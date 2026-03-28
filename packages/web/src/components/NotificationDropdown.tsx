import { useNotificationStore } from "../stores/notification.store.js";
import { useMarkAsRead, useMarkAllAsRead } from "../hooks/useNotifications.js";
import { NotificationItem } from "./NotificationItem.js";

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-surface-container-low border border-outline-variant rounded-lg shadow-xl z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
        <h3 className="text-sm font-semibold text-on-surface">Notifications</h3>
        <button
          onClick={() => void markAllAsRead.mutateAsync()}
          className="text-xs text-primary hover:text-primary/80"
        >
          Mark all read
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant">
        {notifications.length === 0 ? (
          <p className="px-4 py-6 text-sm text-outline text-center">No notifications</p>
        ) : (
          notifications.slice(0, 10).map((notif) => (
            <NotificationItem
              key={notif._id}
              notification={notif}
              onMarkRead={(id) => void markAsRead.mutateAsync(id)}
            />
          ))
        )}
      </div>
      <div className="px-4 py-2 border-t border-outline-variant">
        <button
          onClick={onClose}
          className="text-xs text-outline hover:text-on-surface-variant w-full text-center"
        >
          Close
        </button>
      </div>
    </div>
  );
}
