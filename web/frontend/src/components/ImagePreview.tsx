'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ImagePreviewProps {
  imageDataUrl: string;
  originalFilename: string;
  onDownload: () => void;
  onReset?: () => void;
  watermarkSize?: string;
  processingTime?: number;
}

/**
 * Image Preview Component with Download Button
 * 
 * Displays the processed image and provides download functionality
 */
export default function ImagePreview({
  imageDataUrl,
  originalFilename,
  onDownload,
  onReset,
  watermarkSize,
  processingTime,
}: ImagePreviewProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="w-full">
      {/* Success Header */}
      <div
        className="p-6 rounded-3xl mb-8 border-l-4"
        style={{
          backgroundColor: 'var(--md-sys-color-primary-container)',
          borderLeftColor: 'var(--md-sys-color-primary)',
          borderRadius: 'var(--md-sys-shape-corner-extra-large)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: Success Message */}
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4" style={{ backgroundColor: 'var(--md-sys-color-primary)' }}>
              <svg
                className="w-7 h-7"
                style={{ color: 'var(--md-sys-color-on-primary)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold" style={{ color: 'var(--md-sys-color-on-primary-container)' }}>
                ✨ Watermark Removed Successfully!
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--md-sys-color-on-primary-container)' }}>
                Your image has been processed and is ready for download
              </p>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={onDownload}
                className="px-8 py-3 rounded-full text-base font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl flex items-center justify-center gap-2 whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-on-primary)',
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download Cleaned Image
              </button>
              {onReset && (
                <button
                  onClick={onReset}
                  className="px-6 py-3 rounded-full text-base font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 whitespace-nowrap border-2"
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: 'var(--md-sys-color-primary)',
                    color: 'var(--md-sys-color-primary)',
                    borderRadius: 'var(--md-sys-shape-corner-full)',
                  }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Process Another Image
                </button>
              )}
            </div>
            <div className="text-center lg:text-right">
              <p className="text-xs" style={{ color: 'var(--md-sys-color-on-primary-container)' }}>
                <span className="font-mono">{originalFilename}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Processing Stats */}
        {(watermarkSize || processingTime) && (
          <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
            {watermarkSize && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: 'var(--md-sys-color-surface)' }}>
                <svg className="w-5 h-5" style={{ color: 'var(--md-sys-color-primary)' }} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  Detected: <strong>{watermarkSize === 'small_48x48' ? '48×48px' : '96×96px'}</strong>
                </span>
              </div>
            )}
            {processingTime && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: 'var(--md-sys-color-surface)' }}>
                <svg className="w-5 h-5" style={{ color: 'var(--md-sys-color-secondary)' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  Processed in <strong>{processingTime}ms</strong>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Preview */}
      <div
        className="relative w-full overflow-hidden shadow-2xl"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        }}
      >
        <div className="relative w-full" style={{ minHeight: '400px' }}>
          {!imageLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 mb-4" style={{ 
                borderColor: 'var(--md-sys-color-primary)', 
                borderTopColor: 'transparent' 
              }}></div>
              <p className="text-lg font-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Loading preview...
              </p>
            </div>
          )}
          <img
            src={imageDataUrl}
            alt="Processed image without watermark"
            className="w-full h-auto"
            onLoad={() => setImageLoaded(true)}
            style={{ display: imageLoaded ? 'block' : 'none' }}
          />
        </div>

        {/* Image Overlay Info */}
        {imageLoaded && (
          <div className="absolute top-4 right-4 px-4 py-2 rounded-full backdrop-blur-md" style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.6)', 
            color: 'white' 
          }}>
            <span className="text-sm font-medium">✓ Watermark Removed</span>
          </div>
        )}
      </div>

      {/* Additional Info Card */}
      <div className="mt-8 p-6 rounded-2xl border-2" style={{ 
        backgroundColor: 'var(--md-sys-color-surface-container-low)',
        borderColor: 'var(--md-sys-color-outline-variant)',
      }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl mb-2">🎯</div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Precision Restoration
            </p>
            <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Mathematical accuracy
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">🔒</div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Auto-Delete
            </p>
            <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Removed in 1 hour
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">⚡</div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Lightning Fast
            </p>
            <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Instant processing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
