import Link from "next/link";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { Marca } from "@/components/Marca";
import { SairBotao } from "@/components/SairBotao";

const MENU = [
  { href: "/", rotulo: "Meu cadastro" },
  { href: "/carteirinha", rotulo: "Carteirinha" },
  { href: "/beneficios", rotulo: "Convênios" },
];

export default async function LayoutAssociado({ children }: { children: React.ReactNode }) {
  const supabase = criarClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: admin } = await supabase
    .from("usuarios_admin").select("papel").eq("user_id", user.id).maybeSingle();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Marca />
          <div className="flex items-center gap-3">
            {admin && (
              <Link href="/admin/associados" className="text-sm font-medium text-ascea-600 hover:underline">
                Painel
              </Link>
            )}
            <SairBotao />
          </div>
        </div>
        <nav className="mx-auto max-w-4xl px-4">
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
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
