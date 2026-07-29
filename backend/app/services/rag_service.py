import math
from typing import List, Dict, Any, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import DocumentChunk

class RAGService:
    """
    Handles RAG vector retrieval, keyword relevance scoring,
    and context augmentation for LLM questions and evaluation.
    """

    @staticmethod
    def generate_simple_embedding(text: str, dim: int = 128) -> List[float]:
        """
        Deterministic lightweight embedding vector generator for fallback/fast RAG.
        Produces consistent spatial representation based on character n-grams and hashing.
        """
        vec = [0.0] * dim
        words = text.lower().split()
        for i, word in enumerate(words):
            for j, char in enumerate(word):
                idx = (ord(char) * 31 + j) % dim
                vec[idx] += 1.0 / (i + 1)
        
        # Normalize vector
        norm = math.sqrt(sum(x*x for x in vec)) or 1.0
        return [round(x / norm, 5) for x in vec]

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        if not v1 or not v2 or len(v1) != len(v2):
            return 0.0
        dot = sum(a * b for a, b in zip(v1, v2))
        norm1 = math.sqrt(sum(a * a for a in v1))
        norm2 = math.sqrt(sum(b * b for b in v2))
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return dot / (norm1 * norm2)

    @classmethod
    async def retrieve_relevant_chunks(
        cls, 
        db: AsyncSession, 
        material_id: str, 
        query: str, 
        top_k: int = 3
    ) -> List[Tuple[DocumentChunk, float]]:
        """
        Retrieves top_k relevant document chunks for a query from material_id.
        Combines vector cosine similarity and keyword matching.
        """
        result = await db.execute(
            select(DocumentChunk).where(DocumentChunk.material_id == material_id)
        )
        chunks = result.scalars().all()
        if not chunks:
            return []

        query_vec = cls.generate_simple_embedding(query)
        query_words = set(query.lower().split())

        scored_chunks: List[Tuple[DocumentChunk, float]] = []

        for chunk in chunks:
            # 1. Cosine similarity score
            emb = chunk.embedding_json.get("vector", []) if chunk.embedding_json else []
            sim_score = cls.cosine_similarity(query_vec, emb) if emb else 0.0

            # 2. Keyword match score
            chunk_keywords = set(chunk.keywords or [])
            matched_keywords = query_words.intersection(chunk_keywords)
            keyword_score = len(matched_keywords) * 0.15

            final_score = sim_score + keyword_score
            scored_chunks.append((chunk, final_score))

        # Sort descending by score
        scored_chunks.sort(key=lambda x: x[1], reverse=True)
        return scored_chunks[:top_k]
