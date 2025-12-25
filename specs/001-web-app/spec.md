# Feature Specification: Web Application for Watermark Removal

**Feature Branch**: `001-web-app`  
**Created**: 2025-12-25  
**Status**: Draft  
**Input**: User description: "build a python api to call the Gemini Watermark Tool. in order to build the Gemini Watermark Tool, we need to build it in a linux container. the result of the build will be used for the actual python api container. build the frontend in next.js for seo purpose."

## Clarifications

### Session 2025-12-26

- Q: Should backend pods process images sequentially or in parallel threads? → A: Sequential processing (one image per pod at a time, scale horizontally for concurrency)
- Q: When should failed upload files be deleted? → A: the image should be deleted in 5 minutes
- Q: Should batch processing have a failure threshold or process all images regardless? → A: skip batch processing
- Turnstile bot protection removed from scope (2025-12-26)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload and Process Single Image (Priority: P1)

A user visits the web application, uploads a watermarked image through a drag-and-drop interface or file picker, and receives a cleaned image without the Gemini watermark.

**Why this priority**: This is the core value proposition - enabling watermark removal through a web interface without requiring users to download CLI tools or understand command-line operations. This single flow delivers immediate value.

**Independent Test**: Can be fully tested by uploading a watermarked image through the web interface and verifying the returned image has the watermark removed. This works independently without any batch processing or advanced features.

**Acceptance Scenarios**:

1. **Given** a user on the homepage, **When** they drag and drop a watermarked JPG/PNG/WebP image onto the upload area, **Then** the system displays a processing indicator and automatically processes the image
2. **Given** an image is successfully processed, **When** processing completes, **Then** the user sees a preview of the cleaned image with download and drag-to-save options
3. **Given** a user uploads a 2MB watermarked image, **When** the system processes it, **Then** processing completes within 5 seconds
4. **Given** a user on mobile device, **When** they tap the upload area, **Then** the native file picker opens allowing image selection from gallery or camera

---

### ~~User Story 3 - Batch Image Processing (Priority: P3)~~ [EXCLUDED]

~~Users can upload multiple watermarked images simultaneously and download all processed images as a ZIP archive, streamlining workflows for users with many images to clean.~~

**Status**: Removed from scope per clarification session 2025-12-26. System will support single image processing only for MVP.

---

### Edge Cases

- What happens when a user uploads an image without a Gemini watermark?
  - System should detect absence of watermark and return the original image with a warning message
- What happens when a user uploads an unsupported file format (e.g., GIF, TIFF)?
  - System rejects the upload with a clear error message listing supported formats: JPG, JPEG, PNG, WebP, BMP
- What happens when a user uploads an extremely large image (e.g., 50MB, 8K resolution)?
  - System enforces maximum file size limit (10MB default) and displays error message with size limit
- What happens when the watermark removal process fails due to corrupted image data?
  - System returns an error message explaining the failure and suggesting the user try the CLI tool for advanced troubleshooting
- What happens when backend API is unavailable or times out?
  - Frontend displays user-friendly error message and suggests retrying after a brief wait
- What happens when a user's network connection drops during upload?
  - System detects the interruption and displays appropriate reconnection message

## Requirements *(mandatory)*

### Functional Requirements

#### Frontend (Next.js)

- **FR-001**: System MUST provide a responsive web interface following Google Material Design 3 guidelines with explicit breakpoints: mobile (< 768px), tablet (768px-1024px), desktop (> 1024px)
- **FR-002**: System MUST implement a three-step workflow layout:
  1. Upload area with drag-and-drop and file picker
  2. Processing indicator showing progress
  3. Download/preview area with save options
- **FR-004**: System MUST support image upload via drag-and-drop and file picker click; SHOULD support paste from clipboard (post-MVP enhancement)
- **FR-005**: System MUST display real-time processing status with Material 3 circular progress indicator
- **FR-006**: System MUST show image preview with before/after comparison slider after processing completes
- **FR-007**: System MUST support server-side rendering (SSR) for SEO optimization of landing page; documentation pages MAY use static generation
- **FR-008**: System MUST implement Material You dynamic color theming
- **FR-009**: Frontend MUST meet WCAG 2.1 AA accessibility standards
- **FR-010**: System MUST display clear, user-friendly error messages for failed uploads or processing errors

#### Backend (FastAPI)

