import hashlib
import math
import os
import re
from collections import Counter
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import DocumentChunk


class RAGService:
    """Versioned vector index and hybrid dense/BM25 retrieval."""

    _embeddings = None
    _vector_store = None

    @classmethod
    def get_vector_store(cls):
        if cls._vector_store is None:
            import chromadb
            from langchain_chroma import Chroma
            from langchain_community.embeddings.fastembed import FastEmbedEmbeddings

            if cls._embeddings is None:
                cls._embeddings = FastEmbedEmbeddings(
                    model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
                )
            persist_dir = os.path.abspath(os.path.join(os.getcwd(), "chroma_db"))
            client = chromadb.PersistentClient(path=persist_dir)
            collection_name = settings.RAG_COLLECTION_NAME
            try:
                collection = client.get_collection(collection_name)
                if (collection.metadata or {}).get("hnsw:space") != "cosine":
                    raise RuntimeError(
                        f"Коллекция {collection_name} создана не с cosine-метрикой. "
                        "Задайте новое RAG_COLLECTION_NAME и переиндексируйте документы."
                    )
            except chromadb.errors.NotFoundError:
                pass
            cls._vector_store = Chroma(
                client=client,
                collection_name=collection_name,
                embedding_function=cls._embeddings,
                collection_metadata={"hnsw:space": "cosine", "schema_version": 2},
            )
        return cls._vector_store

    @staticmethod
    def vector_id(material_id: str, chunk_index: int, content_hash: str) -> str:
        return f"{material_id}:{chunk_index}:{content_hash[:16]}"

    @classmethod
    def index_chunks(cls, material_id: str, chunks: Sequence[Dict[str, Any]]) -> List[str]:
        from langchain_core.documents import Document

        cls.delete_material(material_id)
        ids = [cls.vector_id(material_id, chunk["chunk_index"], chunk["content_hash"]) for chunk in chunks]
        documents = [
            Document(
                page_content=chunk["content"],
                metadata={
                    "material_id": material_id,
                    "page_number": chunk["page_number"],
                    "page_end": chunk.get("page_end", chunk["page_number"]),
                    "chunk_index": chunk["chunk_index"],
                    "section_title": chunk.get("section_title", ""),
                    "content_hash": chunk["content_hash"],
                },
            )
            for chunk in chunks
        ]
        if documents:
            cls.get_vector_store().add_documents(documents, ids=ids)
        return ids

    @classmethod
    def delete_material(cls, material_id: str) -> None:
        vector_store = cls.get_vector_store()
        existing = vector_store.get(where={"material_id": material_id})
        if existing and existing.get("ids"):
            vector_store.delete(ids=existing["ids"])

    @staticmethod
    def generate_simple_embedding(text: str, dim: int = 128) -> List[float]:
        """Legacy deterministic embedding retained only for compatibility tests."""
        if dim <= 0:
            raise ValueError("dim must be positive")
        vector = [0.0] * dim
        for token in text.lower().split():
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            vector[int.from_bytes(digest[:4], "big") % dim] += 1.0 if digest[4] % 2 == 0 else -1.0
        magnitude = math.sqrt(sum(value * value for value in vector))
        return [value / magnitude for value in vector] if magnitude else vector

    @staticmethod
    def cosine_similarity(first: List[float], second: List[float]) -> float:
        if len(first) != len(second):
            raise ValueError("vectors must have the same dimension")
        first_magnitude = math.sqrt(sum(value * value for value in first))
        second_magnitude = math.sqrt(sum(value * value for value in second))
        if not first_magnitude or not second_magnitude:
            return 0.0
        return sum(a * b for a, b in zip(first, second)) / (first_magnitude * second_magnitude)

    @staticmethod
    def _tokens(text: str) -> List[str]:
        tokens = [token for token in re.findall(r"[a-zа-яё0-9]+", text.lower()) if len(token) > 2]
        normalized = []
        russian_suffixes = (
            "иями", "ями", "ами", "ности", "ность", "ости", "ость", "ения", "ение",
            "ского", "скому", "ого", "ому", "ими", "ыми", "ая", "яя", "ый", "ий",
            "ой", "ую", "юю", "ов", "ев", "ам", "ям", "ах", "ях", "ия", "ии",
        )
        for token in tokens:
            stem = token
            if re.fullmatch(r"[а-яё]+", token) and len(token) > 5:
                for suffix in russian_suffixes:
                    if token.endswith(suffix) and len(token) - len(suffix) >= 4:
                        stem = token[:-len(suffix)]
                        break
            normalized.append(stem)
        return normalized

    @classmethod
    def _bm25_scores(cls, query: str, chunks: Sequence[DocumentChunk]) -> Dict[int, float]:
        documents = [cls._tokens(f"{chunk.section_title or ''} {chunk.content}") for chunk in chunks]
        query_tokens = cls._tokens(query)
        if not documents or not query_tokens:
            return {chunk.chunk_index: 0.0 for chunk in chunks}
        average_length = sum(len(document) for document in documents) / len(documents) or 1.0
        document_frequency = Counter(token for token in set(query_tokens) for document in documents if token in document)
        scores: Dict[int, float] = {}
        k1, b = 1.5, 0.75
        for chunk, document in zip(chunks, documents):
            frequencies = Counter(document)
            score = 0.0
            for token in query_tokens:
                df = document_frequency[token]
                if not df:
                    continue
                inverse_frequency = math.log(1 + (len(documents) - df + 0.5) / (df + 0.5))
                frequency = frequencies[token]
                denominator = frequency + k1 * (1 - b + b * len(document) / average_length)
                score += inverse_frequency * (frequency * (k1 + 1) / denominator if denominator else 0.0)
            scores[chunk.chunk_index] = score
        return scores

    @classmethod
    def rerank_chunks(
        cls,
        query: str,
        chunks: Sequence[DocumentChunk],
        dense_scores: Dict[int, float],
        preferred_pages: Optional[Sequence[int]] = None,
    ) -> List[Tuple[DocumentChunk, float]]:
        """Fuse dense and BM25 ranks, then rerank by query coverage and page evidence."""
        if not chunks:
            return []
        bm25 = cls._bm25_scores(query, chunks)
        max_bm25 = max(bm25.values(), default=0.0) or 1.0
        dense_rank = {index: rank for rank, (index, _) in enumerate(
            sorted(dense_scores.items(), key=lambda item: item[1], reverse=True), start=1
        )}
        bm25_rank = {index: rank for rank, (index, _) in enumerate(
            sorted(bm25.items(), key=lambda item: item[1], reverse=True), start=1
        )}
        query_tokens = set(cls._tokens(query))
        instruction_tokens = {
            "запишите", "напишите", "сформулируйте", "объясните", "опишите",
            "расскажите", "физическ", "смысл", "слагаемых", "понятие",
            "определ", "такое", "какова", "какие", "какой", "почему", "языке",
        }
        distinctive_tokens = {
            token for token in query_tokens
            if len(token) >= 7 and token not in instruction_tokens
        }
        preferred = set(preferred_pages or [])
        reranked: List[Tuple[DocumentChunk, float]] = []

        for chunk in chunks:
            index = chunk.chunk_index
            chunk_tokens = set(cls._tokens(f"{chunk.section_title or ''} {chunk.content}"))
            coverage = len(query_tokens & chunk_tokens) / max(1, len(query_tokens))
            dense = max(0.0, min(1.0, dense_scores.get(index, 0.0)))
            lexical = max(0.0, bm25.get(index, 0.0) / max_bm25)
            distinctive_match = bool(distinctive_tokens & chunk_tokens)
            reciprocal_rank = 0.0
            if index in dense_rank:
                reciprocal_rank += 1 / (60 + dense_rank[index])
            if index in bm25_rank:
                reciprocal_rank += 1 / (60 + bm25_rank[index])
            reciprocal_rank = min(1.0, reciprocal_rank / (2 / 61))
            page_end = chunk.page_end or chunk.page_number
            page_match = bool(preferred and any(chunk.page_number <= page <= page_end for page in preferred))
            score = 0.42 * dense + 0.28 * lexical + 0.18 * coverage + 0.12 * reciprocal_rank
            # A rare subject term (for example, "Бернулли" or "энтропия")
            # is strong evidence even when a formula-heavy chunk embeds poorly.
            if distinctive_match:
                score += 0.45
            if page_match:
                score += 0.25
            reranked.append((chunk, score))
        ordered = sorted(reranked, key=lambda item: item[1], reverse=True)
        return [(chunk, round(min(1.0, score), 6)) for chunk, score in ordered]

    @classmethod
    async def retrieve_relevant_chunks(
        cls,
        db: AsyncSession,
        material_id: str,
        query: str,
        top_k: int = 3,
        preferred_pages: Optional[Sequence[int]] = None,
        min_relevance: Optional[float] = None,
    ) -> List[Tuple[DocumentChunk, float]]:
        all_chunks = list((await db.execute(
            select(DocumentChunk)
            .where(DocumentChunk.material_id == material_id)
            .order_by(DocumentChunk.chunk_index)
        )).scalars().all())
        if not all_chunks:
            return []

        dense_scores: Dict[int, float] = {}
        try:
            dense_results = cls.get_vector_store().similarity_search_with_relevance_scores(
                query,
                k=max(top_k * 4, settings.RAG_DENSE_CANDIDATES),
                filter={"material_id": material_id},
            )
            for document, score in dense_results:
                index = document.metadata.get("chunk_index")
                if index is not None:
                    dense_scores[int(index)] = float(score)
        except Exception:
            # BM25 remains available if the local vector index is temporarily unavailable.
            dense_scores = {}

        bm25 = cls._bm25_scores(query, all_chunks)
        candidate_indexes = set(dense_scores)
        candidate_indexes.update(
            index for index, _ in sorted(bm25.items(), key=lambda item: item[1], reverse=True)[:max(top_k * 4, 12)]
        )
        if preferred_pages:
            preferred = set(preferred_pages)
            candidate_indexes.update(
                chunk.chunk_index for chunk in all_chunks
                if any(chunk.page_number <= page <= (chunk.page_end or chunk.page_number) for page in preferred)
            )
        candidates = [chunk for chunk in all_chunks if chunk.chunk_index in candidate_indexes]
        reranked = cls.rerank_chunks(query, candidates, dense_scores, preferred_pages)
        threshold = settings.RAG_MIN_RELEVANCE if min_relevance is None else min_relevance
        return [(chunk, score) for chunk, score in reranked if score >= threshold][:top_k]
