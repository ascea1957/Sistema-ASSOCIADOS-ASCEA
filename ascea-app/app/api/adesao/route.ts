import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { somenteDigitos, registroCanonico, cpfValido, emailValido } from "@/lib/formato";
import { enviarEmail } from "@/lib/email/enviar";
import { emailAdesaoRecebida } from "@/lib/email/modelos";

const CATEGORIA: Record<string, { nome: string; conselho: "CREA" | "CAU" | "NENHUM" }> = {
  crea:    { nome: "Profissional CREA", conselho: "CREA" },
  cau:     { nome: "Profissional CAU",  conselho: "CAU" },
  est_eng: { nome: "Estudante de Engenharia — CREA-Jr", conselho: "NENHUM" },
  est_arq: { nome: "Estudante de Arquitetura", conselho: "NENHUM" },
};

export async function POST(req: Request) {
  const b = await req.json();
  const alvo = CATEGORIA[b.categoria];
  if (!alvo) return NextResponse.json({ erro: "Categoria inválida." }, { status: 400 });
  if (!b.nome?.trim()) return NextResponse.json({ erro: "Informe seu nome." }, { status: 400 });
  if (!emailValido(b.email)) return NextResponse.json({ erro: "E-mail inválido." }, { status: 400 });
  if (!b.lgpd) return NextResponse.json({ erro: "É necessário autorizar o tratamento dos dados." }, { status: 400 });

  const cpf = somenteDigitos(b.cpf);
  if (cpf && !cpfValido(cpf)) {
    return NextResponse.json({ erro: "O CPF informado não é válido. Confira os números." }, { status: 400 });
  }

  const registro = alvo.conselho === "CREA" ? registroCanonico(b.registro)
                 : alvo.conselho === "CAU"  ? String(b.registro ?? "").trim().toUpperCase() || null
                 : null;
  if (alvo.conselho !== "NENHUM" && !registro) {
    return NextResponse.json({ erro: "Informe seu número de registro profissional." }, { status: 400 });
  }

  const admin = criarClienteAdmin();

  // --- já existe? Os 397 optantes recebem a campanha também. ---
  const filtros: string[] = [`email.eq.${b.email.trim().toLowerCase()}`];
  if (cpf) filtros.push(`cpf.eq.${cpf}`);
  if (registro) filtros.push(`registro_profissional.eq.${registro}`);

  const { data: existente } = await admin
    .from("associados").select("id, status").or(filtros.join(",")).maybeSingle();

  if (existente) {
    if (["ativo", "aguardando_opcao"].includes(existente.status)) {
      return NextResponse.json(
        { erro: "Você já consta como associado. Use a página de login — se não lembrar a senha, clique em 'Esqueci minha senha'." },
        { status: 409 }
      );
    }
    if (existente.status === "pendente_aprovacao") {
      return NextResponse.json(
        { erro: "Já existe um pedido em análise com estes dados. Aguarde o retorno da secretaria." },
        { status: 409 }
      );
    }
    // inativo, desligado ou recusado → reabre como pedido de reativação
    await admin.from("associados").update({
      status: "pendente_aprovacao",
      solicitado_em: new Date().toISOString(),
      origem_cadastro: "adesao_publica",
      campanha: b.campanha ?? null,
      email: b.email.trim().toLowerCase(),
      telefone: b.telefone ?? null,
      observacoes: "Pedido de reativação pelo formulário público.",
    }).eq("id", existente.id);

    const m = emailAdesaoRecebida(b.nome);
    await enviarEmail({ para: b.email, assunto: m.assunto, html: m.html });
    return NextResponse.json({ ok: true, reativacao: true });
  }

  const { data: cat } = await admin
    .from("categorias_associado").select("id").eq("nome", alvo.nome).maybeSingle();
  if (!cat) return NextResponse.json({ erro: "Categoria não configurada no sistema." }, { status: 500 });

  const { error } = await admin.from("associados").insert({
    nome: b.nome.trim(),
    cpf: cpf || null,
    email: b.email.trim().toLowerCase(),
    telefone: b.telefone ?? null,
    conselho: alvo.conselho,
    registro_profissional: registro,
    categoria_id: cat.id,
    status: "pendente_aprovacao",
    origem_status: alvo.conselho === "CREA" ? "opcao_crea"
                 : alvo.conselho === "CAU"  ? "adesao_direta" : "matricula",
    origem_cadastro: "adesao_publica",
    campanha: b.campanha ?? null,
    solicitado_em: new Date().toISOString(),
    instituicao_ensino: b.instituicao || null,
    curso: b.curso || null,
    previsao_conclusao: b.previsao ? `${b.previsao}-01` : null,
    consentimento_lgpd_em: new Date().toISOString(),
    observacoes: b.titulo ? `Título informado: ${b.titulo}` : null,
  });

  if (error) {
    return NextResponse.json(
      { erro: "Não foi possível registrar o pedido. Se você já é associado, use a página de login." },
      { status: 400 }
    );
  }

  const m = emailAdesaoRecebida(b.nome);
  await enviarEmail({ para: b.email, assunto: m.assunto, html: m.html });
  return NextResponse.json({ ok: true });
}
