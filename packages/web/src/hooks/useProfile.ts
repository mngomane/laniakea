import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../api/client.js";
import { useAuthStore } from "../stores/auth.store.js";
import type { User } from "../stores/auth.store.js";

interface UpdateProfileInput {
  username?: string;
  email?: string;
}

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export function useUpdateProfile() {
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const data = await apiRequest<{ user: User }>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return data.user;
    },
    onSuccess: (user) => {
      updateUser(user);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      apiRequest<{ message: string }>("/users/me/password", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useSetPassword() {
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: async (password: string) => {
      const data = await apiRequest<{ user: User }>("/users/me/set-password", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      return data.user;
    },
    onSuccess: (user) => {
      updateUser(user);
    },
  });
}

export function useUnlinkGitHub() {
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: async (password: string) => {
      const data = await apiRequest<{ user: User }>("/users/me/unlink-github", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      return data.user;
    },
    onSuccess: (user) => {
      updateUser(user);
    },
  });
}

export function useRemovePassword() {
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: async () => {
      const data = await apiRequest<{ user: User }>("/users/me/remove-password", {
        method: "POST",
      });
      return data.user;
    },
    onSuccess: (user) => {
      updateUser(user);
    },
  });
}
