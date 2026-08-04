import os
import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request, status
from fastapi.responses import FileResponse
from starlette.concurrency import run_in_threadpool
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select

from app.database import get_db
from app.config import settings
from app.models import User, Material, DocumentChunk, InterviewSession, InterviewDialog, Payment
from app.schemas import (
    UserProfileResponse,
    MaterialResponse,
    InterviewStartRequest,
    InterviewSessionResponse,
    SubmitAnswerRequest,
    AnswerEvaluationResponse,
    FinalReportResponse,
    DialogItem,
    DocumentChunkResponse,
    DashboardSummaryResponse,
    InterviewHistoryItemResponse,
    MockCheckoutRequest,
    CheckoutResponse,
    PaymentResponse,
    SubscriptionPlanResponse,
)
from app.services.pdf_service import PDFProcessingService
from app.services.rag_service import RAGService
from app.services.interview_llm import InterviewProviderError, get_interview_provider
from app.services.billing_service import FREE_PLAN_CODE, PRO_PLAN_CODE, get_plans, normalize_plan_code
from app.services.yookassa_service import YooKassaConfigurationError, create_checkout, get_payment_status
router = APIRouter()

from app.api.auth import get_current_user

@router.get("/user/me", response_model=UserProfileResponse)
async def get_user_profile(user: User = Depends(get_current_user)):
    remaining = max(0, user.monthly_sessions_limit - user.sessions_used_this_month)
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        subscription_status=normalize_plan_code(user.subscription_status),
        monthly_sessions_limit=user.monthly_sessions_limit,
        sessions_used_this_month=user.sessions_used_this_month,
        sessions_remaining=remaining,
        subscription_title=next(
            plan["title"] for plan in get_plans() if plan["code"] == normalize_plan_code(user.subscription_status)
        ),
    )

@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    material_count = (await db.execute(
        select(func.count(Material.id)).where(Material.user_id == user.id)
    )).scalar_one()
    completed_sessions = (await db.execute(
        select(func.count(InterviewSession.id)).where(
            InterviewSession.user_id == user.id, InterviewSession.status == "completed"
        )
    )).scalar_one()
    active_sessions = (await db.execute(
        select(func.count(InterviewSession.id)).where(
            InterviewSession.user_id == user.id, InterviewSession.status == "in_progress"
        )
    )).scalar_one()
    average_score = (await db.execute(
        select(func.avg(InterviewSession.overall_score)).where(
            InterviewSession.user_id == user.id, InterviewSession.status == "completed"
        )
    )).scalar_one()
    return DashboardSummaryResponse(
        material_count=material_count,
        completed_sessions=completed_sessions,
        active_sessions=active_sessions,
        average_score=round(float(average_score), 1) if average_score is not None else None,
        sessions_remaining=max(0, user.monthly_sessions_limit - user.sessions_used_this_month),
        monthly_sessions_limit=user.monthly_sessions_limit,
        sessions_used_this_month=user.sessions_used_this_month,
    )

@router.get("/billing/plans", response_model=List[SubscriptionPlanResponse])
async def list_subscription_plans(user: User = Depends(get_current_user)):
    current_plan = normalize_plan_code(user.subscription_status)
    return [{**plan, "is_current": plan["code"] == current_plan} for plan in get_plans()]

