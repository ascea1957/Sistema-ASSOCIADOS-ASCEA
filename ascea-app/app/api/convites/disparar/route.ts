import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { enviarEmail } from "@/lib/email/enviar";
import { emailConvite } from "@/lib/email/modelos";

export const maxDuration = 300;

/**
 * Disparo de convites em lote.
 *
 * O plano gratuito do Resend permite 100 e-mails por dia. O limite padrão
 * daqui é 80, deixando folga para os e-mails do dia a dia (aprovações,
 * recuperação de senha). Os 397 optantes levam cerca de 5 dias — o que
 * coincide com o escalonamento planejado: piloto pequeno, depois o resto.
 */
export async function POST(req: Request) {
  const supabase = criarClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  const { data: op } = await supabase
    .from("usuarios_admin").select("ativo").eq("user_id", user.id).maybeSingle();
  if (!op?.ativo) return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });

  const { limite = 80, apenasIds } = await req.json().catch(() => ({}));
  const admin = criarClienteAdmin();

  let q = admin
    .from("associados")
    .select("id, nome, email")
    .in("status", ["ativo", "aguardando_opcao"])
    .is("user_id", null)
    .not("email", "is", null)
    .order("nome")
    .limit(Math.min(Number(limite) || 80, 100));

  if (Array.isArray(apenasIds) && apenasIds.length) q = q.in("id", apenasIds);

  const { data: alvos } = await q;
  if (!alvos?.length) {
    return NextResponse.json({ ok: true, enviados: 0, mensagem: "Ninguém pendente de convite." });
  }

  // Quem já tem convite aceito ou ainda válido não recebe de novo.
  const { data: jaTem } = await admin
    .from("convites").select("associado_id, aceito_em, expira_em")
    .in("associado_id", alvos.map((a) => a.id));

  const agora = new Date();
  const pular = new Set(
    (jaTem ?? [])
      .filter((c: any) => c.aceito_em || new Date(c.expira_em) > agora)
      .map((c: any) => c.associado_id)
  );

  let enviados = 0, falhas = 0;
  const erros: { nome: string; erro: string }[] = [];

  for (const a of alvos) {
    if (pular.has(a.id)) continue;
    const { data: convite } = await admin
      .from("convites").insert({ associado_id: a.id }).select("id, token").single();
    if (!convite) { falhas++; continue; }

    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/convite/${convite.token}`;
    const m = emailConvite(a.nome, url);
    const r = await enviarEmail({ para: a.email!, assunto: m.assunto, html: m.html });

    await admin.from("convites").update({
      enviado_em: new Date().toISOString(),
      provider_msg_id: r.id,
      ultimo_erro: r.erro,
      tentativas: 1,
    }).eq("id", convite.id);

    if (r.erro) { falhas++; erros.push({ nome: a.nome, erro: r.erro }); }
    else enviados++;

    await new Promise((res) => setTimeout(res, 600)); // respeita o limite de taxa
  }

  return NextResponse.json({ ok: true, enviados, falhas, erros: erros.slice(0, 20) });
}
