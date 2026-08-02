import os
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings

def test_rag(query: str):
    with open("test_results.md", "w", encoding="utf-8") as f:
        f.write(f"Загрузка модели эмбеддингов...\n")
        embeddings = FastEmbedEmbeddings(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
        
        f.write(f"Подключение к ChromaDB...\n")
        persist_dir = os.path.join(os.getcwd(), "chroma_db")
        vs = Chroma(
            collection_name="verba_materials",
            embedding_function=embeddings,
            persist_directory=persist_dir
        )
        
        f.write(f"\nПоиск релевантных чанков для запроса: '{query}'\n")
        results = vs.similarity_search_with_relevance_scores(query, k=3)
        
        if not results:
            f.write("Ничего не найдено. Возможно, база пуста.\n")
            return

        for idx, (doc, score) in enumerate(results, 1):
            f.write(f"\n--- Результат #{idx} (Совпадение: {score * 100:.2f}%) ---\n")
            f.write(f"Текст:\n{doc.page_content.strip()}\n")
            f.write("-" * 50 + "\n")

if __name__ == "__main__":
    import sys
    user_query = sys.argv[1] if len(sys.argv) > 1 else "О чем этот документ?"
    test_rag(user_query)
