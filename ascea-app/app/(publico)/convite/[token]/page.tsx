import { criarClienteAdmin } from "@/lib/supabase/admin";
import { FormularioAceite } from "./FormularioAceite";
import { Aviso } from "@/components/Aviso";

export const dynamic = "force-dynamic";

export default async function PaginaConvite({ params }: { params: { token: string } }) {
  const admin = criarClienteAdmin();
  const { data: convite } = await admin
    .from("convites")
    .select("id, aceito_em, expira_em, associados(id, nome, email, cpf, telefone, registro_profissional, conselho, categorias_associado(nome))")
    .eq("token", params.token)
    .maybeSingle();

  if (!convite) {
    return (
      <div className="mx-auto max-w-md">
        <Aviso tipo="erro" titulo="Convite não encontrado">
          Este link não é válido. Confira se copiou o endereço inteiro do e-mail, ou peça
          um novo convite à secretaria.
        </Aviso>
      </div>
    );
  }
  if (convite.aceito_em) {
    return (
      <div className="mx-auto max-w-md">
        <Aviso tipo="info" titulo="Convite já utilizado">
          Sua senha já foi criada. Use a página de login — e, se não lembrar da senha,
          clique em &ldquo;Esqueci minha senha&rdquo;.
        </Aviso>
      </div>
    );
  }
  if (new Date(convite.expira_em) < new Date()) {
    return (
      <div className="mx-auto max-w-md">
        <Aviso tipo="alerta" titulo="Convite expirado">
          Este link perdeu a validade. Peça à secretaria que reenvie o convite.
        </Aviso>
      </div>
    );
  }

  const a: any = convite.associados;
  return <FormularioAceite token={params.token} associado={a} />;
}
