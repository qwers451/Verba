import os
import re
from typing import List, Dict, Any
import pypdf

class PDFProcessingService:
    """
    Parses PDF documents, tracks page numbers, splits into contextual chunks,
    and extracts key terminology for high-precision RAG indexing.
    """

    @staticmethod
    def extract_text_by_pages(file_path: str) -> List[Dict[str, Any]]:
        """
        Extracts text from PDF, returning a list of dicts with page_number and text.
        """
        pages_data = []
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Файл {file_path} не найден.")

        reader = pypdf.PdfReader(file_path)
        total_pages = len(reader.pages)

        for idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            # Clean up whitespace
            text = re.sub(r'\s+', ' ', text).strip()
            if text:
                pages_data.append({
                    "page_number": idx + 1,
                    "content": text
                })

        return pages_data

    @staticmethod
    def create_chunks(pages_data: List[Dict[str, Any]], chunk_size: int = 500, overlap: int = 100) -> List[Dict[str, Any]]:
        """
        Splits page content into overlapping chunks with page metadata.
        """
        chunks = []
        global_chunk_idx = 0

        for page in pages_data:
            page_num = page["page_number"]
            text = page["content"]

            words = text.split(' ')
            if len(words) <= chunk_size:
                # Small enough to fit in one chunk
                keywords = PDFProcessingService._extract_keywords(text)
                chunks.append({
                    "chunk_index": global_chunk_idx,
                    "page_number": page_num,
                    "content": text,
                    "keywords": keywords
                })
                global_chunk_idx += 1
            else:
                start = 0
                while start < len(words):
                    end = start + chunk_size
                    chunk_text = " ".join(words[start:end])
                    keywords = PDFProcessingService._extract_keywords(chunk_text)
                    chunks.append({
                        "chunk_index": global_chunk_idx,
                        "page_number": page_num,
                        "content": chunk_text,
                        "keywords": keywords
                    })
                    global_chunk_idx += 1
                    start += (chunk_size - overlap)

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
