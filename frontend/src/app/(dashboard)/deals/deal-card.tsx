"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, GripVertical } from "lucide-react";

import type { Deal } from "@/lib/api/types";

type Props = {
  deal: Deal;
};

export function DealCard({ deal }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: deal.id,
      data: { deal },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  const value = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(deal.value));

  const closeDate = deal.expected_close_date
    ? new Date(deal.expected_close_date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="group relative bg-zinc-900 border border-zinc-800 rounded-md p-3 hover:border-zinc-700 transition-colors"
    >
      <Link
        href={`/deals/${deal.id}`}
        // Impede que o clique vire drag
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="block"
      >
        <div className="flex items-start gap-2 mb-2">
          <GripVertical className="w-3 h-3 text-zinc-600 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-sm font-medium text-white line-clamp-2 flex-1">
            {deal.lead_name ?? `Negócio #${deal.id.slice(0, 6)}`}
          </p>
        </div>

        <p className="text-base font-bold text-emerald-400 mb-3">{value}</p>

        <div className="flex items-center justify-between text-xs text-zinc-500">
          {closeDate && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {closeDate}
            </span>
          )}
          <span>{deal.probability}%</span>
        </div>
      </Link>
    </div>
  );
}