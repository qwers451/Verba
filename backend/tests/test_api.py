import pytest
import importlib

@pytest.mark.asyncio
async def test_get_user_profile(client, auth_headers):
    response = await client.get("/api/v1/user/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "email" in data
    assert data["subscription_status"] == "pro"
    assert data["subscription_title"] == "Pro"
    assert data["monthly_sessions_limit"] == 15

@pytest.mark.asyncio
async def test_upload_material_invalid_file(client, auth_headers):
    # Test uploading a non-pdf file
    files = {"file": ("test.txt", b"Hello, World!", "text/plain")}
    response = await client.post("/api/v1/materials/upload", files=files, headers=auth_headers)
    assert response.status_code == 400
    assert "Поддерживаются только файлы формата PDF" in response.json()["detail"]

@pytest.mark.asyncio
async def test_yookassa_checkout_creates_pending_payment(client, auth_headers, monkeypatch):
    async def fake_create_checkout(**kwargs):
        assert kwargs["amount_rub"] == 690
        return "test-provider-payment", "pending", "https://example.test/checkout"

    router_module = importlib.import_module("app.api.router")
    monkeypatch.setattr(router_module, "create_checkout", fake_create_checkout)
    response = await client.post(
        "/api/v1/billing/yookassa/checkout", json={"plan_code": "pro"}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["confirmation_url"] == "https://example.test/checkout"
    assert response.json()["payment"]["provider"] == "yookassa_test"
    assert response.json()["payment"]["status"] == "pending"

    profile = await client.get("/api/v1/user/me", headers=auth_headers)
    assert profile.json()["subscription_status"] == "pro"
    assert profile.json()["monthly_sessions_limit"] == 15
