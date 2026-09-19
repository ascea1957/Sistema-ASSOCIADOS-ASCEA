import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { enviarEmail } from "@/lib/email/enviar";
import { emailAdesaoAprovada, emailAdesaoRecusada } from "@/lib/email/modelos";

export async function POST(req: Request) {
  const supabase = criarClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const { data: operador } = await supabase
    .from("usuarios_admin").select("papel, ativo").eq("user_id", user.id).maybeSingle();
  if (!operador?.ativo) return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });

  const { id, decisao, categoriaId, motivo } = await req.json();
  const admin = criarClienteAdmin();

  const { data: p } = await admin
    .from("associados").select("id, nome, email, conselho, status").eq("id", id).maybeSingle();
  if (!p) return NextResponse.json({ erro: "Pedido não encontrado." }, { status: 404 });
  if (p.status !== "pendente_aprovacao") {
    return NextResponse.json({ erro: "Este pedido já foi decidido." }, { status: 409 });
  }

  if (decisao === "recusar") {
    await admin.from("associados").update({
      status: "recusado", aprovado_por: user.id, aprovado_em: new Date().toISOString(),
    }).eq("id", id);
    if (p.email) {
      const m = emailAdesaoRecusada(p.nome, motivo ?? null);
      await enviarEmail({ para: p.email, assunto: m.assunto, html: m.html });
    }
    return NextResponse.json({ ok: true });
  }

  // Engenheiro entra como 'aguardando_opcao': só a lista do CREA confirma o vínculo.
  const precisaOptar = p.conselho === "CREA";
  const atualizacao: Record<string, unknown> = {
    status: precisaOptar ? "aguardando_opcao" : "ativo",
    aprovado_por: user.id,
    aprovado_em: new Date().toISOString(),
    data_associacao: new Date().toISOString().slice(0, 10),
  };
  if (categoriaId) atualizacao.categoria_id = categoriaId;

  const { error } = await admin.from("associados").update(atualizacao).eq("id", id);
  if (error) return NextResponse.json({ erro: "Falha ao aprovar." }, { status: 400 });

  const { data: convite } = await admin
    .from("convites").insert({ associado_id: id }).select("token").single();

  if (p.email && convite) {
    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/convite/${convite.token}`;
    const m = emailAdesaoAprovada(p.nome, url, precisaOptar);
    const r = await enviarEmail({ para: p.email, assunto: m.assunto, html: m.html });
    await admin.from("convites").update({
      enviado_em: new Date().toISOString(),
      provider_msg_id: r.id,
      ultimo_erro: r.erro,
    }).eq("associado_id", id).is("aceito_em", null);
  }

  return NextResponse.json({ ok: true });
}
