"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

type Props = {
  initialValue?: string;
};

export function SearchInput({ initialValue = "" }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);

  // Sincroniza se o initialValue mudar (ex: navegação do browser)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Debounce: dispara a busca 400ms após o usuário parar de digitar
  useEffect(() => {
    if (value === initialValue) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (value.trim()) params.set("search", value.trim());
      const qs = params.toString();
      router.replace(qs ? `/leads?${qs}` : "/leads");
    }, 400);

    return () => clearTimeout(timer);
  }, [value, initialValue, router]);

  return (
    <div className="relative w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar por nome..."
        className="w-full pl-9 pr-9 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
      {value && (
        <button
          onClick={() => setValue("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
          aria-label="Limpar busca"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}