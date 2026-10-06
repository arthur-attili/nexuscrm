"use server";

import { revalidatePath } from "next/cache";

import {
  createNote,
  deleteNote,
  updateNote,
} from "@/lib/api/notes";
import { ApiError } from "@/lib/api/client";
import type { Note, NoteRecordType } from "@/lib/api/types";

// ============================================================
// Criar
// ============================================================

export type CreateNoteState = {
  error?: string;
  success?: boolean;
};

export async function createNoteAction(
  recordType: NoteRecordType,
  recordId: string,
  revalidatePathname: string,
  _prevState: CreateNoteState,
  formData: FormData,
): Promise<CreateNoteState> {
  const content = (formData.get("content") as string)?.trim();

  if (!content) {
    return { error: "A nota não pode ficar vazia." };
  }
  if (content.length > 5000) {
    return { error: "A nota é muito longa (máx. 5000 caracteres)." };
  }

  try {
    await createNote({
      record_type: recordType,
      record_id: recordId,
      content,
    });
  } catch (err) {
    if (err instanceof ApiError) return { error: err.detail };
    return { error: "Erro ao criar nota. Tente novamente." };
  }

  revalidatePath(revalidatePathname);
  return { success: true };
}

// ============================================================
// Atualizar
// ============================================================

export type UpdateNoteState = {
  error?: string;
  success?: boolean;
};

export async function updateNoteAction(
  noteId: string,
  revalidatePathname: string,
  _prevState: UpdateNoteState,
  formData: FormData,
): Promise<UpdateNoteState> {
  const content = (formData.get("content") as string)?.trim();

  if (!content) {
    return { error: "A nota não pode ficar vazia." };
  }
  if (content.length > 5000) {
    return { error: "A nota é muito longa (máx. 5000 caracteres)." };
  }

  try {
    await updateNote(noteId, { content });
  } catch (err) {
    if (err instanceof ApiError) return { error: err.detail };
    return { error: "Erro ao atualizar nota. Tente novamente." };
  }

  revalidatePath(revalidatePathname);
  return { success: true };
}

// ============================================================
// Fixar / desafixar
// ============================================================

export type TogglePinState = {
  error?: string;
  success?: boolean;
};

export async function toggleNotePinAction(
  noteId: string,
  pinned: boolean,
  revalidatePathname: string,
  _prevState: TogglePinState,
  _formData: FormData,
): Promise<TogglePinState> {
  try {
    await updateNote(noteId, { pinned });
  } catch (err) {
    if (err instanceof ApiError) return { error: err.detail };
    return { error: "Erro ao fixar nota." };
  }

  revalidatePath(revalidatePathname);
  return { success: true };
}

// ============================================================
// Deletar
// ============================================================

export type DeleteNoteState = {
  error?: string;
  success?: boolean;
};

export async function deleteNoteAction(
  noteId: string,
  revalidatePathname: string,
  _prevState: DeleteNoteState,
  _formData: FormData,
): Promise<DeleteNoteState> {
  try {
    await deleteNote(noteId);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.detail };
    return { error: "Erro ao excluir nota. Tente novamente." };
  }

  revalidatePath(revalidatePathname);
  return { success: true };
}