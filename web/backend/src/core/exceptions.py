"""Custom exception classes for the application"""


class AppException(Exception):
    """Base exception for all application errors"""

    def __init__(self, message: str, status_code: int = 500, details: dict | None = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(AppException):
    """Validation error for invalid user input"""

    def __init__(self, message: str, details: dict | None = None):
        super().__init__(message, status_code=400, details=details)


class ProcessingError(AppException):
    """Error during image processing"""

    def __init__(self, message: str, details: dict | None = None):
        super().__init__(message, status_code=500, details=details)


class RateLimitError(AppException):
    """Rate limit exceeded"""

    def __init__(self, message: str = "Rate limit exceeded", details: dict | None = None):
        super().__init__(message, status_code=429, details=details)


class BinaryExecutionError(AppException):
    """Error executing the GeminiWatermarkTool binary"""

    def __init__(self, message: str, exit_code: int | None = None, details: dict | None = None):
        error_details = details or {}
        if exit_code is not None:
            error_details["exit_code"] = exit_code
        super().__init__(message, status_code=500, details=error_details)


class FileNotFoundError(AppException):
    """Requested file not found"""

    def __init__(self, message: str = "File not found", details: dict | None = None):
        super().__init__(message, status_code=404, details=details)
