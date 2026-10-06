import Link from "next/link";
import {
  Users,
  Briefcase,
  TrendingUp,
  DollarSign,
  Calendar,
  ArrowRight,
  Inbox,
} from "lucide-react";

import { getDashboardMetrics } from "@/lib/api/dashboard";
import { ApiError } from "@/lib/api/client";
import type { DashboardMetrics } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let metrics: DashboardMetrics | null = null;
  let error: string | null = null;

  try {
    metrics = await getDashboardMetrics();
  } catch (err) {
    if (err instanceof ApiError) {
      error = err.detail;
    } else {
      error = "Erro ao carregar dashboard.";
    }
  }

  if (error || !metrics) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-zinc-400 text-sm mb-6">
          Visão geral dos seus negócios
        </p>
        <div className="bg-red-950/40 border border-red-800 text-red-300 rounded-md px-4 py-3 text-sm">
          {error ?? "Sem dados."}
        </div>
      </div>
    );
  }

  const { leads, deals, recent_leads, upcoming_deals, top_deals } = metrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Visão geral dos seus negócios
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Users className="w-4 h-4" />}
          label="Total de Leads"
          value={String(leads.total)}
          hint={`${leads.by_status.find((s) => s.status === "new")?.count ?? 0} novos`}
          href="/leads"
        />
        <KpiCard
          icon={<Briefcase className="w-4 h-4" />}
          label="Negócios Abertos"
          value={String(deals.open)}
          hint={`${deals.total} no total`}
          href="/deals"
        />
        <KpiCard
          icon={<DollarSign className="w-4 h-4" />}
          label="Receita no Mês"
          value={formatCurrency(deals.revenue_won_month)}
          hint={`${deals.won} ganhos`}
          highlight
        />
        <KpiCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Ticket Médio"
          value={formatCurrency(deals.average_ticket)}
          hint={`Total ganho: ${formatCurrency(deals.revenue_won)}`}
        />
      </div>

      {/* Leads por status */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5">
        <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-4">
          Leads por Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {leads.by_status.map((s) => (
            <div
              key={s.status}
              className="bg-zinc-900/50 border border-zinc-800 rounded-md px-4 py-3"
            >
              <p className="text-xs text-zinc-500 capitalize mb-1">
                {statusLabel(s.status)}
              </p>
              <p className="text-2xl font-bold text-white">{s.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: listas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recentes */}
        <ListCard
          title="Últimos Leads"
          icon={<Users className="w-3.5 h-3.5" />}
          href="/leads"
          empty={recent_leads.length === 0}
          emptyMessage="Nenhum lead ainda."
        >
          {recent_leads.map((lead) => (
            <ListRow key={lead.id} href={`/leads/${lead.id}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{lead.name}</p>
                <p className="text-xs text-zinc-500 truncate">
                  {lead.source ?? "Sem origem"}
                </p>
              </div>
              <StatusPill status={lead.status} />
            </ListRow>
          ))}
        </ListCard>

        {/* Próximos fechamentos */}
        <ListCard
          title="Próximos 7 dias"
          icon={<Calendar className="w-3.5 h-3.5" />}
          href="/deals"
          empty={upcoming_deals.length === 0}
          emptyMessage="Nenhum fechamento nos próximos 7 dias."
        >
          {upcoming_deals.map((deal) => (
            <ListRow key={deal.id} href={`/deals/${deal.id}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">
                  {deal.lead_name ?? "Sem nome"}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {new Date(deal.expected_close_date).toLocaleDateString(
                    "pt-BR",
                    { day: "2-digit", month: "short" },
                  )}
                  {deal.stage_name ? ` · ${deal.stage_name}` : ""}
                </p>
              </div>
              <span className="text-sm font-medium text-emerald-400 shrink-0">
                {formatCurrency(deal.value)}
              </span>
            </ListRow>
          ))}
        </ListCard>

        {/* Top deals */}
        <ListCard
          title="Top 5 Negócios"
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          href="/deals"
          empty={top_deals.length === 0}
          emptyMessage="Nenhum negócio aberto."
        >
          {top_deals.map((deal) => (
            <ListRow key={deal.id} href={`/deals/${deal.id}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">
                  {deal.lead_name ?? "Sem nome"}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {deal.stage_name ?? "—"}
                </p>
              </div>
              <span className="text-sm font-medium text-emerald-400 shrink-0">
                {formatCurrency(deal.value)}
              </span>
            </ListRow>
          ))}
        </ListCard>
      </div>
    </div>
  );
}

// ============================================================
// Componentes auxiliares
// ============================================================

function KpiCard({
  icon,
  label,
  value,
  hint,
  href,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  href?: string;
  highlight?: boolean;
}) {
  const content = (
    <div className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-lg p-5 transition-colors h-full">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-zinc-500">{icon}</span>
        <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
          {label}
        </p>
      </div>
      <p
        className={`text-2xl font-bold mb-1 ${
          highlight ? "text-emerald-400" : "text-white"
        }`}
      >
        {value}
      </p>
      {hint && <p className="text-xs text-zinc-600">{hint}</p>}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function ListCard({
  title,
  icon,
  href,
  empty,
  emptyMessage,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  href: string;
  empty: boolean;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">{icon}</span>
          <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
            {title}
          </h2>
        </div>
        <Link
          href={href}
          className="text-xs text-zinc-500 hover:text-white inline-flex items-center gap-1 transition-colors"
        >
          Ver tudo
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {empty ? (
        <div className="px-5 py-8 text-center">
          <Inbox className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
          <p className="text-xs text-zinc-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-900">{children}</div>
      )}
    </div>
  );
}

function ListRow({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-900/50 transition-colors"
    >
      {children}
    </Link>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: "bg-blue-950 text-blue-300 border-blue-800",
    qualified: "bg-purple-950 text-purple-300 border-purple-800",
    converted: "bg-emerald-950 text-emerald-300 border-emerald-800",
    lost: "bg-red-950 text-red-300 border-red-800",
  };
  const cls = colors[status] ?? "bg-zinc-800 text-zinc-300 border-zinc-700";
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs border shrink-0 ${cls}`}
    >
      {status}
    </span>
  );
}

// ============================================================
// Helpers
// ============================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    new: "Novos",
    qualified: "Qualificados",
    converted: "Convertidos",
    lost: "Perdidos",
  };
  return map[status] ?? status;
}