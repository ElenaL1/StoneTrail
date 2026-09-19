from __future__ import annotations

import time
from dataclasses import dataclass


@dataclass
class _Bucket:
    count: int
    window_start: float


class RateLimiter:
    """Process-local sliding window. Resets on restart; not shared across workers."""

    def __init__(self) -> None:
        self._buckets: dict[str, _Bucket] = {}

    def reset(self) -> None:
        self._buckets.clear()

    def retry_after(
        self, key: str, max_attempts: int, window_seconds: int
    ) -> int | None:
        bucket = self._buckets.get(key)
        now = time.monotonic()
        if bucket is None:
            return None
        if now - bucket.window_start >= window_seconds:
            self._buckets.pop(key, None)
            return None
        if bucket.count >= max_attempts:
            remaining = int(window_seconds - (now - bucket.window_start))
            return max(remaining, 1)
        return None

    def hit(self, key: str, max_attempts: int, window_seconds: int) -> None:
        now = time.monotonic()
        bucket = self._buckets.get(key)
        if bucket is None or now - bucket.window_start >= window_seconds:
            self._buckets[key] = _Bucket(count=1, window_start=now)
            return
        bucket.count += 1

    def clear(self, key: str) -> None:
        self._buckets.pop(key, None)

    def available_at_ms(self, key: str, window_seconds: int) -> int:
        bucket = self._buckets.get(key)
        if bucket is None:
            return 0
        ready = bucket.window_start + window_seconds
        now = time.monotonic()
        if now >= ready:
            return 0
        wall = time.time() + (ready - now)
        return int(wall * 1000)


limiter = RateLimiter()
