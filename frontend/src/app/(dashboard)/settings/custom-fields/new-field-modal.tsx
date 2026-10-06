"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

import {
  createCustomFieldAction,
  type CreateCustomFieldState,
} from "./actions";
import type { CustomFieldType } from "@/lib/api/types";

const TYPES: { value: CustomFieldType; label: string }[] = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "date", label: "Data" },
  { value: "select", label: "Seleção única" },
  { value: "multiselect", label: "Seleção múltipla" },
  { value: "checkbox", label: "Caixa de seleção" },
  { value: "url", label: "URL" },
];

const TYPES_WITH_OPTIONS: CustomFieldType[] = ["select", "multiselect"];

export function NewFieldModal() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<CustomFieldType>("text");
  const [state, formAction, isPending] = useActionState<
    CreateCustomFieldState,
    FormData
  >(createCustomFieldAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      formRef.current?.reset();
      setType("text");
    }
  }, [state.success]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const needsOptions = TYPES_WITH_OPTIONS.includes(type);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors"
      >
        <Plus className="w-4 h-4" />
        Novo Campo
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
                Novo Campo Customizável
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form ref={formRef} action={formAction} className="p-5 space-y-4">
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
                  placeholder="Ex: LinkedIn, Segmento, Faturamento..."
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Tipo + Target */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-zinc-300 mb-1.5"
                  >
                    Tipo *
                  </label>
                  <select
                    id="type"
                    name="type"
                    required
                    value={type}
                    onChange={(e) => setType(e.target.value as CustomFieldType)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="target"
                    className="block text-sm font-medium text-zinc-300 mb-1.5"
                  >
                    Aplicar em *
                  </label>
                  <select
                    id="target"
                    name="target"
                    required
                    defaultValue="lead"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="lead">Lead</option>
                    <option value="deal">Negócio</option>
                  </select>
                </div>
              </div>

              {/* Options — só aparece para select/multiselect */}
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
                    placeholder={"Varejo\nIndústria\nServiços"}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono resize-none"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Digite uma opção por linha. Ex: "Varejo", "Indústria"...
                  </p>
                </div>
              )}

              {/* Flags */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_required"
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  Campo obrigatório
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_unique"
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  Valor único (não pode repetir entre registros)
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
                  {isPending ? "Criando..." : "Criar Campo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}