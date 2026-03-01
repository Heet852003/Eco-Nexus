#!/usr/bin/env python3
"""
Eco-Nexus – Automation testing script.
Run against a live API (e.g. after 'docker compose up' or 'uvicorn app.main:app').
Usage: python scripts/run_automation_tests.py [BASE_URL]
Default BASE_URL = http://localhost:8000
"""
import sys
import time
import urllib.request
import urllib.error
import json

BASE_URL = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000").rstrip("/")


def req(method: str, path: str, data: dict | None = None, headers: dict | None = None) -> tuple[int, dict]:
    url = f"{BASE_URL}{path}"
    h = {"Content-Type": "application/json", **(headers or {})}
    if data is not None and method in ("POST", "PATCH", "PUT"):
        body = json.dumps(data).encode()
    else:
        body = None
    req_obj = urllib.request.Request(url, data=body, headers=h, method=method)
    try:
        with urllib.request.urlopen(req_obj, timeout=10) as r:
            raw = r.read().decode()
            return r.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        return e.code, json.loads(raw) if raw else {}
    except Exception as e:
        print(f"Request failed: {e}")
        return 0, {}


def main() -> int:
    print("Eco-Nexus automation tests –", BASE_URL)
    # Health
    status, _ = req("GET", "/health")
    if status != 200:
        print("FAIL: /health returned", status)
        return 1
    print("OK: /health")

    # Register
    status, body = req("POST", "/api/v1/auth/register", {
        "email": f"automation-{int(time.time())}@eco.dev",
        "password": "automation123",
        "full_name": "Automation User",
    })
    if status != 200:
        print("FAIL: register", status, body)
        return 1
    print("OK: register")

    # Login
    email = body["email"]
    status, body = req("POST", "/api/v1/auth/login", None)
    # Login expects form data
    import urllib.parse
    login_data = urllib.parse.urlencode({"username": email, "password": "automation123"}).encode()
    req_obj = urllib.request.Request(
        f"{BASE_URL}/api/v1/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req_obj, timeout=10) as r:
            body = json.loads(r.read().decode())
            token = body.get("access_token")
    except urllib.error.HTTPError as e:
        print("FAIL: login", e.code)
        return 1
    if not token:
        print("FAIL: no token")
        return 1
    print("OK: login")
    auth = {"Authorization": f"Bearer {token}"}

    # Create device
    status, body = req("POST", "/api/v1/devices", {"name": "Auto Device", "device_type": "sensor"}, auth)
    if status != 201:
        print("FAIL: create device", status, body)
        return 1
    device_id = body["id"]
    print("OK: create device", device_id)

    # Ingest event
    status, body = req("POST", "/api/v1/events", {"device_id": device_id, "event_type": "test", "payload": {}}, auth)
    if status != 201:
        print("FAIL: ingest event", status, body)
        return 1
    print("OK: ingest event")

    # Dashboard summary
    status, body = req("GET", "/api/v1/dashboard/summary", None, auth)
    if status != 200:
        print("FAIL: dashboard", status, body)
        return 1
    print("OK: dashboard", body)
    print("All automation checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
