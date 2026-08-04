import pytest
import importlib
from pathlib import Path
from sqlalchemy import select

from app.models import DocumentChunk, Material, User
from app.services.interview_llm import MockInterviewProvider

@pytest.mark.asyncio
async def test_get_user_profile(client, auth_headers):
    response = await client.get("/api/v1/user/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "email" in data
    assert data["subscription_status"] == "pro"
    assert data["subscription_title"] == "Pro"
    assert data["monthly_sessions_limit"] == 15

@pytest.mark.asyncio
async def test_upload_material_invalid_file(client, auth_headers):
    # Test uploading a non-pdf file
    files = {"file": ("test.txt", b"Hello, World!", "text/plain")}
    response = await client.post("/api/v1/materials/upload", files=files, headers=auth_headers)
    assert response.status_code == 400
    assert "Поддерживаются только файлы формата PDF" in response.json()["detail"]

@pytest.mark.asyncio
async def test_upload_material_is_ready_only_after_vector_index(client, auth_headers, monkeypatch, tmp_path):
    router_module = importlib.import_module("app.api.router")
    monkeypatch.setattr(router_module.settings, "UPLOAD_DIR", str(tmp_path))
    monkeypatch.setattr(
        router_module.PDFProcessingService,
        "extract_text_by_pages",
        lambda _: [{"page_number": 1, "content": "# Тема\n\nОпределение функции."}],
    )
    monkeypatch.setattr(
        router_module.PDFProcessingService,
        "create_chunks",
        lambda _: [{
            "chunk_index": 0, "page_number": 1, "page_end": 1,
            "section_title": "Тема", "content": "Тема\n\nОпределение функции.",
            "token_count": 8, "content_hash": "a" * 64, "keywords": ["функция"],
        }],
    )
    indexed = []
    monkeypatch.setattr(router_module.RAGService, "index_chunks", lambda material_id, chunks: indexed.append((material_id, chunks)))

    response = await client.post(
        "/api/v1/materials/upload",
        files={"file": ("lecture.pdf", b"%PDF-1.4\nfake", "application/pdf")},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "ready"
    assert len(indexed) == 1
    chunks = await client.get(f"/api/v1/materials/{response.json()['id']}/chunks", headers=auth_headers)
    assert chunks.json()[0]["section_title"] == "Тема"
    assert chunks.json()[0]["page_end"] == 1

@pytest.mark.asyncio
async def test_upload_rolls_back_sql_and_file_when_indexing_fails(client, auth_headers, monkeypatch, tmp_path):
    router_module = importlib.import_module("app.api.router")
    monkeypatch.setattr(router_module.settings, "UPLOAD_DIR", str(tmp_path))
    monkeypatch.setattr(
        router_module.PDFProcessingService,
        "extract_text_by_pages",
        lambda _: [{"page_number": 1, "content": "Текст"}],
    )
    monkeypatch.setattr(
        router_module.PDFProcessingService,
        "create_chunks",
        lambda _: [{
            "chunk_index": 0, "page_number": 1, "page_end": 1,
            "section_title": "", "content": "Текст", "token_count": 1,
            "content_hash": "b" * 64, "keywords": ["текст"],
        }],
    )
    monkeypatch.setattr(
        router_module.RAGService, "index_chunks",
        lambda *_: (_ for _ in ()).throw(RuntimeError("index unavailable")),
    )
    monkeypatch.setattr(router_module.RAGService, "delete_material", lambda *_: None)

    response = await client.post(
        "/api/v1/materials/upload",
        files={"file": ("lecture.pdf", b"%PDF-1.4\nfake", "application/pdf")},
        headers=auth_headers,
    )
    assert response.status_code == 503
    materials = await client.get("/api/v1/materials", headers=auth_headers)
    assert materials.json() == []
    assert list(Path(tmp_path).iterdir()) == []

@pytest.mark.asyncio
async def test_yookassa_checkout_creates_pending_payment(client, auth_headers, monkeypatch):
    async def fake_create_checkout(**kwargs):
        assert kwargs["amount_rub"] == 690
        return "test-provider-payment", "pending", "https://example.test/checkout"

    router_module = importlib.import_module("app.api.router")
    monkeypatch.setattr(router_module, "create_checkout", fake_create_checkout)
    response = await client.post(
        "/api/v1/billing/yookassa/checkout", json={"plan_code": "pro"}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["confirmation_url"] == "https://example.test/checkout"
    assert response.json()["payment"]["provider"] == "yookassa_test"
    assert response.json()["payment"]["status"] == "pending"

    profile = await client.get("/api/v1/user/me", headers=auth_headers)
    assert profile.json()["subscription_status"] == "pro"
    assert profile.json()["monthly_sessions_limit"] == 15


@pytest.mark.asyncio
async def test_complete_interview_flow_uses_provider_and_rag(client, auth_headers, monkeypatch, db_session):
    router_module = importlib.import_module("app.api.router")
    monkeypatch.setattr(router_module, "get_interview_provider", lambda: MockInterviewProvider())

    db = db_session
    user = (await db.execute(select(User).where(User.email == "student@example.com"))).scalar_one()
    material = Material(
        user_id=user.id, title="Физика", file_path="/tmp/physics.pdf",
        page_count=30, chunks_count=3, status="ready",
    )
    db.add(material)
    await db.flush()
    chunks = [DocumentChunk(
        material_id=material.id, chunk_index=index, page_number=page, page_end=page,
        section_title=topic, content=f"{topic}. Основные определения и законы раздела.",
        token_count=80, content_hash=str(index) * 64, keywords=[topic.lower()], embedding_json={},
    ) for index, (page, topic) in enumerate([(3, "Кинематика"), (13, "Динамика"), (25, "Энергия")])]
    db.add_all(chunks)
    await db.commit()
    material_id = material.id

    async def fake_retrieve(db, material_id, query, **kwargs):
        chunk = (await db.execute(
            select(DocumentChunk).where(DocumentChunk.material_id == material_id).order_by(DocumentChunk.chunk_index)
        )).scalars().first()
        return [(chunk, 0.91)]

    monkeypatch.setattr(router_module.RAGService, "retrieve_relevant_chunks", fake_retrieve)
    started = await client.post(
        "/api/v1/interviews/start",
        json={"material_id": material_id, "total_questions": 3, "difficulty": "hard"},
        headers=auth_headers,
    )
    assert started.status_code == 200
    session = started.json()
    assert session["status"] == "in_progress"
    assert len(session["dialogs"]) == 3
    assert all(item["difficulty"] == "hard" for item in session["dialogs"])

    out_of_order = await client.post(
        "/api/v1/interviews/answer",
        json={"session_id": session["id"], "question_number": 2, "user_answer": "Развёрнутый ответ."},
        headers=auth_headers,
    )
    assert out_of_order.status_code == 409

    for question_number in range(1, 4):
        response = await client.post(
            "/api/v1/interviews/answer",
            json={
                "session_id": session["id"], "question_number": question_number,
                "user_answer": "Основная тема связана с материалом учебника и его законами.",
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert "strengths" in response.json()
        assert response.json()["is_last_question"] is (question_number == 3)

    report = await client.get(f"/api/v1/interviews/{session['id']}/report", headers=auth_headers)
    assert report.status_code == 200
    assert report.json()["total_questions"] == 3
    assert len(report.json()["topics_breakdown"]) == 3
