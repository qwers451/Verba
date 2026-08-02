"""
Full test: LlamaParse extraction + ChromaDB RAG search
on the math textbook 978-5-7996-1340-2_2014.pdf
"""
import os
import sys
import fitz
from dotenv import load_dotenv

load_dotenv()

PDF_PATH = r"c:\Verba\978-5-7996-1340-2_2014.pdf"
TEST_PDF_PATH = "test_matan_pages.pdf"
RESULTS_FILE = "matan_parse_results.md"

# Pages to extract for testing (0-indexed). Pick pages that likely have formulas.
# Page 10=basic definitions, 50=derivatives, 100=integrals, 200=series
PAGES_TO_TEST = [10, 50, 100, 150, 200]

def step1_extract_pages():
    print("=== STEP 1: Extracting sample pages from matan PDF ===")
    doc = fitz.open(PDF_PATH)
    print(f"Total pages: {doc.page_count}")
    
    new_doc = fitz.open()
    for p in PAGES_TO_TEST:
        if p < doc.page_count:
            new_doc.insert_pdf(doc, from_page=p, to_page=p)
            print(f"  Added page {p+1}")
    new_doc.save(TEST_PDF_PATH)
    new_doc.close()
    doc.close()
    print(f"Saved {len(PAGES_TO_TEST)} pages to {TEST_PDF_PATH}")

def step2_parse_with_llama():
    print("\n=== STEP 2: Parsing with LlamaParse (AI extraction) ===")
    from llama_parse import LlamaParse
    
    api_key = os.environ.get("LLAMA_CLOUD_API_KEY")
    if not api_key:
        print("ERROR: LLAMA_CLOUD_API_KEY not set!")
        return
    
    parser = LlamaParse(
        api_key=api_key,
        result_type="markdown",
        verbose=True
    )
    docs = parser.load_data(TEST_PDF_PATH)
    print(f"LlamaParse returned {len(docs)} document(s)")
    
    with open(RESULTS_FILE, "w", encoding="utf-8") as f:
        f.write(f"# LlamaParse Extraction: Math Textbook\n\n")
        f.write(f"Tested pages (1-indexed): {[p+1 for p in PAGES_TO_TEST]}\n\n")
        f.write("---\n\n")
        for i, doc in enumerate(docs):
            pg = PAGES_TO_TEST[i] + 1 if i < len(PAGES_TO_TEST) else i+1
            f.write(f"\n## Page {pg} (original)\n\n")
            f.write(doc.text)
            f.write("\n\n---\n")
    print(f"Results saved to {RESULTS_FILE}")
    return docs

def step3_rag_search():
    print("\n=== STEP 3: Testing RAG search on existing ChromaDB ===")
    from langchain_community.vectorstores import Chroma
    from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
    
    embeddings = FastEmbedEmbeddings(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    persist_dir = os.path.join(os.getcwd(), "chroma_db")
    vs = Chroma(
        collection_name="verba_materials",
        embedding_function=embeddings,
        persist_directory=persist_dir
    )
    
    queries = [
        "производная функции определение",
        "интеграл Ньютона-Лейбница формула",
        "ряды сходимость признаки",
        "предел функции бесконечность",
    ]
    
    with open("rag_search_results.md", "w", encoding="utf-8") as f:
        f.write("# RAG Search Results on Existing ChromaDB\n\n")
        for q in queries:
            print(f"  Searching: '{q}'...")
            results = vs.similarity_search_with_relevance_scores(q, k=3)
            f.write(f"\n## Query: \"{q}\"\n\n")
            if not results:
                f.write("_No results found._\n")
                continue
            for idx, (doc, score) in enumerate(results, 1):
                f.write(f"### Result #{idx} (score: {score:.4f})\n\n")
                snippet = doc.page_content.strip()[:300]
                f.write(f"```\n{snippet}\n```\n\n")
            f.write("---\n")
    print(f"RAG results saved to rag_search_results.md")

if __name__ == "__main__":
    step1_extract_pages()
    docs = step2_parse_with_llama()
    step3_rag_search()
    print("\n=== DONE ===")
    print(f"  LlamaParse output: {RESULTS_FILE}")
    print(f"  RAG search output: rag_search_results.md")
