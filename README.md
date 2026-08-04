# Verba AI

Verba AI — веб-приложение для подготовки к устным аттестациям по загруженным учебным материалам. Пользователь добавляет PDF, запускает тренировочное собеседование, отвечает на вопросы и получает оценку с итоговым отчётом.

## Возможности

- Регистрация, авторизация и изоляция пользовательских материалов и сессий.
- Загрузка PDF до 50 МБ, извлечение текста, разбиение на чанки и просмотр обработанного материала.
- RAG-поиск по материалам: семантический поиск, BM25 и reranking с привязкой к страницам исходного документа.
- Генерация вопросов, оценка ответов и итоговый отчёт через настраиваемого LLM-провайдера.
- Детерминированный `mock`-режим для автотестов и демонстрационного запуска без LLM.
- История тренировок, лимиты тарифов и тестовая интеграция с ЮKassa.

## Стек

| Область | Технологии |
| --- | --- |
| Клиент | Next.js 15, React 19, TypeScript, Tailwind CSS, Zustand |
| API | Python 3.12, FastAPI, SQLAlchemy Async |
| Данные | PostgreSQL 16, pgvector, Chroma |
| Инфраструктура | Docker Compose |
| Тестирование | Pytest, ESLint |

## Быстрый старт

Требуется Docker с Docker Compose.

```bash
cp .env.example .env
docker compose up -d --build
```

После запуска доступны:

| Сервис | Адрес |
| --- | --- |
| Веб-интерфейс | http://localhost:3000 |
| API | http://localhost:8000/api/v1 |
| OpenAPI | http://localhost:8000/docs |

Для локальной демонстрации Docker Compose использует значения для разработки. Перед развёртыванием в другом окружении обязательно замените `POSTGRES_PASSWORD` и `JWT_SECRET_KEY` в `.env`.

Остановить сервисы:

```bash
docker compose down
```

Удалить сервисы вместе с локальными данными PostgreSQL, загрузками и индексом:

```bash
docker compose down -v
```

## Настройка интервью

По умолчанию Docker-окружение запускается с `INTERVIEW_LLM_PROVIDER=mock`. Для интеллектуального режима укажите в `.env`:

```env
INTERVIEW_LLM_PROVIDER=codex_cli
CODEX_CLI_PATH=codex
CODEX_INTERVIEW_MODEL=gpt-5.4-mini
```

На машине, где работает backend, должен быть установлен и авторизован Codex CLI (`codex login`). LlamaParse не обязателен: при `PDF_PARSER=auto` без `LLAMA_CLOUD_API_KEY` используется локальный парсер. Полный список переменных приведён в [.env.example](.env.example).

## Разработка и проверка

Для запуска backend без Docker:

```bash
cd backend
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --reload
```

Проверка backend:

```bash
cd backend
PYTHONPATH=. .venv/bin/pytest -q
PYTHONPATH=. .venv/bin/python scripts/evaluate_rag.py
```

Проверка frontend:

```bash
cd frontend
npm ci
npm run lint
npm run build
```

## Документация

- [RAG-контур](docs/RAG.md) — обработка PDF, индексация, retrieval и метрики качества.
- [Тренировочное собеседование](docs/INTERVIEW.md) — провайдеры, сценарий сессии и настройка Codex CLI.
- [Материалы этапа 1](docs/stage-1/README.md) — архитектура, план и программа испытаний MVP.

## Безопасность

Не добавляйте в репозиторий `.env`, ключи LlamaParse, ЮKassa или другие секреты. Для платёжной интеграции используйте тестовые учётные данные, пока не настроены production-окружение и возвратный URL.
