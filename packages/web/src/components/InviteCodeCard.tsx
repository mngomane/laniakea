import { useState } from "react";

interface InviteCodeCardProps {
  inviteCode: string;
  canRegenerate: boolean;
  onRegenerate: () => void;
}

export function InviteCodeCard({ inviteCode, canRegenerate, onRegenerate }: InviteCodeCardProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <h3 className="font-semibold text-white mb-2">Invite Code</h3>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-slate-900 text-violet-400 px-3 py-2 rounded font-mono text-sm">
          {inviteCode}
        </code>
        <button
          onClick={handleCopy}
          className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        {canRegenerate && (
          <button
            onClick={onRegenerate}
            className="bg-violet-600 hover:bg-violet-500 text-white px-3 py-2 rounded text-sm transition-colors"
          >
            Regenerate
          </button>
        )}
      </div>
    </div>
  );
}