- **FR-011**: System MUST provide a RESTful API endpoint accepting image uploads (POST /api/v1/remove-watermark)
- **FR-012**: System MUST accept image formats: JPEG (extensions: .jpg, .jpeg), PNG, WebP, BMP
- **FR-014**: System MUST invoke the compiled GeminiWatermarkTool binary to process images
- **FR-014a**: Backend pods MUST process images sequentially (one image at a time per pod); concurrent user requests MUST be handled via horizontal pod scaling
- **FR-015**: System MUST return processed images with appropriate content-type headers
- **FR-016**: System MUST enforce rate limiting (10 requests per minute per IP address)
- **FR-016a**: Rate limit applies globally across all API endpoints per IP address (health checks excluded)
- **FR-016b**: System MUST return X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers in all API responses
- **FR-017**: System MUST delete uploaded images after processing completes (maximum retention: 1 hour for failed cleanup); failed uploads MUST be deleted within 5 minutes
- **FR-018**: System MUST log all processing requests with anonymized IP addresses
- **FR-019**: System MUST return appropriate HTTP status codes (200 OK, 400 Bad Request, 429 Too Many Requests, 500 Internal Server Error)
- **FR-020**: System MUST auto-detect watermark size (small_48x48 or large_96x96 per data-model.md enum) using the same logic as CLI tool

#### Container Architecture

- **FR-021**: GeminiWatermarkTool MUST be compiled in a dedicated Linux build container with all C++ dependencies (CMake, vcpkg, OpenCV, etc.)
- **FR-022**: Compiled binary MUST be extracted from build container and copied into the Backend (FastAPI) runtime container
- **FR-023**: Backend (FastAPI) container MUST be lightweight (Alpine Linux base) with only Python runtime and required packages
- **FR-024**: Both containers MUST be orchestrated using Docker Compose for development environment
- **FR-025**: Production deployment MUST use multi-stage Docker builds to minimize final image size

#### Infrastructure

- **FR-026**: System MUST support separate development and production environment configurations
- **FR-027**: Production backend MUST be deployable to Google Kubernetes Engine (GKE)
- **FR-028**: Production frontend MUST be deployable to Cloudflare Pages
- **FR-029**: System MUST store temporary uploaded images in ephemeral storage (not persistent volumes)
- **FR-030**: System MUST expose health check endpoints (/health, /readiness) for Kubernetes probes

### Key Entities *(include if feature involves data)*

- **Upload Session**: Represents a single user upload request, including uploaded image data, processing status, timestamp, and anonymized IP address
- **Processing Job**: Represents the watermark removal operation, including input image path, output image path, processing status (pending/processing/completed/failed), error messages (if any), and processing duration metrics
- **Image Metadata**: Contains image dimensions, file size, detected watermark size (small_48x48 or large_96x96 enum per data-model.md), file format, and validation status

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can upload and process a watermarked image receiving cleaned output in under 5 seconds for images up to 2MB
- **SC-002**: System successfully processes 95% of uploads with valid Gemini watermarks on first attempt
- **SC-003**: Web interface loads with Core Web Vitals passing thresholds (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- **SC-004**: 90% of first-time users successfully complete the upload-process-download workflow without assistance
- **SC-005**: System handles 100 concurrent users processing images simultaneously without degradation
- **SC-006**: ~~Batch processing of 10 images completes within 30 seconds~~ [EXCLUDED - batch processing removed from scope]
- **SC-007**: Zero user-uploaded images persist on server storage beyond 1 hour after processing
- **SC-008**: Frontend achieves Google Lighthouse score of 90+ for Performance, Accessibility, Best Practices, and SEO
- **SC-009**: API returns appropriate error messages within 500ms for invalid requests (wrong format, file size exceeded, etc.)

## Assumptions *(optional - document informed guesses)*

- Users will primarily upload images in common web formats (JPG, PNG) rather than specialized formats
- Average image size will be 1-3MB (typical smartphone/screenshot resolution)
- Most users will process 1-5 images per session
- Backend API will be deployed with auto-scaling enabled (2-10 pods based on load)
- Frontend will use Next.js 14+ with App Router for optimal SSR and SEO
- Material 3 will be implemented using Material Web Components or Next.js-compatible library
- Processing container will have sufficient CPU/memory resources (2 CPU cores, 2GB RAM minimum per pod)
- Users understand they should backup original images before processing (per disclaimer)

## Out of Scope *(optional - explicitly excluded)*

- User authentication or account creation (stateless API only)
- Persistent storage of user images or processing history
- Payment processing or premium tiers
- Image editing features beyond watermark removal (crop, resize, filters, etc.)
- Support for video watermark removal
- Integration with cloud storage providers (Dropbox, Google Drive, etc.)
- Mobile native applications (iOS/Android apps) - web-only for MVP
- Real-time collaborative editing or sharing features
- Removal of invisible/steganographic watermarks (only visible Gemini watermarks)
- Batch image processing / multiple image upload (single image only for MVP per clarification 2025-12-26)
