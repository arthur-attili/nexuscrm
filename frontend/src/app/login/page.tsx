import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar · NexusCRM",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">NexusCRM</h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Faça login para continuar
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 shadow-xl">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}