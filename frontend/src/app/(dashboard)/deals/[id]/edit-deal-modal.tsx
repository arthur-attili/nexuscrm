"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, X } from "lucide-react";

import { updateDealAction, type UpdateDealState } from "../actions";
import { CustomFieldsFieldset } from "@/components/custom-fields-fieldset";
import type { CustomField, Deal } from "@/lib/api/types";

type Props = {
  deal: Deal;
  customFields: CustomField[];
};

export function EditDealModal({ deal, customFields }: Props) {
  const [open, setOpen] = useState(false);

  const action = updateDealAction.bind(null, deal.id);
  const [state, formAction, isPending] = useActionState<
    UpdateDealState,
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
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-md transition-colors"
      >
        <Pencil className="w-4 h-4" />
        Editar
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
                Editar Negócio
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form action={formAction} className="p-5 space-y-4">
              {/* Valor + Fechamento */}
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Valor (R$) *"
                  name="value"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  defaultValue={deal.value}
                />
                <Field
                  label="Fechamento previsto"
                  name="expected_close_date"
                  type="date"
                  defaultValue={deal.expected_close_date ?? ""}
                />
              </div>

              {/* Financeiro */}
              <div className="grid grid-cols-3 gap-3">
                <Field
                  label="A crédito"
                  name="credit_value"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={deal.credit_value ?? ""}
                />
                <Field
                  label="Entrada"
                  name="down_payment"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={deal.down_payment ?? ""}
                />
                <Field
                  label="Parcela"
                  name="installment"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={deal.installment ?? ""}
                />
              </div>

              {/* Probabilidade */}
              <Field
                label="Probabilidade (%)"
                name="probability"
                type="number"
                min="0"
                max="100"
                defaultValue={String(deal.probability)}
              />

              {/* Custom fields com valores iniciais */}
              <CustomFieldsFieldset
                fields={customFields}
                initialValues={deal.custom_values}
              />

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

function Field({
  label,
  name,
  type = "text",
  step,
  min,
  max,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  step?: string;
  min?: string;
  max?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-zinc-300 mb-1.5"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        min={min}
        max={max}
        required={required}
        defaultValue={defaultValue}
        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
    </div>
  );
}