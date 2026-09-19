import { Resend } from "resend";

export interface Mensagem {
  para: string;
  assunto: string;
  html: string;
}

/**
 * Envia e devolve o id da mensagem no provedor.
 * O id é gravado em convites.provider_msg_id: os logs do Resend só ficam 30
 * dias, e a prova de envio tem que ser da ASCEA, não do fornecedor.
 */
export async function enviarEmail(m: Mensagem): Promise<{ id: string | null; erro: string | null }> {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) return { id: null, erro: "RESEND_API_KEY não configurada" };
  try {
    const resend = new Resend(chave);
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_REMETENTE ?? "ASCEA <convites@envios.asceaoficial.com.br>",
      replyTo: process.env.EMAIL_RESPOSTA ?? "ascea1957@gmail.com",
      to: m.para,
      subject: m.assunto,
      html: m.html,
    });
    if (error) return { id: null, erro: error.message };
    return { id: data?.id ?? null, erro: null };
  } catch (e: any) {
    return { id: null, erro: e?.message ?? "falha no envio" };
  }
}
