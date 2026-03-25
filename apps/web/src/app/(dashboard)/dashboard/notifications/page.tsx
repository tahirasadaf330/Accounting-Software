'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '@/stores/notification.store';
import { cn } from '@/lib/cn';
import {
  Bell,
  FileText,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const typeConfig: Record<string, { icon: typeof Bell; colorClass: string }> = {
  VOUCHER_SUBMITTED: { icon: FileText, colorClass: 'text-yellow-500' },
  VOUCHER_APPROVED: { icon: CheckCircle2, colorClass: 'text-green-500' },
  VOUCHER_REJECTED: { icon: XCircle, colorClass: 'text-red-500' },
  VOUCHER_REVERSED: { icon: RotateCcw, colorClass: 'text-purple-500' },
};

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const router = useRouter();
  const notifications = useNotificationStore((s) => s.notifications);
  const meta = useNotificationStore((s) => s.meta);

  useEffect(() => {
    useNotificationStore.getState().fetchNotifications();
  }, []);

  const handleNotificationClick = (
    notification: (typeof notifications)[0],
  ) => {
    // Navigate immediately
    if (notification.referenceType === 'VOUCHER' && notification.referenceId) {
      router.push(`/dashboard/vouchers/${notification.referenceId}`);
    }

    // Mark as read in background
    if (!notification.isRead) {
      useNotificationStore.getState().markAsRead(notification.id);
      useNotificationStore.getState().fetchUnreadCount();
    }
  };

  const handleMarkAllAsRead = () => {
    useNotificationStore.getState().markAllAsRead();
    useNotificationStore.getState().fetchUnreadCount();
  };

  const handlePageChange = (page: number) => {
    useNotificationStore.getState().fetchNotifications(page);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-600">
            Stay updated on voucher activity
          </p>
        </div>
        <button
          onClick={handleMarkAllAsRead}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Check className="h-4 w-4" />
          Mark all as read
        </button>
      </div>

      {/* Notifications list */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500">
            <Bell className="mb-4 h-12 w-12 text-gray-300" />
            <p className="text-sm">No notifications yet</p>
            <p className="mt-1 text-xs text-gray-400">
              You'll be notified when vouchers are submitted, approved, rejected,
              or reversed.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => {
              const config = typeConfig[notification.type] || {
                icon: Bell,
                colorClass: 'text-gray-500',
              };
              const Icon = config.icon;

              return (
                <li key={notification.id}>
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'flex w-full items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-gray-50 sm:px-6',
                      !notification.isRead && 'bg-primary-50/40',
                    )}
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                        notification.type === 'VOUCHER_SUBMITTED' && 'bg-yellow-100',
                        notification.type === 'VOUCHER_APPROVED' && 'bg-green-100',
                        notification.type === 'VOUCHER_REJECTED' && 'bg-red-100',
                        notification.type === 'VOUCHER_REVERSED' && 'bg-purple-100',
                      )}
                    >
                      <Icon className={cn('h-4 w-4', config.colorClass)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            'text-sm',
                            notification.isRead
                              ? 'text-gray-600'
                              : 'font-semibold text-gray-900',
                          )}
                        >
                          {notification.title}
                        </p>
                        <span className="shrink-0 text-xs text-gray-400">
                          {formatDateTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {notification.message}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary-500" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {meta.page} of {meta.totalPages} ({meta.total} notifications)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(meta.page - 1)}
              disabled={!meta.hasPreviousPage}
              className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() => handlePageChange(meta.page + 1)}
              disabled={!meta.hasNextPage}
              className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
