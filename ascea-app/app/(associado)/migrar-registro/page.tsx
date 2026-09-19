"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Aviso } from "@/components/Aviso";

export default function PaginaMigrar() {
  const router = useRouter();
  const [conselho, setConselho] = useState<"CREA" | "CAU">("CREA");
  const [registro, setRegistro] = useState("");
  const [titulo, setTitulo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null); setEnviando(true);
    const r = await fetch("/api/migrar-registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conselho, registro, titulo }),
    });
    const j = await r.json();
    setEnviando(false);
    if (!r.ok) { setErro(j.erro ?? "Não foi possível enviar."); return; }
    setOk(true);
  }

  if (ok) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Aviso tipo="ok" titulo="Solicitação registrada">
          A secretaria vai conferir seu registro e concluir a migração de categoria. Sua
          data de associação original é preservada.
        </Aviso>
        {conselho === "CREA" && (
          <Aviso tipo="alerta" titulo="Não esqueça deste passo">
            Agora que você tem registro profissional, precisa <strong>indicar a ASCEA como
            sua entidade de classe no cadastro do CREA-SC</strong>. Sem isso, o conselho
            não informa seu vínculo e você sairá da relação de associados na conferência
            seguinte.
          </Aviso>
        )}
        <button className="btn-secundario w-full" onClick={() => router.push("/")}>
          Voltar ao meu cadastro
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="cartao mx-auto max-w-lg space-y-4 p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-slate-900">Informar registro profissional</h1>
      <p className="text-sm text-slate-600">
        Preencha após obter seu registro. A secretaria confere e migra sua categoria.
      </p>
      <div>
        <label className="rotulo">Conselho</label>
        <select className="campo" value={conselho}
                onChange={(e) => setConselho(e.target.value as "CREA" | "CAU")}>
          <option value="CREA">CREA-SC — Engenharia</option>
          <option value="CAU">CAU/SC — Arquitetura</option>
        </select>
      </div>
      <div>
        <label className="rotulo">Número do registro</label>
        <input required className="campo" value={registro}
               onChange={(e) => setRegistro(e.target.value)}
               placeholder={conselho === "CREA" ? "000000-0" : "A000000"} />
      </div>
      <div>
        <label className="rotulo">Título profissional</label>
        <input className="campo" value={titulo} onChange={(e) => setTitulo(e.target.value)}
               placeholder="Engenheiro Civil" />
      </div>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <button className="btn-primario w-full" disabled={enviando}>
        {enviando ? "Enviando…" : "Enviar para conferência"}
      </button>
    </form>
  );
}
