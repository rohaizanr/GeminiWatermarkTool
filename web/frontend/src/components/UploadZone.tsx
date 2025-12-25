'use client';

import { useCallback, useState } from 'react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  disabled?: boolean;
}

/**
 * Drag-and-Drop Upload Zone Component
 * 
 * Provides drag-and-drop and click-to-upload functionality
 */
export default function UploadZone({
  onFileSelect,
  maxSizeMB = 10,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'],
  disabled = false,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    setError(null);

    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      setError(`Invalid file type. Accepted: ${acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}`);
      return false;
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      setError(`File too large. Maximum size: ${maxSizeMB}MB (received: ${sizeMB.toFixed(2)}MB)`);
      return false;
    }

    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleClick = () => {
    if (disabled) return;
    document.getElementById('file-input')?.click();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`
          relative border-3 border-dashed rounded-3xl p-16
          transition-all duration-300 cursor-pointer transform
          ${isDragging ? 'scale-105 shadow-2xl' : 'shadow-lg'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-102 hover:shadow-xl'}
        `}
        style={{
          borderRadius: '28px',
          borderWidth: '3px',
          borderColor: isDragging ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)',
          backgroundColor: isDragging 
            ? 'var(--md-sys-color-primary-container)' 
            : 'var(--md-sys-color-surface-container-highest)',
          boxShadow: isDragging 
            ? '0 20px 60px rgba(103, 80, 164, 0.3)' 
            : '0 4px 16px rgba(0, 0, 0, 0.08)',
        }}
        role="button"
        aria-label="Upload image file"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick();
          }
        }}
      >
        <input
          id="file-input"
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
          aria-label="File input"
        />

        <div className="flex flex-col items-center justify-center text-center">
          {/* Icon Animation */}
          <div className={`mb-6 transition-transform duration-300 ${isDragging ? 'scale-110' : 'scale-100'}`}>
            <svg
              className="w-24 h-24"
              style={{ color: isDragging ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            {isDragging ? '📁 Drop your image here!' : '🖼️ Drag & Drop Your Image'}
          </h3>

          <p className="text-lg mb-6" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            or click to browse from your device
          </p>

          {/* File Info Pills */}
          <div className="flex flex-wrap gap-3 justify-center">
            <span 
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: 'var(--md-sys-color-secondary-container)', 
                color: 'var(--md-sys-color-on-secondary-container)' 
              }}
            >
              📷 JPG, PNG, WebP, BMP
            </span>
            <span 
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: 'var(--md-sys-color-tertiary-container)', 
                color: 'var(--md-sys-color-on-tertiary-container)' 
              }}
            >
              📦 Max {maxSizeMB}MB
            </span>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
            <div className="flex items-center justify-center gap-6 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Secure Upload
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Auto-deleted in 1hr
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div
          className="mt-6 p-5 rounded-2xl border-l-4 animate-shake"
          style={{
            backgroundColor: 'var(--md-sys-color-error-container)',
            color: 'var(--md-sys-color-on-error-container)',
            borderLeftColor: 'var(--md-sys-color-error)',
            borderRadius: 'var(--md-sys-shape-corner-medium)',
          }}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
