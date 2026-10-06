import Link from "next/link";

import { listLeads } from "@/lib/api/leads";
import { listCustomFields } from "@/lib/api/custom-fields";
import { ApiError } from "@/lib/api/client";
import { NewLeadModal } from "./new-lead-modal";
import { SearchInput } from "./search-input";
import { Pagination } from "./pagination";
import type { CustomField } from "@/lib/api/types";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ page?: string; search?: string }>;
};

const PAGE_SIZE = 20;

export default async function LeadsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const search = params.search ?? "";

  let data;
  let customFields: CustomField[] = [];
  let error: string | null = null;

  try {
    [data, customFields] = await Promise.all([
      listLeads({ page, page_size: PAGE_SIZE, search }),
      listCustomFields({ target: "lead" }).catch(() => []),
    ]);
  } catch (err) {
    if (err instanceof ApiError) {
      error = err.detail;
    } else {
      error = "Erro ao carregar leads.";
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {data
              ? `${data.total} lead${data.total === 1 ? "" : "s"} encontrado${data.total === 1 ? "" : "s"}`
              : "Carregando..."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SearchInput initialValue={search} />
          <NewLeadModal customFields={customFields} />
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-300 rounded-md px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-12 text-center">
          <p className="text-zinc-400">
            {search
              ? `Nenhum lead encontrado para "${search}".`
              : "Nenhum lead encontrado."}
          </p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900/50 border-b border-zinc-800">
                <tr className="text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Origem</th>
                  <th className="px-4 py-3 font-medium">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-zinc-900 last:border-0 hover:bg-zinc-900/30 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="block w-full text-white font-medium"
                      >
                        {lead.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/leads/${lead.id}`} className="block w-full">
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-300">
                          {lead.status}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      <Link href={`/leads/${lead.id}`} className="block w-full">
                        {lead.source ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      <Link href={`/leads/${lead.id}`} className="block w-full">
                        {lead.created_at
                          ? new Date(lead.created_at).toLocaleDateString("pt-BR")
                          : "—"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={data.page}
            pageSize={data.page_size}
            total={data.total}
            search={search}
          />
        </>
      )}
    </div>
  );
}