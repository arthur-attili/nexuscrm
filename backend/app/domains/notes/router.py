"""
Router HTTP do domínio de Notas.
"""

from fastapi import APIRouter, Depends, Query, status

from app.domains.notes.entities import (
    Note,
    NoteCreate,
    NoteUpdate,
)
from app.domains.notes.service import NoteService
from app.shared.dependencies import CurrentUser, get_current_user_with_role

router = APIRouter(
    prefix="/notes",
    tags=["Notes"],
)


def get_note_service() -> NoteService:
    return NoteService()


# ============================================================
# Listagem
# ============================================================


@router.get("", response_model=list[Note])
def list_notes(
    record_type: str = Query(..., description="'lead' ou 'deal'"),
    record_id: str = Query(..., description="ID do lead ou deal"),
    current: CurrentUser = Depends(get_current_user_with_role),
    service: NoteService = Depends(get_note_service),
) -> list[Note]:
    """Lista notas de um lead ou deal."""
    return service.list_notes(record_type, record_id, current)


# ============================================================
# Criação
# ============================================================


@router.post("", response_model=Note, status_code=status.HTTP_201_CREATED)
def create_note(
    payload: NoteCreate,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: NoteService = Depends(get_note_service),
) -> Note:
    """Cria uma nova nota."""
    return service.create_note(payload, current)


# ============================================================
# Atualização
# ============================================================


@router.patch("/{note_id}", response_model=Note)
def update_note(
    note_id: str,
    payload: NoteUpdate,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: NoteService = Depends(get_note_service),
) -> Note:
    """Atualiza uma nota existente."""
    return service.update_note(note_id, payload, current)


# ============================================================
# Remoção
# ============================================================


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: str,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: NoteService = Depends(get_note_service),
) -> None:
    """Remove uma nota."""
    service.delete_note(note_id, current)