import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Busca o perfil (com nome) do banco
  let userName = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();
    userName = profile?.name ?? "";
  }

  return (
    <div className="h-screen flex bg-zinc-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header userName={userName} userEmail={user?.email ?? ""} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}