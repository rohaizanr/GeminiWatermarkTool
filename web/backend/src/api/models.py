"""Pydantic models for API request/response schemas"""

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """Standard error response schema per OpenAPI specification"""

    error: str = Field(..., description="Error type or code")
    message: str = Field(..., description="Human-readable error message")
    details: dict[str, Any] | None = Field(None, description="Additional error context")

    class Config:
        json_schema_extra = {
            "example": {
                "error": "validation_error",
                "message": "File size exceeds maximum limit",
                "details": {"max_size_mb": 10, "received_size_mb": 15.3},
            }
        }


class HealthResponse(BaseModel):
    """Health check response"""

    status: str = Field(..., description="Service status")
    version: str = Field(..., description="Application version")


class ReadinessResponse(BaseModel):
    """Readiness check response"""

    ready: bool = Field(..., description="Service readiness status")
    checks: dict[str, bool] = Field(..., description="Individual component checks")
    message: str | None = Field(None, description="Additional readiness information")


# Enums
class JobStatus(str, Enum):
    """Processing job status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ImageFormat(str, Enum):
    """Supported image formats"""
    JPEG = "jpeg"
    PNG = "png"
    WEBP = "webp"
    BMP = "bmp"


class WatermarkSize(str, Enum):
    """Watermark dimensions"""
    SMALL_48X48 = "small_48x48"
    LARGE_96X96 = "large_96x96"
    UNKNOWN = "unknown"


# Data Models (User Story 1)
class UploadSession(BaseModel):
    """Upload session tracking"""
    session_id: UUID = Field(..., description="Unique session identifier")
    client_ip: str = Field(..., description="Anonymized client IP address")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow, description="Upload timestamp")


class ProcessingJob(BaseModel):
    """Watermark removal processing job"""
    job_id: UUID = Field(..., description="Unique job identifier")
    session_id: UUID = Field(..., description="Parent session identifier")
    input_file_path: str = Field(..., description="Input file path")
    output_file_path: str = Field(..., description="Output file path")
    status: JobStatus = Field(default=JobStatus.PENDING, description="Job status")
    started_at: datetime | None = Field(None, description="Processing start timestamp")
    completed_at: datetime | None = Field(None, description="Processing completion timestamp")
    duration_ms: int | None = Field(None, description="Processing duration in milliseconds")
    error_message: str | None = Field(None, description="Error message if failed")
    binary_exit_code: int | None = Field(None, description="Binary exit code")
    detected_watermark_size: WatermarkSize = Field(
        default=WatermarkSize.UNKNOWN, description="Detected watermark size"
    )


class ImageMetadata(BaseModel):
    """Image metadata from validation"""
    job_id: UUID = Field(..., description="Associated job identifier")
    file_name: str = Field(..., description="Original filename")
    file_size_bytes: int = Field(..., description="File size in bytes")
    file_format: ImageFormat = Field(..., description="Image format")
    mime_type: str = Field(..., description="MIME type")
    width_pixels: int = Field(..., description="Image width")
    height_pixels: int = Field(..., description="Image height")
    has_watermark: bool = Field(default=True, description="Assumed to have watermark")
    watermark_size: WatermarkSize = Field(..., description="Watermark dimensions")
    watermark_position: str = Field(default="bottom-right", description="Watermark position")
    validation_passed: bool = Field(default=False, description="Validation status")


# API Response Models (User Story 1)
class SingleImageResponse(BaseModel):
    """Response for single image processing"""
    job_id: str = Field(..., description="Job identifier for tracking")
    status: JobStatus = Field(..., description="Processing status")
    processed_image_base64: str | None = Field(None, description="Base64-encoded processed image")
    original_filename: str = Field(..., description="Original uploaded filename")
    output_filename: str | None = Field(None, description="Generated output filename")
    duration_ms: int | None = Field(None, description="Processing duration")
    watermark_size: WatermarkSize = Field(..., description="Detected watermark size")
    error: str | None = Field(None, description="Error message if processing failed")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                "status": "completed",
                "processed_image_base64": "iVBORw0KGgoAAAANSUhEUgA...",
                "original_filename": "my-image.jpg",
                "output_filename": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
                "duration_ms": 1234,
                "watermark_size": "large_96x96",
                "error": None,
            }
        }
