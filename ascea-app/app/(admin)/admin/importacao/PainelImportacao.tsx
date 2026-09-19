"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Aviso } from "@/components/Aviso";

export function PainelImportacao({ papel, escopo }: { papel: string; escopo: string }) {
  const router = useRouter();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [referencia, setReferencia] = useState(new Date().toISOString().slice(0, 10));
  const [analisando, setAnalisando] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [previa, setPrevia] = useState<any>(null);
  const [aplicarSaidas, setAplicarSaidas] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  async function analisar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null); setPrevia(null); setResultado(null);
    if (!arquivo) { setErro("Selecione o arquivo exportado do CREA."); return; }
    setAnalisando(true);
    const fd = new FormData();
    fd.append("arquivo", arquivo);
    fd.append("referencia", referencia);
    const r = await fetch("/api/importacao/processar", { method: "POST", body: fd });
    const j = await r.json();
    setAnalisando(false);
    if (!r.ok) { setErro(j.erro ?? "Falha ao analisar o arquivo."); return; }
    setPrevia(j);
  }

  async function aplicar() {
    setErro(null); setAplicando(true);
    const r = await fetch("/api/importacao/aplicar", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ importacaoId: previa.importacaoId, aplicarSaidas }),
    });
    const j = await r.json();
    setAplicando(false);
    if (!r.ok) { setErro(j.erro ?? "Falha ao aplicar."); return; }
    setResultado(j); setPrevia(null);
    router.refresh();
  }

  if (resultado) {
    return (
      <Aviso tipo="ok" titulo="Importação aplicada">
        <ul className="mt-1 space-y-1">
          <li>{resultado.confirmados} associado(s) confirmado(s) como optantes</li>
          <li>{resultado.criados} novo(s) cadastro(s) criado(s)</li>
          <li>{resultado.inativados} inativado(s)</li>
        </ul>
        <button className="btn-secundario mt-4" onClick={() => setResultado(null)}>
          Nova importação
        </button>
      </Aviso>
    );
  }

  return (
    <div className="space-y-5">
      {!previa && (
        <form onSubmit={analisar} className="cartao space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="rotulo">Arquivo exportado do CREA-SC</label>
              <input type="file" accept=".xlsx,.xls,.csv" className="campo"
                     onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
            </div>
            <div>
              <label className="rotulo">Data da extração no CREA</label>
              <input type="date" required className="campo" value={referencia}
                     onChange={(e) => setReferencia(e.target.value)} />
              <p className="mt-1 text-xs text-slate-500">
                É essa data que carimba a relação de aptos a votar.
              </p>
            </div>
          </div>
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          <button className="btn-primario" disabled={analisando}>
            {analisando ? "Analisando…" : "Analisar arquivo"}
          </button>
          <p className="text-xs text-slate-500">
            Nada é gravado nesta etapa. Você vê o resultado antes de confirmar.
          </p>
        </form>
      )}

      {previa && (
        <div className="cartao p-6">
          <h2 className="font-medium text-slate-900">Prévia — nada foi aplicado ainda</h2>

          <div className="mt-3 rounded-lg bg-slate-50 p-4 text-sm">
            <p><strong>Escopo:</strong> categoria &ldquo;{previa.escopo}&rdquo;</p>
            <p className="mt-1 text-slate-600">
              Fora do escopo e <strong>não afetados</strong>: {previa.foraEscopo} associado(s)
              de outras categorias (CAU e estudantes).
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {[
              ["permanecem", previa.resumo.permanece, "bg-emerald-50 text-emerald-900"],
              ["novos", previa.resumo.novo, "bg-sky-50 text-sky-900"],
              ["saíram", previa.resumo.saiu, "bg-amber-50 text-amber-900"],
              ["não identificados", previa.resumo.naoIdentificado, "bg-slate-100 text-slate-700"],
            ].map(([r, v, cor]) => (
              <div key={String(r)} className={`rounded-lg p-4 ${cor}`}>
                <p className="text-2xl font-semibold">{v as number}</p>
                <p className="text-xs uppercase tracking-wide">{r as string}</p>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs text-slate-500">
            {previa.resumo.lidas} linhas lidas · {previa.resumo.ignoradasPorSituacao} ignoradas
            por situação (desligados e recusados)
          </p>

          {previa.resumo.saiu > 0 && (
            <div className="mt-5">
              <Aviso tipo="alerta" titulo={`${previa.resumo.saiu} associado(s) sairiam da lista`}>
                <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
                  {previa.saiu.map((s: any) => (
                    <li key={s.id}>{s.nome} — {s.registro}</li>
                  ))}
                </ul>
                <label className="mt-3 flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-1" checked={aplicarSaidas}
                         disabled={papel !== "presidencia"}
                         onChange={(e) => setAplicarSaidas(e.target.checked)} />
                  <span>
                    Inativar estes associados
                    {papel !== "presidencia" && (
                      <strong className="block text-amber-800">
                        Somente a presidência pode aplicar inativações. Você pode aplicar o
                        restante normalmente.
                      </strong>
                    )}
                  </span>
                </label>
              </Aviso>
            </div>
          )}

          {erro && <div className="mt-4"><Aviso tipo="erro">{erro}</Aviso></div>}

          <div className="mt-5 flex gap-3">
            <button className="btn-primario" onClick={aplicar} disabled={aplicando}>
              {aplicando ? "Aplicando…" : "Confirmar e aplicar"}
            </button>
            <button className="btn-secundario" onClick={() => setPrevia(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
