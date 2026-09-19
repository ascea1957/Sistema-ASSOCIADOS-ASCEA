import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { somenteDigitos, cpfValido, emailValido } from "@/lib/formato";

export async function POST(req: Request) {
  const { token, email, telefone, cpf, senha, lgpd } = await req.json();
  if (!token) return NextResponse.json({ erro: "Convite inválido." }, { status: 400 });
  if (!emailValido(email)) return NextResponse.json({ erro: "E-mail inválido." }, { status: 400 });
  if (!senha || senha.length < 8) return NextResponse.json({ erro: "Senha muito curta." }, { status: 400 });
  if (!lgpd) return NextResponse.json({ erro: "É necessário autorizar o tratamento dos dados." }, { status: 400 });

  const admin = criarClienteAdmin();
  const { data: convite } = await admin
    .from("convites").select("id, aceito_em, expira_em, associado_id").eq("token", token).maybeSingle();

  if (!convite) return NextResponse.json({ erro: "Convite não encontrado." }, { status: 404 });
  if (convite.aceito_em) return NextResponse.json({ erro: "Este convite já foi utilizado." }, { status: 409 });
  if (new Date(convite.expira_em) < new Date()) {
    return NextResponse.json({ erro: "Convite expirado. Peça um novo à secretaria." }, { status: 410 });
  }

  const { data: usuario, error: erroUser } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password: senha,
    email_confirm: true,
  });
  if (erroUser || !usuario?.user) {
    const msg = /already been registered|already exists/i.test(erroUser?.message ?? "")
      ? "Já existe uma conta com este e-mail. Use 'Esqueci minha senha' na página de login."
      : "Não foi possível criar o acesso. Tente novamente.";
    return NextResponse.json({ erro: msg }, { status: 400 });
  }

  const cpfLimpo = somenteDigitos(cpf);
  const atualizacao: Record<string, unknown> = {
    user_id: usuario.user.id,
    email: email.trim().toLowerCase(),
    telefone: telefone || null,
    consentimento_lgpd_em: new Date().toISOString(),
  };
  if (cpfLimpo && cpfValido(cpfLimpo)) atualizacao.cpf = cpfLimpo;

  const { error: erroAssoc } = await admin
    .from("associados").update(atualizacao).eq("id", convite.associado_id);

  if (erroAssoc) {
    await admin.auth.admin.deleteUser(usuario.user.id); // não deixa conta órfã
    return NextResponse.json({ erro: "Não foi possível concluir o cadastro." }, { status: 400 });
  }

  await admin.from("convites").update({ aceito_em: new Date().toISOString() }).eq("id", convite.id);
  return NextResponse.json({ ok: true });
}
