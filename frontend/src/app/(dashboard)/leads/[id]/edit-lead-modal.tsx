"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Pencil, X } from "lucide-react";

import { updateLeadAction, type UpdateLeadState } from "../actions";
import { CustomFieldsFieldset } from "@/components/custom-fields-fieldset";
import type { CustomField, Lead } from "@/lib/api/types";

type Props = {
  lead: Lead;
  customFields: CustomField[];
};

export function EditLeadModal({ lead, customFields }: Props) {
  const [open, setOpen] = useState(false);

  const contactInfo = (lead.contact_info ?? {}) as Record<string, unknown>;
  const initialPhone =
    typeof contactInfo.phone === "string" ? contactInfo.phone : "";
  const initialEmail =
    typeof contactInfo.email === "string" ? contactInfo.email : "";

  // Outros campos que não são phone/email (para não perdermos na edição)
  const extraContact = Object.fromEntries(
    Object.entries(contactInfo).filter(
      ([key]) => !["phone", "email"].includes(key),
    ),
  );

  // bind: passa o leadId como primeiro argumento da Server Action
  const action = updateLeadAction.bind(null, lead.id);
  const [state, formAction, isPending] = useActionState<
    UpdateLeadState,
    FormData
  >(action, {});

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
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
                Editar Lead
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form ref={formRef} action={formAction} className="p-5 space-y-4">
              {/* Hidden: preserva campos de contato que não estão sendo editados */}
              <input
                type="hidden"
                name="_extra_contact"
                value={JSON.stringify(extraContact)}
              />

              <Field
                label="Nome"
                name="name"
                defaultValue={lead.name}
                required
                autoFocus
              />
              <Field
                label="Origem"
                name="source"
                defaultValue={lead.source ?? ""}
                placeholder="Ex: site, indicação, google ads"
              />

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-zinc-300 mb-1.5"
                >
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={lead.status}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="new">Novo</option>
                  <option value="qualified">Qualificado</option>
                  <option value="converted">Convertido</option>
                  <option value="lost">Perdido</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Telefone"
                  name="phone"
                  defaultValue={initialPhone}
                  placeholder="(11) 99999-9999"
                />
                <Field
                  label="Email"
                  name="email"
                  type="email"
                  defaultValue={initialEmail}
                  placeholder="contato@empresa.com"
                />
              </div>

              <CustomFieldsFieldset
                fields={customFields}
                initialValues={lead.custom_values}
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

// ---- Reutilizamos o Field do NewLeadModal ----
function Field({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  required,
  autoFocus,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  autoFocus?: boolean;
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
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        autoFocus={autoFocus}
        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
    </div>
  );
}