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
  owner: "bg-yellow-900 text-yellow-300",
  admin: "bg-violet-900 text-violet-300",
  member: "bg-slate-700 text-slate-400",
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
    <div className="bg-slate-800 border border-slate-700 rounded-lg">
      <div className="px-4 py-3 border-b border-slate-700">
        <h3 className="font-semibold text-white">Members ({members.length})</h3>
      </div>
      <ul className="divide-y divide-slate-700">
        {members.map((member) => (
          <li key={member.userId} className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white">
                {member.userId.slice(-2).toUpperCase()}
              </div>
              <span className="text-sm text-slate-300">{member.userId}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${roleBadgeColors[member.role] ?? ""}`}>
                {member.role}
              </span>
            </div>
            <div className="flex gap-2">
              {isOwner && member.role !== "owner" && (
                <select
                  value={member.role}
                  onChange={(e) => onRoleChange(member.userId, e.target.value as "admin" | "member")}
                  className="text-xs bg-slate-700 text-slate-300 border border-slate-600 rounded px-2 py-1"
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
                    className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
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
