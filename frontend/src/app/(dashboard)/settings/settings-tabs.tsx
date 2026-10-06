"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { User, Sliders, GitBranch, Key, type LucideIcon } from "lucide-react";

type TabSegment = "profile" | "custom-fields" | "pipelines" | "api-keys";

type Props = {
  segments: TabSegment[];
};

const TABS: Record<TabSegment, { label: string; icon: LucideIcon }> = {
  profile: { label: "Perfil", icon: User },
  "custom-fields": { label: "Campos customizáveis", icon: Sliders },
  pipelines: { label: "Pipelines", icon: GitBranch },
  "api-keys": { label: "API Keys", icon: Key },
};

export function SettingsTabs({ segments }: Props) {
  const activeTab = useSelectedLayoutSegment();

  return (
    <div className="border-b border-zinc-800 mb-6">
      <nav className="flex gap-1">
        {segments.map((segment) => {
          const { label, icon: Icon } = TABS[segment];
          const isActive = activeTab === segment;
          return (
            <Link
              key={segment}
              href={`/settings/${segment}`}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? "text-blue-400 border-blue-500"
                  : "text-zinc-400 border-transparent hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}