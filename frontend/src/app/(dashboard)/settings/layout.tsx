import { getMyProfile } from "@/lib/api/profile";
import type { Profile } from "@/lib/api/types";
import { SettingsTabs } from "./settings-tabs";

type TabSegment = "profile" | "custom-fields" | "pipelines" | "api-keys";

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

  // api-keys fica visível para todos (cada um gerencia as suas)
  const segments: TabSegment[] = ["profile", "api-keys"];
  if (isAdmin) {
    segments.splice(1, 0, "custom-fields", "pipelines");
  }

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