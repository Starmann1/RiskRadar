import time
import json
import os
import sys

backend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.pipeline import pipeline

def run_stress_test():
    dataset_path = os.path.join(backend_dir, "data", "synthetic_reports.json")
    with open(dataset_path, "r", encoding="utf-8") as f:
        reports = json.load(f)

    print("=" * 80)
    print(f"RISKRADAR AI/NLP PIPELINE STRESS & THROUGHPUT BENCHMARK ({len(reports)} Reports)")
    print("=" * 80)

    start_time = time.time()
    latencies = []
    errors = []

    for idx, r in enumerate(reports):
        t0 = time.time()
        try:
            res = pipeline.process_report(
                narrative_text=r["narrative_text"],
                site=r.get("site", "Field Site"),
                activity=r.get("activity", "mechanical_electrical_maintenance"),
                report_id=r.get("report_id", f"REP-{idx}")
            )
            elapsed_ms = (time.time() - t0) * 1000
            latencies.append(elapsed_ms)
        except Exception as e:
            errors.append((idx, str(e)))

    total_time = time.time() - start_time
    avg_latency = sum(latencies) / len(latencies) if latencies else 0.0
    p95_latency = sorted(latencies)[int(len(latencies) * 0.95)] if latencies else 0.0
    p99_latency = sorted(latencies)[int(len(latencies) * 0.99)] if latencies else 0.0
    throughput = len(reports) / total_time if total_time > 0 else 0.0

    print(f"Total Processed:         {len(reports)} Reports")
    print(f"Total Time:              {total_time:.2f} seconds")
    print(f"Throughput:              {throughput:.1f} reports/sec")
    print(f"Average Latency:         {avg_latency:.2f} ms/report")
    print(f"P95 Latency:             {p95_latency:.2f} ms")
    print(f"P99 Latency:             {p99_latency:.2f} ms")
    print(f"Errors / Failures:       {len(errors)}")
    print("=" * 80)

    assert len(errors) == 0, f"Encountered {len(errors)} pipeline errors during stress test"

if __name__ == "__main__":
    run_stress_test()
