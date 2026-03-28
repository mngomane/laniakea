import { useState, useEffect } from "react";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "../hooks/useNotifications.js";
import {
  useUpdateProfile,
  useChangePassword,
  useSetPassword,
  useUnlinkGitHub,
  useRemovePassword,
} from "../hooks/useProfile.js";
import { useAuthStore } from "../stores/auth.store.js";

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { data: prefs, isLoading } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const setPasswordMut = useSetPassword();
  const unlinkGitHub = useUnlinkGitHub();
  const removePasswordMut = useRemovePassword();

  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addPasswordConfirm, setAddPasswordConfirm] = useState("");
  const [unlinkPassword, setUnlinkPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [linkedMsg, setLinkedMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setUsername(user?.username ?? "");
    setEmail(user?.email ?? "");
  }, [user?.username, user?.email]);

  if (isLoading) return <p className="text-on-surface-variant">Loading settings...</p>;

  async function handleProfileSave() {
    setProfileMsg(null);
    try {
      await updateProfile.mutateAsync({ username, email: email || undefined });
      setProfileMsg({ type: "success", text: "Profile updated" });
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update profile",
      });
    }
  }

  async function handlePasswordChange() {
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Passwords do not match" });
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMsg({ type: "success", text: "Password changed successfully" });
    } catch (err) {
      setPasswordMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to change password",
      });
    }
  }

  const showPasswordSection = user?.authProvider !== "github";

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-headline font-bold text-on-surface flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        Settings
      </h1>

      {/* Profile */}
      <div className="bg-surface-container-low border border-outline-variant rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-headline font-semibold text-on-surface">Profile</h2>

        <div>
          <label className="block text-sm text-on-surface-variant mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-surface-container-high border border-outline-variant rounded px-3 py-2 text-sm text-on-surface w-full"
          />
        </div>

        <div>
          <label className="block text-sm text-on-surface-variant mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-surface-container-high border border-outline-variant rounded px-3 py-2 text-sm text-on-surface w-full"
          />
        </div>

        {profileMsg && (
          <p
            className={
              profileMsg.type === "success"
                ? "text-sm text-tertiary"
                : "text-sm text-error"
            }
          >
            {profileMsg.text}
          </p>
        )}

        <button
          type="button"
          onClick={() => void handleProfileSave()}
          disabled={updateProfile.isPending}
          className="bg-primary hover:bg-primary/80 disabled:opacity-50 text-on-surface text-sm font-medium px-4 py-2 rounded"
        >
          {updateProfile.isPending ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Linked Accounts */}
      <div className="bg-surface-container-low border border-outline-variant rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-headline font-semibold text-on-surface">Linked Accounts</h2>

        {/* GitHub status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5 text-on-surface-variant">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            <span className="text-sm text-on-surface-variant">GitHub</span>
          </div>
          {user?.authProvider === "email" ? (
            <a
              href="/api/auth/github/link"
              className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm font-medium px-3 py-1.5 rounded"
            >
              Link GitHub
            </a>
          ) : (
            <span className="text-sm text-tertiary">Connected</span>
          )}
        </div>

        {/* Email/password status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-on-surface-variant">Email &amp; Password</span>
          {user?.authProvider === "github" ? (
            <span className="text-sm text-outline">Not set</span>
          ) : (
            <span className="text-sm text-tertiary">Active</span>
          )}
        </div>

        {/* Add password (github-only users) */}
        {user?.authProvider === "github" && (
          <div className="border-t border-outline-variant pt-4 space-y-3">
            <p className="text-sm text-on-surface-variant">
              Add a password to also sign in with email.
            </p>
            <input
              type="password"
              placeholder="New password (min 8 characters)"
              value={addPassword}
              onChange={(e) => setAddPassword(e.target.value)}
              className="bg-surface-container-high border border-outline-variant rounded px-3 py-2 text-sm text-on-surface w-full"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={addPasswordConfirm}
              onChange={(e) => setAddPasswordConfirm(e.target.value)}
              className="bg-surface-container-high border border-outline-variant rounded px-3 py-2 text-sm text-on-surface w-full"
            />
            <button
              type="button"
              disabled={setPasswordMut.isPending}
              onClick={() => {
                setLinkedMsg(null);
                if (addPassword !== addPasswordConfirm) {
                  setLinkedMsg({ type: "error", text: "Passwords do not match" });
                  return;
                }
                void setPasswordMut
                  .mutateAsync(addPassword)
                  .then(() => {
                    setAddPassword("");
                    setAddPasswordConfirm("");
                    setLinkedMsg({ type: "success", text: "Password added" });
                  })
                  .catch((err: unknown) => {
                    setLinkedMsg({
                      type: "error",
                      text: err instanceof Error ? err.message : "Failed",
                    });
                  });
              }}
              className="bg-primary hover:bg-primary/80 disabled:opacity-50 text-on-surface text-sm font-medium px-4 py-2 rounded"
            >
              {setPasswordMut.isPending ? "Adding..." : "Add Password"}
            </button>
          </div>
        )}

        {/* Unlink GitHub (both users) */}
        {user?.authProvider === "both" && (
          <div className="border-t border-outline-variant pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-on-surface-variant">
                  Unlink GitHub — requires your password to confirm.
                </p>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={unlinkPassword}
                  onChange={(e) => setUnlinkPassword(e.target.value)}
                  className="bg-surface-container-high border border-outline-variant rounded px-3 py-2 text-sm text-on-surface w-full mt-2"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={unlinkGitHub.isPending}
                onClick={() => {
                  setLinkedMsg(null);
                  void unlinkGitHub
                    .mutateAsync(unlinkPassword)
                    .then(() => {
                      setUnlinkPassword("");
                      setLinkedMsg({ type: "success", text: "GitHub unlinked" });
                    })
                    .catch((err: unknown) => {
                      setLinkedMsg({
                        type: "error",
                        text: err instanceof Error ? err.message : "Failed",
                      });
                    });
                }}
                className="bg-error-container hover:bg-error-container/80 disabled:opacity-50 text-on-surface text-sm font-medium px-4 py-2 rounded"
              >
                {unlinkGitHub.isPending ? "Unlinking..." : "Unlink GitHub"}
              </button>
              <button
                type="button"
                disabled={removePasswordMut.isPending}
                onClick={() => {
                  setLinkedMsg(null);
                  void removePasswordMut
                    .mutateAsync()
                    .then(() => {
                      setLinkedMsg({ type: "success", text: "Password removed" });
                    })
                    .catch((err: unknown) => {
                      setLinkedMsg({
                        type: "error",
                        text: err instanceof Error ? err.message : "Failed",
                      });
                    });
                }}
                className="bg-surface-container-high hover:bg-surface-container-highest disabled:opacity-50 text-on-surface text-sm font-medium px-4 py-2 rounded"
              >
                {removePasswordMut.isPending ? "Removing..." : "Remove Password"}
              </button>
            </div>
          </div>
        )}

        {linkedMsg && (
          <p
            className={
              linkedMsg.type === "success"
                ? "text-sm text-tertiary"
                : "text-sm text-error"
            }
          >
            {linkedMsg.text}
          </p>
        )}
      </div>

      {/* Change Password (email/both users only) */}
      {showPasswordSection && (
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-headline font-semibold text-on-surface">Change Password</h2>

          <div>
            <label className="block text-sm text-on-surface-variant mb-1">
              Current password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-surface-container-high border border-outline-variant rounded px-3 py-2 text-sm text-on-surface w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-on-surface-variant mb-1">
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-surface-container-high border border-outline-variant rounded px-3 py-2 text-sm text-on-surface w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-on-surface-variant mb-1">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-surface-container-high border border-outline-variant rounded px-3 py-2 text-sm text-on-surface w-full"
            />
          </div>

          {passwordMsg && (
            <p
              className={
                passwordMsg.type === "success"
                  ? "text-sm text-tertiary"
                  : "text-sm text-error"
              }
            >
              {passwordMsg.text}
            </p>
          )}

          <button
            type="button"
            onClick={() => void handlePasswordChange()}
            disabled={changePassword.isPending}
            className="bg-primary hover:bg-primary/80 disabled:opacity-50 text-on-surface text-sm font-medium px-4 py-2 rounded"
          >
            {changePassword.isPending ? "Changing..." : "Change Password"}
          </button>
        </div>
      )}

      {/* Notification Preferences */}
      <div className="bg-surface-container-low border border-outline-variant rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-headline font-semibold text-on-surface">
          Notification Preferences
        </h2>

        <label className="flex items-center justify-between">
          <span className="text-sm text-on-surface-variant">In-app notifications</span>
          <input
            type="checkbox"
            checked={prefs?.inApp ?? true}
            onChange={(e) =>
              void updatePrefs.mutateAsync({ inApp: e.target.checked })
            }
            className="rounded"
          />
        </label>

        <label className="flex items-center justify-between">
          <span className="text-sm text-on-surface-variant">Email notifications</span>
          <input
            type="checkbox"
            checked={prefs?.email ?? false}
            onChange={(e) =>
              void updatePrefs.mutateAsync({ email: e.target.checked })
            }
            className="rounded"
          />
        </label>

        <div className="flex items-center justify-between">
          <span className="text-sm text-on-surface-variant">Email digest</span>
          <select
            value={prefs?.emailDigest ?? "off"}
            onChange={(e) =>
              void updatePrefs.mutateAsync({
                emailDigest: e.target.value as
                  | "instant"
                  | "daily"
                  | "weekly"
                  | "off",
              })
            }
            className="bg-surface-container-high border border-outline-variant rounded px-3 py-1 text-sm text-on-surface"
          >
            <option value="off">Off</option>
            <option value="instant">Instant</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </div>
    </div>
  );
}
