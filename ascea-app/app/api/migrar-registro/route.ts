import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { registroCanonico } from "@/lib/formato";

export async function POST(req: Request) {
  const supabase = criarClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const { conselho, registro, titulo } = await req.json();
  if (!["CREA", "CAU"].includes(conselho)) {
    return NextResponse.json({ erro: "Conselho inválido." }, { status: 400 });
  }
  const numero = conselho === "CREA"
    ? registroCanonico(registro)
    : String(registro ?? "").trim().toUpperCase() || null;
  if (!numero) return NextResponse.json({ erro: "Informe o número do registro." }, { status: 400 });

  const admin = criarClienteAdmin();
  const { data: a } = await admin
    .from("associados").select("id, observacoes").eq("user_id", user.id).maybeSingle();
  if (!a) return NextResponse.json({ erro: "Cadastro não encontrado." }, { status: 404 });

  // Não migra sozinho: registra o pedido para a secretaria conferir.
  const nota = `[${new Date().toLocaleDateString("pt-BR")}] Informou registro ${conselho} ${numero}` +
               (titulo ? ` — ${titulo}` : "") + ". Aguardando conferência para migrar de categoria.";

  await admin.from("associados").update({
    observacoes: [a.observacoes, nota].filter(Boolean).join("\n"),
  }).eq("id", a.id);

  return NextResponse.json({ ok: true });
}
