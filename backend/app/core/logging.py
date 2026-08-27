"""Centralised logging configuration.

Call :func:`configure_logging` once during app startup. Keeps a single stream
handler on the root logger so uvicorn/gunicorn workers log consistently.
"""

import logging
import sys

_LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
_DATE_FORMAT = "%Y-%m-%dT%H:%M:%S"


def configure_logging(level: str = "INFO") -> None:
    """Configure the root logger with a single stdout handler.

    Idempotent: repeated calls only adjust the level rather than stacking
    handlers (important under uvicorn's reloader / multiple workers).
    """
    root = logging.getLogger()

    if root.handlers:
        root.setLevel(level)
        for handler in root.handlers:
            handler.setLevel(level)
        return

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(_LOG_FORMAT, datefmt=_DATE_FORMAT))
    handler.setLevel(level)

    root.addHandler(handler)
    root.setLevel(level)
