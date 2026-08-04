from app.services.pdf_service import PDFProcessingService


def test_normalize_parser_artifacts():
    source = "Непрерыв-\nность &lt; функции\u00ad\n\n\nследующая строка"
    assert PDFProcessingService.normalize_text(source) == "Непрерывность < функции\n\nследующая строка"


def test_normalize_removes_toc_dot_leaders_and_private_glyphs():
    source = "# 1.1 Кинематика\n\n........................................ 5\nТекст\uf0b7 раздела"
    normalized = PDFProcessingService.normalize_text(source)
    assert "...." not in normalized
    assert "\uf0b7" not in normalized
    assert "1.1 Кинематика" in normalized
    assert "Текст раздела" in normalized


def test_chunks_keep_section_and_cross_page_context():
    pages = [
        {"page_number": 1, "content": "# Производная\n\nОпределение производной функции через предел отношения приращений."},
        {"page_number": 2, "content": "Далее рассматривается геометрический смысл производной и касательная."},
    ]
    chunks = PDFProcessingService.create_chunks(pages, max_tokens=120, overlap_tokens=20)
    assert len(chunks) == 1
    assert chunks[0]["page_number"] == 1
    assert chunks[0]["page_end"] == 2
    assert chunks[0]["section_title"] == "Производная"
    assert chunks[0]["content"].startswith("Производная")


def test_overlap_is_materialized_between_text_chunks():
    sentences = [f"Уникальное предложение номер {index} описывает важное понятие функции." for index in range(24)]
    pages = [{"page_number": 1, "content": "# Раздел\n\n" + " ".join(sentences)}]
    chunks = PDFProcessingService.create_chunks(pages, max_tokens=90, overlap_tokens=24)
    assert len(chunks) > 1
    assert all(
        "описывает важное понятие\n\nфункции." in chunks[index + 1]["content"]
        for index in range(len(chunks) - 1)
    )


def test_large_table_repeats_header_and_section():
    rows = ["| Термин | Описание |", "|---|---|"]
    rows.extend(f"| Термин {index} | {'важное описание ' * 8}|" for index in range(12))
    pages = [{"page_number": 7, "content": "# Глава\n\n## Таблица терминов\n\n" + "\n".join(rows)}]
    chunks = PDFProcessingService.create_chunks(pages, max_tokens=100, overlap_tokens=20)
    assert len(chunks) > 2
    assert all("| Термин | Описание |" in chunk["content"] for chunk in chunks)
    assert all(chunk["section_title"] == "Глава > Таблица терминов" for chunk in chunks)
    assert all(chunk["token_count"] <= 100 for chunk in chunks)


def test_chunk_hashes_and_indexes_are_deterministic():
    pages = [{"page_number": 1, "content": "# Тема\n\nТекст определения. " * 20}]
    first = PDFProcessingService.create_chunks(pages, max_tokens=80, overlap_tokens=20)
    second = PDFProcessingService.create_chunks(pages, max_tokens=80, overlap_tokens=20)
    assert [(c["chunk_index"], c["content_hash"]) for c in first] == [
        (c["chunk_index"], c["content_hash"]) for c in second
    ]
