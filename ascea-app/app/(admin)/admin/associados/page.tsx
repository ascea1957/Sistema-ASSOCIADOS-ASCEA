import Link from "next/link";
import { criarClienteServidor } from "@/lib/supabase/server";
import { EtiquetaStatus } from "@/components/Etiqueta";
import { ROTULO_STATUS, type StatusAssociado } from "@/lib/tipos";
import { DisparoConvites } from "@/components/DisparoConvites";

export const dynamic = "force-dynamic";

export default async function PaginaAssociados({
  searchParams,
}: { searchParams: { busca?: string; status?: string; categoria?: string } }) {
  const supabase = criarClienteServidor();

  let q = supabase
    .from("associados")
    .select("id, nome, email, status, conselho, registro_profissional, user_id, categorias_associado(nome)")
    .order("nome")
    .limit(500);

  if (searchParams.busca) {
    const b = searchParams.busca.trim();
    q = q.or(`nome.ilike.%${b}%,email.ilike.%${b}%,registro_profissional.ilike.%${b}%`);
  }
  if (searchParams.status) q = q.eq("status", searchParams.status);

  const { data: lista } = await q;
  const { data: cats } = await supabase
    .from("categorias_associado").select("id, nome").order("ordem");

  const { count: pendentes } = await supabase
    .from("associados").select("id", { count: "exact", head: true })
    .in("status", ["ativo", "aguardando_opcao"]).is("user_id", null).not("email", "is", null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Associados</h1>
        <p className="text-sm text-slate-500">{lista?.length ?? 0} registro(s)</p>
      </div>

      <DisparoConvites pendentes={pendentes ?? 0} />

      <form className="cartao flex flex-wrap gap-3 p-4">
        <input name="busca" defaultValue={searchParams.busca} className="campo flex-1 min-w-[220px]"
               placeholder="Buscar por nome, e-mail ou registro" />
        <select name="status" defaultValue={searchParams.status ?? ""} className="campo w-auto">
          <option value="">Todas as situações</option>
          {Object.entries(ROTULO_STATUS).map(([v, r]) => (
            <option key={v} value={v}>{r}</option>
          ))}
        </select>
        <button className="btn-primario">Filtrar</button>
        <Link href="/admin/associados" className="btn-secundario">Limpar</Link>
      </form>

      <div className="cartao overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Registro</th>
                <th className="px-4 py-3 font-medium">Situação</th>
                <th className="px-4 py-3 font-medium">App</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(lista ?? []).map((a: any) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/associados/${a.id}`} className="font-medium text-slate-900 hover:text-ascea-600">
                      {a.nome}
                    </Link>
                    <p className="text-xs text-slate-500">{a.email ?? "sem e-mail"}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.categorias_associado?.nome}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {a.registro_profissional ? `${a.conselho} ${a.registro_profissional}` : "—"}
                  </td>
                  <td className="px-4 py-3"><EtiquetaStatus status={a.status as StatusAssociado} /></td>
                  <td className="px-4 py-3">
                    {a.user_id
                      ? <span className="etiqueta bg-emerald-100 text-emerald-800">ativou</span>
                      : <span className="etiqueta bg-slate-100 text-slate-600">não ativou</span>}
                  </td>
                </tr>
              ))}
              {!lista?.length && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  Nenhum associado encontrado com esses filtros.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Categorias cadastradas: {(cats ?? []).map((c: any) => c.nome).join(" · ")}
      </p>
    </div>
  );
}
