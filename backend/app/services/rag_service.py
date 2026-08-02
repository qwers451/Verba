import os
from typing import List, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import DocumentChunk
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings

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
            
            # Persistent ChromaDB store
            persist_dir = os.path.join(os.getcwd(), "chroma_db")
            cls._vector_store = Chroma(
                collection_name="verba_materials",
                embedding_function=cls._embeddings,
                persist_directory=persist_dir
            )
        return cls._vector_store

    @staticmethod
    def generate_simple_embedding(text: str, dim: int = 128) -> List[float]:
        """
        Legacy mock embedding function for backwards compatibility.
        """
        return []

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
