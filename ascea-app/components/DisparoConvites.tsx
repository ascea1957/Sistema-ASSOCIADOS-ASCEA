"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Aviso } from "@/components/Aviso";

export function DisparoConvites({ pendentes }: { pendentes: number }) {
  const router = useRouter();
  const [limite, setLimite] = useState(20);
  const [enviando, setEnviando] = useState(false);
  const [res, setRes] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function disparar() {
    if (!confirm(`Enviar convite para até ${limite} associado(s)? Esta ação envia e-mails de verdade.`)) return;
    setErro(null); setEnviando(true);
    const r = await fetch("/api/convites/disparar", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limite }),
    });
    const j = await r.json();
    setEnviando(false);
    if (!r.ok) { setErro(j.erro ?? "Falha no disparo."); return; }
    setRes(j); router.refresh();
  }

  return (
    <div className="cartao p-6">
      <h2 className="font-medium text-slate-900">Convites de acesso</h2>
      <p className="mt-1 text-sm text-slate-600">
        {pendentes} associado(s) com e-mail cadastrado ainda não criaram acesso.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="rotulo">Quantidade neste envio</label>
          <input type="number" min={1} max={80} className="campo w-32" value={limite}
                 onChange={(e) => setLimite(Number(e.target.value))} />
        </div>
        <button className="btn-primario" onClick={disparar} disabled={enviando || !pendentes}>
          {enviando ? "Enviando…" : "Enviar convites"}
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        O plano de envio permite 100 e-mails por dia. Comece com 20 a 30 para validar o
        fluxo antes de abrir para toda a base — se houver problema, ele aparece no piloto e
        não em centenas de caixas de entrada.
      </p>

      {erro && <div className="mt-4"><Aviso tipo="erro">{erro}</Aviso></div>}
      {res && (
        <div className="mt-4">
          <Aviso tipo={res.falhas ? "alerta" : "ok"} titulo="Disparo concluído">
            <p>{res.enviados} enviado(s) · {res.falhas} falha(s)</p>
            {res.erros?.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {res.erros.map((e: any, i: number) => (
                  <li key={i}>{e.nome}: {e.erro}</li>
                ))}
              </ul>
            )}
          </Aviso>
        </div>
      )}
    </div>
  );
}
