import type { WebhookEvent } from "@/lib/api/types";

export const WEBHOOK_EVENTS: { value: WebhookEvent; label: string }[] = [
  { value: "lead.created", label: "Lead criado" },
  { value: "lead.updated", label: "Lead atualizado" },
  { value: "deal.created", label: "Negócio criado" },
  { value: "deal.updated", label: "Negócio atualizado" },
  { value: "deal.status_changed", label: "Status do negócio mudou" },
  { value: "note.created", label: "Nota criada" },
];

export function eventLabel(event: string): string {
  return WEBHOOK_EVENTS.find((e) => e.value === event)?.label ?? event;
}