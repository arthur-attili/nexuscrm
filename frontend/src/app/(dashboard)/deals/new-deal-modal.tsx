"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

import { createDealAction, type CreateDealState } from "./actions";
import { CustomFieldsFieldset } from "@/components/custom-fields-fieldset";
import type { CustomField, Lead, Pipeline, Stage } from "@/lib/api/types";

type Props = {
  leads: Lead[];
  pipelines: Pipeline[];
  stagesByPipeline: Record<string, Stage[]>;
  defaultPipelineId: string;
  customFields: CustomField[];
};

export function NewDealModal({
  leads,
  pipelines,
  stagesByPipeline,
  defaultPipelineId,
  customFields,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pipelineId, setPipelineId] = useState(defaultPipelineId);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState<
    CreateDealState,
    FormData
  >(createDealAction, {});

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      formRef.current?.reset();
      setPipelineId(defaultPipelineId);
    }
  }, [state.success, defaultPipelineId]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const stages = stagesByPipeline[pipelineId] ?? [];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors"
      >
        <Plus className="w-4 h-4" />
        Novo Negócio
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
                Novo Negócio
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form ref={formRef} action={formAction} className="p-5 space-y-4">
              <div>
                <label
                  htmlFor="lead_id"
                  className="block text-sm font-medium text-zinc-300 mb-1.5"
                >
                  Lead *
                </label>
                <select
                  id="lead_id"
                  name="lead_id"
                  required
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Selecione um lead...</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name}
                      {lead.status === "converted" ? " (já convertido)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="pipeline_id"
                  className="block text-sm font-medium text-zinc-300 mb-1.5"
                >
                  Pipeline *
                </label>
                <select
                  id="pipeline_id"
                  name="pipeline_id"
                  required
                  value={pipelineId}
                  onChange={(e) => setPipelineId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  {pipelines.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.is_default ? " (padrão)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="stage_id"
                  className="block text-sm font-medium text-zinc-300 mb-1.5"
                >
                  Estágio (opcional)
                </label>
                <select
                  id="stage_id"
                  name="stage_id"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Automático (primeira do pipeline)</option>
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="value"
                    className="block text-sm font-medium text-zinc-300 mb-1.5"
                  >
                    Valor (R$) *
                  </label>
                  <input
                    id="value"
                    name="value"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="10000.00"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="expected_close_date"
                    className="block text-sm font-medium text-zinc-300 mb-1.5"
                  >
                    Fechamento previsto
                  </label>
                  <input
                    id="expected_close_date"
                    name="expected_close_date"
                    type="date"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="probability"
                  className="block text-sm font-medium text-zinc-300 mb-1.5"
                >
                  Probabilidade (%)
                </label>
                <input
                  id="probability"
                  name="probability"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue="0"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <CustomFieldsFieldset fields={customFields} />

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
                  {isPending ? "Criando..." : "Criar Negócio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}