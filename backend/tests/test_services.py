import pytest
from app.services.pdf_service import PDFProcessingService
from app.services.rag_service import RAGService

def test_extract_keywords():
    text = "Система управления базами данных - это комплекс программ, позволяющий создавать базы данных и управлять ими."
    keywords = PDFProcessingService._extract_keywords(text)
    assert len(keywords) > 0
    assert "базами" in keywords or "система" in keywords

def test_cosine_similarity():
    v1 = [1.0, 0.0, 0.0]
    v2 = [1.0, 0.0, 0.0]
    assert RAGService.cosine_similarity(v1, v2) == 1.0

    v3 = [0.0, 1.0, 0.0]
    assert RAGService.cosine_similarity(v1, v3) == 0.0

def test_simple_embedding():
    text = "Artificial Intelligence"
    vec = RAGService.generate_simple_embedding(text, dim=128)
    assert len(vec) == 128
    assert sum(x*x for x in vec) > 0.99  # Should be normalized to ~1.0
