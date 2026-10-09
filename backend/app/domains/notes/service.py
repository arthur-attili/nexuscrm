"""
Serviço de Notas: regras de negócio.
"""

from __future__ import annotations

from fastapi import HTTPException, status

from app.domains.deals.repository import DealRepository
from app.domains.leads.repository import LeadRepository
from app.domains.notes.entities import (
    Note,
    NoteCreate,
    NoteUpdate,
)
from app.domains.notes.repository import NoteRepository
from app.domains.webhooks.dispatcher import dispatch_event
from app.shared.dependencies import CurrentUser


class NoteService:
    """Regras de negócio para notas."""

    def __init__(
        self,
        repo: NoteRepository | None = None,
        lead_repo: LeadRepository | None = None,
        deal_repo: DealRepository | None = None,
    ):
        self.repo = repo or NoteRepository()
        self.lead_repo = lead_repo or LeadRepository()
        self.deal_repo = deal_repo or DealRepository()

    # --------------------------------------------------------
    # Helpers
    # --------------------------------------------------------

    def _get_record(self, record_type: str, record_id: str) -> dict:
        if record_type == "lead":
            record = self.lead_repo.get_by_id(record_id)
            label = "Lead"
        elif record_type == "deal":
            record = self.deal_repo.get_by_id(record_id)
            label = "Negócio"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tipo de registro inválido.",
            )

        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{label} não encontrado.",
            )
        return record

    def _ensure_can_access(self, record: dict, current: CurrentUser) -> None:
        if current.can_see_all_leads:
            return
        if record.get("owner_id") != current.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para acessar as notas deste registro.",
            )

    def _ensure_can_edit(self, note_data: dict, current: CurrentUser) -> None:
        if current.is_admin:
            return
        if note_data.get("author_id") != current.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você só pode editar ou excluir as suas próprias notas.",
            )

    def _enrich_with_author(self, note: dict) -> Note:
        author_id = note.get("author_id")
        name_map = self.repo.get_authors_map([author_id]) if author_id else {}
        note["author_name"] = name_map.get(author_id)
        return Note(**note)

    def _enrich_many(self, notes: list[dict]) -> list[Note]:
        author_ids = list(
            {n.get("author_id") for n in notes if n.get("author_id")}
        )
        name_map = self.repo.get_authors_map(author_ids)
        for note in notes:
            note["author_name"] = name_map.get(note.get("author_id"))
        return [Note(**n) for n in notes]

    # --------------------------------------------------------
    # Listar
    # --------------------------------------------------------

    def list_notes(
        self,
        record_type: str,
        record_id: str,
        current: CurrentUser,
    ) -> list[Note]:
        record = self._get_record(record_type, record_id)
        self._ensure_can_access(record, current)
        data = self.repo.list_by_record(record_type, record_id)
        return self._enrich_many(data)

    # --------------------------------------------------------
    # Criar
    # --------------------------------------------------------

    def create_note(
        self, payload: NoteCreate, current: CurrentUser
    ) -> Note:
        record = self._get_record(payload.record_type, payload.record_id)
        self._ensure_can_access(record, current)

        data = {
            "record_type": payload.record_type,
            "record_id": payload.record_id,
            "content": payload.content.strip(),
            "pinned": payload.pinned,
            "author_id": current.id,
        }

        created = self.repo.create(data)
        note = self._enrich_with_author(created)

        # Dispara webhook
        dispatch_event(
            owner_id=current.id,
            event="note.created",
            payload={
                "id": note.id,
                "record_type": note.record_type,
                "record_id": note.record_id,
                "content": note.content,
                "author_id": note.author_id,
                "author_name": note.author_name,
                "created_at": note.created_at.isoformat() if note.created_at else None,
            },
        )

        return note

    # --------------------------------------------------------
    # Atualizar
    # --------------------------------------------------------

    def update_note(
        self, note_id: str, payload: NoteUpdate, current: CurrentUser
    ) -> Note:
        existing = self.repo.get_by_id(note_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Nota não encontrada.",
            )

        record = self._get_record(
            existing["record_type"], existing["record_id"]
        )
        self._ensure_can_access(record, current)
        self._ensure_can_edit(existing, current)

        data = payload.model_dump(exclude_unset=True, exclude_none=True)
        if "content" in data:
            data["content"] = data["content"].strip()
            if not data["content"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A nota não pode ficar vazia.",
                )

        if not data:
            return self._enrich_with_author(existing)

        updated = self.repo.update(note_id, data)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Nota não encontrada.",
            )
        return self._enrich_with_author(updated)

    # --------------------------------------------------------
    # Deletar
    # --------------------------------------------------------

    def delete_note(self, note_id: str, current: CurrentUser) -> None:
        existing = self.repo.get_by_id(note_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Nota não encontrada.",
            )

        record = self._get_record(
            existing["record_type"], existing["record_id"]
        )
        self._ensure_can_access(record, current)
        self._ensure_can_edit(existing, current)

        deleted = self.repo.delete(note_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Nota não encontrada.",
            )