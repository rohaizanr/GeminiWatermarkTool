cmake_minimum_required(VERSION 3.20)
project(GeminiWatermarkTool VERSION 0.1.1 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# =============================================================================
# Build Options
# =============================================================================

# =============================================================================
# Application Metadata (for Windows resources)
# =============================================================================
set(APP_PRODUCT_NAME "Gemini Watermark Tool")
set(APP_DESCRIPTION "Add/Remove Gemini-style visible watermarks")
set(APP_COMPANY "Allen Wu")
set(APP_COPYRIGHT "Copyright (C) 2024 Allen Wu. MIT License.")

# =============================================================================
# Windows Resource File (Icon + Version Info)
# =============================================================================
if(WIN32)
    set(APP_ICON_PATH "${CMAKE_CURRENT_SOURCE_DIR}/resources/app.ico")

    if(EXISTS "${APP_ICON_PATH}")
        # Generate .rc from template
        configure_file(
            "${CMAKE_CURRENT_SOURCE_DIR}/resources/app.rc.in"
            "${CMAKE_CURRENT_BINARY_DIR}/resources/app.rc"
            @ONLY
        )
        set(WIN_RESOURCE_FILE "${CMAKE_CURRENT_BINARY_DIR}/resources/app.rc")
        message(STATUS "Windows resource file configured with icon: ${APP_ICON_PATH}")
    else()
        message(STATUS "No icon found at ${APP_ICON_PATH}, skipping resource file")
        set(WIN_RESOURCE_FILE "")
    endif()
endif()

# =============================================================================
# Static Runtime Configuration (for single .exe distribution)
# =============================================================================
if(MSVC)
    # Use static runtime library (/MT instead of /MD)
    set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")

    # Compiler flags
    add_compile_options(/W4 /utf-8)

    # Release optimizations
    set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} /O2 /GL /Gy")
    set(CMAKE_EXE_LINKER_FLAGS_RELEASE "${CMAKE_EXE_LINKER_FLAGS_RELEASE} /LTCG /OPT:REF /OPT:ICF")
endif()


# =============================================================================
# Dependencies (via vcpkg)
# =============================================================================
find_package(OpenCV REQUIRED)
find_package(fmt CONFIG REQUIRED)
find_package(CLI11 CONFIG REQUIRED)
find_package(spdlog CONFIG REQUIRED)

# =============================================================================
# Main Executable
# =============================================================================
set(SOURCES
    src/main.cpp
    src/watermark_engine.cpp
    src/blend_modes.cpp
)

set(HEADERS
    src/watermark_engine.hpp
    src/blend_modes.hpp
    src/ascii_logo.hpp
)

add_executable(${PROJECT_NAME}
    ${SOURCES}
    ${HEADERS}
    ${WIN_RESOURCE_FILE}  # Windows icon + version info (empty on non-Windows)
)

target_include_directories(${PROJECT_NAME} PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${CMAKE_CURRENT_SOURCE_DIR}/assets
)

target_link_libraries(${PROJECT_NAME} PRIVATE
    ${OpenCV_LIBS}
    fmt::fmt
    CLI11::CLI11
    spdlog::spdlog
)

# =============================================================================
# Compile Definitions
# =============================================================================
target_compile_definitions(${PROJECT_NAME} PRIVATE
    APP_VERSION="${PROJECT_VERSION}"
    APP_NAME="${PROJECT_NAME}"
)

# =============================================================================
# Install
# =============================================================================
install(TARGETS ${PROJECT_NAME} DESTINATION bin)

message(STATUS "")
message(STATUS "=== Sudoku Solver Configuration ===")
message(STATUS "Build type: ${CMAKE_BUILD_TYPE}")
message(STATUS "C++ Standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "OpenCV: ${OpenCV_VERSION}")
message(STATUS "===================================")

