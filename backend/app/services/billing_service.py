from app.config import settings

FREE_PLAN_CODE = "free"
PRO_PLAN_CODE = "pro"
LEGACY_PRO_STATUSES = {"active_tier", "active", "paid"}


def normalize_plan_code(subscription_status: str | None) -> str:
    if subscription_status in LEGACY_PRO_STATUSES or subscription_status == PRO_PLAN_CODE:
        return PRO_PLAN_CODE
    return FREE_PLAN_CODE


def get_plans() -> list[dict]:
    return [
        {
            "code": FREE_PLAN_CODE,
            "title": "Базовый",
            "price_rub": 0,
            "monthly_session_limit": 3,
            "features": ["3 тренировочные сессии в месяц", "Загрузка PDF-материалов", "Личный кабинет"],
        },
        {
            "code": PRO_PLAN_CODE,
            "title": "Pro",
            "price_rub": settings.MONTHLY_SUBSCRIPTION_PRICE_RUB,
            "monthly_session_limit": settings.MONTHLY_SESSION_LIMIT,
            "features": ["15 тренировочных сессий в месяц", "Загрузка PDF-материалов", "История и результаты сессий"],
        },
    ]
