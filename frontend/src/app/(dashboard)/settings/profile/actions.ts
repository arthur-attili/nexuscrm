"use server";

import { revalidatePath } from "next/cache";

import { updateMyProfile } from "@/lib/api/profile";
import { ApiError } from "@/lib/api/client";

export type UpdateProfileState = {
  error?: string;
  success?: boolean;
};

export async function updateProfileAction(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const name = (formData.get("name") as string)?.trim();

  if (!name) {
    return { error: "O nome é obrigatório." };
  }

  if (name.length > 120) {
    return { error: "O nome é muito longo (máx. 120 caracteres)." };
  }

  try {
    await updateMyProfile({ name });
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.detail };
    }
    return { error: "Erro ao atualizar perfil. Tente novamente." };
  }

  revalidatePath("/settings/profile");
  revalidatePath("/", "layout"); // atualiza o header no layout
  return { success: true };
}