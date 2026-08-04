# Модуль тренировочного собеседования

## Режимы

- `INTERVIEW_LLM_PROVIDER=codex_cli` — тестовая интеллектуальная генерация и оценка через `codex exec`.
- `INTERVIEW_LLM_PROVIDER=mock` — детерминированный режим только для автотестов и Docker-демо без Codex CLI.

Codex запускается с `--ephemeral`, `--sandbox read-only`, `--ignore-user-config`,
`--ignore-rules` и строгой JSON Schema. Рабочий каталог каждого вызова временный и
не содержит репозиторий. Ошибка CLI не подменяется незаметно mock-оценкой.

## Настройка

```env
INTERVIEW_LLM_PROVIDER=codex_cli
CODEX_CLI_PATH=codex
CODEX_INTERVIEW_MODEL=gpt-5.4-mini
CODEX_MAX_CONCURRENCY=2
CODEX_RETRY_COUNT=1
CODEX_MAX_PROMPT_CHARS=90000
CODEX_GENERATION_TIMEOUT_SECONDS=120
CODEX_EVALUATION_TIMEOUT_SECONDS=60
CODEX_REPORT_TIMEOUT_SECONDS=60
```

Перед запуском локальный пользователь должен выполнить `codex login`. Модель
настраивается переменной и может быть заменена на `gpt-5.6-luna` без изменения кода.

## Сценарий

1. Из материала выбираются содержательные чанки из разных частей документа.
2. Провайдер создаёт вопросы, эталонные тезисы, темы и ссылки на реальные страницы.
3. Ответы принимаются строго по порядку и только один раз.
4. RAG повторно извлекает контекст текущего вопроса.
5. Провайдер оценивает фактическую точность и сохраняет аудит вызова.
6. После последнего ответа создаётся итоговый отчёт; при сбое только отчёта используется локальная сводка из уже выставленных баллов.

Состояния сессии: `created`, `generating`, `in_progress`, `evaluating`, `completed`, `failed`.

## Переход на API

Нужно реализовать ещё один класс интерфейса `InterviewLLMProvider` и выбрать его
через `INTERVIEW_LLM_PROVIDER`. API, RAG, схемы данных и интерфейс приложения при
этом не меняются.
