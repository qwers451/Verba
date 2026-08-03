import os
import hashlib
import math
from typing import List, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import DocumentChunk
from langchain_chroma import Chroma
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
import chromadb

class RAGService:
    """
    Handles RAG vector retrieval using LangChain, ChromaDB, and FastEmbed.
    """
    _embeddings = None
    _vector_store = None

    @classmethod
    def get_vector_store(cls) -> Chroma:
        if cls._vector_store is None:
            # Initialize embeddings with a small multilingual model that works locally
            if cls._embeddings is None:
                cls._embeddings = FastEmbedEmbeddings(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
            
            # Persistent ChromaDB store with cosine similarity for correct 0-1 scores
            persist_dir = os.path.join(os.getcwd(), "chroma_db")
            client = chromadb.PersistentClient(path=persist_dir)
            cls._vector_store = Chroma(
                client=client,
                collection_name="verba_materials",
                embedding_function=cls._embeddings,
                collection_metadata={"hnsw:space": "cosine"}
            )
        return cls._vector_store

    @staticmethod
    def generate_simple_embedding(text: str, dim: int = 128) -> List[float]:
        """
        Legacy mock embedding function for backwards compatibility.
        """
        if dim <= 0:
            raise ValueError("dim must be positive")

        vector = [0.0] * dim
        for token in text.lower().split():
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            index = int.from_bytes(digest[:4], "big") % dim
            vector[index] += 1.0 if digest[4] % 2 == 0 else -1.0

        magnitude = math.sqrt(sum(value * value for value in vector))
        return [value / magnitude for value in vector] if magnitude else vector

    @staticmethod
    def cosine_similarity(first: List[float], second: List[float]) -> float:
        """Return cosine similarity for two vectors without external dependencies."""
        if len(first) != len(second):
            raise ValueError("vectors must have the same dimension")

        first_magnitude = math.sqrt(sum(value * value for value in first))
        second_magnitude = math.sqrt(sum(value * value for value in second))
        if not first_magnitude or not second_magnitude:
            return 0.0

        return sum(a * b for a, b in zip(first, second)) / (first_magnitude * second_magnitude)

    @classmethod
    async def retrieve_relevant_chunks(
        cls, 
        db: AsyncSession, 
        material_id: str, 
        query: str, 
        top_k: int = 3
    ) -> List[Tuple[DocumentChunk, float]]:
        """
        Retrieves top_k relevant document chunks for a query from material_id using semantic search.
        """
        vs = cls.get_vector_store()
        
        # Search the vector store with filter for specific material
        results = vs.similarity_search_with_relevance_scores(
            query,
            k=top_k,
            filter={"material_id": material_id}
        )

        # Retrieve full DocumentChunk objects from SQL DB to preserve existing interfaces
        scored_chunks = []
        for doc, score in results:
            chunk_idx = doc.metadata.get("chunk_index")
            if chunk_idx is not None:
                # Find matching chunk in DB
                db_res = await db.execute(
                    select(DocumentChunk)
                    .where(DocumentChunk.material_id == material_id)
                    .where(DocumentChunk.chunk_index == chunk_idx)
                )
                db_chunk = db_res.scalars().first()
                if db_chunk:
                    scored_chunks.append((db_chunk, float(score)))

        return scored_chunks
