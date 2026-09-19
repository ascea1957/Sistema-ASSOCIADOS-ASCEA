const BASE = (conteudo: string) => `
<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#1a3f72;padding:24px;">
  <p style="margin:0;color:#aec9ea;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;">Associação Sul Catarinense</p>
  <p style="margin:4px 0 0;color:#ffffff;font-size:17px;font-weight:600;">de Engenheiros e Arquitetos</p>
</td></tr>
<tr><td style="padding:28px 24px;color:#334155;font-size:15px;line-height:1.65;">${conteudo}</td></tr>
<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 24px;color:#64748b;font-size:12px;line-height:1.5;">
  <p style="margin:0;">ASCEA — Associação Sul Catarinense de Engenheiros e Arquitetos · Criciúma/SC</p>
  <p style="margin:8px 0 0;">Você recebeu esta mensagem porque consta no cadastro de associados da ASCEA. Seus dados são tratados conforme a Lei 13.709/2018 (LGPD) e usados apenas para fins associativos. Para corrigir ou excluir seus dados, responda a este e-mail.</p>
</td></tr>
</table></td></tr></table></body></html>`;

const BOTAO = (url: string, texto: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td style="background:#1f4d8c;border-radius:8px;">
<a href="${url}" style="display:inline-block;padding:13px 28px;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">${texto}</a>
</td></tr></table>`;

export function emailConvite(nome: string, url: string) {
  const primeiro = nome.split(" ")[0];
  return {
    assunto: "Seu acesso à Área do Associado da ASCEA",
    html: BASE(`
      <p style="margin:0 0 16px;">Olá, ${primeiro}.</p>
      <p style="margin:0 0 16px;">A ASCEA passou a ter uma área exclusiva para os associados, com <strong>carteirinha digital</strong> e a relação dos <strong>convênios</strong> firmados pela associação.</p>
      <p style="margin:0 0 16px;">Para criar seu acesso, clique no botão abaixo. Você vai conferir seus dados e definir uma senha — leva menos de dois minutos.</p>
      ${BOTAO(url, "Criar meu acesso")}
      <p style="margin:0 0 16px;font-size:13px;color:#64748b;">Se o botão não funcionar, copie e cole este endereço no navegador:<br><span style="word-break:break-all;color:#1f4d8c;">${url}</span></p>
      <p style="margin:0;font-size:13px;color:#64748b;">Este link é pessoal e vale por 30 dias. Em caso de dúvida, responda a esta mensagem.</p>`),
  };
}

export function emailAdesaoRecebida(nome: string) {
  return {
    assunto: "Recebemos seu pedido de associação — ASCEA",
    html: BASE(`
      <p style="margin:0 0 16px;">Olá, ${nome.split(" ")[0]}.</p>
      <p style="margin:0 0 16px;">Recebemos seu pedido de associação à ASCEA. A secretaria vai conferir seus dados junto ao conselho profissional e retornar por este mesmo e-mail.</p>
      <p style="margin:0;">Obrigado pelo interesse em fazer parte da associação.</p>`),
  };
}

export function emailAdesaoAprovada(nome: string, url: string, precisaOptar: boolean) {
  return {
    assunto: "Seu pedido foi aprovado — ASCEA",
    html: BASE(`
      <p style="margin:0 0 16px;">Olá, ${nome.split(" ")[0]}.</p>
      <p style="margin:0 0 16px;">Seu pedido de associação foi aprovado. Crie seu acesso à área do associado:</p>
      ${BOTAO(url, "Criar meu acesso")}
      ${precisaOptar ? `
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:8px 0 16px;">
        <p style="margin:0 0 8px;font-weight:600;color:#92400e;">Falta um passo importante</p>
        <p style="margin:0;color:#92400e;font-size:14px;line-height:1.6;">Entre no portal do CREA-SC e <strong>indique a ASCEA como sua entidade de classe</strong>. É esse registro no conselho que confirma seu vínculo com a associação. Sem ele, seu acesso fica limitado.</p>
      </div>` : ""}
      <p style="margin:0;font-size:13px;color:#64748b;">Em caso de dúvida, responda a esta mensagem.</p>`),
  };
}

export function emailAdesaoRecusada(nome: string, motivo: string | null) {
  return {
    assunto: "Sobre seu pedido de associação — ASCEA",
    html: BASE(`
      <p style="margin:0 0 16px;">Olá, ${nome.split(" ")[0]}.</p>
      <p style="margin:0 0 16px;">Seu pedido de associação não pôde ser aprovado neste momento.</p>
      ${motivo ? `<p style="margin:0 0 16px;"><strong>Motivo:</strong> ${motivo}</p>` : ""}
      <p style="margin:0;">Se acredita que houve engano, responda a esta mensagem e a secretaria reavaliará.</p>`),
  };
}
