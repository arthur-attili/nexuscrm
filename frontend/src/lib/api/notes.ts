import { apiFetch } from "./client";
import type { Note, NoteRecordType } from "./types";

export async function listNotes(
  recordType: NoteRecordType,
  recordId: string,
): Promise<Note[]> {
  const qs = new URLSearchParams({
    record_type: recordType,
    record_id: recordId,
  });
  return apiFetch<Note[]>(`/notes?${qs.toString()}`);
}

export type CreateNoteInput = {
  record_type: NoteRecordType;
  record_id: string;
  content: string;
  pinned?: boolean;
};

export async function createNote(data: CreateNoteInput): Promise<Note> {
  return apiFetch<Note>("/notes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type UpdateNoteInput = {
  content?: string;
  pinned?: boolean;
};

export async function updateNote(
  id: string,
  data: UpdateNoteInput,
): Promise<Note> {
  return apiFetch<Note>(`/notes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteNote(id: string): Promise<void> {
  return apiFetch<void>(`/notes/${id}`, { method: "DELETE" });
}