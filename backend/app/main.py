"""ReMind AI FastAPI application factory.

``create_app()`` wires configuration, logging, middleware, exception handlers
(which enforce the ``{ status, data, error }`` envelope for errors) and routers.
A module-level ``app`` is exported so ``uvicorn app.main:app`` keeps working.
"""

import logging

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.logging import configure_logging
from app.core.middleware import RequestContextMiddleware
from app.schemas.common import error as error_envelope
from app.schemas.common import success

logger = logging.getLogger("remind")


def create_app() -> FastAPI:
    configure_logging("DEBUG" if settings.DEBUG else "INFO")

    app = FastAPI(
        title=settings.PROJECT_NAME,
        description=settings.PROJECT_DESCRIPTION,
        version=settings.VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
    )

    _register_middleware(app)
    _register_exception_handlers(app)
    _register_routes(app)

    logger.info(
        "%s v%s initialised (env=%s)",
        settings.PROJECT_NAME,
        settings.VERSION,
        settings.ENVIRONMENT,
    )
    return app


def _register_middleware(app: FastAPI) -> None:
    # Order matters: the last middleware added is the outermost (runs first).
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.add_middleware(RequestContextMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Process-Time-ms"],
    )


def _register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content=error_envelope(code=f"http_{exc.status_code}", message=str(exc.detail)),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content=error_envelope(
                code="validation_error",
                message="Request validation failed",
                details=jsonable_encoder(exc.errors()),
            ),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        request_id = getattr(request.state, "request_id", None)
        logger.exception("unhandled error id=%s", request_id)
        return JSONResponse(
            status_code=500,
            content=error_envelope(
                code="internal_error",
                message="An unexpected error occurred.",
            ),
        )


def _register_routes(app: FastAPI) -> None:
    # Imported lazily so app metadata/handlers are set up before route modules load.
    from app.api import analytics, auth, faces, patients, reminders, sos

    @app.get("/", tags=["meta"], summary="API root")
    def read_root():
        return success(
            {
                "service": settings.PROJECT_NAME,
                "version": settings.VERSION,
                "environment": settings.ENVIRONMENT,
                "docs": "/docs",
            }
        )

    @app.get("/health", tags=["meta"], summary="Liveness probe")
    def health_check():
        return success(
            {
                "status": "ok",
                "service": settings.PROJECT_NAME,
                "version": settings.VERSION,
                "environment": settings.ENVIRONMENT,
            }
        )

    app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
    app.include_router(patients.router, prefix=f"{settings.API_V1_STR}/patients", tags=["patients"])
    app.include_router(faces.router, prefix=f"{settings.API_V1_STR}/faces", tags=["faces"])
    app.include_router(
        reminders.router, prefix=f"{settings.API_V1_STR}/reminders", tags=["reminders"]
    )
    app.include_router(sos.router, prefix=f"{settings.API_V1_STR}/sos", tags=["sos"])
    app.include_router(
        analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"]
    )


app = create_app()
