import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, Globe } from "lucide-react";

import { getLead } from "@/lib/api/leads";
import { listCustomFields } from "@/lib/api/custom-fields";
import { listNotes } from "@/lib/api/notes";
import { listActivities } from "@/lib/api/activities";
import { ApiError } from "@/lib/api/client";
import { EditLeadModal } from "./edit-lead-modal";
import { DeleteLeadButton } from "./delete-lead-button";
import { CreateNoteForm } from "@/components/notes/create-note-form";
import { NoteItem } from "@/components/notes/note-item";
import { CreateActivityForm } from "@/components/activities/create-activity-form";
import { ActivityItem } from "@/components/activities/activity-item";
import type { Activity, CustomField, Note } from "@/lib/api/types";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;

  let lead;
  let customFields: CustomField[] = [];
  let notes: Note[] = [];
  let activities: Activity[] = [];

  try {
    [lead, customFields, notes, activities] = await Promise.all([
      getLead(id),
      listCustomFields({ target: "lead" }).catch(() => []),
      listNotes("lead", id).catch(() => []),
      listActivities("lead", id).catch(() => []),
    ]);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) {
      notFound();
    }
    throw err;
  }

  const contactInfo = lead.contact_info as Record<string, unknown>;
  const hasContact = Object.keys(contactInfo).length > 0;
  const revalidatePathname = `/leads/${id}`;

  const pendingActivities = activities.filter((a) => !a.completed).length;

  return (
    <div className="max-w-4xl">
      <Link
        href="/leads"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Leads
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white">{lead.name}</h1>
            <StatusBadge status={lead.status} />
          </div>
          <p className="text-zinc-500 text-sm">
            Lead criado em{" "}
            {lead.created_at
              ? new Date(lead.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DeleteLeadButton leadId={lead.id} leadName={lead.name} />
          <EditLeadModal lead={lead} customFields={customFields} />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Informações">
          <InfoRow label="Nome" value={lead.name} />
          <InfoRow label="Origem" value={lead.source ?? "—"} />
          <InfoRow label="Status" value={lead.status} />
          <InfoRow
            label="Atualizado em"
            value={
              lead.updated_at
                ? new Date(lead.updated_at).toLocaleString("pt-BR")
                : "—"
            }
          />
        </Card>

        <Card title="Contato">
          {hasContact ? (
            <div className="space-y-3">
              {typeof contactInfo.phone === "string" && (
                <ContactLine
                  icon={<Phone className="w-4 h-4" />}
                  label="Telefone"
                  value={contactInfo.phone}
                />
              )}
              {typeof contactInfo.email === "string" && (
                <ContactLine
                  icon={<Mail className="w-4 h-4" />}
                  label="Email"
                  value={contactInfo.email}
                />
              )}
              {Object.entries(contactInfo)
                .filter(([key]) => !["phone", "email"].includes(key))
                .map(([key, value]) => (
                  <ContactLine
                    key={key}
                    icon={<Globe className="w-4 h-4" />}
                    label={key}
                    value={String(value)}
                  />
                ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">
              Nenhuma informação de contato.
            </p>
          )}
        </Card>

        <Card title="Campos customizados">
          <CustomValues values={lead.custom_values} fields={customFields} />
        </Card>

        <Card title="Metadados">
          <InfoRow label="ID" value={lead.id} mono />
          <InfoRow
            label="Criado em"
            value={
              lead.created_at
                ? new Date(lead.created_at).toLocaleString("pt-BR")
                : "—"
            }
          />
          <InfoRow
            label="Pipeline"
            value={lead.pipeline_id ? lead.pipeline_id.slice(0, 8) + "…" : "—"}
            mono
          />
          <InfoRow
            label="Stage"
            value={lead.stage_id ? lead.stage_id.slice(0, 8) + "…" : "—"}
            mono
          />
        </Card>
      </div>

      {/* Seção de Atividades */}
      <div className="mt-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
              Atividades
            </h2>
            {activities.length > 0 && (
              <span className="text-xs text-zinc-500">
                {pendingActivities > 0
                  ? `${pendingActivities} pendente${pendingActivities === 1 ? "" : "s"} de ${activities.length}`
                  : `${activities.length} concluída${activities.length === 1 ? "" : "s"}`}
              </span>
            )}
          </div>

          <div className="mb-5">
            <CreateActivityForm
              recordType="lead"
              recordId={lead.id}
              revalidatePathname={revalidatePathname}
            />
          </div>

          {activities.length === 0 ? (
            <div className="text-center py-6 border-t border-zinc-900">
              <p className="text-sm text-zinc-500">
                Nenhuma atividade ainda. Crie a primeira acima.
              </p>
            </div>
          ) : (
            <div className="space-y-2 border-t border-zinc-900 pt-4">
              {activities.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  revalidatePathname={revalidatePathname}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Seção de Notas */}
      <div className="mt-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
              Notas
            </h2>
            {notes.length > 0 && (
              <span className="text-xs text-zinc-500">
                {notes.length} {notes.length === 1 ? "nota" : "notas"}
              </span>
            )}
          </div>

          <div className="mb-5">
            <CreateNoteForm
              recordType="lead"
              recordId={lead.id}
              revalidatePathname={revalidatePathname}
            />
          </div>

          {notes.length === 0 ? (
            <div className="text-center py-6 border-t border-zinc-900">
              <p className="text-sm text-zinc-500">
                Nenhuma nota ainda. Adicione a primeira acima.
              </p>
            </div>
          ) : (
            <div className="space-y-2 border-t border-zinc-900 pt-4">
              {notes.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  revalidatePathname={revalidatePathname}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Componentes auxiliares
// ============================================================

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5">
      <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-zinc-900 last:border-0">
      <span className="text-sm text-zinc-500 capitalize">{label}</span>
      <span
        className={`text-sm text-white text-right ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ContactLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-zinc-500 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-zinc-500 capitalize">{label}</p>
        <p className="text-sm text-white">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: "bg-blue-950 text-blue-300 border-blue-800",
    converted: "bg-emerald-950 text-emerald-300 border-emerald-800",
    qualified: "bg-purple-950 text-purple-300 border-purple-800",
    lost: "bg-red-950 text-red-300 border-red-800",
  };
  const color = colors[status] ?? "bg-zinc-800 text-zinc-300 border-zinc-700";
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${color}`}
    >
      {status}
    </span>
  );
}

function CustomValues({
  values,
  fields,
}: {
  values: Record<string, unknown>;
  fields: CustomField[];
}) {
  const entries = Object.entries(values).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );

  if (entries.length === 0) {
    return (
      <p className="text-zinc-500 text-sm">Nenhum valor customizado.</p>
    );
  }

  return (
    <div className="space-y-1">
      {entries.map(([key, value]) => {
        const field = fields.find((f) => f.name === key);
        return (
          <div
            key={key}
            className="flex items-start justify-between gap-4 py-2 border-b border-zinc-900 last:border-0"
          >
            <span className="text-sm text-zinc-500">{key}</span>
            <span className="text-sm text-white text-right">
              {formatCustomValue(value, field)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function formatCustomValue(value: unknown, field?: CustomField): string {
  if (Array.isArray(value)) {
    return value.map((v) => resolveOptionLabel(v, field)).join(", ");
  }
  return resolveOptionLabel(value, field);
}

function resolveOptionLabel(value: unknown, field?: CustomField): string {
  if (field && Array.isArray(field.options)) {
    const match = field.options.find((opt) => {
      if (typeof opt === "object" && opt !== null && "value" in opt) {
        return (opt as { value: unknown }).value === value;
      }
      return opt === value;
    });
    if (match && typeof match === "object" && "label" in match) {
      return String((match as { label: unknown }).label);
    }
  }

  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (value === null || value === undefined) return "—";
  return String(value);
}