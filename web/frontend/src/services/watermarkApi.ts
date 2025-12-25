/**
 * API Client Service for Watermark Removal
 * 
 * Provides type-safe wrapper around backend API endpoints
 */

import type { ProcessingJob, ErrorResponse } from '../types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class WatermarkApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string; version: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }

  /**
   * Readiness check endpoint
   */
  async readinessCheck(): Promise<{
    ready: boolean;
    checks: Record<string, boolean>;
    message?: string;
  }> {
    const response = await fetch(`${this.baseUrl}/readiness`);
    if (!response.ok) {
      throw new Error('Readiness check failed');
    }
    return response.json();
  }

  /**
   * Remove watermark from an image (to be implemented in User Story 1)
   */
  async removeWatermark(
    file: File
  ): Promise<ProcessingJob> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/api/v1/remove-watermark`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new ApiError(error.message, response.status, error);
    }

    return response.json();
  }

  /**
   * Download processed image
   */
  async downloadImage(jobId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/v1/download/${jobId}`);

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new ApiError(error.message, response.status, error);
    }

    return response.blob();
  }
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorResponse: ErrorResponse
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Export singleton instance
export const watermarkApi = new WatermarkApiClient();

// Export class for testing
export { WatermarkApiClient };
