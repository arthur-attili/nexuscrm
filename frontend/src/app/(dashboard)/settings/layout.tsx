import { getMyProfile } from "@/lib/api/profile";
import type { Profile } from "@/lib/api/types";
import { SettingsTabs } from "./settings-tabs";

type TabSegment =
  | "profile"
  | "custom-fields"
  | "pipelines"
  | "api-keys"
  | "webhooks";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let profile: Profile | null = null;
  try {
    profile = await getMyProfile();
  } catch {
    profile = null;
  }

  const isAdmin = profile?.role === "admin";

  // API Keys fica visível para todos. Admin vê também os outros.
  const segments: TabSegment[] = ["profile"];
  if (isAdmin) {
    segments.push("custom-fields", "pipelines", "webhooks");
  }
  segments.push("api-keys");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Gerencie seu perfil e as configurações do CRM
        </p>
      </div>

      <SettingsTabs segments={segments} />

      {children}
    </div>
  );
}