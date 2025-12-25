"""Health check and API routes"""

import os
import uuid
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, File, Form, Request, UploadFile, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from .. import __version__
from ..api.models import SingleImageResponse, UploadSession
from ..core.config import get_settings
from ..core.exceptions import ValidationError
from ..services.file_service import FileService
from ..services.watermark_service import watermark_service
from .models import HealthResponse, ReadinessResponse

settings = get_settings()
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# Initialize services
file_service = FileService()


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Health check endpoint",
    description="Returns basic health status of the service",
)
async def health_check() -> HealthResponse:
    """Basic health check - always returns 200 if service is running"""
    return HealthResponse(
        status="healthy",
        version=__version__,
    )


@router.get(
    "/readiness",
    response_model=ReadinessResponse,
    status_code=status.HTTP_200_OK,
    summary="Readiness check endpoint",
    description="Verifies all dependencies are available (binary, storage, etc.)",
)
async def readiness_check() -> ReadinessResponse:
    """Readiness check - verifies all dependencies are available"""
    checks = {}
    all_ready = True

    # Check if binary exists and is executable
    binary_exists = os.path.isfile(settings.binary_path) and os.access(
        settings.binary_path, os.X_OK
    )
    checks["binary"] = binary_exists
    if not binary_exists:
        all_ready = False

    # Check if upload directory is writable
    upload_dir_writable = os.path.isdir(settings.upload_dir) and os.access(
        settings.upload_dir, os.W_OK
    )
    checks["upload_dir"] = upload_dir_writable
    if not upload_dir_writable:
        all_ready = False

    # Check if output directory is writable
    output_dir_writable = os.path.isdir(settings.output_dir) and os.access(
        settings.output_dir, os.W_OK
    )
    checks["output_dir"] = output_dir_writable
    if not output_dir_writable:
        all_ready = False

    message = "All systems operational" if all_ready else "Some dependencies unavailable"

    return ReadinessResponse(
        ready=all_ready,
        checks=checks,
        message=message,
    )


@router.post(
    "/api/v1/remove-watermark",
    response_model=SingleImageResponse,
    status_code=status.HTTP_200_OK,
    summary="Remove watermark from a single image",
    description="Upload an image with Gemini watermark and receive the cleaned result",
    responses={
        200: {"description": "Image processed successfully"},
        400: {"description": "Invalid request or file validation failed"},
        429: {"description": "Rate limit exceeded"},
        500: {"description": "Internal processing error"},
        504: {"description": "Processing timeout"},
    },
)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def remove_watermark(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Image file to process"),
) -> SingleImageResponse:
    """
    Remove Gemini watermark from uploaded image

    **Workflow**:
    1. Validate file (format, size, content)
    2. Process image through GeminiWatermarkTool binary
    3. Return base64-encoded processed image
    4. Clean up files in background

    **Supported Formats**: JPG, PNG, WebP, BMP
    **Max File Size**: 10MB
    """
    # Step 1: Validate file presence
    if not file.filename:
        raise ValidationError("No file provided")

    # Step 2: Get client IP (anonymized)
    client_ip = request.client.host if request.client else "unknown"
    anonymized_ip = _anonymize_ip(client_ip)

    # Step 3: Create upload session
    session = UploadSession(
        session_id=uuid.uuid4(),
        client_ip=anonymized_ip,
        uploaded_at=datetime.utcnow(),
    )

    # Step 5: Read file content
    file_content = await file.read()

    # Step 6: Validate file size
    if len(file_content) > settings.max_file_size_mb * 1024 * 1024:
        raise ValidationError(
            f"File size exceeds {settings.max_file_size_mb}MB limit",
            details={
                "max_size_mb": settings.max_file_size_mb,
                "received_size_mb": round(len(file_content) / (1024 * 1024), 2),
            },
        )

    # Step 7: Process image
    response = await watermark_service.process_single_image(
        file_content, file.filename, session
    )

    # Step 8: Schedule cleanup in background
    background_tasks.add_task(_cleanup_files, response.output_filename)

    return response


async def _cleanup_files(output_filename: str | None) -> None:
    """
    Background task to clean up processed files

    Args:
        output_filename: Output filename to delete
    """
    if output_filename:
        try:
            await file_service.delete_file(output_filename, from_output=True)
        except Exception as e:
            # Log but don't fail - cleanup is best effort
            from ..core.logging import get_logger
            logger = get_logger(__name__)
            logger.warning(f"Failed to cleanup file {output_filename}: {e}")


def _anonymize_ip(ip: str) -> str:
    """
    Anonymize IP address by zeroing last octet (IPv4) or last groups (IPv6)

    Args:
        ip: IP address string

    Returns:
        Anonymized IP address
    """
    if ":" in ip:  # IPv6
        parts = ip.split(":")
        return ":".join(parts[:4]) + ":0:0:0:0"
    else:  # IPv4
        parts = ip.split(".")
        return ".".join(parts[:3]) + ".0"
