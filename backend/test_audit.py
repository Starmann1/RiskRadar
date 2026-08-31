import requests
import json
import io

BASE = "http://127.0.0.1:8000/api"

endpoints = [
    ("/dashboard/executive-overview", "GET"),
    ("/dashboard/priority-queue", "GET"),
    ("/dashboard/site-comparison", "GET"),
    ("/dashboard/activity-analysis", "GET"),
    ("/dashboard/barrier-failures", "GET"),
    ("/dashboard/trends", "GET"),
    ("/intelligence/benchmark", "GET"),
    ("/reports?limit=5", "GET")
]

all_passed = True
print("=== COMPREHENSIVE ENDPOINT AUDIT ===")
for ep, method in endpoints:
    try:
        r = requests.get(f"{BASE}{ep}", timeout=5)
        status = "PASS" if r.status_code == 200 else f"FAIL ({r.status_code})"
        print(f"{method} {ep:<35} -> {status}")
        if r.status_code != 200:
            all_passed = False
    except Exception as e:
        print(f"{method} {ep:<35} -> ERROR: {e}")
        all_passed = False

# Test individual report detail, chain, similar
try:
    rep = requests.get(f"{BASE}/reports?limit=1").json()[0]
    r_id = rep["report_id"]
    r_detail = requests.get(f"{BASE}/reports/{r_id}")
    r_chain = requests.get(f"{BASE}/reports/{r_id}/chain")
    r_similar = requests.get(f"{BASE}/reports/{r_id}/similar")
    print(f"GET /reports/{{id}} (ID: {r_id[:12]})       -> {'PASS' if r_detail.status_code == 200 else 'FAIL'}")
    print(f"GET /reports/{{id}}/chain             -> {'PASS' if r_chain.status_code == 200 else 'FAIL'}")
    print(f"GET /reports/{{id}}/similar           -> {'PASS' if r_similar.status_code == 200 else 'FAIL'}")
except Exception as e:
    print(f"Report detail checks -> ERROR: {e}")
    all_passed = False

# Test PDF Ingestion
try:
    sample_text = """OIL INDIA LIMITED - HSE Flash Report
Site: Moran Oilfield Well #84
Date: 2026-03-20
Activity: mechanical_electrical_maintenance
Description: During scheduled turnaround maintenance on hydrocarbon line, positive isolation was not verified before crew unbolted wellhead flange. Residual pressure of 14 bar caused sudden emulsion ejection."""
    r_doc = requests.post(f"{BASE}/analyze/document", json={"text": sample_text, "filename": "test.pdf"})
    print(f"POST /analyze/document              -> {'PASS' if r_doc.status_code == 200 else 'FAIL'}")
    if r_doc.status_code != 200:
        all_passed = False
except Exception as e:
    print(f"POST /analyze/document -> ERROR: {e}")
    all_passed = False

# Test CSV Ingestion
try:
    csv_bytes = b"site,narrative_text,activity,report_type\nField Site 4 - Duliajan Central,Helper on monkey board at 14m without securing lanyard,work_at_height,UA\n"
    r_csv = requests.post(f"{BASE}/upload/batch-csv", files={"file": ("test.csv", io.BytesIO(csv_bytes), "text/csv")})
    print(f"POST /upload/batch-csv              -> {'PASS' if r_csv.status_code == 200 else 'FAIL'}")
    if r_csv.status_code != 200:
        all_passed = False
except Exception as e:
    print(f"POST /upload/batch-csv -> ERROR: {e}")
    all_passed = False

print(f"\n==========================================")
print(f"OVERALL BACKEND HEALTH: {'100% HEALTHY' if all_passed else 'ISSUES FOUND'}")
print(f"==========================================")
