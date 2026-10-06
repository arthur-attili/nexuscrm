"""
Serviço de Dashboard: agrega as métricas e aplica controle de acesso.

Regra de acesso:
- Vendedor: vê apenas os próprios leads/deals.
- Gerente e admin: veem tudo.
"""

from __future__ import annotations

from app.domains.dashboard.entities import (
    DashboardMetrics,
    DealsMetrics,
    LeadsMetrics,
    RecentLead,
    StatusCount,
    TopDeal,
    UpcomingDeal,
)
from app.domains.dashboard.repository import DashboardRepository
from app.shared.dependencies import CurrentUser


class DashboardService:
    """Regras de negócio do dashboard."""

    def __init__(self, repo: DashboardRepository | None = None):
        self.repo = repo or DashboardRepository()

    def get_metrics(self, current: CurrentUser) -> DashboardMetrics:
        """
        Retorna todas as métricas do dashboard em uma única chamada.
        """
        # Só filtra por owner se NÃO puder ver tudo.
        owner_filter = None if current.can_see_all_leads else current.id

        # Mapa de stages (para exibir nomes nos cards de deals)
        stages_map = self.repo.get_stages_map()

        # --- Leads ---
        leads_total = self.repo.count_leads(owner_id=owner_filter)
        leads_by_status = [
            StatusCount(**item)
            for item in self.repo.count_leads_by_status(owner_id=owner_filter)
        ]

        # --- Deals ---
        deals_counts = self.repo.count_deals_by_status(owner_id=owner_filter)
        won_values = self.repo.won_deals_values(owner_id=owner_filter)
        won_values_month = self.repo.won_deals_values_this_month(
            owner_id=owner_filter
        )

        revenue_won = sum(won_values)
        revenue_won_month = sum(won_values_month)
        average_ticket = (
            revenue_won / len(won_values) if won_values else 0.0
        )

        # --- Listas ---
        recent_leads_data = self.repo.recent_leads(
            owner_id=owner_filter, limit=5
        )
        recent_leads = [RecentLead(**row) for row in recent_leads_data]

        upcoming_deals_data = self.repo.upcoming_deals(
            owner_id=owner_filter, days=7, limit=5
        )
        upcoming_deals = []
        for row in upcoming_deals_data:
            stage_name = stages_map.get(row.get("stage_id")) if row.get("stage_id") else None
            upcoming_deals.append(
                UpcomingDeal(
                    id=row["id"],
                    lead_id=row["lead_id"],
                    lead_name=row.get("lead_name"),
                    value=float(row["value"]) if row.get("value") else 0.0,
                    probability=row.get("probability", 0),
                    expected_close_date=row["expected_close_date"],
                    stage_name=stage_name,
                )
            )

        top_deals_data = self.repo.top_deals(owner_id=owner_filter, limit=5)
        top_deals = []
        for row in top_deals_data:
            stage_name = stages_map.get(row.get("stage_id")) if row.get("stage_id") else None
            top_deals.append(
                TopDeal(
                    id=row["id"],
                    lead_id=row["lead_id"],
                    lead_name=row.get("lead_name"),
                    value=float(row["value"]) if row.get("value") else 0.0,
                    status=row["status"],
                    stage_name=stage_name,
                )
            )

        return DashboardMetrics(
            leads=LeadsMetrics(total=leads_total, by_status=leads_by_status),
            deals=DealsMetrics(
                total=sum(deals_counts.values()),
                open=deals_counts.get("open", 0),
                won=deals_counts.get("won", 0),
                lost=deals_counts.get("lost", 0),
                revenue_won=revenue_won,
                revenue_won_month=revenue_won_month,
                average_ticket=average_ticket,
            ),
            recent_leads=recent_leads,
            upcoming_deals=upcoming_deals,
            top_deals=top_deals,
        )