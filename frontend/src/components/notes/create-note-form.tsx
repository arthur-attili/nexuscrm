"use client";

import { useActionState, useEffect, useRef } from "react";
import { Send } from "lucide-react";

import {
  createNoteAction,
  type CreateNoteState,
} from "@/lib/actions/notes";
import type { NoteRecordType } from "@/lib/api/types";

type Props = {
  recordType: NoteRecordType;
  recordId: string;
  revalidatePathname: string;
  /** Chave de remontagem para resetar o form após sucesso. */
  onSuccessKey?: number;
};

export function CreateNoteForm({
  recordType,
  recordId,
  revalidatePathname,
}: Props) {
  const action = createNoteAction.bind(
    null,
    recordType,
    recordId,
    revalidatePathname,
  );
  const [state, formAction, isPending] = useActionState<
    CreateNoteState,
    FormData
  >(action, {});

  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      textareaRef.current?.focus();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <textarea
        ref={textareaRef}
        name="content"
        rows={3}
        required
        maxLength={5000}
        placeholder="Escreva uma nota... (Enter para quebrar linha)"
        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
      />

      {state.error && (
        <div className="bg-red-950/50 border border-red-800 text-red-300 text-sm rounded-md px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          {isPending ? "Salvando..." : "Adicionar nota"}
        </button>
      </div>
    </form>
  );
}