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
    <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4">
      <h3 className="font-semibold text-on-surface mb-2">Invite Code</h3>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-background text-primary px-3 py-2 rounded font-mono text-sm">
          {inviteCode}
        </code>
        <button
          onClick={handleCopy}
          className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-3 py-2 rounded text-sm transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        {canRegenerate && (
          <button
            onClick={onRegenerate}
            className="bg-primary hover:bg-primary/80 text-on-surface px-3 py-2 rounded text-sm transition-colors"
          >
            Regenerate
          </button>
        )}
      </div>
    </div>
  );
}
