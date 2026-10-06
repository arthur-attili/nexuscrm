"use client";

import { useActionState, useEffect, useState } from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";

import { deleteDealAction, type DeleteDealState } from "../actions";

type Props = {
  dealId: string;
  dealLabel: string;
};

export function DeleteDealButton({ dealId, dealLabel }: Props) {
  const [open, setOpen] = useState(false);

  const action = deleteDealAction.bind(null, dealId);
  const [state, formAction, isPending] = useActionState<
    DeleteDealState,
    FormData
  >(action, null);

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
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-950/60 hover:bg-red-900/60 text-red-300 hover:text-red-200 text-sm font-medium rounded-md border border-red-900 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Excluir
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h2 className="text-lg font-semibold text-white">
                  Excluir Negócio
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form action={formAction} className="p-5 space-y-4">
              <p className="text-sm text-zinc-300">
                Tem certeza que deseja excluir o negócio{" "}
                <span className="text-white font-medium">
                  "{dealLabel}"
                </span>
                ?
              </p>
              <p className="text-xs text-zinc-500">
                Esta ação não pode ser desfeita.
              </p>

              {state?.error && (
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
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
                >
                  {isPending ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}