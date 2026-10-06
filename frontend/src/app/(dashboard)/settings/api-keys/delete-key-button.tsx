"use client";

import { useActionState, useEffect, useState } from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";

import { deleteApiKeyAction, type DeleteApiKeyState } from "./actions";

type Props = {
  keyId: string;
  keyName: string;
};

export function DeleteKeyButton({ keyId, keyName }: Props) {
  const [open, setOpen] = useState(false);

  const action = deleteApiKeyAction.bind(null, keyId);
  const [state, formAction, isPending] = useActionState<
    DeleteApiKeyState,
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
        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
        title="Revogar"
      >
        <Trash2 className="w-4 h-4" />
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
                  Revogar API Key
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
                Revogar a chave{" "}
                <span className="text-white font-medium">"{keyName}"</span>?
              </p>
              <p className="text-xs text-zinc-500">
                Qualquer integração que estiver usando essa chave vai parar
                de funcionar imediatamente.
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
                  {isPending ? "Revogando..." : "Revogar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}