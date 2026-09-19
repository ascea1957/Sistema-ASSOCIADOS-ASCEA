import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { lerPlanilhaCrea, compararBases } from "@/lib/importacao";

export const maxDuration = 60;

/**
 * Passo 1 da conciliação: lê o arquivo, guarda o original com seu hash e grava
 * o resultado do diff SEM aplicar nada. A confirmação é um segundo passo.
 */
export async function POST(req: Request) {
  const supabase = criarClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  const { data: op } = await supabase
    .from("usuarios_admin").select("ativo").eq("user_id", user.id).maybeSingle();
  if (!op?.ativo) return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });

  const form = await req.formData();
  const arquivo = form.get("arquivo") as File | null;
  const referencia = String(form.get("referencia") ?? "");
  if (!arquivo) return NextResponse.json({ erro: "Envie o arquivo exportado do CREA." }, { status: 400 });
  if (!referencia) return NextResponse.json({ erro: "Informe a data de referência da extração." }, { status: 400 });

  const bytes = await arquivo.arrayBuffer();
  const hash = crypto.createHash("sha256").update(Buffer.from(bytes)).digest("hex");

  let linhas;
  try { linhas = lerPlanilhaCrea(bytes); }
  catch { return NextResponse.json({ erro: "Não consegui ler a planilha. Envie o arquivo como veio do CREA (.xlsx ou .csv)." }, { status: 400 }); }
  if (!linhas.length) return NextResponse.json({ erro: "A planilha não tem linhas reconhecíveis." }, { status: 400 });

  const admin = criarClienteAdmin();

  // ESCOPO: apenas a categoria cujo critério é a opção no CREA.
  const { data: cat } = await admin
    .from("categorias_associado").select("id, nome").eq("criterio", "opcao_crea").maybeSingle();
  if (!cat) return NextResponse.json({ erro: "Categoria de optantes não configurada." }, { status: 500 });

  const { data: naBase } = await admin
    .from("associados").select("id, registro_profissional, nome")
    .eq("categoria_id", cat.id).in("status", ["ativo", "aguardando_opcao"])
    .not("registro_profissional", "is", null);

  const { data: foraEscopo } = await admin
    .from("associados").select("categorias_associado(nome)", { count: "exact" })
    .neq("categoria_id", cat.id).eq("status", "ativo");

  const dif = compararBases(linhas, (naBase ?? []) as any);

  const caminho = `crea/${referencia}-${hash.slice(0, 8)}.xlsx`;
  await admin.storage.from("importacoes").upload(caminho, bytes, {
    contentType: arquivo.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    upsert: true,
  });

  const { data: imp, error } = await admin.from("importacoes_crea").insert({
    data_referencia: referencia,
    arquivo_path: caminho,
    arquivo_nome: arquivo.name,
    arquivo_hash: hash,
    qtd_registros: linhas.length,
    importado_por: user.id,
  }).select("id").single();
  if (error || !imp) return NextResponse.json({ erro: "Falha ao registrar a importação." }, { status: 500 });

  const registros = [
    ...dif.permanece.map((x) => ({ resultado: "permanece", registro_lido: x.registro, nome_lido: x.nome })),
    ...dif.novo.map((x) => ({ resultado: "novo", registro_lido: x.registro, nome_lido: x.nome })),
    ...dif.saiu.map((x) => ({ resultado: "saiu", registro_lido: x.registro, nome_lido: x.nome, associado_id: x.id })),
    ...dif.naoIdentificado.map((x) => ({ resultado: "nao_identificado", registro_lido: x.registro, nome_lido: x.nome })),
  ].map((r) => ({ ...r, importacao_id: imp.id, aplicado: false }));

  await admin.from("conciliacoes").insert(registros);

  return NextResponse.json({
    ok: true,
    importacaoId: imp.id,
    escopo: cat.nome,
    foraEscopo: foraEscopo?.length ?? 0,
    resumo: {
      lidas: linhas.length,
      ignoradasPorSituacao: dif.ignorados,
      permanece: dif.permanece.length,
      novo: dif.novo.length,
      saiu: dif.saiu.length,
      naoIdentificado: dif.naoIdentificado.length,
    },
    saiu: dif.saiu,
    novo: dif.novo.slice(0, 100),
  });
}
