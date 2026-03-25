import { create } from 'zustand';
import { api } from '@/lib/api';

interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  referenceId: string | null;
  referenceType: string | null;
  isRead: boolean;
  createdAt: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  meta: PaginationMeta | null;
  isDropdownOpen: boolean;

  fetchNotifications: (page?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  setDropdownOpen: (open: boolean) => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  meta: null,
  isDropdownOpen: false,

  fetchNotifications: async (page = 1) => {
    try {
      const data = await api.get<{ data: Notification[]; meta: PaginationMeta }>(
        '/notifications',
        { page, limit: 20 },
      );
      set({ notifications: data.data, meta: data.meta });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  },

  fetchUnreadCount: async () => {
    try {
      const data = await api.get<{ unreadCount: number }>(
        '/notifications/unread-count',
      );
      set({ unreadCount: data.unreadCount });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  markAsRead: async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  },

  setDropdownOpen: (open: boolean) => set({ isDropdownOpen: open }),

  reset: () =>
    set({
      notifications: [],
      unreadCount: 0,
      meta: null,
      isDropdownOpen: false,
    }),
}));
