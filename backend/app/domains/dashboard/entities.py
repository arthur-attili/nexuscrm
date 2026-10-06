"""
Modelos do domínio de Dashboard.
"""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class StatusCount(BaseModel):
    """Contagem de registros por status."""
    status: str
    count: int


class LeadsMetrics(BaseModel):
    """Métricas de leads."""
    total: int
    by_status: list[StatusCount]


class DealsMetrics(BaseModel):
    """Métricas de negócios."""
    total: int
    open: int
    won: int
    lost: int
    revenue_won: float          # soma de todos os deals ganhos (histórico)
    revenue_won_month: float    # soma dos deals ganhos no mês atual
    average_ticket: float       # ticket médio dos ganhos


class RecentLead(BaseModel):
    """Lead recente para o dashboard."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    status: str
    source: Optional[str] = None
    created_at: Optional[datetime] = None


class UpcomingDeal(BaseModel):
    """Negócio com fechamento previsto nos próximos dias."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    lead_id: str
    lead_name: Optional[str] = None
    value: float
    probability: int
    expected_close_date: date
    stage_name: Optional[str] = None


class TopDeal(BaseModel):
    """Negócio com maior valor."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    lead_id: str
    lead_name: Optional[str] = None
    value: float
    status: str
    stage_name: Optional[str] = None


class DashboardMetrics(BaseModel):
    """Resposta completa do dashboard."""
    leads: LeadsMetrics
    deals: DealsMetrics
    recent_leads: list[RecentLead]
    upcoming_deals: list[UpcomingDeal]
    top_deals: list[TopDeal]