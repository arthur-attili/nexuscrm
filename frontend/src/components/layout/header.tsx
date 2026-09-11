import { logout } from "@/app/login/actions";

type Props = {
  userName: string;
  userEmail: string;
};

export function Header({ userName, userEmail }: Props) {
  const initial = (userName || userEmail).charAt(0).toUpperCase();

  return (
    <header className="h-14 shrink-0 bg-zinc-950 border-b border-zinc-800 flex items-center justify-end px-6 gap-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
          {initial}
        </div>
        <div className="text-right">
          <p className="text-sm text-white leading-tight">{userName || "Sem nome"}</p>
          <p className="text-xs text-zinc-500 leading-tight">{userEmail}</p>
        </div>
      </div>

      <form action={logout}>
        <button
          type="submit"
          className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
        >
          Sair
        </button>
      </form>
    </header>
  );
}