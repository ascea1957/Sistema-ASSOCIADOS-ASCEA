"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Aviso } from "@/components/Aviso";
import { dataBR, mascararCpf } from "@/lib/formato";

export function PainelSolicitacoes({
  pedidos, categorias, confCrea, referencia,
}: {
  pedidos: any[]; categorias: any[];
  confCrea: Record<string, { situacao: string; optante: boolean }>;
  referencia: string | null;
}) {
  const router = useRouter();
  const [processando, setProcessando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function decidir(id: string, decisao: "aprovar" | "recusar", categoriaId?: string) {
    setErro(null);
    if (decisao === "recusar" && !confirm("Recusar este pedido? O solicitante será avisado por e-mail.")) return;
    setProcessando(id);
    const r = await fetch("/api/solicitacoes/decidir", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decisao, categoriaId }),
    });
    const j = await r.json();
    setProcessando(null);
    if (!r.ok) { setErro(j.erro ?? "Falha ao processar."); return; }
    router.refresh();
  }

  if (!pedidos.length) {
    return <Aviso tipo="info" titulo="Nenhuma solicitação pendente">
      Novos pedidos feitos pelo formulário público aparecem aqui.
    </Aviso>;
  }

  return (
    <div className="space-y-4">
      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      {pedidos.map((p) => {
        const conf = p.registro_profissional ? confCrea[p.registro_profissional] : undefined;
        const ehCrea = p.conselho === "CREA";
        return (
          <article key={p.id} className="cartao p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900">{p.nome}</h2>
                <p className="text-sm text-slate-500">
                  Categoria declarada: {p.categorias_associado?.nome}
                  {p.campanha && ` · campanha ${p.campanha}`}
                </p>
              </div>
              <p className="text-xs text-slate-500">Pedido em {dataBR(p.solicitado_em)}</p>
            </div>

            <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between"><dt className="text-slate-500">E-mail</dt><dd>{p.email}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Telefone</dt><dd>{p.telefone ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">CPF</dt><dd>{mascararCpf(p.cpf)}</dd></div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Registro</dt>
                <dd>{p.registro_profissional ? `${p.conselho} ${p.registro_profissional}` : "—"}</dd>
              </div>
              {p.instituicao_ensino && (
                <>
                  <div className="flex justify-between"><dt className="text-slate-500">Instituição</dt><dd>{p.instituicao_ensino}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Curso</dt><dd>{p.curso ?? "—"}</dd></div>
                </>
              )}
            </dl>

            {p.observacoes && (
              <p className="mt-3 rounded bg-slate-50 p-3 text-xs text-slate-600">{p.observacoes}</p>
            )}

            <div className="mt-4">
              {ehCrea ? (
                conf ? (
                  <Aviso tipo="ok" titulo="Conferido na lista do CREA-SC">
                    Registro {p.registro_profissional} {conf.situacao}
                    {referencia && ` (base de ${dataBR(referencia)})`}.
                    {" "}Ao aprovar, entra como <strong>aguardando opção</strong> até a
                    próxima importação confirmar que ele indicou a ASCEA.
                  </Aviso>
                ) : (
                  <Aviso tipo="alerta" titulo="Não localizado na última lista do CREA">
                    O registro informado não aparece na importação mais recente
                    {referencia && ` (base de ${dataBR(referencia)})`}. Pode ser registro
                    digitado errado, profissional de outro CREA, ou que ainda não indicou a
                    ASCEA. <strong>Confira no portal do CREA-SC antes de aprovar.</strong>
                  </Aviso>
                )
              ) : p.conselho === "CAU" ? (
                <Aviso tipo="info" titulo="Conferência manual">
                  Não há lista do CAU importada no sistema. Confira o registro{" "}
                  <strong>{p.registro_profissional}</strong> na consulta pública do CAU/SC
                  antes de aprovar.
                </Aviso>
              ) : (
                <Aviso tipo="info" titulo="Estudante">
                  Confirme o vínculo com a instituição de ensino antes de aprovar.
                </Aviso>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
              <select
                className="campo w-auto"
                defaultValue={p.categorias_associado?.id}
                id={`cat-${p.id}`}
                title="Categoria a aplicar na aprovação"
              >
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <button
                className="btn-primario"
                disabled={processando === p.id}
                onClick={() => {
                  const sel = document.getElementById(`cat-${p.id}`) as HTMLSelectElement;
                  decidir(p.id, "aprovar", sel.value);
                }}
              >
                {processando === p.id ? "Processando…" : "Aprovar e enviar convite"}
              </button>
              <button className="btn-perigo" disabled={processando === p.id}
                      onClick={() => decidir(p.id, "recusar")}>
                Recusar
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
