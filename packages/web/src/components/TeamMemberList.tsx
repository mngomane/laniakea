import type { TeamMember } from "../hooks/useTeams.js";

interface TeamMemberListProps {
  members: TeamMember[];
  currentUserId: string;
  isOwner: boolean;
  isAdmin: boolean;
  onKick: (userId: string) => void;
  onRoleChange: (userId: string, role: "admin" | "member") => void;
}

const roleBadgeColors: Record<string, string> = {
  owner: "bg-secondary/10 text-secondary",
  admin: "bg-primary/10 text-primary",
  member: "bg-surface-container-high text-on-surface-variant",
};

export function TeamMemberList({
  members,
  currentUserId,
  isOwner,
  isAdmin,
  onKick,
  onRoleChange,
}: TeamMemberListProps) {
  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-lg">
      <div className="px-4 py-3 border-b border-outline-variant">
        <h3 className="font-semibold text-on-surface">Members ({members.length})</h3>
      </div>
      <ul className="divide-y divide-outline-variant">
        {members.map((member) => (
          <li key={member.userId} className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-xs font-bold text-on-surface">
                {member.userId.slice(-2).toUpperCase()}
              </div>
              <span className="text-sm text-on-surface-variant">{member.userId}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${roleBadgeColors[member.role] ?? ""}`}>
                {member.role}
              </span>
            </div>
            <div className="flex gap-2">
              {isOwner && member.role !== "owner" && (
                <select
                  value={member.role}
                  onChange={(e) => onRoleChange(member.userId, e.target.value as "admin" | "member")}
                  className="text-xs bg-surface-container-high text-on-surface-variant border border-outline-variant rounded px-2 py-1"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              )}
              {(isOwner || isAdmin) &&
                member.role !== "owner" &&
                member.userId !== currentUserId && (
                  <button
                    onClick={() => onKick(member.userId)}
                    className="text-xs text-error hover:text-error/80 px-2 py-1"
                  >
                    Kick
                  </button>
                )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
