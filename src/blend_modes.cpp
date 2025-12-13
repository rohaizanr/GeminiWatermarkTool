#include "blend_modes.hpp"
#include <opencv2/imgproc.hpp>

namespace gwt {

cv::Mat calculate_alpha_map(const cv::Mat& bg_capture) {
    CV_Assert(!bg_capture.empty());

    cv::Mat gray;
    if (bg_capture.channels() == 3) {
        // Use max of RGB channels for brightness (handles colored logos)
        std::vector<cv::Mat> channels;
        cv::split(bg_capture, channels);
        cv::max(channels[0], channels[1], gray);
        cv::max(gray, channels[2], gray);
    } else if (bg_capture.channels() == 4) {
        std::vector<cv::Mat> channels;
        cv::split(bg_capture, channels);
        cv::max(channels[0], channels[1], gray);
        cv::max(gray, channels[2], gray);
    } else {
        gray = bg_capture.clone();
    }

    // Convert to float and normalize to [0, 1]
    // alpha = bg_value / 255
    cv::Mat alpha_map;
    gray.convertTo(alpha_map, CV_32FC1, 1.0 / 255.0);

    return alpha_map;
}

void remove_watermark_alpha_blend(
    cv::Mat& image,
    const cv::Mat& alpha_map,
    const cv::Point& position,
    float logo_value ) {
    CV_Assert(!image.empty() && !alpha_map.empty());
    CV_Assert(image.channels() == 3);
    CV_Assert(alpha_map.type() == CV_32FC1);

    // Calculate region of interest
    int x = position.x;
    int y = position.y;
    int w = alpha_map.cols;
    int h = alpha_map.rows;

    // Clip to image bounds
    int x1 = std::max(0, x);
    int y1 = std::max(0, y);
    int x2 = std::min(image.cols, x + w);
    int y2 = std::min(image.rows, y + h);

    if (x1 >= x2 || y1 >= y2) return;

    // Get ROIs
    cv::Rect alpha_roi(x1 - x, y1 - y, x2 - x1, y2 - y1);
    cv::Rect image_roi(x1, y1, x2 - x1, y2 - y1);

    cv::Mat alpha_region = alpha_map(alpha_roi);
    cv::Mat image_region = image(image_roi);

    // Convert image to float
    cv::Mat image_f;
    image_region.convertTo(image_f, CV_32FC3);

    // Apply reverse alpha blending
    //
    // Gemini applies: watermarked = alpha * logo + (1 - alpha) * original
    // We reverse:     original = (watermarked - alpha * logo) / (1 - alpha)
    //
    // Special cases:
    //   - alpha = 0: no watermark effect, pixel unchanged
    //   - alpha → 1: unstable, clamp result

    const float alpha_threshold = 0.002f;  // Ignore very small alpha (noise)
    const float max_alpha = 0.99f;         // Avoid division by near-zero

    for (int row = 0; row < image_f.rows; ++row) {
        const float* alpha_ptr = alpha_region.ptr<float>(row);
        cv::Vec3f* img_ptr = image_f.ptr<cv::Vec3f>(row);

        for (int col = 0; col < image_f.cols; ++col) {
            float alpha = alpha_ptr[col];

            // Skip pixels with negligible watermark effect
            if (alpha < alpha_threshold) {
                continue;
            }

            // Clamp alpha to avoid division issues
            alpha = std::min(alpha, max_alpha);
            float one_minus_alpha = 1.0f - alpha;

            // Reverse the blending for each channel
            for (int c = 0; c < 3; ++c) {
                float watermarked = img_ptr[col][c];
                float original = (watermarked - alpha * logo_value) / one_minus_alpha;
                img_ptr[col][c] = std::clamp(original, 0.0f, 255.0f);
            }
        }
    }

    // Convert back to 8-bit
    cv::Mat result;
    image_f.convertTo(result, CV_8UC3);
    result.copyTo(image_region);
}

void add_watermark_alpha_blend(
    cv::Mat& image,
    const cv::Mat& alpha_map,
    const cv::Point& position,
    float logo_value ) {
    CV_Assert(!image.empty() && !alpha_map.empty());
    CV_Assert(image.channels() == 3);
    CV_Assert(alpha_map.type() == CV_32FC1);

    // Calculate region of interest
    int x = position.x;
    int y = position.y;
    int w = alpha_map.cols;
    int h = alpha_map.rows;

    // Clip to image bounds
    int x1 = std::max(0, x);
    int y1 = std::max(0, y);
    int x2 = std::min(image.cols, x + w);
    int y2 = std::min(image.rows, y + h);

    if (x1 >= x2 || y1 >= y2) return;

    // Get ROIs
    cv::Rect alpha_roi(x1 - x, y1 - y, x2 - x1, y2 - y1);
    cv::Rect image_roi(x1, y1, x2 - x1, y2 - y1);

    cv::Mat alpha_region = alpha_map(alpha_roi);
    cv::Mat image_region = image(image_roi);

    // Convert image to float
    cv::Mat image_f;
    image_region.convertTo(image_f, CV_32FC3);

    // Apply alpha blending (same as Gemini)
    // Formula: result = alpha * logo + (1 - alpha) * original

    const float alpha_threshold = 0.002f;

    for (int row = 0; row < image_f.rows; ++row) {
        const float* alpha_ptr = alpha_region.ptr<float>(row);
        cv::Vec3f* img_ptr = image_f.ptr<cv::Vec3f>(row);

        for (int col = 0; col < image_f.cols; ++col) {
            float alpha = alpha_ptr[col];

            if (alpha < alpha_threshold) {
                continue;
            }

            float one_minus_alpha = 1.0f - alpha;

            for (int c = 0; c < 3; ++c) {
                float original = img_ptr[col][c];
                float result = alpha * logo_value + one_minus_alpha * original;
                img_ptr[col][c] = std::clamp(result, 0.0f, 255.0f);
            }
        }
    }

    // Convert back to 8-bit
    cv::Mat result;
    image_f.convertTo(result, CV_8UC3);
    result.copyTo(image_region);
}

} // namespace gwt
