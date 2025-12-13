#pragma once

#include <opencv2/core.hpp>
#include <algorithm>
#include <cmath>

namespace gwt {

/**
 * Gemini Watermark Blend Engine
 *
 * Based on reverse engineering of Gemini's watermark system:
 *
 * Gemini adds watermark using alpha blending:
 *   watermarked = alpha * logo + (1 - alpha) * original
 *
 * To remove watermark:
 *   original = (watermarked - alpha * logo) / (1 - alpha)
 */

// ============================================================================
// Alpha Map Calculation
// ============================================================================

/**
 * Calculate alpha map from background capture
 *
 * @param bg_capture  The watermark captured on pure background
 * @return                  Alpha map (CV_32FC1, values 0.0 to 1.0)
 */
cv::Mat calculate_alpha_map(const cv::Mat& bg_capture);

// ============================================================================
// Watermark Removal (Reverse Alpha Blending)
// ============================================================================

/**
 * Remove watermark from image region using reverse alpha blending
 *
 * Formula: original = (watermarked - alpha * logo) / (1 - alpha)
 *
 * Where alpha = 0, the pixel is unchanged (no watermark effect)
 * Where alpha > 0, we reverse the blending to restore original
 *
 * @param image          The image to modify (BGR, 8-bit)
 * @param alpha_map      Alpha map from calculate_alpha_map()
 * @param position       Top-left position of watermark region
 * @param logo_value     The logo color value (default: 255 = white)
 */
void remove_watermark_alpha_blend(
    cv::Mat& image,
    const cv::Mat& alpha_map,
    const cv::Point& position,
    float logo_value = 255.0f
);

// ============================================================================
// Watermark Addition (Alpha Blending)
// ============================================================================

/**
 * Add watermark to image region using alpha blending
 *
 * Formula: result = alpha * logo + (1 - alpha) * original
 *
 * @param image          The image to modify (BGR, 8-bit)
 * @param alpha_map      Alpha map from calculate_alpha_map()
 * @param position       Top-left position of watermark region
 * @param logo_value     The logo color value (default: 255 = white)
 */
void add_watermark_alpha_blend(
    cv::Mat& image,
    const cv::Mat& alpha_map,
    const cv::Point& position,
    float logo_value = 255.0f
);

// ============================================================================
// Legacy Blend Modes (kept for reference)
// ============================================================================

enum class BlendMode {
    Screen,      // Lighten - alternative method
    ColourBurn,  // Darken - alternative method
};

inline float screen_blend(float base, float blend) {
    return 1.0f - (1.0f - base) * (1.0f - blend);
}

inline float colour_burn_blend(float base, float blend) {
    if (blend <= 0.0f) return 0.0f;
    float result = 1.0f - (1.0f - base) / blend;
    return std::clamp(result, 0.0f, 1.0f);
}

} // namespace gwt
