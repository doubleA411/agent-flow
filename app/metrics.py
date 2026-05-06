import os
from prometheus_client import Counter, Histogram, Gauge, multiprocess, CollectorRegistry

def make_metrics():
    return (
        Counter(
            "agentflow_runs_total",
            "Total agent runs by status",
            ["status"]
        ),
        Histogram(
            "agentflow_run_duration_seconds",
            "How long agent runs take",
            buckets=[0.5, 1, 2, 5, 10, 30, 60]
        ),
        Gauge(
            "agentflow_queue_depth",
            "Number of pending runs in DB",
            multiprocess_mode="livesum"
        ),
    )

run_counter, run_duration, queue_depth = make_metrics()