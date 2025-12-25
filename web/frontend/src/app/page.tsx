'use client';

import { useState } from 'react';
import ImagePreview from '../components/ImagePreview';
import ProcessingIndicator from '../components/ProcessingIndicator';
import UploadZone from '../components/UploadZone';

type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

interface ProcessingResult {
  imageDataUrl: string;
  originalFilename: string;
  watermarkSize?: string;
  processingTime?: number;
}

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setError(null);
    await processImage(file);
  };

  const processImage = async (file: File) => {
    setStatus('uploading');
    setError(null);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      setStatus('processing');

      // Call API
      const response = await fetch(`${apiUrl}/api/v1/remove-watermark`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Processing failed');
      }

      const data = await response.json();

      // Convert base64 to data URL
      const imageDataUrl = `data:image/png;base64,${data.processed_image_base64}`;

      setResult({
        imageDataUrl,
        originalFilename: data.original_filename,
        watermarkSize: data.watermark_size,
        processingTime: data.duration_ms,
      });

      setStatus('completed');
    } catch (err) {
      console.error('Processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process image');
      setStatus('error');
    }
  };

  const handleDownload = () => {
    if (!result) return;

    // Create download link
    const link = document.createElement('a');
    link.href = result.imageDataUrl;
    link.download = `cleaned_${result.originalFilename}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setStatus('idle');
    setResult(null);
    setError(null);
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--md-sys-color-surface)' }}>
      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Upload Section */}
        {status === 'idle' && (
          <section className="mb-12">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                Upload Your Image
              </h2>
              <p className="text-lg" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Upload your Gemini-watermarked image to remove the watermark
              </p>
            </div>
            
            <UploadZone
              onFileSelect={handleFileSelect}
              maxSizeMB={10}
              disabled={false}
            />
          </section>
        )}

        {/* Processing State */}
        {(status === 'uploading' || status === 'processing') && (
          <ProcessingIndicator status={status} />
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="max-w-2xl mx-auto">
            <ProcessingIndicator status="error" message={error || undefined} />
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={handleReset}
                className="px-8 py-4 rounded-full text-lg font-semibold transition-all hover:scale-105 shadow-lg"
                style={{
                  backgroundColor: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-on-primary)',
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Success State */}
        {status === 'completed' && result && (
          <div className="mb-12">
            <ImagePreview
              imageDataUrl={result.imageDataUrl}
              originalFilename={result.originalFilename}
              onDownload={handleDownload}
              onReset={handleReset}
              watermarkSize={result.watermarkSize}
              processingTime={result.processingTime}
            />
          </div>
        )}

        {/* How It Works Section */}
        {status === 'idle' && (
          <section className="mt-20 mb-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                How It Works
              </h2>
              <p className="text-lg max-w-3xl mx-auto" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Our tool uses reverse alpha blending to mathematically restore original pixels
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  Upload Image
                </h3>
                <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Drop your Gemini-watermarked image
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)' }}>
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  Alpha Reconstruction
                </h3>
                <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  We analyze and reconstruct the alpha map
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)' }}>
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                  Download Clean Image
                </h3>
                <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Get your watermark-free image instantly
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Disclaimer */}
        <section className="mt-16 mb-8 p-8 rounded-2xl border-2" style={{ 
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          borderColor: 'var(--md-sys-color-outline-variant)',
          borderRadius: 'var(--md-sys-shape-corner-extra-large)',
        }}>
          <div className="flex items-start gap-4">
            <svg className="w-8 h-8 flex-shrink-0 mt-1" style={{ color: 'var(--md-sys-color-error)' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                ⚠️ Disclaimer
              </h3>
              <p className="mb-3" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                <strong>USE AT YOUR OWN RISK</strong>
              </p>
              <p className="mb-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                This tool is provided for personal and educational use only. The removal of watermarks may have legal implications depending on your jurisdiction. 
                Users are solely responsible for ensuring their use complies with applicable laws and intellectual property rights.
              </p>
              <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND. Always back up your original images before processing.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t text-center" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
          <div className="mb-4">
            <p className="text-lg font-semibold mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Gemini Watermark Tool
            </p>
            <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Fast • Secure • Mathematically Accurate
            </p>
          </div>
          <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Files automatically deleted after 1 hour • All processing done securely
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            MIT License • Open Source
          </p>
        </footer>
      </div>
    </main>
  );
}
