"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, X, Copy, Check, AlertTriangle, Key } from "lucide-react";

import { createApiKeyAction, type CreateApiKeyState } from "./actions";

export function NewKeyModal() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<
    CreateApiKeyState,
    FormData
  >(createApiKeyAction, {});

  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const created = state.created;

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setCopied(false);
      setConfirmed(false);
    }
  }, [open]);

  // Bloqueia ESC quando o token foi gerado (não pode fechar por acidente)
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !created) setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, created]);

  function handleClose() {
    // Só permite fechar se ainda não criou, ou se confirmou
    if (!created || confirmed) {
      setOpen(false);
    }
  }

  async function handleCopy() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: seleciona e copia
      const el = document.createElement("textarea");
      el.value = created.token;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors"
      >
        <Plus className="w-4 h-4" />
        Nova API Key
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">
                {created ? "API Key Criada" : "Nova API Key"}
              </h2>
              {!created && (
                <button
                  onClick={handleClose}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {!created ? (
              <form action={formAction} className="p-5 space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-zinc-300 mb-1.5"
                  >
                    Nome da chave *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    autoFocus
                    maxLength={80}
                    placeholder="Ex: Integração n8n, Zapier, Site..."
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Use um nome que ajude a identificar onde a chave será usada.
                  </p>
                </div>

                {state.error && (
                  <div className="bg-red-950/50 border border-red-800 text-red-300 text-sm rounded-md px-3 py-2">
                    {state.error}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
                  >
                    {isPending ? "Gerando..." : "Gerar API Key"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-5 space-y-4">
                {/* Aviso destacado */}
                <div className="flex items-start gap-3 bg-yellow-950/40 border border-yellow-800 rounded-md px-4 py-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-200">
                      Copie agora — este token não será mostrado novamente
                    </p>
                    <p className="text-xs text-yellow-300/70 mt-1">
                      Se você perder, será necessário gerar uma nova chave.
                    </p>
                  </div>
                </div>

                {/* Nome da chave */}
                <div>
                  <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
                    Nome
                  </p>
                  <p className="text-sm text-white">{created.name}</p>
                </div>

                {/* Token */}
                <div>
                  <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                    Sua API Key
                  </p>
                  <div className="relative">
                    <div className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-3 pr-12 font-mono text-xs text-emerald-400 break-all leading-relaxed">
                      {created.token}
                    </div>
                    <button
                      onClick={handleCopy}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
                      title="Copiar"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {copied && (
                    <p className="text-xs text-emerald-400 mt-2">
                      ✓ Copiado para a área de transferência
                    </p>
                  )}
                </div>

                {/* Como usar */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-md px-4 py-3">
                  <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                    Como usar
                  </p>
                  <p className="text-xs text-zinc-400 mb-2">
                    Inclua no header <code className="text-white bg-zinc-800 px-1 rounded">Authorization</code> de cada requisição:
                  </p>
                  <code className="block text-xs text-emerald-400 bg-zinc-950 px-3 py-2 rounded border border-zinc-800 break-all">
                    Authorization: Bearer {created.token}
                  </code>
                </div>

                {/* Confirmação obrigatória */}
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-md bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span className="text-sm text-zinc-300">
                    Copiei e guardei minha API key em um local seguro
                  </span>
                </label>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleClose}
                    disabled={!confirmed}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
                  >
                    <Key className="w-4 h-4" />
                    Concluir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}