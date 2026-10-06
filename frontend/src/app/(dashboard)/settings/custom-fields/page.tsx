import { notFound } from "next/navigation";
import { Sliders } from "lucide-react";

import { listCustomFields } from "@/lib/api/custom-fields";
import { getMyProfile } from "@/lib/api/profile";
import { ApiError } from "@/lib/api/client";
import { NewFieldModal } from "./new-field-modal";
import { EditFieldModal } from "./edit-field-modal";
import { DeleteFieldButton } from "./delete-field-button";
import type { CustomField } from "@/lib/api/types";

export default async function CustomFieldsSettingsPage() {
  // Só admin pode acessar
  let profile;
  try {
    profile = await getMyProfile();
  } catch (err) {
    notFound();
  }
  if (profile.role !== "admin") {
    notFound();
  }

  let fields: CustomField[] = [];
  try {
    fields = await listCustomFields();
  } catch (err) {
    if (err instanceof ApiError) {
      notFound();
    }
    throw err;
  }

  const leadFields = fields.filter((f) => f.target === "lead");
  const dealFields = fields.filter((f) => f.target === "deal");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Campos customizáveis
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            Defina campos personalizados para seus leads e negócios
          </p>
        </div>
        <NewFieldModal />
      </div>

      {fields.length === 0 && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-12 text-center">
          <Sliders className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400">Nenhum campo criado ainda.</p>
          <p className="text-zinc-500 text-sm mt-1">
            Clique em "Novo Campo" para começar.
          </p>
        </div>
      )}

      {leadFields.length > 0 && (
        <FieldGroup title="Leads" fields={leadFields} />
      )}

      {dealFields.length > 0 && (
        <FieldGroup title="Negócios" fields={dealFields} />
      )}
    </div>
  );
}

function FieldGroup({
  title,
  fields,
}: {
  title: string;
  fields: CustomField[];
}) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-3">
        {title} · {fields.length}
      </h3>
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg divide-y divide-zinc-900">
        {fields.map((field) => (
          <FieldRow key={field.id} field={field} />
        ))}
      </div>
    </div>
  );
}

function FieldRow({ field }: { field: CustomField }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-white">{field.name}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
            {field.type}
          </span>
          {field.is_required && (
            <span className="text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900">
              obrigatório
            </span>
          )}
          {field.is_unique && (
            <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-900">
              único
            </span>
          )}
        </div>
        {field.options && field.options.length > 0 && (
          <p className="text-xs text-zinc-500 mt-1 truncate">
            Opções: {(field.options as string[]).join(", ")}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <EditFieldModal field={field} />
        <DeleteFieldButton fieldId={field.id} fieldName={field.name} />
      </div>
    </div>
  );
}