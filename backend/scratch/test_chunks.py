import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.pdf_service import PDFProcessingService

# Тестовая страница с длинным текстом и таблицей
long_text = "Здесь очень много текста, который должен занять место, чтобы мы приблизились к границе чанка. " * 15

test_page = {
    "page_number": 1,
    "content": f"""# Тестовый документ
    
{long_text}

## Важная таблица

| Столбец 1 | Столбец 2 | Столбец 3 |
|-----------|-----------|-----------|
| Значение 1 | Значение 2 | Значение 3 |
| Очень длинное значение, которое может быть разрезано | Еще одно длинное значение | И еще одно |
| Строка 3 | Строка 3 | Строка 3 |
| Строка 4 | Строка 4 | Строка 4 |

{long_text}
"""
}

# Размер чанка такой, чтобы таблица могла быть разрезана, если использовать простой сплиттер по символам.
# 15 * 94 = 1410 символов в long_text. Весь текст будет около 3000 символов.
# Установим max_chars = 1500 (как в сервисе).
chunks = PDFProcessingService.create_chunks([test_page], max_chars=1500, overlap_chars=300)

with open(os.path.join(os.path.dirname(__file__), "test_output.txt"), "w", encoding="utf-8") as f:
    for i, chunk in enumerate(chunks):
        f.write(f"--- Chunk {i+1} ---\n")
        f.write(f"Page: {chunk['page_number']}\n")
        f.write(f"Keywords: {chunk['keywords']}\n")
        f.write(f"Content:\n{chunk['content']}\n\n")

print("Finished writing to test_output.txt")
