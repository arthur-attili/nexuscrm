"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Calendar,
  Clock,
} from "lucide-react";

import {
  deleteActivityAction,
  updateActivityAction,
  type UpdateActivityState,
  type DeleteActivityState,
} from "@/lib/actions/activities";
import type { Activity, ActivityType } from "@/lib/api/types";

type Props = {
  activity: Activity;
  revalidatePathname: string;
};

const TYPE_META: Record<
  ActivityType,
  { label: string; emoji: string; color: string }
> = {
  call: {
    label: "Ligação",
    emoji: "📞",
    color: "text-blue-400 border-blue-900 bg-blue-950/30",
  },
  meeting: {
    label: "Reunião",
    emoji: "🤝",
    color: "text-purple-400 border-purple-900 bg-purple-950/30",
  },
  email: {
    label: "Email",
    emoji: "✉️",
    color: "text-amber-400 border-amber-900 bg-amber-950/30",
  },
  whatsapp: {
    label: "WhatsApp",
    emoji: "💬",
    color: "text-emerald-400 border-emerald-900 bg-emerald-950/30",
  },
  task: {
    label: "Tarefa",
    emoji: "✅",
    color: "text-zinc-300 border-zinc-700 bg-zinc-800/40",
  },
};

export function ActivityItem({ activity, revalidatePathname }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const meta = TYPE_META[activity.type] ?? TYPE_META.task;

  const dueDate = activity.due_date ? new Date(activity.due_date) : null;
  const isOverdue =
    dueDate && !activity.completed && dueDate.getTime() < Date.now();

  if (editing) {
    return (
      <EditForm
        activity={activity}
        revalidatePathname={revalidatePathname}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    );
  }

  return (
    <div
      className={`group relative flex items-start gap-3 bg-zinc-900/50 border rounded-md px-4 py-3 transition-colors ${
        activity.completed
          ? "border-zinc-800 opacity-60"
          : isOverdue
            ? "border-red-900/60 bg-red-950/10"
            : "border-zinc-800"
      }`}
    >
      {/* Checkbox de conclusão */}
      <ToggleComplete
        activityId={activity.id}
        completed={activity.completed}
        revalidatePathname={revalidatePathname}
      />

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        {/* Header: tipo + data + owner */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${meta.color}`}
          >
            <span>{meta.emoji}</span>
            {meta.label}
          </span>

          {dueDate && (
            <span
              className={`inline-flex items-center gap-1 text-xs ${
                isOverdue ? "text-red-400" : "text-zinc-500"
              }`}
            >
              <Calendar className="w-3 h-3" />
              {dueDate.toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {isOverdue && " · atrasada"}
            </span>
          )}

          <span className="text-xs text-zinc-600">
            · {activity.owner_name ?? "—"}
          </span>
        </div>

        {/* Descrição */}
        <p
          className={`text-sm whitespace-pre-wrap break-words ${
            activity.completed
              ? "text-zinc-500 line-through"
              : "text-zinc-200"
          }`}
        >
          {activity.description || (
            <span className="italic text-zinc-600">Sem descrição</span>
          )}
        </p>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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

      {confirmDelete && (
        <DeleteConfirm
          activityId={activity.id}
          revalidatePathname={revalidatePathname}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// Toggle completo/incompleto
// ============================================================

function ToggleComplete({
  activityId,
  completed,
  revalidatePathname,
}: {
  activityId: string;
  completed: boolean;
  revalidatePathname: string;
}) {
  const action = updateActivityAction.bind(
    null,
    activityId,
    revalidatePathname,
  );
  const [, formAction, isPending] = useActionState<
    UpdateActivityState,
    FormData
  >(action, {});

  return (
    <form action={formAction} className="shrink-0 pt-0.5">
      <input type="hidden" name="completed" value={(!completed).toString()} />
      <button
        type="submit"
        disabled={isPending}
        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
          completed
            ? "bg-emerald-600 border-emerald-500 text-white"
            : "bg-zinc-950 border-zinc-700 hover:border-zinc-500"
        } disabled:opacity-50`}
        title={completed ? "Marcar como pendente" : "Marcar como concluída"}
      >
        {completed && <Check className="w-3.5 h-3.5" />}
      </button>
    </form>
  );
}

// ============================================================
// Modo edição inline
// ============================================================

function EditForm({
  activity,
  revalidatePathname,
  onCancel,
  onSaved,
}: {
  activity: Activity;
  revalidatePathname: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const action = updateActivityAction.bind(
    null,
    activity.id,
    revalidatePathname,
  );
  const [state, formAction, isPending] = useActionState<
    UpdateActivityState,
    FormData
  >(action, {});

  useEffect(() => {
    if (state.success) onSaved();
  }, [state.success, onSaved]);

  // Preenche datetime-local
  const dueDateValue = activity.due_date
    ? new Date(activity.due_date).toISOString().slice(0, 16)
    : "";

  return (
    <div className="bg-zinc-900/50 border border-blue-900/60 rounded-md px-4 py-3">
      <form action={formAction} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3">
          <select
            name="type"
            defaultValue={activity.type}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="call">📞 Ligação</option>
            <option value="meeting">🤝 Reunião</option>
            <option value="email">✉️ Email</option>
            <option value="whatsapp">💬 WhatsApp</option>
            <option value="task">✅ Tarefa</option>
          </select>

          <input
            type="text"
            name="description"
            defaultValue={activity.description ?? ""}
            maxLength={2000}
            placeholder="Descrição"
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">
            Vencimento
          </label>
          <input
            type="datetime-local"
            name="due_date"
            defaultValue={dueDateValue}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

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
  activityId,
  revalidatePathname,
  onCancel,
}: {
  activityId: string;
  revalidatePathname: string;
  onCancel: () => void;
}) {
  const action = deleteActivityAction.bind(
    null,
    activityId,
    revalidatePathname,
  );
  const [state, formAction, isPending] = useActionState<
    DeleteActivityState,
    FormData
  >(action, {});

  useEffect(() => {
    if (state.success) onCancel();
  }, [state.success, onCancel]);

  return (
    <div className="absolute inset-0 z-10 bg-zinc-950/95 backdrop-blur-sm rounded-md flex items-center justify-center gap-3 px-4">
      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
      <span className="text-sm text-zinc-300">Excluir esta atividade?</span>

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