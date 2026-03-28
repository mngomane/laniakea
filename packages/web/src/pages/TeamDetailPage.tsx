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

  if (isLoading) return <p className="text-on-surface-variant">Loading...</p>;
  if (!team || !slug) return <p className="text-on-surface-variant">Team not found</p>;

  const userId = user?._id ?? "";
  const currentMember = team.members.find((m) => m.userId === userId);
  const isMember = !!currentMember;
  const isOwner = currentMember?.role === "owner";
  const isAdmin = currentMember?.role === "admin" || isOwner;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">{team.name}</h1>
          {team.description && (
            <p className="text-on-surface-variant mt-1">{team.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {isMember && !isOwner && (
            <button
              onClick={() => { void leaveTeam.mutateAsync(slug).then(() => navigate("/teams")); }}
              className="text-sm text-error hover:text-error/80 px-3 py-1.5 border border-error-container rounded-lg"
            >
              Leave Team
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary">{team.stats.memberCount}</p>
          <p className="text-xs text-outline">Members</p>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary">{team.stats.totalXp.toLocaleString()}</p>
          <p className="text-xs text-outline">Total XP</p>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary">{team.stats.weeklyXp.toLocaleString()}</p>
          <p className="text-xs text-outline">Weekly XP</p>
        </div>
      </div>

      {/* Join if not member */}
      {!isMember && (
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4">
          <h3 className="font-semibold text-on-surface mb-2">Join this team</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              placeholder="Enter invite code"
              className="flex-1 bg-background border border-outline-variant rounded-lg px-3 py-2 text-on-surface text-sm"
            />
            <button
              onClick={() => void joinTeam.mutateAsync({ slug, inviteCode: inviteInput })}
              disabled={joinTeam.isPending}
              className="bg-primary hover:bg-primary/80 text-on-surface px-4 py-2 rounded-lg text-sm"
            >
              Join
            </button>
          </div>
          {joinTeam.error && <p className="text-error text-sm mt-2">{joinTeam.error.message}</p>}
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
        <div className="bg-surface-container-low border border-outline-variant rounded-lg">
          <div className="px-4 py-3 border-b border-outline-variant">
            <h3 className="font-headline font-semibold text-on-surface">Team Leaderboard</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-outline text-xs">
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-4 py-2 text-left">Player</th>
                <th className="px-4 py-2 text-right">XP</th>
                <th className="px-4 py-2 text-right">Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {leaderboard.map((entry) => (
                <tr key={entry.userId} className="text-on-surface-variant">
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
