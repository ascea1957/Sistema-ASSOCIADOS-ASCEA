import Link from "next/link";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { Marca } from "@/components/Marca";
import { SairBotao } from "@/components/SairBotao";

const MENU = [
  { href: "/admin/associados",   rotulo: "Associados" },
  { href: "/admin/solicitacoes", rotulo: "Solicitações" },
  { href: "/admin/beneficios",   rotulo: "Convênios" },
  { href: "/admin/importacao",   rotulo: "Importação CREA" },
  { href: "/admin/relatorios",   rotulo: "Relatórios" },
];

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const supabase = criarClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: admin } = await supabase
    .from("usuarios_admin").select("papel, nome, ativo").eq("user_id", user.id).maybeSingle();
  if (!admin?.ativo) redirect("/");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Marca compacta />
            <div>
              <p className="text-sm font-semibold text-slate-900">Painel administrativo</p>
              <p className="text-xs text-slate-500">
                {admin.nome} · {admin.papel === "presidencia" ? "Presidência" : "Secretaria"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
              Ver como associado
            </Link>
            <SairBotao />
          </div>
        </div>
        <nav className="mx-auto max-w-6xl px-4">
          <ul className="flex gap-1 overflow-x-auto">
            {MENU.map((m) => (
              <li key={m.href}>
                <Link href={m.href}
                  className="block whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-sm font-medium text-slate-600 hover:border-ascea-300 hover:text-ascea-700">
                  {m.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