@router.post("/billing/yookassa/checkout", response_model=CheckoutResponse)
async def create_yookassa_checkout(
    payload: MockCheckoutRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.plan_code != PRO_PLAN_CODE:
        raise HTTPException(status_code=400, detail="Для оплаты доступен только тариф Pro.")
    pro_plan = next(plan for plan in get_plans() if plan["code"] == PRO_PLAN_CODE)
    payment = Payment(
        user_id=user.id,
        plan_code=PRO_PLAN_CODE,
        amount_rub=pro_plan["price_rub"],
        status="pending",
        provider="yookassa_test",
    )
    db.add(payment)
    await db.flush()
    try:
        provider_id, provider_status, confirmation_url = await create_checkout(
            payment_id=payment.id,
            amount_rub=payment.amount_rub,
            description="Verba AI — тариф Pro (тестовый платёж)",
        )
    except YooKassaConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Не удалось создать платёж в ЮKassa. Повторите попытку позже.") from exc
    payment.provider_payment_id = provider_id
    payment.status = provider_status
    await db.commit()
    await db.refresh(payment)
    return CheckoutResponse(payment=payment, confirmation_url=confirmation_url)

@router.get("/billing/payments/{payment_id}/status", response_model=PaymentResponse)
async def refresh_yookassa_payment_status(
    payment_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    payment = await db.get(Payment, payment_id)
    if not payment or payment.user_id != user.id:
        raise HTTPException(status_code=404, detail="Платёж не найден.")
    await synchronize_yookassa_payment(payment, db)
    return payment

@router.post("/billing/yookassa/webhook")
async def yookassa_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.json()
    provider_payment_id = payload.get("object", {}).get("id")
    if not provider_payment_id:
        raise HTTPException(status_code=400, detail="Некорректное уведомление ЮKassa.")
    result = await db.execute(select(Payment).where(Payment.provider_payment_id == provider_payment_id))
    payment = result.scalars().first()
    if payment:
        await synchronize_yookassa_payment(payment, db)
    return {"status": "ok"}

async def synchronize_yookassa_payment(payment: Payment, db: AsyncSession) -> None:
    if payment.provider != "yookassa_test" or not payment.provider_payment_id:
        return
    try:
        payment.status = await get_payment_status(payment.provider_payment_id)
    except YooKassaConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Не удалось проверить статус платежа в ЮKassa.") from exc
    if payment.status == "succeeded":
        user = await db.get(User, payment.user_id)
        pro_plan = next(plan for plan in get_plans() if plan["code"] == PRO_PLAN_CODE)
        if user:
            user.subscription_status = PRO_PLAN_CODE
            user.monthly_sessions_limit = pro_plan["monthly_session_limit"]
    await db.commit()
    await db.refresh(payment)

@router.get("/billing/payments", response_model=List[PaymentResponse])
async def list_payments(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Payment).where(Payment.user_id == user.id).order_by(Payment.created_at.desc())
    )
    return result.scalars().all()

@router.post("/materials/upload", response_model=MaterialResponse)
async def upload_material(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Поддерживаются только файлы формата PDF."
        )

    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)
    safe_filename = os.path.basename(file.filename)
    file_location = os.path.join(upload_dir, f"{user.id}_{uuid.uuid4().hex}_{safe_filename}")
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    file_size = 0
    try:
        with open(file_location, "wb") as buffer:
            while data := await file.read(1024 * 1024):
                file_size += len(data)
                if file_size > max_bytes:
                    raise ValueError(f"Размер PDF не должен превышать {settings.MAX_FILE_SIZE_MB} МБ.")
                buffer.write(data)
        with open(file_location, "rb") as source:
            if source.read(5) != b"%PDF-":
                raise ValueError("Файл не является корректным PDF.")
        pages_data = await run_in_threadpool(PDFProcessingService.extract_text_by_pages, file_location)
        chunks = await run_in_threadpool(PDFProcessingService.create_chunks, pages_data)
        if not chunks:
            raise ValueError("Не удалось сформировать чанки из документа.")
    except Exception as exc:
        if os.path.exists(file_location):
            os.remove(file_location)
        raise HTTPException(status_code=400, detail=f"Ошибка обработки PDF: {exc}") from exc

    material = Material(
        user_id=user.id,
        title=os.path.splitext(safe_filename)[0],
        file_path=file_location,
        file_size_bytes=file_size,
        page_count=max(page["page_number"] for page in pages_data),
        chunks_count=len(chunks),
        status="processing",
    )
    index_attempted = False
    try:
        db.add(material)
        await db.flush()
        db.add_all([
            DocumentChunk(
                material_id=material.id,
                content=chunk["content"],
                page_number=chunk["page_number"],
                page_end=chunk["page_end"],
                chunk_index=chunk["chunk_index"],
                section_title=chunk["section_title"],
                token_count=chunk["token_count"],
                content_hash=chunk["content_hash"],
                keywords=chunk["keywords"],
                embedding_json={},
            )
            for chunk in chunks
        ])
        await db.flush()
        index_attempted = True
        await run_in_threadpool(RAGService.index_chunks, material.id, chunks)
        material.status = "ready"
        await db.commit()
        await db.refresh(material)
    except Exception as exc:
        await db.rollback()
        if index_attempted:
            try:
                await run_in_threadpool(RAGService.delete_material, material.id)
            except Exception:
                pass
        if os.path.exists(file_location):
            os.remove(file_location)
        raise HTTPException(status_code=503, detail="Не удалось завершить индексацию PDF.") from exc
    return material

