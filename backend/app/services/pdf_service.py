import os
import re
from typing import List, Dict, Any
import pymupdf4llm
from langchain_text_splitters import MarkdownTextSplitter
class PDFProcessingService:
    """
    Parses PDF documents, tracks page numbers, splits into contextual chunks,
    and extracts key terminology for high-precision RAG indexing.
    """

    @staticmethod
    def extract_text_by_pages(file_path: str) -> List[Dict[str, Any]]:
        """
        Extracts text from PDF using pymupdf4llm to preserve markdown formatting (tables, headers).
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Файл {file_path} не найден.")

        pages_data = []
        try:
            md_pages = pymupdf4llm.to_markdown(file_path, page_chunks=True)
            for page in md_pages:
                text = page.get("text", "")
                page_num = page.get("metadata", {}).get("page", 0) + 1
                if text.strip():
                    pages_data.append({
                        "page_number": page_num,
                        "content": text.strip()
                    })
        except Exception as e:
            raise RuntimeError(f"Ошибка при парсинге PDF: {str(e)}")

        return pages_data

    @staticmethod
    def create_chunks(pages_data: List[Dict[str, Any]], max_chars: int = 1500, overlap_chars: int = 300) -> List[Dict[str, Any]]:
        """
        Splits page content into chunks with page metadata, using MarkdownTextSplitter to preserve tables.
        """
        splitter = MarkdownTextSplitter(chunk_size=max_chars, chunk_overlap=overlap_chars)
        
        chunks = []
        global_chunk_idx = 0

        for page in pages_data:
            page_num = page["page_number"]
            text = page["content"]
            
            if not text.strip():
                continue
                
            split_texts = splitter.split_text(text)
            
            for chunk_text in split_texts:
                chunk_text = chunk_text.strip()
                if not chunk_text:
                    continue
                    
                keywords = PDFProcessingService._extract_keywords(chunk_text)
                chunks.append({
                    "chunk_index": global_chunk_idx,
                    "page_number": page_num,
                    "content": chunk_text,
                    "keywords": keywords
                })
                global_chunk_idx += 1

        return chunks

    @staticmethod
    def _extract_keywords(text: str) -> List[str]:
        """
        Extracts key nouns / terms (e.g., words >= 4 chars, capitalized or key terms).
        """
        words = re.findall(r'\b[A-Za-zА-Яа-я0-9_-]{4,}\b', text)
        freq = {}
        for w in words:
            w_lower = w.lower()
            if w_lower not in ("это", "который", "быть", "также", "такой", "свой", "если", "для", "после"):
                freq[w_lower] = freq.get(w_lower, 0) + 1
        
        # Sort by frequency
        sorted_terms = sorted(freq.items(), key=lambda x: x[1], reverse=True)
        return [t[0] for t in sorted_terms[:8]]
