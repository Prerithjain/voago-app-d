from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/api/filters")
    assert response.status_code == 200
    data = response.json()
    assert "cities" in data
    assert "types" in data

def test_recommendations():
    payload = {
        "destination": "Delhi",
        "categories": ["Historical"],
        "significance": [],
        "budget": 10000,
        "num_days": 2,
        "preferences": []
    }
    response = client.post("/api/recommendations", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data
    assert isinstance(data["recommendations"], list)
