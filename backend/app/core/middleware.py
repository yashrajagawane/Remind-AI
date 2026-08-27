"""HTTP middleware: per-request correlation ID and timing."""

import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("remind.request")


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Attach a request ID, measure duration, and log every request.

    - Reuses an inbound ``X-Request-ID`` header if present, else generates one.
    - Exposes ``request.state.request_id`` to downstream handlers.
    - Adds ``X-Request-ID`` and ``X-Process-Time-ms`` to every response.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id

        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            elapsed_ms = (time.perf_counter() - start) * 1000
            logger.exception(
                "%s %s -> ERROR (%.1fms) id=%s",
                request.method,
                request.url.path,
                elapsed_ms,
                request_id,
            )
            raise

        elapsed_ms = (time.perf_counter() - start) * 1000
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time-ms"] = f"{elapsed_ms:.1f}"
        logger.info(
            "%s %s -> %s (%.1fms) id=%s",
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
            request_id,
        )
        return response
