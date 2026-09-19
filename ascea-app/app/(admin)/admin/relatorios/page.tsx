import { criarClienteServidor } from "@/lib/supabase/server";
import { dataBR } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function PaginaRelatorios() {
  const supabase = criarClienteServidor();

  const { data: assoc } = await supabase
    .from("associados").select("status, user_id, email, categorias_associado(nome)");
  const { data: aptosAssembleia } = await supabase
    .from("vw_aptos_assembleia").select("id, base_crea_referencia, base_crea_hash");
  const { data: aptosConselho } = await supabase
    .from("vw_aptos_conselheiro_crea").select("id");
  const { data: ultimaImp } = await supabase
    .from("importacoes_crea").select("data_referencia, confirmado_em")
    .not("confirmado_em", "is", null).order("data_referencia", { ascending: false }).limit(1).maybeSingle();

  const lista = assoc ?? [];
  const ativos = lista.filter((a: any) => a.status === "ativo");
  const porCategoria = ativos.reduce<Record<string, number>>((acc, a: any) => {
    const n = a.categorias_associado?.nome ?? "—";
    acc[n] = (acc[n] ?? 0) + 1; return acc;
  }, {});
  const ativaram = ativos.filter((a: any) => a.user_id).length;
  const semEmail = ativos.filter((a: any) => !a.email).length;
  const nA = aptosAssembleia?.length ?? 0;
  const nC = aptosConselho?.length ?? 0;
  const ref = aptosAssembleia?.[0];

  const diasDesde = ultimaImp?.data_referencia
    ? Math.floor((Date.now() - new Date(`${ultimaImp.data_referencia}T12:00:00`).getTime()) / 86400000)
    : null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Relatórios</h1>

      {(diasDesde === null || diasDesde > 45) && (
        <div className="aviso border-amber-200 bg-amber-50 text-amber-900">
          <p className="font-semibold">Base do CREA desatualizada</p>
          <p className="mt-1">
            {diasDesde === null
              ? "Nenhuma importação confirmada até agora."
              : `A última importação tem ${diasDesde} dias.`}{" "}
            A conferência deve ser mensal, e é obrigatória antes de qualquer assembleia.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Associados ativos", ativos.length],
          ["Aptos em assembleia", nA],
          ["Colégio conselheiro CREA", nC],
        ].map(([r, v]) => (
          <div key={String(r)} className="cartao p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">{r}</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{v as number}</p>
          </div>
        ))}
      </div>

      <div className="cartao p-6">
        <h2 className="font-medium text-slate-900">Quórum de assembleia</h2>
        <p className="mt-1 text-sm text-slate-600">
          Art. 38, §2º do Estatuto. A base de cálculo depende da redação aprovada.
        </p>
        <table className="mt-4 w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="py-2">Base</th><th className="py-2">1ª convocação</th><th className="py-2">Demais (1/3)</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-2">Todos os associados ({ativos.length})</td>
              <td className="py-2 font-medium">{Math.floor(ativos.length / 2) + 1}</td>
              <td className="py-2 font-medium">{Math.ceil(ativos.length / 3)}</td>
            </tr>
            <tr>
              <td className="py-2">Somente aptos a votar ({nA})</td>
              <td className="py-2 font-medium">{Math.floor(nA / 2) + 1}</td>
              <td className="py-2 font-medium">{Math.ceil(nA / 3)}</td>
            </tr>
          </tbody>
        </table>
        {ref?.base_crea_referencia && (
          <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            Relação apurada sobre a base do CREA-SC extraída em{" "}
            <strong>{dataBR(ref.base_crea_referencia)}</strong>
            {ref.base_crea_hash && <> · arquivo <code className="text-[11px]">{String(ref.base_crea_hash).slice(0, 16)}…</code></>}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="cartao p-6">
          <h2 className="font-medium text-slate-900">Por categoria</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {Object.entries(porCategoria).map(([n, q]) => (
              <li key={n} className="flex justify-between">
                <span className="text-slate-600">{n}</span>
                <span className="font-medium text-slate-900">{q}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="cartao p-6">
          <h2 className="font-medium text-slate-900">Adesão ao aplicativo</h2>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {ativos.length ? Math.round((ativaram / ativos.length) * 100) : 0}%
          </p>
          <p className="text-sm text-slate-600">{ativaram} de {ativos.length} criaram acesso</p>
          {semEmail > 0 && (
            <p className="mt-3 text-sm text-amber-700">
              {semEmail} associado(s) ativo(s) sem e-mail — não podem ser convidados nem
              notificados de convocação.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
