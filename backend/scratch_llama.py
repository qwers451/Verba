import os
import glob
from dotenv import load_dotenv
import fitz # PyMuPDF

load_dotenv()

from llama_parse import LlamaParse

def test_llama():
    files = glob.glob('uploads/*.pdf')
    file_path = next((f for f in files if "32dd" in f and "Rid" not in f), files[0])
    
    # Extract page 285 (1-indexed, so index 284)
    doc = fitz.open(file_path)
    new_doc = fitz.open()
    new_doc.insert_pdf(doc, from_page=284, to_page=284)
    
    test_pdf_path = "test_page_285.pdf"
    new_doc.save(test_pdf_path)
    new_doc.close()
    doc.close()
    
    print(f"Loading {test_pdf_path} (extracted from {file_path}) with LlamaParse...")
    parser = LlamaParse(
        api_key=os.environ.get("LLAMA_CLOUD_API_KEY"),
        result_type="markdown",
        verbose=True
    )
    docs = parser.load_data(test_pdf_path)
    
    print(f"Got {len(docs)} documents (pages).")
    
    with open("llama_parse_results.md", "w", encoding="utf-8") as f:
        for i, doc in enumerate(docs):
            f.write(f"\n\n# --- PAGE {i+1} ---\n\n")
            f.write(doc.text)
            
if __name__ == "__main__":
    test_llama()
