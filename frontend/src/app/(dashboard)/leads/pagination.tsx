"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  search?: string;
};

export function Pagination({ page, pageSize, total, search = "" }: Props) {
  const router = useRouter();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  function goTo(newPage: number) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (newPage > 1) params.set("page", String(newPage));
    const qs = params.toString();
    router.replace(qs ? `/leads?${qs}` : "/leads");
  }

  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-zinc-500">
        Mostrando <span className="text-zinc-300">{from}</span>–
        <span className="text-zinc-300">{to}</span> de{" "}
        <span className="text-zinc-300">{total}</span>
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => goTo(page - 1)}
          disabled={!hasPrev}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-md hover:bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>

        <span className="text-sm text-zinc-500 px-2">
          Página <span className="text-zinc-300">{page}</span> de{" "}
          <span className="text-zinc-300">{totalPages}</span>
        </span>

        <button
          onClick={() => goTo(page + 1)}
          disabled={!hasNext}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-md hover:bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Próxima
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}