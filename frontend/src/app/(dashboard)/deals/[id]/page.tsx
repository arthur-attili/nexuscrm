import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, TrendingUp, Layers } from "lucide-react";

import { getDeal } from "@/lib/api/deals";
import { getPipeline } from "@/lib/api/pipelines";
import { getLead } from "@/lib/api/leads";
import { listCustomFields } from "@/lib/api/custom-fields";
import { listNotes } from "@/lib/api/notes";
import { listActivities } from "@/lib/api/activities";
import { ApiError } from "@/lib/api/client";
import { EditDealModal } from "./edit-deal-modal";
import { DeleteDealButton } from "./delete-deal-button";
import { CreateNoteForm } from "@/components/notes/create-note-form";
import { NoteItem } from "@/components/notes/note-item";
import { CreateActivityForm } from "@/components/activities/create-activity-form";
import { ActivityItem } from "@/components/activities/activity-item";
import type { Activity, CustomField, DealStatus, Note } from "@/lib/api/types";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DealDetailPage({ params }: Props) {
  const { id } = await params;

  let deal;
  try {
    deal = await getDeal(id);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) {
      notFound();
    }
    throw err;
  }

  const [lead, pipeline, customFields, notes, activities] = await Promise.all([
    getLead(deal.lead_id).catch(() => null),
    getPipeline(deal.pipeline_id).catch(() => null),
    listCustomFields({ target: "deal" }).catch(() => []),
    listNotes("deal", deal.id).catch(() => []),
    listActivities("deal", deal.id).catch(() => []),
  ]);

  const stage = pipeline?.stages.find((s) => s.id === deal.stage_id);
  const revalidatePathname = `/deals/${id}`;
  const pendingActivities = activities.filter((a) => !a.completed).length;

  return (
    <div className="max-w-4xl">
      <Link
        href="/deals"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Negócios
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white">
              {deal.lead_name ?? `Negócio #${deal.id.slice(0, 6)}`}
            </h1>
            <DealStatusBadge status={deal.status} />
          </div>
          <p className="text-2xl font-semibold text-emerald-400">
            {formatCurrency(deal.value)}
          </p>
          <p className="text-zinc-500 text-sm mt-2">
            Criado em{" "}
            {deal.created_at
              ? new Date(deal.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DeleteDealButton
            dealId={deal.id}
            dealLabel={deal.lead_name ?? `Negócio #${deal.id.slice(0, 6)}`}
          />
          <EditDealModal deal={deal} customFields={customFields} />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Valores">
          <ValueRow
            label="Valor total"
            value={formatCurrency(deal.value)}
            highlight
          />
          <ValueRow
            label="Valor a crédito"
            value={formatCurrency(deal.credit_value)}
          />
          <ValueRow
            label="Entrada"
            value={formatCurrency(deal.down_payment)}
          />
          <ValueRow
            label="Parcelamento"
            value={formatCurrency(deal.installment)}
          />
        </Card>

        <Card title="Detalhes do Negócio">
          <InfoRow
            icon={<Layers className="w-4 h-4" />}
            label="Pipeline"
            value={pipeline?.name ?? "—"}
          />
          <InfoRow
            icon={<TrendingUp className="w-4 h-4" />}
            label="Etapa"
            value={stage?.name ?? "—"}
          />
          <InfoRow
            icon={<TrendingUp className="w-4 h-4" />}
            label="Probabilidade"
            value={`${deal.probability}%`}
          />
          <InfoRow
            icon={<Calendar className="w-4 h-4" />}
            label="Fechamento previsto"
            value={
              deal.expected_close_date
                ? new Date(deal.expected_close_date).toLocaleDateString("pt-BR")
                : "—"
            }
          />
        </Card>

        <Card title="Lead Associado">
          {lead ? (
            <Link
              href={`/leads/${lead.id}`}
              className="flex items-center gap-3 p-3 -m-1 rounded-md hover:bg-zinc-900/60 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
                {lead.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                  {lead.name}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {lead.source ?? "Sem origem"}
                </p>
              </div>
              <ArrowLeft className="w-4 h-4 text-zinc-600 rotate-180 shrink-0" />
            </Link>
          ) : (
            <p className="text-zinc-500 text-sm">Lead não encontrado.</p>
          )}
        </Card>

        <Card title="Campos Personalizados">
          <CustomValues values={deal.custom_values} fields={customFields} />
        </Card>
      </div>

      {/* Metadados */}
      <div className="mt-4">
        <Card title="Metadados">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetadataItem label="ID" value={deal.id} mono />
            <MetadataItem
              label="Criado em"
              value={
                deal.created_at
                  ? new Date(deal.created_at).toLocaleString("pt-BR")
                  : "—"
              }
            />
            <MetadataItem
              label="Atualizado em"
              value={
                deal.updated_at
                  ? new Date(deal.updated_at).toLocaleString("pt-BR")
                  : "—"
              }
            />
          </div>
        </Card>
      </div>

      {/* Atividades */}
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
              recordType="deal"
              recordId={deal.id}
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

      {/* Notas */}
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
              recordType="deal"
              recordId={deal.id}
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
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-zinc-900 last:border-0">
      <div className="text-zinc-500 mt-0.5">{icon}</div>
      <div className="flex-1 flex items-center justify-between gap-4">
        <span className="text-sm text-zinc-500">{label}</span>
        <span className="text-sm text-white text-right">{value}</span>
      </div>
    </div>
  );
}

function ValueRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-zinc-900 last:border-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span
        className={
          highlight
            ? "text-base font-semibold text-emerald-400"
            : "text-sm text-white"
        }
      >
        {value}
      </span>
    </div>
  );
}

function MetadataItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
        {label}
      </p>
      <p className={`text-sm text-white ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function DealStatusBadge({ status }: { status: DealStatus }) {
  const config: Record<DealStatus, { label: string; className: string }> = {
    open: {
      label: "Em andamento",
      className: "bg-blue-950 text-blue-300 border-blue-800",
    },
    won: {
      label: "Ganho",
      className: "bg-emerald-950 text-emerald-300 border-emerald-800",
    },
    lost: {
      label: "Perdido",
      className: "bg-red-950 text-red-300 border-red-800",
    },
  };
  const { label, className } = config[status] ?? config.open;
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded text-xs font-medium border ${className}`}
    >
      {label}
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
    return <p className="text-zinc-500 text-sm">Nenhum valor preenchido.</p>;
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

function formatCurrency(value: string | null): string {
  if (!value) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
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