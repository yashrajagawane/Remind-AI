"""Phase 0 smoke tests: the app boots, health/root respond, docs load,
and errors use the standard ``{ status, data, error }`` envelope.
"""

from fastapi.testclient import TestClient


def test_root_returns_success_envelope(client: TestClient):
    resp = client.get("/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "success"
    assert body["data"]["service"] == "ReMind AI"
    assert body["error"] is None


def test_health_ok(client: TestClient):
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "success"
    assert body["data"]["status"] == "ok"


def test_request_id_header_present(client: TestClient):
    resp = client.get("/health")
    assert "X-Request-ID" in resp.headers
    assert "X-Process-Time-ms" in resp.headers


def test_docs_and_openapi_load(client: TestClient):
    assert client.get("/docs").status_code == 200
    assert client.get("/api/v1/openapi.json").status_code == 200


def test_unknown_route_uses_error_envelope(client: TestClient):
    resp = client.get("/definitely-not-a-route")
    assert resp.status_code == 404
    body = resp.json()
    assert body["status"] == "error"
    assert body["error"]["code"] == "http_404"
    assert body["data"] is None
