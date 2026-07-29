import pytest

@pytest.mark.asyncio
async def test_get_user_profile(client):
    response = await client.get("/api/v1/user/me")
    assert response.status_code == 200
    data = response.json()
    assert "email" in data
    assert data["subscription_status"] == "active_base_tier"
    assert data["monthly_sessions_limit"] == 15

@pytest.mark.asyncio
async def test_upload_material_invalid_file(client):
    # Test uploading a non-pdf file
    files = {"file": ("test.txt", b"Hello, World!", "text/plain")}
    response = await client.post("/api/v1/materials/upload", files=files)
    assert response.status_code == 400
    assert "Поддерживаются только файлы формата PDF" in response.json()["detail"]
