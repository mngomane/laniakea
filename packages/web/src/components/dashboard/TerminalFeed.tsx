interface ActivityEntry {
  id: string;
  type: string;
  xpAwarded: number;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface TerminalFeedProps {
  activities: ActivityEntry[];
}

function getTagInfo(type: string): { label: string; colorClass: string } {
  switch (type.toLowerCase()) {
    case "commit":
      return { label: "SUCCESS", colorClass: "text-tertiary" };
    case "pullrequest":
    case "pull_request":
      return { label: "DEPLOY", colorClass: "text-secondary" };
    case "review":
      return { label: "INFO", colorClass: "text-primary" };
    case "issue":
      return { label: "WARN", colorClass: "text-error" };
    case "merge":
      return { label: "SYNC", colorClass: "text-primary" };
    default:
      return { label: "LOG", colorClass: "text-on-surface-variant" };
  }
}

function getMessage(type: string): string {
  switch (type.toLowerCase()) {
    case "commit":
      return "Code pushed to branch";
    case "pullrequest":
    case "pull_request":
      return "Pull Request created";
    case "review":
      return "Code review submitted";
    case "issue":
      return "Issue reported";
    case "merge":
      return "Branch merged";
    default:
      return `Activity: ${type}`;
  }
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function TerminalFeed({ activities }: TerminalFeedProps) {
  return (
    <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/15 flex flex-col h-[400px]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant/10">
        <span className="font-label text-[0.6rem] uppercase tracking-widest text-on-surface-variant">
          System Activity Feed
        </span>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-error/80" />
          <div className="w-2 h-2 rounded-full bg-tertiary/80" />
        </div>
      </div>

      {/* Scrollable body */}
      <div className="p-4 overflow-y-auto space-y-3 font-mono text-[0.7rem] leading-relaxed flex-1">
        {activities.length === 0 ? (
          <p className="text-on-surface-variant/50">
            {"> "}No activity data...
          </p>
        ) : (
          activities.map((activity) => {
            const { label, colorClass } = getTagInfo(activity.type);
            return (
              <div key={activity.id} className="flex gap-2">
                <span className="text-on-surface-variant/40 shrink-0">
                  {formatTimestamp(activity.createdAt)}
                </span>
                <span className={`${colorClass} shrink-0`}>
                  [{label}]
                </span>
                <span className="text-on-surface/80">
                  {getMessage(activity.type)}
                  <span className="text-on-surface-variant/50 ml-2">
                    +{activity.xpAwarded}xp
                  </span>
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
