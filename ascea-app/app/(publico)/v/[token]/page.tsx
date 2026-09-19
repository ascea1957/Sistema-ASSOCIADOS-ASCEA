import { criarClienteServidor } from "@/lib/supabase/server";
import { Marca } from "@/components/Marca";

export const dynamic = "force-dynamic";

/** Verificação pública da carteirinha — é a página que o QR code abre. */
export default async function PaginaVerificacao({ params }: { params: { token: string } }) {
  const supabase = criarClienteServidor();
  const { data } = await supabase.rpc("verificar_carteirinha", { p_token: params.token });
  const reg = Array.isArray(data) && data.length ? data[0] : null;
  const regular = reg?.situacao === "situação regular";

  return (
    <div className="mx-auto max-w-md">
      <div className="cartao overflow-hidden">
        <div className={`px-6 py-8 text-center text-white ${regular ? "bg-emerald-600" : "bg-slate-500"}`}>
          <div className="mb-3 text-4xl">{regular ? "✓" : "!"}</div>
          <p className="text-lg font-semibold">
            {!reg ? "Carteirinha não reconhecida" : regular ? "Carteirinha válida" : "Sem registro ativo"}
          </p>
        </div>

        <div className="p-6">
          {reg ? (
            <dl className="space-y-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Associado</dt>
                <dd className="text-lg font-medium text-slate-900">{reg.nome}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Categoria</dt>
                <dd className="text-slate-800">{reg.categoria}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Situação</dt>
                <dd className="text-slate-800">{reg.situacao}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Verificado em</dt>
                <dd className="text-slate-800">
                  {new Date(reg.verificado_em).toLocaleString("pt-BR")}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm leading-relaxed text-slate-600">
              Este código não corresponde a nenhuma carteirinha válida. Códigos expiram a
              cada 24 horas — peça ao associado que abra a carteirinha novamente no
              aplicativo e gere um novo.
            </p>
          )}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Marca />
          <p className="mt-2 text-xs text-slate-500">
            Verificação oficial emitida pela Associação Sul Catarinense de Engenheiros e
            Arquitetos. Nenhum dado pessoal além dos acima é divulgado.
          </p>
        </div>
      </div>
    </div>
  );
}
