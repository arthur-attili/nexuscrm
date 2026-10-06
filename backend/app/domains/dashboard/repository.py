"""
Repositório de Dashboard: queries de agregação no Supabase.

IMPORTANTE: todos os métodos aceitam `owner_id` opcional. O service decide
se passa ou não, baseado no role do usuário. Isso garante que vendedores
só vejam dados próprios.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Optional

from app.core.database import supabase


class DashboardRepository:
    """Queries agregadas para o dashboard."""

    # --------------------------------------------------------
    # Leads
    # --------------------------------------------------------

    def count_leads(self, owner_id: Optional[str] = None) -> int:
        """Conta todos os leads (respeitando owner_id, se informado)."""
        query = supabase.table("leads").select("id", count="exact")
        if owner_id:
            query = query.eq("owner_id", owner_id)
        return query.execute().count or 0

    def count_leads_by_status(
        self, owner_id: Optional[str] = None
    ) -> list[dict]:
        """
        Retorna contagem de leads agrupada por status.
        Como o Supabase não tem GROUP BY nativo no client,
        fazemos uma contagem por status conhecido.

        Status possíveis: new, qualified, converted, lost
        """
        statuses = ["new", "qualified", "converted", "lost"]
        result = []
        for status in statuses:
            query = (
                supabase.table("leads")
                .select("id", count="exact")
                .eq("status", status)
            )
            if owner_id:
                query = query.eq("owner_id", owner_id)
            count = query.execute().count or 0
            result.append({"status": status, "count": count})
        return result

    def recent_leads(
        self, owner_id: Optional[str] = None, limit: int = 5
    ) -> list[dict]:
        """Últimos N leads criados."""
        query = supabase.table("leads").select("*")
        if owner_id:
            query = query.eq("owner_id", owner_id)
        query = query.order("created_at", desc=True).limit(limit)
        return query.execute().data or []

    # --------------------------------------------------------
    # Deals
    # --------------------------------------------------------

    def count_deals_by_status(
        self, owner_id: Optional[str] = None
    ) -> dict[str, int]:
        """Contagem de deals por status."""
        statuses = ["open", "won", "lost"]
        result = {}
        for status in statuses:
            query = (
                supabase.table("deals")
                .select("id", count="exact")
                .eq("status", status)
            )
            if owner_id:
                query = query.eq("owner_id", owner_id)
            result[status] = query.execute().count or 0
        return result

    def won_deals_values(
        self, owner_id: Optional[str] = None
    ) -> list[float]:
        """
        Retorna a lista de valores (string) de todos os deals com status='won'.
        O service soma e calcula métricas em Python.
        """
        query = supabase.table("deals").select("value").eq("status", "won")
        if owner_id:
            query = query.eq("owner_id", owner_id)
        rows = query.execute().data or []
        return [float(r["value"]) for r in rows if r.get("value") is not None]

    def won_deals_values_this_month(
        self, owner_id: Optional[str] = None
    ) -> list[float]:
        """
        Valores de deals ganhos no mês atual.
        Filtra por `updated_at` (momento em que virou won).
        """
        now = datetime.now(timezone.utc)
        start_of_month = now.replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        ).isoformat()

        query = (
            supabase.table("deals")
            .select("value")
            .eq("status", "won")
            .gte("updated_at", start_of_month)
        )
        if owner_id:
            query = query.eq("owner_id", owner_id)
        rows = query.execute().data or []
        return [float(r["value"]) for r in rows if r.get("value") is not None]

    def upcoming_deals(
        self,
        owner_id: Optional[str] = None,
        days: int = 7,
        limit: int = 5,
    ) -> list[dict]:
        """
        Deals abertos com expected_close_date entre hoje e hoje + N dias.
        Inclui o nome do lead via join.
        """
        today = date.today().isoformat()
        limit_date = (date.today() + timedelta(days=days)).isoformat()

        query = (
            supabase.table("deals")
            .select("*, lead:leads(name)")
            .eq("status", "open")
            .gte("expected_close_date", today)
            .lte("expected_close_date", limit_date)
            .order("expected_close_date", desc=False)
            .limit(limit)
        )
        if owner_id:
            query = query.eq("owner_id", owner_id)

        rows = query.execute().data or []
        for row in rows:
            lead = row.pop("lead", None) or {}
            row["lead_name"] = lead.get("name")
        return rows

    def top_deals(
        self,
        owner_id: Optional[str] = None,
        limit: int = 5,
    ) -> list[dict]:
        """
        Deals abertos ordenados por valor (desc).
        Inclui o nome do lead via join.
        """
        query = (
            supabase.table("deals")
            .select("*, lead:leads(name)")
            .eq("status", "open")
            .order("value", desc=True)
            .limit(limit)
        )
        if owner_id:
            query = query.eq("owner_id", owner_id)

        rows = query.execute().data or []
        for row in rows:
            lead = row.pop("lead", None) or {}
            row["lead_name"] = lead.get("name")
        return rows

    # --------------------------------------------------------
    # Stages (para mostrar o nome da etapa nos cards)
    # --------------------------------------------------------

    def get_stages_map(self) -> dict[str, str]:
        """Retorna um mapa {stage_id: stage_name} para todos os estágios."""
        rows = supabase.table("stages").select("id, name").execute().data or []
        return {r["id"]: r["name"] for r in rows}