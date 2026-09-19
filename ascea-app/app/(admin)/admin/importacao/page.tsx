import { criarClienteServidor } from "@/lib/supabase/server";
import { PainelImportacao } from "./PainelImportacao";
import { dataBR } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function PaginaImportacao() {
  const supabase = criarClienteServidor();
  const { data: admin } = await supabase
    .from("usuarios_admin").select("papel")
    .eq("user_id", (await supabase.auth.getUser()).data.user!.id).maybeSingle();

  const { data: historico } = await supabase
    .from("importacoes_crea")
    .select("id, data_referencia, arquivo_nome, arquivo_hash, qtd_registros, confirmado_em")
    .order("data_referencia", { ascending: false }).limit(12);

  const { data: escopo } = await supabase
    .from("categorias_associado").select("nome").eq("criterio", "opcao_crea").maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Importação da lista do CREA-SC</h1>
        <p className="mt-1 text-sm text-slate-500">
          Conferência mensal do quadro de optantes. Obrigatória antes de qualquer assembleia.
        </p>
      </div>

      <PainelImportacao
        papel={admin?.papel ?? "secretaria"}
        escopo={escopo?.nome ?? "Profissional CREA"}
      />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Histórico
        </h2>
        {historico?.length ? (
          <div className="cartao overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Referência</th>
                  <th className="px-4 py-3 font-medium">Arquivo</th>
                  <th className="px-4 py-3 font-medium">Linhas</th>
                  <th className="px-4 py-3 font-medium">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historico.map((h: any) => (
                  <tr key={h.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{dataBR(h.data_referencia)}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700">{h.arquivo_nome}</p>
                      <p className="font-mono text-[11px] text-slate-400">
                        {String(h.arquivo_hash).slice(0, 24)}…
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{h.qtd_registros}</td>
                    <td className="px-4 py-3">
                      {h.confirmado_em
                        ? <span className="etiqueta bg-emerald-100 text-emerald-800">aplicada</span>
                        : <span className="etiqueta bg-amber-100 text-amber-800">não aplicada</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Nenhuma importação registrada ainda.</p>
        )}
      </section>
    </div>
  );
}
