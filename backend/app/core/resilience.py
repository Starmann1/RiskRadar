import time
import logging
from typing import Callable, Any, Optional

logger = logging.getLogger("riskradar.resilience")

class CircuitBreakerOpenException(Exception):
    pass

class CircuitBreaker:
    """
    Circuit breaker for external LLM API calls.
    Prevents cascading network timeouts when LLM providers experience outages.
    """

    def __init__(self, failure_threshold: int = 3, recovery_timeout: float = 30.0):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = 0.0
        self.state = "CLOSED" # CLOSED, OPEN, HALF-OPEN

    def call(self, func: Callable, *args, **kwargs) -> Any:
        now = time.time()
        if self.state == "OPEN":
            if now - self.last_failure_time > self.recovery_timeout:
                self.state = "HALF-OPEN"
                logger.info("Circuit breaker switched to HALF-OPEN state. Testing provider probe...")
            else:
                raise CircuitBreakerOpenException("Circuit breaker is OPEN. Fast-failing to deterministic fallback.")

        try:
            result = func(*args, **kwargs)
            if self.state == "HALF-OPEN":
                self.state = "CLOSED"
                self.failure_count = 0
                logger.info("Circuit breaker probe succeeded. State restored to CLOSED.")
            return result
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = now
            if self.failure_count >= self.failure_threshold:
                self.state = "OPEN"
                logger.warning(f"Circuit breaker tripped to OPEN after {self.failure_count} consecutive failures: {e}")
            raise e

llm_circuit_breaker = CircuitBreaker()
