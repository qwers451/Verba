# RAG-контур Verba AI

## Обработка PDF

- `PDF_PARSER=auto` использует LlamaParse при наличии `LLAMA_CLOUD_API_KEY`, иначе локальный `pymupdf4llm`.
- Текст проходит Unicode/HTML-нормализацию, удаление служебных символов и склейку слов, разорванных переносом строки.
- Чанки строятся по заголовкам, абзацам и предложениям с бюджетом `RAG_CHUNK_TOKENS` и перекрытием `RAG_CHUNK_OVERLAP_TOKENS`.
- Контекст может продолжаться между страницами; каждый чанк хранит `page_number`, `page_end`, `section_title`, `token_count` и `content_hash`.
- Большие Markdown-таблицы делятся по строкам с повторением заголовка таблицы.

## Индексация и поиск

- Chroma использует версионированную коллекцию `verba_materials_v2_cosine` с cosine-метрикой.
- ID вектора детерминирован: материал + индекс чанка + хэш содержимого.
- Индексация компенсируется при ошибке: материал не получает статус `ready`, пока SQL и Chroma не записаны успешно.
- Retrieval объединяет semantic search и локальный BM25, затем выполняет reranking по dense-score, BM25, покрытию терминов, позициям в обоих рейтингах и ожидаемым страницам.
- Результаты ниже `RAG_MIN_RELEVANCE` не передаются в контекст оценки.

## Локальный запуск

```bash
cd backend
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --reload
```

LlamaParse необязателен. Для принудительной локальной обработки установите `PDF_PARSER=local`.

## Проверка качества

```bash
cd backend
PYTHONPATH=. .venv/bin/pytest -q
PYTHONPATH=. .venv/bin/python scripts/evaluate_rag.py
```

Контрольный набор находится в `backend/benchmarks/rag_quality_dataset.json`. Метрики: Recall@3, MRR и Top-1 accuracy.