@router.get("/materials", response_model=List[MaterialResponse])
async def list_materials(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Material).where(Material.user_id == user.id).order_by(Material.created_at.desc())
    )
    return result.scalars().all()

@router.get("/materials/{material_id}/pdf")
async def get_material_pdf(
    material_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    material = await db.get(Material, material_id)
    if not material or material.user_id != user.id:
        raise HTTPException(status_code=404, detail="Материал не найден.")
    
    if not os.path.exists(material.file_path):
        raise HTTPException(status_code=404, detail="PDF файл не найден на сервере.")
        
    return FileResponse(
        path=material.file_path,
        media_type="application/pdf",
        filename=os.path.basename(material.file_path)
    )

@router.get("/materials/{material_id}/chunks", response_model=List[DocumentChunkResponse])
async def get_material_chunks(
    material_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    material = await db.get(Material, material_id)
    if not material or material.user_id != user.id:
        raise HTTPException(status_code=404, detail="Материал не найден.")
    
    result = await db.execute(
        select(DocumentChunk)
        .where(DocumentChunk.material_id == material_id)
        .order_by(DocumentChunk.chunk_index)
    )
    return result.scalars().all()

@router.delete("/materials/{material_id}")
async def delete_material(
    material_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    material = await db.get(Material, material_id)
    if not material or material.user_id != user.id:
        raise HTTPException(status_code=404, detail="Материал не найден.")
        
    # Delete file from disk if it exists
    if os.path.exists(material.file_path):
        os.remove(material.file_path)
        
    # Delete from ChromaDB
    try:
        await run_in_threadpool(RAGService.delete_material, material.id)
    except Exception as e:
        print(f"Warning: Failed to delete vectors from ChromaDB: {e}")

    # Delete from DB (cascade should handle document_chunks and interviews)
    await db.delete(material)
    await db.commit()
    
    return {"status": "success", "message": "Материал успешно удален."}

@router.post("/interviews/start", response_model=InterviewSessionResponse)
async def start_interview(
    payload: InterviewStartRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check quota
    if user.sessions_used_this_month >= user.monthly_sessions_limit:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Превышен лимит сессий ({user.monthly_sessions_limit} сессий в месяц). Обновите подписку за 690 руб/мес."
        )

    material = await db.get(Material, payload.material_id)
    if not material or material.user_id != user.id:
        raise HTTPException(status_code=404, detail="Учебный материал не найден.")
    if material.status != "ready":
        raise HTTPException(status_code=409, detail="Учебный материал ещё не готов к собеседованию.")

    # Fetch chunks
    chunks_res = await db.execute(
        select(DocumentChunk).where(DocumentChunk.material_id == material.id).order_by(DocumentChunk.chunk_index)
    )
    chunks = chunks_res.scalars().all()
    session = InterviewSession(
        user_id=user.id,
        material_id=material.id,
        status="generating",
        total_questions=payload.total_questions,
        difficulty=payload.difficulty,
        current_question_index=0,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    source_chunks = select_interview_source_chunks(chunks, payload.total_questions)
    try:
        provider = get_interview_provider()
        generated = await provider.generate_questions(
            material.title, source_chunks, payload.total_questions, payload.difficulty
        )
        questions = generated.value.questions
        session.llm_provider = generated.provider
        session.llm_model = generated.model
        session.status = "in_progress"
        db.add_all([
            InterviewDialog(
                session_id=session.id,
                question_number=question.question_number,
                question_text=question.question_text,
                topic=question.topic,
                difficulty=question.difficulty,
                expected_key_points=question.expected_key_points,
                referenced_pages=question.referenced_pages,
                llm_audit={
                    "generation": {
                        "provider": generated.provider, "model": generated.model,
                        "prompt_version": generated.prompt_version,
                        "duration_ms": generated.duration_ms, "retries": generated.retries,
                    }
                },
            ) for question in questions
        ])
        user.sessions_used_this_month += 1
        await db.commit()
    except InterviewProviderError as exc:
        session.status = "failed"
        session.last_error = str(exc)[:2000]
        await db.commit()
        raise HTTPException(status_code=503, detail=f"Не удалось сформировать вопросы: {exc}") from exc

    # Load complete session with dialogs
    return await get_session_response(session.id, db)

@router.get("/interviews", response_model=List[InterviewHistoryItemResponse])
async def list_interviews(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(InterviewSession, Material.title)
        .join(Material, Material.id == InterviewSession.material_id)
        .where(InterviewSession.user_id == user.id)
        .order_by(InterviewSession.created_at.desc())
    )
    return [
        InterviewHistoryItemResponse(
            id=session.id, material_id=session.material_id, material_title=material_title,
            status=session.status, overall_score=session.overall_score,
            total_questions=session.total_questions, created_at=session.created_at,
            completed_at=session.completed_at,
        )
        for session, material_title in result.all()
    ]

@router.get("/interviews/{session_id}", response_model=InterviewSessionResponse)
async def get_interview_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await ensure_session_owner(session_id, user.id, db)
    return await get_session_response(session_id, db)

@router.post("/interviews/answer", response_model=AnswerEvaluationResponse)
async def submit_answer(
    payload: SubmitAnswerRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    session = await db.get(InterviewSession, payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Сессия собеседования не найдена.")
    if session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Сессия собеседования не найдена.")
    if session.status != "in_progress":
        raise HTTPException(status_code=409, detail="Сессия не готова к приёму ответа.")
    expected_question = session.current_question_index + 1
    if payload.question_number != expected_question:
        raise HTTPException(status_code=409, detail=f"Сейчас ожидается ответ на вопрос {expected_question}.")

    # Find dialog item
    res = await db.execute(
        select(InterviewDialog)
        .where(InterviewDialog.session_id == session.id)
        .where(InterviewDialog.question_number == payload.question_number)
    )
    dialog = res.scalars().first()
    if not dialog:
        raise HTTPException(status_code=404, detail="Вопрос не найден в данной сессии.")
    if dialog.user_answer is not None:
        raise HTTPException(status_code=409, detail="Ответ на этот вопрос уже сохранён.")

    # RAG Context retrieval for verification
    relevant_chunks = await RAGService.retrieve_relevant_chunks(
        db,
        session.material_id,
        dialog.question_text,
        top_k=3,
        preferred_pages=dialog.referenced_pages or [],
    )
    if not relevant_chunks:
        raise HTTPException(status_code=422, detail="Не найден надёжный контекст для оценки ответа.")
    context_data = [{
        "content": chunk.content, "page_number": chunk.page_number,
        "page_end": chunk.page_end or chunk.page_number, "section_title": chunk.section_title or "",
        "relevance": score,
    } for chunk, score in relevant_chunks]
    session.status = "evaluating"
    await db.commit()
    try:
        provider = get_interview_provider()
        evaluated = await provider.evaluate_answer(
            dialog.question_text, dialog.expected_key_points or [], payload.user_answer,
            context_data, dialog.referenced_pages or [],
        )
        eval_result = evaluated.value
    except InterviewProviderError as exc:
        session.status = "in_progress"
        session.last_error = str(exc)[:2000]
        await db.commit()
        raise HTTPException(status_code=503, detail=f"Не удалось оценить ответ: {exc}") from exc

    # Save user answer and evaluation to DB
    dialog.user_answer = payload.user_answer
    dialog.score = eval_result.score
    dialog.feedback = eval_result.feedback
    dialog.missed_concepts = eval_result.missed_concepts
    dialog.strengths = eval_result.strengths
    dialog.llm_audit = {
        **(dialog.llm_audit or {}),
        "evaluation": {
            "provider": evaluated.provider, "model": evaluated.model,
            "prompt_version": evaluated.prompt_version,
            "duration_ms": evaluated.duration_ms, "retries": evaluated.retries,
            "retrieved_chunks": [item[0].id for item in relevant_chunks],
            "relevance_scores": [item[1] for item in relevant_chunks],
        },
    }

    # Update session progress
    if session.current_question_index < payload.question_number:
        session.current_question_index = payload.question_number

    # Check if this was the last question
    is_last = payload.question_number >= session.total_questions
    if is_last:
        await db.flush()
        all_dialogs_res = await db.execute(
            select(InterviewDialog).where(InterviewDialog.session_id == session.id).order_by(InterviewDialog.question_number)
        )
        all_d = all_dialogs_res.scalars().all()
        scores = [d.score for d in all_d if d.score is not None]
        session.overall_score = round(sum(scores) / len(scores), 1) if scores else 0.0
        report_input = [dialog_to_report_data(item) for item in all_d]
        try:
            report_result = await provider.generate_report(material_title=(await db.get(Material, session.material_id)).title, dialogs=report_input)
            session.summary_report = report_result.value.model_dump()
            session.summary_report["overall_score"] = session.overall_score
        except InterviewProviderError as exc:
            session.last_error = f"Итоговый отчёт: {exc}"[:2000]
            session.summary_report = fallback_report(report_input, session.overall_score)
        session.status = "completed"
        session.completed_at = datetime.now(timezone.utc)
    else:
        session.status = "in_progress"

    await db.commit()

    return AnswerEvaluationResponse(
        question_number=dialog.question_number,
        score=eval_result.score,
        feedback=eval_result.feedback,
        strengths=eval_result.strengths,
        missed_concepts=eval_result.missed_concepts,
        referenced_pages=eval_result.recommended_pages or dialog.referenced_pages or [1],
        is_last_question=is_last
    )

@router.get("/interviews/{session_id}/report", response_model=FinalReportResponse)
async def get_interview_report(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    session = await db.get(InterviewSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Сессия не найдена.")
    if session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Сессия не найдена.")

    material = await db.get(Material, session.material_id)
    material_title = material.title if material else "Учебный материал"

    # Fetch all dialogs
    res = await db.execute(
        select(InterviewDialog).where(InterviewDialog.session_id == session.id).order_by(InterviewDialog.question_number)
    )
    dialogs = res.scalars().all()
    dialogs_dicts = [
        {
            "id": d.id,
            "question_number": d.question_number,
            "question_text": d.question_text,
            "user_answer": d.user_answer,
            "score": d.score or 0,
            "feedback": d.feedback or "",
            "missed_concepts": d.missed_concepts or [],
            "referenced_pages": d.referenced_pages or [1]
        }
        for d in dialogs
    ]

    if session.status != "completed":
        raise HTTPException(status_code=409, detail="Итоговый отчёт доступен после завершения собеседования.")
    report = session.summary_report or fallback_report(dialogs_dicts, session.overall_score or 0.0)
    
    dialog_items = [
        DialogItem(
            id=d.id,
            question_number=d.question_number,
            question_text=d.question_text,
            topic=d.topic,
            difficulty=d.difficulty,
            user_answer=d.user_answer,
            score=d.score,
            feedback=d.feedback,
            missed_concepts=d.missed_concepts or [],
            strengths=d.strengths or [],
            referenced_pages=d.referenced_pages or [1]
        )
        for d in dialogs
    ]

    return FinalReportResponse(
        session_id=session.id,
        material_title=material_title,
        overall_score=report["overall_score"],
        grade_label=report["grade_label"],
        total_questions=session.total_questions,
        topics_breakdown=report["topics_breakdown"],
        key_recommendations=report["key_recommendations"],
        dialogs=dialog_items
    )

async def get_session_response(session_id: str, db: AsyncSession) -> InterviewSessionResponse:
    session = await db.get(InterviewSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Сессия не найдена.")
    
    material = await db.get(Material, session.material_id)
    material_title = material.title if material else "Материал"

    res = await db.execute(
        select(InterviewDialog).where(InterviewDialog.session_id == session.id).order_by(InterviewDialog.question_number)
    )
    dialogs = res.scalars().all()

    dialog_items = [
        DialogItem(
            id=d.id,
            question_number=d.question_number,
            question_text=d.question_text,
            topic=d.topic,
            difficulty=d.difficulty,
            user_answer=d.user_answer,
            score=d.score,
            feedback=d.feedback,
            missed_concepts=d.missed_concepts or [],
            strengths=d.strengths or [],
            referenced_pages=d.referenced_pages or [1]
        )
        for d in dialogs
    ]

    return InterviewSessionResponse(
        id=session.id,
        material_id=session.material_id,
        material_title=material_title,
        status=session.status,
        current_question_index=session.current_question_index,
        total_questions=session.total_questions,
        overall_score=session.overall_score,
        dialogs=dialog_items,
        created_at=session.created_at
    )

async def ensure_session_owner(session_id: str, user_id: str, db: AsyncSession) -> InterviewSession:
    session = await db.get(InterviewSession, session_id)
    if not session or session.user_id != user_id:
        raise HTTPException(status_code=404, detail="Сессия не найдена.")
    return session


def select_interview_source_chunks(chunks: List[DocumentChunk], total_questions: int) -> list[dict]:
    excluded = ("оглавление", "содержание", "список литературы", "библиограф")
    useful = [chunk for chunk in chunks if chunk.token_count >= 50 and not any(
        marker in (chunk.section_title or "").lower() for marker in excluded
    )]
    pool = useful or chunks
    limit = min(len(pool), max(total_questions * 4, 12), 28)
    if not pool:
        raise HTTPException(status_code=422, detail="В материале нет текста для генерации вопросов.")
    indexes = sorted({min(len(pool) - 1, int(index * len(pool) / limit)) for index in range(limit)})
    return [{
        "chunk_index": chunk.chunk_index, "content": chunk.content,
        "page_number": chunk.page_number, "page_end": chunk.page_end or chunk.page_number,
        "section_title": chunk.section_title or "", "keywords": chunk.keywords or [],
    } for chunk in (pool[index] for index in indexes)]


def dialog_to_report_data(dialog: InterviewDialog) -> dict:
    return {
        "question_number": dialog.question_number, "question_text": dialog.question_text,
        "topic": dialog.topic, "score": dialog.score or 0, "feedback": dialog.feedback or "",
        "strengths": dialog.strengths or [], "missed_concepts": dialog.missed_concepts or [],
        "referenced_pages": dialog.referenced_pages or [],
    }


def fallback_report(dialogs: list[dict], overall_score: float) -> dict:
    topics = [{
        "topic": item.get("topic") or item.get("question_text", "Тема")[:80],
        "status": "strong" if item.get("score", 0) >= 80 else "medium" if item.get("score", 0) >= 60 else "weak",
        "pages": item.get("referenced_pages") or [],
        "advice": "Повторите ключевые тезисы и сформулируйте ответ своими словами.",
    } for item in dialogs]
    return {
        "overall_score": overall_score,
        "grade_label": "Отлично" if overall_score >= 85 else "Хорошо" if overall_score >= 70 else "Требует повторения",
        "topics_breakdown": topics,
        "key_recommendations": ["Повторите темы с наименьшими баллами и пройдите тренировку повторно."],
    }
