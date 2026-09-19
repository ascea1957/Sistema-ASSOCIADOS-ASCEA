import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const maxDuration = 60;

/**
 * Passo 2: aplica o diff.
 * 'saiu' (inativação) só é aplicado se o operador for da presidência — a mesma
 * regra está no gatilho do banco, aqui é só para dar mensagem decente.
 */
export async function POST(req: Request) {
  const supabase = criarClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  const { data: op } = await supabase
    .from("usuarios_admin").select("papel, ativo").eq("user_id", user.id).maybeSingle();
  if (!op?.ativo) return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });

  const { importacaoId, aplicarSaidas } = await req.json();
  const admin = criarClienteAdmin();

  const { data: imp } = await admin
    .from("importacoes_crea").select("id, data_referencia, confirmado_em").eq("id", importacaoId).maybeSingle();
  if (!imp) return NextResponse.json({ erro: "Importação não encontrada." }, { status: 404 });
  if (imp.confirmado_em) return NextResponse.json({ erro: "Esta importação já foi aplicada." }, { status: 409 });

  const { data: linhas } = await admin
    .from("conciliacoes").select("id, resultado, registro_lido, nome_lido, associado_id")
    .eq("importacao_id", importacaoId).eq("aplicado", false);

  const { data: cat } = await admin
    .from("categorias_associado").select("id").eq("criterio", "opcao_crea").maybeSingle();

  let confirmados = 0, criados = 0, inativados = 0;
  const idsAplicados: string[] = [];

  for (const l of linhas ?? []) {
    if (l.resultado === "permanece") {
      await admin.from("associados").update({
        status: "ativo", origem_status: "opcao_crea", opcao_confirmada_em: imp.data_referencia,
      }).eq("registro_profissional", l.registro_lido).eq("categoria_id", cat!.id);
      confirmados++; idsAplicados.push(l.id);
    } else if (l.resultado === "novo") {
      const { error } = await admin.from("associados").insert({
        nome: l.nome_lido, conselho: "CREA", registro_profissional: l.registro_lido,
        categoria_id: cat!.id, status: "ativo", origem_status: "opcao_crea",
        origem_cadastro: "conciliacao_crea", opcao_confirmada_em: imp.data_referencia,
        observacoes: "Criado pela conciliação do CREA. Faltam e-mail e CPF.",
      });
      if (!error) { criados++; idsAplicados.push(l.id); }
    } else if (l.resultado === "saiu" && aplicarSaidas) {
      if (op.papel !== "presidencia") {
        return NextResponse.json(
          { erro: "Somente a presidência pode aplicar as inativações. As demais alterações podem ser aplicadas por você." },
          { status: 403 }
        );
      }
      if (l.associado_id) {
        await admin.from("associados").update({ status: "inativo", origem_status: "opcao_crea" })
          .eq("id", l.associado_id);
        inativados++; idsAplicados.push(l.id);
      }
    }
  }

  if (idsAplicados.length) {
    await admin.from("conciliacoes").update({
      aplicado: true, decidido_por: user.id, decidido_em: new Date().toISOString(),
    }).in("id", idsAplicados);
  }

  await admin.from("importacoes_crea").update({
    confirmado_por: user.id, confirmado_em: new Date().toISOString(),
  }).eq("id", importacaoId);

  return NextResponse.json({ ok: true, confirmados, criados, inativados });
}
