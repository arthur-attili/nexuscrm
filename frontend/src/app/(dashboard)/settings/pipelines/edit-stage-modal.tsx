"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, X } from "lucide-react";

import { updateStageAction, type UpdateStageState } from "./actions";
import type { Stage } from "@/lib/api/types";

type Props = {
  stage: Stage;
};

export function EditStageModal({ stage }: Props) {
  const [open, setOpen] = useState(false);

  const action = updateStageAction.bind(null, stage.id);
  const [state, formAction, isPending] = useActionState<
    UpdateStageState,
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
        className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"
        title="Editar etapa"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">
                Editar Etapa
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form action={formAction} className="p-5 space-y-4">
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
                  defaultValue={stage.name}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="order"
                  className="block text-sm font-medium text-zinc-300 mb-1.5"
                >
                  Ordem *
                </label>
                <input
                  id="order"
                  name="order"
                  type="number"
                  required
                  min={0}
                  defaultValue={stage.order}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_won"
                    defaultChecked={stage.is_won}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0"
                  />
                  Etapa de <span className="text-emerald-400">ganho</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_lost"
                    defaultChecked={stage.is_lost}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-0"
                  />
                  Etapa de <span className="text-red-400">perda</span>
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