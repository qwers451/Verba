import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.config import settings
from app.models import User, Material, DocumentChunk, InterviewSession, InterviewDialog
from app.schemas import (
    UserProfileResponse,
    MaterialResponse,
    InterviewStartRequest,
    InterviewSessionResponse,
    SubmitAnswerRequest,
    AnswerEvaluationResponse,
    FinalReportResponse,
    DialogItem,
    DocumentChunkResponse
)
from app.services.pdf_service import PDFProcessingService
from app.services.rag_service import RAGService
from app.services.llm_service import LLMService
from langchain_core.documents import Document

router = APIRouter()

from app.api.auth import get_current_user

@router.get("/user/me", response_model=UserProfileResponse)
async def get_user_profile(user: User = Depends(get_current_user)):
    remaining = max(0, user.monthly_sessions_limit - user.sessions_used_this_month)
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        subscription_status=user.subscription_status,
        monthly_sessions_limit=user.monthly_sessions_limit,
        sessions_used_this_month=user.sessions_used_this_month,
        sessions_remaining=remaining
    )

@router.post("/materials/upload", response_model=MaterialResponse)
async def upload_material(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Поддерживаются только файлы формата PDF."
        )

    # Create uploads dir if not exists
    upload_dir = "./uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_location = os.path.join(upload_dir, f"{user.id}_{file.filename}")
    
    # Save file
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_location)

    # Extract text by pages
    try:
        pages_data = PDFProcessingService.extract_text_by_pages(file_location)
        chunks = PDFProcessingService.create_chunks(pages_data)
    except Exception as e:
        if os.path.exists(file_location):
            os.remove(file_location)
        raise HTTPException(status_code=400, detail=f"Ошибка обработки PDF: {str(e)}")

    # Create Material record
    material = Material(
        user_id=user.id,
        title=file.filename.replace(".pdf", ""),
        file_path=file_location,
        file_size_bytes=file_size,
        page_count=len(pages_data),
        chunks_count=len(chunks),
        status="ready"
    )
    db.add(material)
    await db.commit()
    await db.refresh(material)

    # Save document chunks with vector embeddings
    db_chunks = []
    langchain_docs = []
    
    for chunk in chunks:
        # We don't generate dummy embeddings anymore, save directly to sqlite
        db_chunk = DocumentChunk(
            material_id=material.id,
            content=chunk["content"],
            page_number=chunk["page_number"],
            chunk_index=chunk["chunk_index"],
            keywords=chunk["keywords"],
            embedding_json={}
        )
        db_chunks.append(db_chunk)
        
        # Prepare for ChromaDB
        langchain_docs.append(Document(
            page_content=chunk["content"],
            metadata={
                "material_id": material.id,
                "page_number": chunk["page_number"],
                "chunk_index": chunk["chunk_index"]
            }
        ))

    db.add_all(db_chunks)
    await db.commit()
    
    # Save to ChromaDB
    if langchain_docs:
        vs = RAGService.get_vector_store()
        vs.add_documents(langchain_docs)

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
        vs = RAGService.get_vector_store()
        # ChromaDB allows deleting by metadata filter in some versions, or we can just fetch and delete by ids.
        # Let's try to get them first.
        docs = vs.get(where={"material_id": material.id})
        if docs and docs["ids"]:
            vs.delete(ids=docs["ids"])
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

    # Fetch material
    material = await db.get(Material, payload.material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Учебный материал не найден.")

    # Fetch chunks
    chunks_res = await db.execute(
        select(DocumentChunk).where(DocumentChunk.material_id == material.id).order_by(DocumentChunk.chunk_index)
    )
    chunks = chunks_res.scalars().all()
    chunks_dicts = [
        {
            "content": c.content,
            "page_number": c.page_number,
            "keywords": c.keywords or []
        }
        for c in chunks
    ]

    # Generate exam questions
    questions = await LLMService.generate_questions_for_material(chunks_dicts, payload.total_questions)

    # Create interview session
    session = InterviewSession(
        user_id=user.id,
        material_id=material.id,
        status="in_progress",
        total_questions=len(questions),
        current_question_index=0
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    # Create dialog records for generated questions
    dialogs = []
    for q in questions:
        dialog = InterviewDialog(
            session_id=session.id,
            question_number=q["question_number"],
            question_text=q["question_text"],
            expected_key_points=q.get("expected_key_points", []),
            referenced_pages=q.get("referenced_pages", [1])
        )
        dialogs.append(dialog)

    db.add_all(dialogs)
    
    # Increment user sessions used count
    user.sessions_used_this_month += 1
    await db.commit()

    # Load complete session with dialogs
    return await get_session_response(session.id, db)

@router.get("/interviews/{session_id}", response_model=InterviewSessionResponse)
async def get_interview_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    return await get_session_response(session_id, db)

@router.post("/interviews/answer", response_model=AnswerEvaluationResponse)
async def submit_answer(
    payload: SubmitAnswerRequest,
    db: AsyncSession = Depends(get_db)
):
    session = await db.get(InterviewSession, payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Сессия собеседования не найдена.")

    # Find dialog item
    res = await db.execute(
        select(InterviewDialog)
        .where(InterviewDialog.session_id == session.id)
        .where(InterviewDialog.question_number == payload.question_number)
    )
    dialog = res.scalars().first()
    if not dialog:
        raise HTTPException(status_code=404, detail="Вопрос не найден в данной сессии.")

    # RAG Context retrieval for verification
    relevant_chunks = await RAGService.retrieve_relevant_chunks(
        db, session.material_id, dialog.question_text, top_k=2
    )
    context_texts = [c[0].content for c in relevant_chunks]

    # Evaluate answer via LLM Engine
    eval_result = await LLMService.evaluate_answer(
        question_text=dialog.question_text,
        expected_points=dialog.expected_key_points or [],
        user_answer=payload.user_answer,
        referenced_pages=dialog.referenced_pages or [1],
        context_chunks=context_texts
    )

    # Save user answer and evaluation to DB
    dialog.user_answer = payload.user_answer
    dialog.score = eval_result["score"]
    dialog.feedback = eval_result["feedback"]
    dialog.missed_concepts = eval_result["missed_concepts"]

    # Update session progress
    if session.current_question_index < payload.question_number:
        session.current_question_index = payload.question_number

    # Check if this was the last question
    is_last = payload.question_number >= session.total_questions
    if is_last:
        session.status = "completed"
        # Calculate overall score
        all_dialogs_res = await db.execute(
            select(InterviewDialog).where(InterviewDialog.session_id == session.id)
        )
        all_d = all_dialogs_res.scalars().all()
        scores = [d.score for d in all_d if d.score is not None]
        if scores:
            session.overall_score = round(sum(scores) / len(scores), 1)

    await db.commit()

    return AnswerEvaluationResponse(
        question_number=dialog.question_number,
        score=eval_result["score"],
        feedback=eval_result["feedback"],
        missed_concepts=eval_result["missed_concepts"],
        referenced_pages=dialog.referenced_pages or [1],
        is_last_question=is_last
    )

@router.get("/interviews/{session_id}/report", response_model=FinalReportResponse)
async def get_interview_report(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    session = await db.get(InterviewSession, session_id)
    if not session:
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

    report = LLMService.synthesize_report(material_title, dialogs_dicts)
    
    dialog_items = [
        DialogItem(
            id=d.id,
            question_number=d.question_number,
            question_text=d.question_text,
            user_answer=d.user_answer,
            score=d.score,
            feedback=d.feedback,
            missed_concepts=d.missed_concepts or [],
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
            user_answer=d.user_answer,
            score=d.score,
            feedback=d.feedback,
            missed_concepts=d.missed_concepts or [],
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
