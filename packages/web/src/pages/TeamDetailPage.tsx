import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuthStore } from "../stores/auth.store.js";
import {
  useTeam,
  useTeamLeaderboard,
  useLeaveTeam,
  useJoinTeam,
  useKickMember,
  useUpdateMemberRole,
  useRegenerateInviteCode,
} from "../hooks/useTeams.js";
import { TeamMemberList } from "../components/TeamMemberList.js";
import { InviteCodeCard } from "../components/InviteCodeCard.js";

export function TeamDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: team, isLoading } = useTeam(slug ?? "");
  const { data: leaderboard } = useTeamLeaderboard(slug ?? "");
  const leaveTeam = useLeaveTeam();
  const joinTeam = useJoinTeam();
  const kickMember = useKickMember();
  const updateRole = useUpdateMemberRole();
  const regenerateInvite = useRegenerateInviteCode();
  const [inviteInput, setInviteInput] = useState("");

  if (isLoading) return <p className="text-slate-400">Loading...</p>;
  if (!team || !slug) return <p className="text-slate-400">Team not found</p>;

  const userId = user?._id ?? "";
  const currentMember = team.members.find((m) => m.userId === userId);
  const isMember = !!currentMember;
  const isOwner = currentMember?.role === "owner";
  const isAdmin = currentMember?.role === "admin" || isOwner;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{team.name}</h1>
          {team.description && (
            <p className="text-slate-400 mt-1">{team.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {isMember && !isOwner && (
            <button
              onClick={() => { void leaveTeam.mutateAsync(slug).then(() => navigate("/teams")); }}
              className="text-sm text-red-400 hover:text-red-300 px-3 py-1.5 border border-red-800 rounded-lg"
            >
              Leave Team
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-violet-400">{team.stats.memberCount}</p>
          <p className="text-xs text-slate-500">Members</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-violet-400">{team.stats.totalXp.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Total XP</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-violet-400">{team.stats.weeklyXp.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Weekly XP</p>
        </div>
      </div>

      {/* Join if not member */}
      {!isMember && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-2">Join this team</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              placeholder="Enter invite code"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
            <button
              onClick={() => void joinTeam.mutateAsync({ slug, inviteCode: inviteInput })}
              disabled={joinTeam.isPending}
              className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm"
            >
              Join
            </button>
          </div>
          {joinTeam.error && <p className="text-red-400 text-sm mt-2">{joinTeam.error.message}</p>}
        </div>
      )}

      {/* Invite Code (admin only) */}
      {isAdmin && (
        <InviteCodeCard
          inviteCode={team.inviteCode}
          canRegenerate={isAdmin}
          onRegenerate={() => void regenerateInvite.mutateAsync(slug)}
        />
      )}

      {/* Members */}
      <TeamMemberList
        members={team.members}
        currentUserId={userId}
        isOwner={isOwner}
        isAdmin={isAdmin}
        onKick={(targetId) => void kickMember.mutateAsync({ slug, userId: targetId })}
        onRoleChange={(targetId, role) => void updateRole.mutateAsync({ slug, userId: targetId, role })}
      />

      {/* Leaderboard */}
      {leaderboard && leaderboard.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg">
          <div className="px-4 py-3 border-b border-slate-700">
            <h3 className="font-semibold text-white">Team Leaderboard</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs">
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-4 py-2 text-left">Player</th>
                <th className="px-4 py-2 text-right">XP</th>
                <th className="px-4 py-2 text-right">Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {leaderboard.map((entry) => (
                <tr key={entry.userId} className="text-slate-300">
                  <td className="px-4 py-2">{entry.rank}</td>
                  <td className="px-4 py-2">{entry.username}</td>
                  <td className="px-4 py-2 text-right">{entry.xp.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{entry.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
