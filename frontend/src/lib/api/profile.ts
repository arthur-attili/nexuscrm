import { apiFetch } from "./client";
import type { Profile } from "./types";

export async function getMyProfile(): Promise<Profile> {
  return apiFetch<Profile>("/profiles/me");
}

export type UpdateProfileInput = {
  name?: string;
  avatar_url?: string | null;
};

export async function updateMyProfile(
  data: UpdateProfileInput,
): Promise<Profile> {
  return apiFetch<Profile>("/profiles/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}