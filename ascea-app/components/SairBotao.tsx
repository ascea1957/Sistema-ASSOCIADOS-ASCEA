"use client";
import { useRouter } from "next/navigation";
import { criarClienteNavegador } from "@/lib/supabase/client";

export function SairBotao() {
  const router = useRouter();
  return (
    <button
      className="text-sm text-slate-500 hover:text-slate-800"
      onClick={async () => {
        await criarClienteNavegador().auth.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      Sair
    </button>
  );
}
