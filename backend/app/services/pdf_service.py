import hashlib
import html
import os
import re
import unicodedata
from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Dict, Iterable, List, Optional

from app.config import settings


@dataclass(frozen=True)
class _Segment:
    text: str
    page_start: int
    page_end: int
    section_title: str
    kind: str = "text"


class PDFProcessingService:
    """PDF extraction, cleanup and structure-aware token chunking."""

    @staticmethod
    def extract_text_by_pages(file_path: str) -> List[Dict[str, Any]]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Файл {file_path} не найден.")
        parser_mode = settings.PDF_PARSER.lower().strip()
        if parser_mode not in {"auto", "llama_parse", "local"}:
            raise RuntimeError("PDF_PARSER должен быть auto, llama_parse или local.")

        pages: List[Dict[str, Any]] = []
        cloud_error: Optional[Exception] = None
        if parser_mode in {"auto", "llama_parse"} and settings.LLAMA_CLOUD_API_KEY:
            try:
                pages = PDFProcessingService._extract_with_llama_parse(file_path)
            except Exception as exc:
                cloud_error = exc
                if parser_mode == "llama_parse":
                    raise RuntimeError(f"Ошибка при парсинге PDF (LlamaParse): {exc}") from exc
        elif parser_mode == "llama_parse":
            raise RuntimeError("API ключ LlamaParse не настроен (LLAMA_CLOUD_API_KEY).")

        if not pages and parser_mode in {"auto", "local"}:
            pages = PDFProcessingService._extract_locally(file_path)
        if not pages:
            suffix = f" LlamaParse: {cloud_error}" if cloud_error else ""
            raise RuntimeError(f"В PDF не найден текст, пригодный для индексации.{suffix}")
        return pages

    @staticmethod
    def _extract_with_llama_parse(file_path: str) -> List[Dict[str, Any]]:
        # Lazy import keeps local parsing and unit tests independent of the cloud client.
        from llama_parse import LlamaParse

        parser = LlamaParse(
            api_key=settings.LLAMA_CLOUD_API_KEY,
            result_type="markdown",
            split_by_page=True,
            verbose=False,
        )
        docs = parser.load_data(file_path)
        pages = []
        for index, document in enumerate(docs):
            content = PDFProcessingService.normalize_text(document.text or "")
            metadata = document.metadata or {}
            raw_page = metadata.get("page_number")
            page_number = int(raw_page) if raw_page is not None else index + 1
            if content:
                pages.append({"page_number": page_number, "content": content})
        return pages

    @staticmethod
    def _extract_locally(file_path: str) -> List[Dict[str, Any]]:
        import pymupdf4llm

        parsed_pages = pymupdf4llm.to_markdown(file_path, page_chunks=True)
        pages = []
        for index, page in enumerate(parsed_pages):
            content = PDFProcessingService.normalize_text(page.get("text", ""))
            page_number = int(page.get("metadata", {}).get("page_number", index + 1))
            if content:
                pages.append({"page_number": page_number, "content": content})
        return pages

    @staticmethod
    def normalize_text(text: str) -> str:
        """Normalize parser/OCR artifacts while retaining Markdown structure."""
        text = html.unescape(unicodedata.normalize("NFKC", text or ""))
        text = text.replace("\u00ad", "").replace("\u200b", "").replace("\ufeff", "")
        # Legacy PDFs often map decorative/font glyphs into Unicode's private-use
        # area. They carry no searchable meaning and otherwise pollute embeddings.
        text = re.sub(r"[\uE000-\uF8FF]", " ", text)
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        # Join words split by OCR/PDF line wrapping: "непрерыв-\nность".
        text = re.sub(r"(?<=[A-Za-zА-Яа-яЁё])-\s*\n\s*(?=[A-Za-zА-Яа-яЁё])", "", text)
        # Dot leaders from a table of contents are navigation, not evidence.
        text = re.sub(r"(?m)^\s*\.{5,}\s*\d+\s*$", "", text)
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r" *\n *", "\n", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    @staticmethod
    @lru_cache(maxsize=1)
    def _token_encoder():
        try:
            import tiktoken
            return tiktoken.get_encoding("cl100k_base")
        except (ImportError, ValueError):
            return None

    @staticmethod
    def count_tokens(text: str) -> int:
        encoder = PDFProcessingService._token_encoder()
        if encoder is not None:
            return len(encoder.encode(text, disallowed_special=()))
        # Conservative fallback for Cyrillic and formulas.
        return len(re.findall(r"\w+|[^\w\s]", text, flags=re.UNICODE))

    @classmethod
    def create_chunks(
        cls,
        pages_data: List[Dict[str, Any]],
        max_tokens: Optional[int] = None,
        overlap_tokens: Optional[int] = None,
        **legacy_options: Any,
    ) -> List[Dict[str, Any]]:
        """Create structure-aware chunks across page boundaries.

        ``max_chars``/``overlap_chars`` are accepted for backwards compatibility,
        but interpreted conservatively as token budgets.
        """
        if max_tokens is None:
            max_tokens = int(legacy_options.pop("max_chars", settings.RAG_CHUNK_TOKENS))
        if overlap_tokens is None:
            overlap_tokens = int(legacy_options.pop("overlap_chars", settings.RAG_CHUNK_OVERLAP_TOKENS))
        if legacy_options:
            raise TypeError(f"Неизвестные параметры чанкинга: {', '.join(legacy_options)}")
        if max_tokens < 64 or overlap_tokens < 0 or overlap_tokens >= max_tokens:
            raise ValueError("Некорректные размеры чанка или перекрытия.")

        segments = list(cls._extract_segments(
            pages_data, max_tokens=max_tokens, overlap_tokens=overlap_tokens
        ))
        chunks: List[Dict[str, Any]] = []
        current: List[_Segment] = []

        def render(items: List[_Segment]) -> str:
            section = next((item.section_title for item in reversed(items) if item.section_title), "")
            body = "\n\n".join(item.text for item in items).strip()
            if section and not body.startswith(section):
                return f"{section}\n\n{body}".strip()
            return body

        def flush() -> None:
            nonlocal current
            if not current:
                return
            content = render(current)
            if not content:
                current = []
                return
            digest = hashlib.sha256(content.encode("utf-8")).hexdigest()
            chunks.append({
                "chunk_index": len(chunks),
                "page_number": min(item.page_start for item in current),
                "page_end": max(item.page_end for item in current),
                "section_title": next((item.section_title for item in reversed(current) if item.section_title), ""),
                "content": content,
                "token_count": cls.count_tokens(content),
                "content_hash": digest,
                "keywords": cls._extract_keywords(content),
            })
            overlap: List[_Segment] = []
            overlap_size = 0
            for item in reversed(current):
                item_tokens = cls.count_tokens(item.text)
                if item.kind == "table":
                    break
                if overlap_size + item_tokens > overlap_tokens:
                    if overlap_size < max(1, overlap_tokens // 2) and item_tokens <= int(overlap_tokens * 1.5):
                        overlap.insert(0, item)
                    break
                overlap.insert(0, item)
                overlap_size += item_tokens
            current = overlap

        for segment in segments:
            if segment.kind == "table":
                flush()
                current = [segment]
                flush()
                continue
            active_section = next((item.section_title for item in reversed(current) if item.section_title), "")
            if current and segment.section_title and segment.section_title != active_section:
                flush()
                current = []
            candidate = render([*current, segment])
            if current and cls.count_tokens(candidate) > max_tokens:
                flush()
            current.append(segment)
            if cls.count_tokens(render(current)) >= max_tokens:
                flush()
        flush()

        # Remove exact duplicates that can result from repeated PDF headers.
        unique: List[Dict[str, Any]] = []
        seen = set()
        for chunk in chunks:
            key = (chunk["page_number"], chunk["page_end"], chunk["content_hash"])
            if key in seen:
                continue
            seen.add(key)
            chunk["chunk_index"] = len(unique)
            unique.append(chunk)
        return unique

    @classmethod
    def _extract_segments(
        cls, pages_data: Iterable[Dict[str, Any]], max_tokens: int, overlap_tokens: int
    ) -> Iterable[_Segment]:
        heading_stack: Dict[int, str] = {}
        inherited_section = ""
        segment_budget = max(12, min(64, max_tokens // 4, overlap_tokens or max_tokens // 4))

        for page in pages_data:
            page_number = int(page["page_number"])
            text = cls.normalize_text(str(page.get("content", "")))
            if not text:
                continue
            lines = text.splitlines()
            index = 0
            paragraph: List[str] = []

            def section_title() -> str:
                return " > ".join(heading_stack[level] for level in sorted(heading_stack)) or inherited_section

            def emit_paragraph() -> Iterable[_Segment]:
                nonlocal paragraph
                value = " ".join(part.strip() for part in paragraph if part.strip()).strip()
                paragraph = []
                if not value:
                    return []
                return [
                    _Segment(part, page_number, page_number, section_title(), "text")
                    for part in cls._split_text(value, segment_budget)
                ]

            while index < len(lines):
                line = lines[index].strip()
                heading = cls._parse_heading(line)
                if heading:
                    yield from emit_paragraph()
                    level, heading_text = heading
                    heading_stack[level] = heading_text
                    for obsolete in [key for key in heading_stack if key > level]:
                        heading_stack.pop(obsolete, None)
                    inherited_section = section_title()
                    index += 1
                    continue

                if line.startswith("|") and line.count("|") >= 2:
                    yield from emit_paragraph()
                    table_lines = []
                    while index < len(lines):
                        candidate = lines[index].strip()
                        if not (candidate.startswith("|") and candidate.count("|") >= 2):
                            break
                        table_lines.append(candidate)
                        index += 1
                    yield from cls._split_table(table_lines, page_number, section_title(), max_tokens)
                    continue

                if not line:
                    yield from emit_paragraph()
                else:
                    paragraph.append(line)
                index += 1
            yield from emit_paragraph()

    @staticmethod
    def _parse_heading(line: str) -> Optional[tuple[int, str]]:
        markdown = re.match(r"^(#{1,6})\s+(.+?)\s*$", line)
        if markdown:
            title = PDFProcessingService._clean_heading(markdown.group(2))
            if title and not re.search(r"[A-Za-zА-Яа-яЁё]{3,}", title):
                return None
            return (len(markdown.group(1)), title) if title else None
        bold = re.fullmatch(r"\*\*(.+?)\*\*", line)
        candidate = bold.group(1).strip() if bold else line
        if len(candidate) > 180 or candidate.count("<br>") > 1:
            return None
        numbered = re.match(r"^(\d+(?:\.\d+)*\.?)\s+(.+)$", candidate)
        if numbered:
            title = numbered.group(2).strip()
            # Equations frequently start with a coefficient ("2 sin ..."). A
            # numbered prose heading starts with an uppercase title word.
            if not re.match(r"^[A-ZА-ЯЁ][A-Za-zА-Яа-яЁё-]{2,}\b", title):
                return None
            if not re.match(r"^(Определение|Теорема|Пример|Доказательство)\b", title, re.IGNORECASE):
                level = min(6, numbered.group(1).count(".") + 1)
                clean_title = PDFProcessingService._clean_heading(candidate)
                return (level, clean_title) if clean_title else None
        return None

    @staticmethod
    def _clean_heading(value: str) -> str:
        value = re.sub(r"<[^>]+>", "", value)
        value = re.sub(r"[*_`]+", "", value)
        value = re.sub(r"\s+", " ", value).strip(" #")
        if not value or len(value) > 180 or len(value.split()) > 24:
            return ""
        return value

    @classmethod
    def _split_text(cls, text: str, budget: int) -> List[str]:
        sentences = [part.strip() for part in re.split(r"(?<=[.!?…])\s+|\n+", text) if part.strip()]
        result: List[str] = []
        current = ""
        for sentence in sentences or [text]:
            if cls.count_tokens(sentence) > budget:
                if current:
                    result.append(current)
                    current = ""
                words = sentence.split()
                piece: List[str] = []
                for word in words:
                    if piece and cls.count_tokens(" ".join([*piece, word])) > budget:
                        result.append(" ".join(piece))
                        piece = []
                    piece.append(word)
                if piece:
                    result.append(" ".join(piece))
                continue
            candidate = f"{current} {sentence}".strip()
            if current and cls.count_tokens(candidate) > budget:
                result.append(current)
                current = sentence
            else:
                current = candidate
        if current:
            result.append(current)
        return result

    @classmethod
    def _split_table(cls, lines: List[str], page: int, section: str, max_tokens: int) -> Iterable[_Segment]:
        if not lines:
            return
        header_size = 2 if len(lines) > 1 and re.fullmatch(r"\|?[\s:|\-]+\|?", lines[1]) else 1
        header = lines[:header_size]
        rows = lines[header_size:]
        current = list(header)
        header_text = "\n".join(header)
        prefix = f"{section}\n\n" if section else ""
        for row in rows:
            candidate = "\n".join([*current, row])
            if len(current) > header_size and cls.count_tokens(prefix + candidate) > max_tokens:
                yield _Segment("\n".join(current), page, page, section, "table")
                current = [*header]
            single_row = "\n".join([*header, row])
            if cls.count_tokens(prefix + single_row) > max_tokens:
                if len(current) > header_size:
                    yield _Segment("\n".join(current), page, page, section, "table")
                    current = [*header]
                row_budget = max(12, max_tokens - cls.count_tokens(prefix + header_text) - 4)
                for part in cls._split_text(row, row_budget):
                    yield _Segment("\n".join([header_text, part]), page, page, section, "table")
            else:
                current.append(row)
        if len(current) > header_size or not rows:
            yield _Segment("\n".join(current), page, page, section, "table")

    @staticmethod
    def _extract_keywords(text: str) -> List[str]:
        words = re.findall(r"\b[A-Za-zА-Яа-яЁё0-9_-]{4,}\b", text.lower())
        stopwords = {
            "этот", "того", "того", "который", "которая", "которые", "быть", "также",
            "такой", "свой", "если", "после", "перед", "между", "через", "здесь",
            "очень", "может", "будет", "данный", "данная", "данные", "только", "тогда",
            "пункт", "страница", "страницы", "раздел", "когда", "чтобы", "место",
        }
        frequencies: Dict[str, int] = {}
        for word in words:
            if word not in stopwords:
                frequencies[word] = frequencies.get(word, 0) + 1
        return [word for word, _ in sorted(frequencies.items(), key=lambda item: (-item[1], item[0]))[:10]]
