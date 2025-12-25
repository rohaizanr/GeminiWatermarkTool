#!/usr/bin/env bash

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_TYPE="${BUILD_TYPE:-Debug}"
SKIP_TESTS="${SKIP_TESTS:-false}"
SKIP_CPP="${SKIP_CPP:-false}"
SKIP_BACKEND="${SKIP_BACKEND:-false}"
SKIP_FRONTEND="${SKIP_FRONTEND:-false}"
USE_DOCKER="${USE_DOCKER:-true}"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Build script for GeminiWatermarkTool.
Defaults to Docker build with clean.

OPTIONS:
    -h, --help              Show this help message
    -l, --local             Build locally (requires CMake, vcpkg, etc.)
    --no-clean              Skip cleaning build directories

EXAMPLES:
    $0                      # Build with Docker (recommended)
    $0 --no-clean           # Build with Docker (no clean)
    $0 --local              # Build locally

EOF
}

# Determine docker compose command
get_docker_compose_cmd() {
    if command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    elif docker compose version &> /dev/null 2>&1; then
        echo "docker compose"
    else
        log_error "Neither 'docker-compose' nor 'docker compose' is available"
        exit 1
    fi
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_deps=()
    
    # If using Docker, only check for Docker
    if [ "$USE_DOCKER" = "true" ]; then
        if ! command -v docker &> /dev/null; then
            missing_deps+=("docker")
        fi
        
        # Check for docker compose
        if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
            missing_deps+=("docker-compose or docker compose plugin")
        fi
        
        if [ ${#missing_deps[@]} -gt 0 ]; then
            log_error "Missing required dependencies for Docker build: ${missing_deps[*]}"
            log_info "Please install Docker and Docker Compose and try again."
            exit 1
        fi
        
        log_success "Docker prerequisites satisfied"
        return 0
    fi
    
    # For local builds, check all dependencies
    # Check for CMake
    if [ "$SKIP_CPP" != "true" ] && ! command -v cmake &> /dev/null; then
        missing_deps+=("cmake")
    fi
    
    # Check for Python
    if [ "$SKIP_BACKEND" != "true" ] && ! command -v python3 &> /dev/null; then
        missing_deps+=("python3")
    fi
    
    # Check for Node.js
    if [ "$SKIP_FRONTEND" != "true" ] && ! command -v node &> /dev/null; then
        missing_deps+=("node")
    fi
    
    # Check for npm
    if [ "$SKIP_FRONTEND" != "true" ] && ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        log_info "Please install missing dependencies or use --docker flag."
        exit 1
    fi
    
    log_success "All prerequisites satisfied"
}

clean_build() {
    log_info "Cleaning build directories..."
    
    if [ "$USE_DOCKER" = "true" ]; then
        log_info "Removing Docker images and containers..."
        local DOCKER_COMPOSE_CMD=$(get_docker_compose_cmd)
        $DOCKER_COMPOSE_CMD down -v --remove-orphans 2>/dev/null || true
        docker rmi geminiwatermarktool-backend:latest 2>/dev/null || true
        docker builder prune -f
    else
        rm -rf "$PROJECT_ROOT/build/local"
        rm -rf "$PROJECT_ROOT/web/backend/.venv"
        rm -rf "$PROJECT_ROOT/web/backend/.pytest_cache"
        rm -rf "$PROJECT_ROOT/web/backend/src/__pycache__"
        rm -rf "$PROJECT_ROOT/web/frontend/.next"
        rm -rf "$PROJECT_ROOT/web/frontend/node_modules"
    fi
    
    log_success "Build directories cleaned"
}

build_docker() {
    log_info "Building with Docker Compose..."
    
    cd "$PROJECT_ROOT"
    
    # Get the appropriate docker compose command
    local DOCKER_COMPOSE_CMD=$(get_docker_compose_cmd)
    log_info "Using: $DOCKER_COMPOSE_CMD"
    
    # Build backend (C++ binary will be built inside Docker container)
    log_info "Building backend service (C++ binary will be built in container)..."
    $DOCKER_COMPOSE_CMD build backend
    
    # Build frontend if not skipped
    if [ "$SKIP_FRONTEND" != "true" ]; then
        log_info "Setting up frontend service..."
        # Frontend runs with volume mount in dev mode, so just pull the image
        $DOCKER_COMPOSE_CMD pull frontend 2>/dev/null || true
    fi
    
    log_success "Docker build completed"
    
    # Optionally start services
    if [ "$SKIP_TESTS" != "true" ]; then
        log_info "Starting services for testing..."
        $DOCKER_COMPOSE_CMD up -d
        
        log_info "Waiting for services to be healthy..."
        sleep 10
        
        log_info "Checking service health..."
        $DOCKER_COMPOSE_CMD ps
        
        log_info "Stopping services..."
        $DOCKER_COMPOSE_CMD down
    fi
}

build_cpp() {
    if [ "$SKIP_CPP" = "true" ]; then
        log_warning "Skipping C++ build"
        return 0
    fi
    
    log_info "Building C++ core binary..."
    
    cd "$PROJECT_ROOT"
    
    # Create build directory
    mkdir -p build/local
    cd build/local
    
    # Configure with CMake
    log_info "Configuring CMake (${BUILD_TYPE} build)..."
    cmake ../.. \
        -DCMAKE_BUILD_TYPE="$BUILD_TYPE" \
        -DCMAKE_TOOLCHAIN_FILE="${PROJECT_ROOT}/vcpkg/scripts/buildsystems/vcpkg.cmake" \
        -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
    
    # Build
    log_info "Building C++ binary..."
    cmake --build . --config "$BUILD_TYPE" --parallel $(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)
    
    log_success "C++ build completed"
}

setup_backend() {
    if [ "$SKIP_BACKEND" = "true" ]; then
        log_warning "Skipping backend setup"
        return 0
    fi
    
    log_info "Setting up Python backend..."
    
    cd "$PROJECT_ROOT/web/backend"
    
    # Create virtual environment
    if [ ! -d ".venv" ]; then
        log_info "Creating Python virtual environment..."
        python3 -m venv .venv
    fi
    
    # Activate virtual environment
    source .venv/bin/activate
    
    # Upgrade pip
    log_info "Upgrading pip..."
    pip install --upgrade pip
    
    # Install dependencies
    log_info "Installing backend dependencies..."
    pip install -r requirements.txt
    
    # Install dev dependencies
    if [ -f "requirements-dev.txt" ]; then
        log_info "Installing dev dependencies..."
        pip install -r requirements-dev.txt
    fi
    
    # Run tests if not skipped
    if [ "$SKIP_TESTS" != "true" ]; then
        log_info "Running backend tests..."
        if command -v pytest &> /dev/null; then
            pytest tests/ -v || log_warning "Backend tests failed or no tests found"
        else
            log_warning "pytest not found, skipping backend tests"
        fi
    fi
    
    deactivate
    
    log_success "Backend setup completed"
}

setup_frontend() {
    if [ "$SKIP_FRONTEND" = "true" ]; then
        log_warning "Skipping frontend setup"
        return 0
    fi
    
    log_info "Setting up Next.js frontend..."
    
    cd "$PROJECT_ROOT/web/frontend"
    
    # Install dependencies
    log_info "Installing frontend dependencies..."
    npm install
    
    # Build frontend
    log_info "Building frontend..."
    npm run build
    
    # Run tests if not skipped
    if [ "$SKIP_TESTS" != "true" ]; then
        log_info "Running frontend tests..."
        if npm run test --if-present; then
            log_success "Frontend tests passed"
        else
            log_warning "Frontend tests failed or not configured"
        fi
    fi
    
    log_success "Frontend setup completed"
}

print_summary() {
    log_success "================================"
    log_success "Build completed successfully!"
    log_success "================================"
    echo ""
    
    if [ "$USE_DOCKER" = "true" ]; then
        local DOCKER_COMPOSE_CMD=$(get_docker_compose_cmd)
        log_info "Docker build completed!"
        echo ""
        log_info "To run the application with Docker:"
        echo "  $DOCKER_COMPOSE_CMD up          # Run in foreground"
        echo "  $DOCKER_COMPOSE_CMD up -d       # Run in background"
        echo ""
        log_info "To view logs:"
        echo "  $DOCKER_COMPOSE_CMD logs -f backend"
        echo "  $DOCKER_COMPOSE_CMD logs -f frontend"
        echo ""
        log_info "To stop services:"
        echo "  $DOCKER_COMPOSE_CMD down"
        echo ""
        log_info "Service URLs:"
        echo "  Backend:  http://localhost:8000"
        echo "  Frontend: http://localhost:3000"
        echo "  API Docs: http://localhost:8000/docs"
    else
        log_info "Project locations:"
        [ "$SKIP_CPP" != "true" ] && echo "  C++ Binary: $PROJECT_ROOT/build/local/"
        [ "$SKIP_BACKEND" != "true" ] && echo "  Backend: $PROJECT_ROOT/web/backend/"
        [ "$SKIP_FRONTEND" != "true" ] && echo "  Frontend: $PROJECT_ROOT/web/frontend/"
        echo ""
        log_info "To run the application locally:"
        [ "$SKIP_BACKEND" != "true" ] && echo "  Backend:  cd web/backend && source .venv/bin/activate && uvicorn src.main:app --reload"
        [ "$SKIP_FRONTEND" != "true" ] && echo "  Frontend: cd web/frontend && npm run dev"
        echo ""
        log_info "Or use Docker for integrated deployment:"
        echo "  docker-compose up --build"
    fi
    echo ""
}

# Parse command line arguments
CLEAN_BUILD=true

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            print_usage
            exit 0
            ;;
        -l|--local)
            USE_DOCKER=false
            shift
            ;;
        --no-clean)
            CLEAN_BUILD=false
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            print_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    log_info "Starting build process for GeminiWatermarkTool"
    if [ "$USE_DOCKER" = "true" ]; then
        log_info "Build mode: Docker"
    else
        log_info "Build mode: Local (${BUILD_TYPE})"
    fi
    echo ""
    
    check_prerequisites
    
    if [ "$CLEAN_BUILD" = "true" ]; then
        clean_build
    fi
    
    if [ "$USE_DOCKER" = "true" ]; then
        # Docker build includes C++ and backend together
        build_docker
    else
        # Local builds
        build_cpp
        setup_backend
        setup_frontend
    fi
    
    print_summary
}

# Run main function
main
