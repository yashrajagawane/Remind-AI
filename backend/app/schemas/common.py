"""Standard API response envelope: ``{ status, data, error }``.

Every ReMind AI endpoint returns this shape so the frontend can handle
success and failure uniformly. Use :func:`success` / :func:`error` to build
responses, and :class:`ResponseEnvelope` to document them in OpenAPI.
"""

from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Any | None = None


class ResponseEnvelope(BaseModel, Generic[T]):
    status: str  # "success" | "error"
    data: T | None = None
    error: ErrorDetail | None = None


def success(data: Any = None) -> dict[str, Any]:
    """Build a success envelope."""
    return {"status": "success", "data": data, "error": None}


def error(code: str, message: str, details: Any = None) -> dict[str, Any]:
    """Build an error envelope."""
    return {
        "status": "error",
        "data": None,
        "error": {"code": code, "message": message, "details": details},
    }
