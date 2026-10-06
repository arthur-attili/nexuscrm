"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Pencil, X } from "lucide-react";

import {
  updateCustomFieldAction,
  type UpdateCustomFieldState,
} from "./actions";
import type { CustomField, CustomFieldType } from "@/lib/api/types";

const TYPES_WITH_OPTIONS: CustomFieldType[] = ["select", "multiselect"];

type Props = {
  field: CustomField;
};

export function EditFieldModal({ field }: Props) {
  const [open, setOpen] = useState(false);

  const needsOptions = TYPES_WITH_OPTIONS.includes(field.type);
  const initialOptions =
    needsOptions && Array.isArray(field.options)
      ? (field.options as string[]).join("\n")
      : "";

  const action = updateCustomFieldAction.bind(null, field.id, field.type);
  const [state, formAction, isPending] = useActionState<
    UpdateCustomFieldState,
    FormData
  >(action, {});

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"
        title="Editar"
      >
        <Pencil className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">
                Editar Campo
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form action={formAction} className="p-5 space-y-4">
              {/* Info: tipo e target (imutáveis) */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-400">
                Tipo: <span className="text-white">{field.type}</span> · Aplicado em:{" "}
                <span className="text-white">
                  {field.target === "lead" ? "Leads" : "Negócios"}
                </span>
                <p className="text-zinc-500 mt-1">
                  Tipo e alvo não podem ser alterados.
                </p>
              </div>

              {/* Nome */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-zinc-300 mb-1.5"
                >
                  Nome *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoFocus
                  maxLength={80}
                  defaultValue={field.name}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Options */}
              {needsOptions && (
                <div>
                  <label
                    htmlFor="options"
                    className="block text-sm font-medium text-zinc-300 mb-1.5"
                  >
                    Opções * (uma por linha)
                  </label>
                  <textarea
                    id="options"
                    name="options"
                    rows={5}
                    required
                    defaultValue={initialOptions}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono resize-none"
                  />
                </div>
              )}

              {/* Flags */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_required"
                    defaultChecked={field.is_required}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  Campo obrigatório
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_unique"
                    defaultChecked={field.is_unique}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  Valor único
                </label>
              </div>

              {state.error && (
                <div className="bg-red-950/50 border border-red-800 text-red-300 text-sm rounded-md px-3 py-2">
                  {state.error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
                >
                  {isPending ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}