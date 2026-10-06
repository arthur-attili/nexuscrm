"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";

import {
  createActivityAction,
  type CreateActivityState,
} from "@/lib/actions/activities";
import type { ActivityRecordType, ActivityType } from "@/lib/api/types";

type Props = {
  recordType: ActivityRecordType;
  recordId: string;
  revalidatePathname: string;
};

const TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: "call", label: "📞 Ligação" },
  { value: "meeting", label: "🤝 Reunião" },
  { value: "email", label: "✉️ Email" },
  { value: "whatsapp", label: "💬 WhatsApp" },
  { value: "task", label: "✅ Tarefa" },
];

export function CreateActivityForm({
  recordType,
  recordId,
  revalidatePathname,
}: Props) {
  const action = createActivityAction.bind(
    null,
    recordType,
    recordId,
    revalidatePathname,
  );
  const [state, formAction, isPending] = useActionState<
    CreateActivityState,
    FormData
  >(action, {});

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3">
        <select
          name="type"
          required
          defaultValue="task"
          className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="description"
          maxLength={2000}
          placeholder="Descrição da atividade (ex: Ligar para o cliente)"
          className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="block text-xs text-zinc-500 mb-1">
            Vencimento (opcional)
          </label>
          <input
            type="datetime-local"
            name="due_date"
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="self-end inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {isPending ? "Criando..." : "Adicionar"}
        </button>
      </div>

      {state.error && (
        <div className="bg-red-950/50 border border-red-800 text-red-300 text-sm rounded-md px-3 py-2">
          {state.error}
        </div>
      )}
    </form>
  );
}