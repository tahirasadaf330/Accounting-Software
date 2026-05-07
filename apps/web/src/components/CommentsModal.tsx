'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Paperclip, Send, Loader2, Download, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  attachments: Attachment[];
}

interface Props {
  open: boolean;
  voucherId: string | null;
  voucherNumber?: string | null;
  onClose: () => void;
  onCommentAdded?: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function CommentsModal({ open, voucherId, voucherNumber, onClose, onCommentAdded }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const load = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Comment[]>(`/vouchers/${id}/comments`);
      setComments(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !voucherId) return;
    setComments([]);
    setBody('');
    setFiles([]);
    load(voucherId);
  }, [open, voucherId]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherId) return;
    if (!body.trim() && files.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('body', body);
      files.forEach((f) => fd.append('files', f));

      const newComment = await api.postFormData<Comment>(
        `/vouchers/${voucherId}/comments`,
        fd,
      );
      setComments((prev) => [...prev, newComment]);
      setBody('');
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onCommentAdded?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadAttachment = async (commentId: string, att: Attachment) => {
    if (!voucherId) return;
    try {
      await api.downloadFile(
        `/vouchers/${voucherId}/comments/${commentId}/attachments/${att.id}/download`,
        att.fileName,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Download failed');
    }
  };

  const removePendingFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Comments</h2>
            {voucherNumber && (
              <p className="mt-0.5 font-mono text-xs text-gray-500">{voucherNumber}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}

          {error && (
            <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {!loading && comments.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">No comments yet. Add the first one below.</p>
          )}

          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-900">{c.user.name}</span>
                  <span className="text-xs text-gray-500">{formatDate(c.createdAt)}</span>
                </div>
                {c.body && <p className="whitespace-pre-wrap text-sm text-gray-700">{c.body}</p>}
                {c.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {c.attachments.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => downloadAttachment(c.id, a)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs text-gray-700 ring-1 ring-gray-200 hover:bg-primary-50 hover:ring-primary-300"
                        title={`${a.fileName} (${formatBytes(a.fileSize)})`}
                      >
                        <Download className="h-3 w-3" />
                        <span className="max-w-[180px] truncate">{a.fileName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="border-t border-gray-200 px-6 py-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            placeholder="Write a comment..."
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />

          {files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {files.map((f, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700 ring-1 ring-blue-200"
                >
                  <span className="max-w-[160px] truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => removePendingFile(idx)}
                    className="text-blue-400 hover:text-blue-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="mt-2 flex items-center justify-between">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => {
                if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
              }}
              className="hidden"
              id="comments-file-input"
            />
            <label
              htmlFor="comments-file-input"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Paperclip className="h-3.5 w-3.5" />
              Attach files
            </label>
            <button
              type="submit"
              disabled={submitting || (!body.trim() && files.length === 0)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
