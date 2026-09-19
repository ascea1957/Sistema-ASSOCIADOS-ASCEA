import { criarClienteServidor } from "@/lib/supabase/server";
import { PainelSolicitacoes } from "./PainelSolicitacoes";

export const dynamic = "force-dynamic";

export default async function PaginaSolicitacoes() {
  const supabase = criarClienteServidor();

  const { data: pedidos } = await supabase
    .from("associados")
    .select("id, nome, email, telefone, cpf, conselho, registro_profissional, instituicao_ensino, curso, previsao_conclusao, solicitado_em, campanha, observacoes, categorias_associado(id, nome, criterio)")
    .eq("status", "pendente_aprovacao")
    .order("solicitado_em", { ascending: true });

  // Conferência automática contra a última lista importada do CREA:
  // evita que alguém precise abrir o portal do conselho para cada pedido.
  const registros = (pedidos ?? [])
    .filter((p: any) => p.conselho === "CREA" && p.registro_profissional)
    .map((p: any) => p.registro_profissional);

  let confCrea: Record<string, { situacao: string; optante: boolean }> = {};
  let referencia: string | null = null;

  if (registros.length) {
    const { data: imp } = await supabase
      .from("importacoes_crea").select("id, data_referencia")
      .not("confirmado_em", "is", null)
      .order("data_referencia", { ascending: false }).limit(1).maybeSingle();

    if (imp) {
      referencia = imp.data_referencia;
      const { data: linhas } = await supabase
        .from("conciliacoes").select("registro_lido, resultado")
        .eq("importacao_id", imp.id).in("registro_lido", registros);
      (linhas ?? []).forEach((l: any) => {
        confCrea[l.registro_lido] = {
          situacao: l.resultado === "nao_identificado" ? "não identificado" : "consta na lista",
          optante: l.resultado !== "nao_identificado",
        };
      });
    }
  }

  const { data: categorias } = await supabase
    .from("categorias_associado").select("id, nome, criterio").eq("ativa", true).order("ordem");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Solicitações de associação</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pedidos feitos pelo formulário público, aguardando conferência.
        </p>
      </div>
      <PainelSolicitacoes
        pedidos={pedidos ?? []}
        categorias={categorias ?? []}
        confCrea={confCrea}
        referencia={referencia}
      />
    </div>
  );
}
