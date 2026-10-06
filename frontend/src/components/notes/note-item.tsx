"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Pin,
  PinOff,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";

import {
  deleteNoteAction,
  toggleNotePinAction,
  updateNoteAction,
  type UpdateNoteState,
  type DeleteNoteState,
  type TogglePinState,
} from "@/lib/actions/notes";
import type { Note } from "@/lib/api/types";

type Props = {
  note: Note;
  revalidatePathname: string;
};

export function NoteItem({ note, revalidatePathname }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formattedDate = note.created_at
    ? new Date(note.created_at).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  if (editing) {
    return (
      <EditForm
        note={note}
        revalidatePathname={revalidatePathname}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    );
  }

  return (
    <div
      className={`group relative bg-zinc-900/50 border rounded-md px-4 py-3 transition-colors ${
        note.pinned
          ? "border-blue-900/60 bg-blue-950/20"
          : "border-zinc-800"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 text-xs text-zinc-500 flex-wrap">
          <span className="text-zinc-400 font-medium">
            {note.author_name ?? "—"}
          </span>
          <span>·</span>
          <span>{formattedDate}</span>
          {note.pinned && (
            <span className="inline-flex items-center gap-1 text-blue-400">
              <Pin className="w-3 h-3" />
              Fixada
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <TogglePinButton
            noteId={note.id}
            pinned={note.pinned}
            revalidatePathname={revalidatePathname}
          />
          <button
            onClick={() => setEditing(true)}
            className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
            title="Excluir"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-sm text-zinc-200 whitespace-pre-wrap break-words">
        {note.content}
      </p>

      {confirmDelete && (
        <DeleteConfirm
          noteId={note.id}
          revalidatePathname={revalidatePathname}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// Botão fixar/desafixar
// ============================================================

function TogglePinButton({
  noteId,
  pinned,
  revalidatePathname,
}: {
  noteId: string;
  pinned: boolean;
  revalidatePathname: string;
}) {
  const action = toggleNotePinAction.bind(
    null,
    noteId,
    !pinned,
    revalidatePathname,
  );
  const [, formAction, isPending] = useActionState<TogglePinState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={isPending}
        className={`p-1 rounded transition-colors ${
          pinned
            ? "text-blue-400 hover:text-blue-300 hover:bg-blue-950/40"
            : "text-zinc-500 hover:text-white hover:bg-zinc-800"
        } disabled:opacity-50`}
        title={pinned ? "Desafixar" : "Fixar"}
      >
        {pinned ? (
          <PinOff className="w-3.5 h-3.5" />
        ) : (
          <Pin className="w-3.5 h-3.5" />
        )}
      </button>
    </form>
  );
}

// ============================================================
// Modo edição inline
// ============================================================

function EditForm({
  note,
  revalidatePathname,
  onCancel,
  onSaved,
}: {
  note: Note;
  revalidatePathname: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const action = updateNoteAction.bind(null, note.id, revalidatePathname);
  const [state, formAction, isPending] = useActionState<
    UpdateNoteState,
    FormData
  >(action, {});

  useEffect(() => {
    if (state.success) onSaved();
  }, [state.success, onSaved]);

  return (
    <div className="bg-zinc-900/50 border border-blue-900/60 rounded-md px-4 py-3">
      <form action={formAction} className="space-y-3">
        <textarea
          name="content"
          rows={3}
          required
          maxLength={5000}
          autoFocus
          defaultValue={note.content}
          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
        />

        {state.error && (
          <div className="bg-red-950/50 border border-red-800 text-red-300 text-xs rounded-md px-3 py-2">
            {state.error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-xs font-medium rounded-md transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            {isPending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// Confirmação de exclusão inline
// ============================================================

function DeleteConfirm({
  noteId,
  revalidatePathname,
  onCancel,
}: {
  noteId: string;
  revalidatePathname: string;
  onCancel: () => void;
}) {
  const action = deleteNoteAction.bind(null, noteId, revalidatePathname);
  const [state, formAction, isPending] = useActionState<
    DeleteNoteState,
    FormData
  >(action, {});

  // Fecha somente quando a action retornar sucesso explícito.
  useEffect(() => {
    if (state.success) onCancel();
  }, [state.success, onCancel]);

  return (
    <div className="absolute inset-0 z-10 bg-zinc-950/95 backdrop-blur-sm rounded-md flex items-center justify-center gap-3 px-4">
      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
      <span className="text-sm text-zinc-300">Excluir esta nota?</span>

      {state.error && (
        <span className="text-xs text-red-400">{state.error}</span>
      )}

      <form action={formAction} className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-2.5 py-1 text-xs bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 text-white rounded transition-colors"
        >
          {isPending ? "..." : "Excluir"}
        </button>
      </form>
    </div>
  );
}