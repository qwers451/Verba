import asyncio
from decimal import Decimal
from uuid import uuid4

from yookassa import Configuration, Payment as YooKassaPayment

from app.config import settings


class YooKassaConfigurationError(RuntimeError):
    pass


def _configure() -> None:
    if not settings.YOOKASSA_SHOP_ID or not settings.YOOKASSA_SECRET_KEY:
        raise YooKassaConfigurationError("ЮKassa не настроена: добавьте тестовые ключи в .env.")
    Configuration.account_id = settings.YOOKASSA_SHOP_ID
    Configuration.secret_key = settings.YOOKASSA_SECRET_KEY


async def create_checkout(*, payment_id: str, amount_rub: int, description: str) -> tuple[str, str, str]:
    """Create a redirect checkout and return provider id, status and confirmation URL."""
    _configure()
    payload = {
        "amount": {"value": f"{Decimal(amount_rub):.2f}", "currency": "RUB"},
        "confirmation": {"type": "redirect", "return_url": settings.PAYMENT_RETURN_URL},
        "capture": True,
        "description": description,
        "metadata": {"local_payment_id": payment_id, "environment": "test"},
    }
    payment = await asyncio.to_thread(YooKassaPayment.create, payload, str(uuid4()))
    confirmation_url = getattr(payment.confirmation, "confirmation_url", None)
    if not confirmation_url:
        raise RuntimeError("ЮKassa не вернула ссылку для подтверждения платежа.")
    return payment.id, payment.status, confirmation_url


async def get_payment_status(provider_payment_id: str) -> str:
    _configure()
    payment = await asyncio.to_thread(YooKassaPayment.find_one, provider_payment_id)
    return payment.status
