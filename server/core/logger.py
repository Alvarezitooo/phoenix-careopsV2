"""
📝 Logging structuré avec Loguru
"""
import sys
from loguru import logger
from config.settings import settings


# Remove default handler
logger.remove()

# Console handler (pretty logs for dev)
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="DEBUG" if settings.debug else "INFO",
    colorize=True,
)

# File handler (JSON for production)
logger.add(
    "logs/app.log",
    rotation="500 MB",  # Rotate when file size reaches 500MB
    retention="10 days",  # Keep logs for 10 days
    compression="zip",  # Compress old logs
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} - {message}",
    level="INFO",
    serialize=False,  # Set to True for JSON logs
)

# Error handler (separate file for errors)
logger.add(
    "logs/errors.log",
    rotation="100 MB",
    retention="30 days",
    compression="zip",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} - {message}",
    level="ERROR",
    backtrace=True,  # Include full traceback
    diagnose=True,  # Include variables values
)


def log_request(method: str, path: str, status_code: int, processing_time: float, user_id: str = "anonymous"):
    """
    Log HTTP requests with structured data

    Usage:
    ```python
    log_request("POST", "/api/chat/send", 200, 1.23, "user123")
    ```
    """
    logger.info(
        f"HTTP {method} {path} | Status: {status_code} | Time: {processing_time:.2f}s | User: {user_id}"
    )


def log_error(error: Exception, context: dict = None):
    """
    Log errors with context

    Usage:
    ```python
    try:
        ...
    except Exception as e:
        log_error(e, {"user_id": "user123", "action": "chat_send"})
    ```
    """
    if context:
        logger.error(f"Error: {str(error)} | Context: {context}", exc_info=True)
    else:
        logger.error(f"Error: {str(error)}", exc_info=True)


def log_rag_query(user_id: str, question: str, num_sources: int, cached: bool, processing_time: float):
    """
    Log RAG queries for analytics

    Usage:
    ```python
    log_rag_query("user123", "Comment obtenir l'AEEH ?", 3, False, 2.5)
    ```
    """
    logger.info(
        f"RAG Query | User: {user_id} | Question: {question[:50]}... | Sources: {num_sources} | Cached: {cached} | Time: {processing_time:.2f}s"
    )


def log_auth(user_id: str, action: str, success: bool):
    """
    Log authentication events

    Usage:
    ```python
    log_auth("user123", "login", True)
    log_auth("user123", "jwt_validation", False)
    ```
    """
    level = "info" if success else "warning"
    logger.log(level, f"Auth {action} | User: {user_id} | Success: {success}")


# Export logger for direct use
__all__ = ["logger", "log_request", "log_error", "log_rag_query", "log_auth"]
