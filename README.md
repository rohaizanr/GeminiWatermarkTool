# Image Processing & Restoration Pipeline

## Overview
This project provides a **self-hosted image processing pipeline** designed for **preprocessing, restoration, and quality optimization** of images that users **own or are authorized to process**.

The system focuses on:
- Noise reduction
- Artifact cleanup
- Compression artifact mitigation
- Resolution and clarity improvement
- Pipeline-based image transformations

It is intended for **technical users** who want full control over their image processing infrastructure.

---

## Intended Use
This software is designed to be used **only** on images for which you have:
- full ownership, **or**
- explicit rights and permission to process

Typical legitimate use cases include:
- Restoring archived or degraded images
- Improving quality of scanned documents
- Preprocessing assets for internal ML workflows
- Cleaning artifacts introduced by compression or transmission
- Enhancing user-generated content prior to publishing

---

## Non-Goals
This project is **not designed or intended** to:
- Circumvent platform safeguards
- Bypass digital rights management (DRM)
- Defeat proprietary protection mechanisms
- Enable unauthorized use of third-party content

Any such usage is **outside the scope** of this project.

---

## Deployment Model
This software is intended to be deployed in **user-owned infrastructure**.

You are responsible for:
- Cloud account ownership
- Infrastructure costs
- Runtime configuration
- Operational security
- Legal and compliant use of the system

The authors of this project **do not operate** any hosted version of this software.

---

## Architecture
- Stateless processing services
- Configurable pipelines
- Container-friendly deployment
- No hard dependency on external proprietary platforms
- Designed for customization by experienced users

---

## Quick Start

### Prerequisites
- Docker and Docker Compose installed on your system

### Building the Project

Simply run the build script:

```bash
./build.sh
```

This will build the entire project using Docker (recommended).

**Available options:**
- `./build.sh` - Build with Docker (clean build, recommended)
- `./build.sh --no-clean` - Build with Docker without cleaning (faster rebuilds)
- `./build.sh --local` - Build locally (requires CMake, vcpkg, C++ compiler)

### Running the Application

After building, start the services:

```bash
docker compose up
```

Or run in the background:

```bash
docker compose up -d
```

Access the application:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

To stop the services:

```bash
docker compose down
```

---

## Setup
Basic setup involves:
1. Provisioning compute resources in your own cloud environment
2. Deploying the processing services
3. Configuring pipelines to match your workflow
4. Validating output quality against your requirements

Refer to the `/docs` directory for detailed setup instructions.

---

## Responsibility & Compliance
By using this software, you agree that:
- You are solely responsible for how it is used
- You comply with applicable laws and regulations
- You respect intellectual property rights
- You do not use this software for prohibited purposes

The maintainers provide this software **as-is**, without warranties of any kind.

---

## License
This project is licensed under the **MIT License**.

---

## Support
This is a **self-hosted, self-operated** project.

Community contributions are welcome via pull requests and issues related to:
- Performance
- Stability
- General image processing improvements

Requests to target specific platforms, services, or protection mechanisms **will not be accepted**.

---

## Final Note (Important)
If you are unsure whether your intended usage is compliant, **consult legal counsel** before deploying this software in a production environment.
