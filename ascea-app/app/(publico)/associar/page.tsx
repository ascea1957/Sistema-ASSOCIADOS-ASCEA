"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Aviso } from "@/components/Aviso";

type Opcao = "crea" | "cau" | "est_eng" | "est_arq";

const OPCOES: { valor: Opcao; titulo: string; detalhe: string }[] = [
  { valor: "crea",    titulo: "Engenheiro",              detalhe: "Registrado no CREA-SC" },
  { valor: "cau",     titulo: "Arquiteto",               detalhe: "Registrado no CAU/SC" },
  { valor: "est_eng", titulo: "Estudante de Engenharia", detalhe: "CREA-Jr" },
  { valor: "est_arq", titulo: "Estudante de Arquitetura",detalhe: "Curso em andamento" },
];

export default function PaginaAssociar() {
  const router = useRouter();
  const [cat, setCat] = useState<Opcao | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [f, setF] = useState({
    nome: "", cpf: "", email: "", telefone: "", cidade: "",
    registro: "", titulo: "", instituicao: "", curso: "", previsao: "", lgpd: false,
  });

  const ehEstudante = cat === "est_eng" || cat === "est_arq";
  const ehProfissional = cat === "crea" || cat === "cau";
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!cat) { setErro("Escolha uma das opções acima."); return; }
    if (!f.lgpd) { setErro("É necessário concordar com o tratamento dos dados."); return; }
    setEnviando(true);
    const resp = await fetch("/api/adesao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, categoria: cat }),
    });
    const json = await resp.json();
    setEnviando(false);
    if (!resp.ok) { setErro(json.erro ?? "Não foi possível enviar seu pedido. Tente novamente."); return; }
    router.push(`/obrigado?categoria=${cat}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="cartao p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-slate-900">Quero me associar à ASCEA</h1>
        <p className="mt-1 text-sm text-slate-500">
          Preencha os dados abaixo. A secretaria confere e responde por e-mail.
        </p>

        <form onSubmit={enviar} className="mt-6 space-y-6">
          <fieldset>
            <legend className="rotulo">Você é:</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {OPCOES.map((o) => (
                <label key={o.valor}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                    cat === o.valor ? "border-ascea-500 bg-ascea-50 ring-1 ring-ascea-200"
                                    : "border-slate-300 hover:border-slate-400"}`}>
                  <input type="radio" name="categoria" className="mt-1" checked={cat === o.valor}
                         onChange={() => setCat(o.valor)} />
                  <span>
                    <span className="block text-sm font-medium text-slate-900">{o.titulo}</span>
                    <span className="block text-xs text-slate-500">{o.detalhe}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {cat && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="rotulo">Nome completo *</label>
                  <input required className="campo" value={f.nome} onChange={set("nome")} />
                </div>
                <div>
                  <label className="rotulo">CPF *</label>
                  <input required className="campo" value={f.cpf} onChange={set("cpf")}
                         placeholder="000.000.000-00" inputMode="numeric" />
                </div>
                <div>
                  <label className="rotulo">Telefone *</label>
                  <input required className="campo" value={f.telefone} onChange={set("telefone")}
                         placeholder="(48) 90000-0000" />
                </div>
                <div className="sm:col-span-2">
                  <label className="rotulo">E-mail *</label>
                  <input required type="email" className="campo" value={f.email} onChange={set("email")} />
                  <p className="mt-1 text-xs text-slate-500">
                    É por aqui que você receberá o acesso e as convocações da associação.
                  </p>
                </div>
                <div>
                  <label className="rotulo">Cidade</label>
                  <input className="campo" value={f.cidade} onChange={set("cidade")} />
                </div>

                {ehProfissional && (
                  <>
                    <div>
                      <label className="rotulo">
                        Registro {cat === "crea" ? "no CREA-SC" : "no CAU/SC"} *
                      </label>
                      <input required className="campo" value={f.registro} onChange={set("registro")}
                             placeholder={cat === "crea" ? "000000-0" : "A000000"} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="rotulo">Título profissional</label>
                      <input className="campo" value={f.titulo} onChange={set("titulo")}
                             placeholder="Engenheiro Civil, Arquiteta e Urbanista…" />
                    </div>
                  </>
                )}

                {ehEstudante && (
                  <>
                    <div className="sm:col-span-2">
                      <label className="rotulo">Instituição de ensino *</label>
                      <input required className="campo" value={f.instituicao} onChange={set("instituicao")} />
                    </div>
                    <div>
                      <label className="rotulo">Curso *</label>
                      <input required className="campo" value={f.curso} onChange={set("curso")} />
                    </div>
                    <div>
                      <label className="rotulo">Previsão de conclusão</label>
                      <input type="month" className="campo" value={f.previsao} onChange={set("previsao")} />
                    </div>
                  </>
                )}
              </div>

              {cat === "crea" && (
                <Aviso tipo="alerta" titulo="Atenção, engenheiro">
                  Além deste cadastro, você precisa indicar a ASCEA como sua entidade de
                  classe no seu cadastro do CREA-SC. É esse registro no conselho que
                  confirma o vínculo. Explicamos como na próxima tela.
                </Aviso>
              )}

              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input type="checkbox" className="mt-1" checked={f.lgpd} onChange={set("lgpd")} />
                <span>
                  Autorizo a ASCEA a tratar meus dados para fins de cadastro associativo,
                  emissão de carteirinha, acesso a convênios e comunicações da associação,
                  conforme a{" "}
                  <a href="/privacidade" target="_blank" className="text-ascea-600 underline">
                    política de privacidade
                  </a>.
                </span>
              </label>

              {erro && <Aviso tipo="erro">{erro}</Aviso>}

              <button type="submit" className="btn-primario w-full" disabled={enviando}>
                {enviando ? "Enviando…" : "Enviar pedido de associação"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
