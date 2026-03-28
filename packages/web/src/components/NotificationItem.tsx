import type { NotificationData } from "../stores/notification.store.js";

interface NotificationItemProps {
  notification: NotificationData;
  onMarkRead: (id: string) => void;
}

const typeIcons: Record<string, string> = {
  level_up: "LV",
  achievement: "TR",
  streak_record: "SR",
  team_join: "TJ",
  team_kick: "TK",
  system: "SY",
};

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const timeAgo = getTimeAgo(notification.createdAt);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 ${
        notification.read ? "opacity-60" : ""
      }`}
    >
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
        {typeIcons[notification.type] ?? "N"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-on-surface">{notification.title}</p>
        <p className="text-xs text-on-surface-variant mt-0.5">{notification.body}</p>
        <p className="text-xs text-outline mt-1">{timeAgo}</p>
      </div>
      {!notification.read && (
        <button
          onClick={() => onMarkRead(notification._id)}
          className="text-xs text-primary hover:text-primary/80 shrink-0"
        >
          Mark read
        </button>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
