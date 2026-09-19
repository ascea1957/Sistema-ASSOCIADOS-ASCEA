"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { Aviso } from "@/components/Aviso";
import { EtiquetaStatus } from "@/components/Etiqueta";
import { dataBR } from "@/lib/formato";
import { ROTULO_STATUS } from "@/lib/tipos";

export function FichaAssociado({ associado, categorias, papel, convites }: any) {
  const router = useRouter();
  const [f, setF] = useState<any>(associado);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const campo = (k: string) => ({
    value: f[k] ?? "",
    onChange: (e: any) => setF({ ...f, [k]: e.target.value }),
  });

  const ehPresidencia = papel === "presidencia";

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null); setOk(false); setSalvando(true);
    const { categorias_associado, ...dados } = f;
    const { error } = await criarClienteNavegador()
      .from("associados").update({
        nome: dados.nome, email: dados.email || null, telefone: dados.telefone || null,
        cpf: dados.cpf || null, registro_profissional: dados.registro_profissional || null,
        conselho: dados.conselho, categoria_id: dados.categoria_id, status: dados.status,
        instituicao_ensino: dados.instituicao_ensino || null, curso: dados.curso || null,
        observacoes: dados.observacoes || null,
      }).eq("id", associado.id);
    setSalvando(false);
    if (error) {
      setErro(/insufficient_privilege|presidência/i.test(error.message)
        ? "Somente a presidência pode inativar ou desligar um associado."
        : error.message);
      return;
    }
    setOk(true); router.refresh();
  }

  async function reenviarConvite() {
    setErro(null);
    const r = await fetch("/api/convites/disparar", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apenasIds: [associado.id], limite: 1 }),
    });
    const j = await r.json();
    if (!r.ok) { setErro(j.erro ?? "Falha ao enviar."); return; }
    setOk(true); router.refresh();
  }

  return (
    <form onSubmit={salvar} className="space-y-5">
      <div className="cartao p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-xl font-semibold text-slate-900">{associado.nome}</h1>
          <EtiquetaStatus status={associado.status} />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="rotulo">Nome</label><input className="campo" {...campo("nome")} /></div>
          <div><label className="rotulo">E-mail</label><input className="campo" {...campo("email")} /></div>
          <div><label className="rotulo">Telefone</label><input className="campo" {...campo("telefone")} /></div>
          <div>
            <label className="rotulo">CPF</label>
            <input className="campo" {...campo("cpf")} placeholder="apenas números" />
            <p className="mt-1 text-xs text-slate-500">Deixe vazio se não houver CPF confiável.</p>
          </div>
          <div>
            <label className="rotulo">Conselho</label>
            <select className="campo" {...campo("conselho")}>
              <option value="NENHUM">Nenhum</option><option value="CREA">CREA</option><option value="CAU">CAU</option>
            </select>
          </div>
          <div><label className="rotulo">Registro profissional</label><input className="campo" {...campo("registro_profissional")} /></div>
          <div>
            <label className="rotulo">Categoria</label>
            <select className="campo" {...campo("categoria_id")}>
              {categorias.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="rotulo">Situação</label>
            <select className="campo" {...campo("status")}>
              {Object.entries(ROTULO_STATUS).map(([v, r]) => {
                const bloqueado = !ehPresidencia && ["inativo", "desligado"].includes(v);
                return <option key={v} value={v} disabled={bloqueado}>
                  {r}{bloqueado ? " (só presidência)" : ""}
                </option>;
              })}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="rotulo">Observações</label>
            <textarea rows={3} className="campo" {...campo("observacoes")} />
          </div>
        </div>

        {erro && <div className="mt-4"><Aviso tipo="erro">{erro}</Aviso></div>}
        {ok && <div className="mt-4"><Aviso tipo="ok">Alterações salvas.</Aviso></div>}

        <div className="mt-5 flex flex-wrap gap-3">
          <button className="btn-primario" disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar alterações"}
          </button>
          {!associado.user_id && associado.email && (
            <button type="button" className="btn-secundario" onClick={reenviarConvite}>
              Enviar convite de acesso
            </button>
          )}
        </div>
      </div>

      <div className="cartao p-6">
        <h2 className="font-medium text-slate-900">Acesso ao aplicativo</h2>
        <p className="mt-1 text-sm text-slate-600">
          {associado.user_id ? "Este associado já criou sua senha e acessa o app."
                             : "Ainda não criou acesso."}
        </p>
        {convites.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            {convites.map((c: any, i: number) => (
              <li key={i}>
                Convite enviado em {dataBR(c.enviado_em)}
                {c.aceito_em && ` · aceito em ${dataBR(c.aceito_em)}`}
                {c.ultimo_erro && <span className="text-red-700"> · falha: {c.ultimo_erro}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Toda alteração feita aqui fica registrada no log de auditoria, com autor e horário.
      </p>
    </form>
  );
}
