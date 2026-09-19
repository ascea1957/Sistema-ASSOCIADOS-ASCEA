"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { Aviso } from "@/components/Aviso";
import { dataBR } from "@/lib/formato";
import type { Parceiro } from "@/lib/tipos";

const VAZIO = {
  nome: "", categoria: "", descricao_beneficio: "", como_usar: "",
  contato: "", endereco: "", site: "",
  vigencia_inicio: new Date().toISOString().slice(0, 10),
  vigencia_fim: "", ativo: true, ordem: 0,
};

export function GestorParceiros({ iniciais }: { iniciais: Parceiro[] }) {
  const router = useRouter();
  const [form, setForm] = useState<any>(VAZIO);
  const [editando, setEditando] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const campo = (k: string) => ({
    value: form[k] ?? "",
    onChange: (e: any) => setForm({ ...form, [k]: e.target.value }),
  });

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!form.vigencia_fim) { setErro("Informe a data final de vigência do convênio."); return; }
    setSalvando(true);
    const supabase = criarClienteNavegador();
    const dados = { ...form, ordem: Number(form.ordem) || 0 };
    const { error } = editando
      ? await supabase.from("parceiros").update(dados).eq("id", editando)
      : await supabase.from("parceiros").insert(dados);
    setSalvando(false);
    if (error) { setErro(error.message); return; }
    setForm(VAZIO); setEditando(null); setAberto(false);
    router.refresh();
  }

  async function alternarAtivo(p: Parceiro) {
    await criarClienteNavegador().from("parceiros").update({ ativo: !p.ativo }).eq("id", p.id);
    router.refresh();
  }

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      {!aberto ? (
        <button className="btn-primario" onClick={() => { setForm(VAZIO); setEditando(null); setAberto(true); }}>
          + Cadastrar parceiro
        </button>
      ) : (
        <form onSubmit={salvar} className="cartao space-y-4 p-6">
          <h2 className="font-medium text-slate-900">
            {editando ? "Editar parceiro" : "Novo parceiro"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="rotulo">Nome *</label><input required className="campo" {...campo("nome")} /></div>
            <div>
              <label className="rotulo">Categoria *</label>
              <input required className="campo" {...campo("categoria")} list="cats"
                     placeholder="Saúde, Educação, Lazer…" />
              <datalist id="cats">
                {Array.from(new Set(iniciais.map((p) => p.categoria))).map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="sm:col-span-2">
              <label className="rotulo">Benefício *</label>
              <input required className="campo" {...campo("descricao_beneficio")}
                     placeholder="15% de desconto em consultas" />
            </div>
            <div className="sm:col-span-2">
              <label className="rotulo">Como usar</label>
              <input className="campo" {...campo("como_usar")}
                     placeholder="Apresentar a carteirinha digital no atendimento" />
            </div>
            <div><label className="rotulo">Contato</label><input className="campo" {...campo("contato")} /></div>
            <div><label className="rotulo">Site</label><input className="campo" {...campo("site")} placeholder="https://" /></div>
            <div className="sm:col-span-2"><label className="rotulo">Endereço</label><input className="campo" {...campo("endereco")} /></div>
            <div><label className="rotulo">Vigência — início</label><input type="date" className="campo" {...campo("vigencia_inicio")} /></div>
            <div>
              <label className="rotulo">Vigência — fim *</label>
              <input type="date" required className="campo" {...campo("vigencia_fim")} />
              <p className="mt-1 text-xs text-slate-500">
                Passada essa data o convênio some da lista automaticamente.
              </p>
            </div>
          </div>
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          <div className="flex gap-3">
            <button className="btn-primario" disabled={salvando}>{salvando ? "Salvando…" : "Salvar"}</button>
            <button type="button" className="btn-secundario" onClick={() => { setAberto(false); setEditando(null); }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {iniciais.length === 0 ? (
        <Aviso tipo="info">Nenhum parceiro cadastrado ainda.</Aviso>
      ) : (
        <div className="cartao overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Parceiro</th>
                <th className="px-4 py-3 font-medium">Benefício</th>
                <th className="px-4 py-3 font-medium">Vigência</th>
                <th className="px-4 py-3 font-medium">Situação</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {iniciais.map((p) => {
                const vencido = p.vigencia_fim < hoje;
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{p.nome}</p>
                      <p className="text-xs text-slate-500">{p.categoria}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.descricao_beneficio}</td>
                    <td className="px-4 py-3 text-slate-600">{dataBR(p.vigencia_fim)}</td>
                    <td className="px-4 py-3">
                      {vencido ? <span className="etiqueta bg-red-100 text-red-800">vencido</span>
                        : p.ativo ? <span className="etiqueta bg-emerald-100 text-emerald-800">no ar</span>
                        : <span className="etiqueta bg-slate-200 text-slate-700">oculto</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-sm text-ascea-600 hover:underline"
                              onClick={() => { setForm(p); setEditando(p.id); setAberto(true); }}>
                        editar
                      </button>
                      <button className="ml-3 text-sm text-slate-500 hover:underline"
                              onClick={() => alternarAtivo(p)}>
                        {p.ativo ? "ocultar" : "mostrar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
