'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ImageIcon, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function UploadZone({ onFileSelect, disabled }: UploadZoneProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejected: any[]) => {
      setError(null);
      if (rejected.length > 0) {
        setError('Invalid file. Please upload a JPEG, PNG, or WebP image under 10 MB.');
        return;
      }
      if (accepted.length > 0) {
        const file = accepted[0];
        setFileName(file.name);
        setPreview(URL.createObjectURL(file));
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.bmp'] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    disabled,
  });

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setFileName(null);
    setError(null);
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer min-h-[220px]',
          isDragActive
            ? 'border-blue-400 bg-blue-50 scale-[1.01]'
            : preview
            ? 'border-gray-300 bg-gray-50'
            : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/40',
          disabled && 'pointer-events-none opacity-60'
        )}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full p-4 flex flex-col items-center gap-3"
            >
              <div className="w-full max-h-[180px] overflow-hidden rounded-lg border border-gray-200">
                <img src={preview} alt="Preview" className="w-full object-contain max-h-[180px]" />
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <ImageIcon className="h-4 w-4" />
                <span className="max-w-[200px] truncate">{fileName}</span>
                <button onClick={clear} className="rounded-full p-0.5 hover:bg-red-50 hover:text-red-500 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 px-6 py-8 text-center"
            >
              <div className={cn(
                'rounded-full p-4 transition-colors',
                isDragActive ? 'bg-blue-100' : 'bg-gray-100'
              )}>
                <Upload className={cn('h-8 w-8', isDragActive ? 'text-blue-600' : 'text-gray-400')} />
              </div>
              <div>
                <p className="text-gray-700 font-semibold">
                  {isDragActive ? 'Drop the image here' : 'Drop medicine image here'}
                </p>
                <p className="text-gray-400 text-sm mt-1">or click to browse — JPEG, PNG, WebP up to 10 MB</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </motion.div>
      )}
    </div>
  );
}
