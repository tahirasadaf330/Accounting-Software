'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, File, FileImage, FileText as FileTextIcon, FileSpreadsheet, X, Eye } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface PendingFile {
  id: string;
  file: File;
  preview?: string;
}

interface FileDropzoneProps {
  files: PendingFile[];
  onChange: (files: PendingFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  disabled?: boolean;
}

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
];

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType === 'application/pdf') return FileTextIcon;
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    mimeType === 'text/csv'
  )
    return FileSpreadsheet;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileDropzone({
  files,
  onChange,
  maxFiles = 10,
  maxSizeMB = 10,
  disabled = false,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<PendingFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const newFiles: PendingFile[] = [];
      const maxSizeBytes = maxSizeMB * 1024 * 1024;

      Array.from(fileList).forEach((file) => {
        if (files.length + newFiles.length >= maxFiles) return;
        if (!ALLOWED_TYPES.includes(file.type)) return;
        if (file.size > maxSizeBytes) return;

        const pendingFile: PendingFile = {
          id: crypto.randomUUID(),
          file,
        };

        if (file.type.startsWith('image/')) {
          pendingFile.preview = URL.createObjectURL(file);
        }

        newFiles.push(pendingFile);
      });

      if (newFiles.length > 0) {
        onChange([...files, ...newFiles]);
      }
    },
    [files, onChange, maxFiles, maxSizeMB],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    processFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    onChange(files.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors',
          isDragging
            ? 'border-primary-400 bg-primary-50'
            : 'border-gray-200 bg-gray-50/50 hover:border-gray-300',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <Upload className={cn('mb-2 h-8 w-8', isDragging ? 'text-primary-500' : 'text-gray-400')} />
        <p className="mb-1 text-sm text-gray-600">
          <button
            type="button"
            onClick={() => !disabled && inputRef.current?.click()}
            disabled={disabled}
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Click to upload
          </button>{' '}
          or drag and drop
        </p>
        <p className="text-xs text-gray-400">
          Images, PDF, Office docs (max {maxSizeMB}MB each)
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {files.map((pendingFile) => {
            const Icon = getFileIcon(pendingFile.file.type);
            const isImage = pendingFile.file.type.startsWith('image/');
            const isPdf = pendingFile.file.type === 'application/pdf';

            return (
              <li key={pendingFile.id} className="flex items-center gap-3 px-3 py-2.5">
                {pendingFile.preview ? (
                  <img
                    src={pendingFile.preview}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gray-100">
                    <Icon className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{pendingFile.file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(pendingFile.file.size)}</p>
                </div>
                {(isImage || isPdf) && pendingFile.preview && (
                  <button
                    type="button"
                    onClick={() => setPreviewFile(pendingFile)}
                    className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(pendingFile.id)}
                  disabled={disabled}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-gray-400">
        {files.length}/{maxFiles} files
      </p>

      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-auto rounded-lg bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute right-2 top-2 rounded-full bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
            {previewFile.preview && previewFile.file.type.startsWith('image/') && (
              <img
                src={previewFile.preview}
                alt={previewFile.file.name}
                className="max-h-[80vh] rounded object-contain"
              />
            )}
            <p className="mt-2 text-center text-sm text-gray-600">{previewFile.file.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}
