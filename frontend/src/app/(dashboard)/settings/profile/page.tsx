import { notFound } from "next/navigation";

import { getMyProfile } from "@/lib/api/profile";
import { ApiError } from "@/lib/api/client";
import { EditProfileModal } from "./edit-profile-modal";

export default async function ProfileSettingsPage() {
  let profile;
  try {
    profile = await getMyProfile();
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 401)) {
      notFound();
    }
    throw err;
  }

  const initial = (profile.name || "?").charAt(0).toUpperCase();
  const roleLabels = {
    admin: "Administrador",
    gerente: "Gerente",
    vendedor: "Vendedor",
  };

  return (
    <div className="max-w-2xl space-y-4">
      {/* Card: Perfil */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-medium">
              {initial}
            </div>
            <div>
              <p className="text-lg font-semibold text-white">
                {profile.name}
              </p>
              <p className="text-sm text-zinc-500">
                {roleLabels[profile.role]}
              </p>
            </div>
          </div>
          <EditProfileModal profile={profile} />
        </div>

        <div className="space-y-3 pt-4 border-t border-zinc-900">
          <InfoRow label="ID" value={profile.id} mono />
          <InfoRow
            label="Criado em"
            value={
              profile.created_at
                ? new Date(profile.created_at).toLocaleString("pt-BR")
                : "—"
            }
          />
          <InfoRow
            label="Atualizado em"
            value={
              profile.updated_at
                ? new Date(profile.updated_at).toLocaleString("pt-BR")
                : "—"
            }
          />
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-zinc-500">{label}</span>
      <span
        className={`text-sm text-white text-right ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}