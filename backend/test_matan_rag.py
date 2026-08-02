"""
RAG quality test with fixed langchain-chroma (cosine similarity, correct 0-1 scores)
material_id: 60c80b12-1f6a-4916-9112-63de4e403da1 (matan textbook)
"""
import os
import warnings
warnings.filterwarnings("ignore")

from dotenv import load_dotenv
load_dotenv()

import chromadb
from langchain_chroma import Chroma
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings

MATERIAL_ID = "10d95aea-ab1e-473f-8120-73901fdd37a4"

def test_rag():
    print("Loading embeddings model...")
    embeddings = FastEmbedEmbeddings(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

    persist_dir = os.path.join(os.getcwd(), "chroma_db")
    client = chromadb.PersistentClient(path=persist_dir)
    vs = Chroma(
        client=client,
        collection_name="verba_materials",
        embedding_function=embeddings,
        collection_metadata={"hnsw:space": "cosine"}
    )

    # Check how many chunks are in the DB for the matan textbook
    all_docs = vs.get(where={"material_id": MATERIAL_ID})
    chunk_count = len(all_docs["ids"])
    print(f"\n=== ChromaDB: found {chunk_count} chunks for matan textbook ===\n")

    if chunk_count == 0:
        print("ERROR: No chunks found! Was the PDF uploaded?")
        return

    # Test queries
    queries = [
        "производная функции определение правило",
        "интеграл Ньютона-Лейбница формула",
        "ряды сходимость признак Даламбера",
        "предел функции epsilon delta определение",
        "теорема Лагранжа о среднем значении доказательство",
        "непрерывность функции разрыв",
    ]

    with open("rag_matan_v2_results.md", "w", encoding="utf-8") as f:
        f.write(f"# RAG Quality Test v2 (cosine similarity): Matan Textbook\n\n")
        f.write(f"**Material ID:** `{MATERIAL_ID}`  \n")
        f.write(f"**Total chunks indexed:** {chunk_count}\n\n---\n")

        for q in queries:
            print(f"Searching: '{q}'...")
            results = vs.similarity_search_with_relevance_scores(
                q, k=3,
                filter={"material_id": MATERIAL_ID}
            )
            f.write(f"\n## Query: \"{q}\"\n\n")

            if not results:
                f.write("_No results_\n")
                continue

            for idx, (doc, score) in enumerate(results, 1):
                quality = "🟢 Отлично" if score > 0.7 else ("🟡 Приемлемо" if score > 0.4 else "🔴 Слабо")
                f.write(f"### #{idx} — score: {score:.4f} {quality}\n\n")
                snippet = doc.page_content.strip()[:500]
                f.write(f"```\n{snippet}\n```\n\n")
            f.write("---\n")

    print("\nDone! Results saved to rag_matan_v2_results.md")

if __name__ == "__main__":
    test_rag()
