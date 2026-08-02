import os
import sys

# Добавляем путь к приложению
sys.path.append(os.path.join(os.path.dirname(__file__)))

try:
    from app.services.pdf_service import PDFProcessingService
    
    mock_pages = [
        {
            "page_number": 1,
            "content": "# Заголовок 1\nТестовый текст.\n\n| Столбец 1 | Столбец 2 |\n|---|---|\n| Значение 1 | Значение 2 |\n| Значение 3 | Значение 4 |\n\nЕще немного текста."
        }
    ]
    
    chunks = PDFProcessingService.create_chunks(mock_pages, max_chars=100, overlap_chars=20)
    print("Успешно создано чанков:", len(chunks))
    for i, c in enumerate(chunks):
        print(f"--- Чанк {i} ---")
        print(c["content"])
        
except Exception as e:
    print(f"Ошибка: {e}")
