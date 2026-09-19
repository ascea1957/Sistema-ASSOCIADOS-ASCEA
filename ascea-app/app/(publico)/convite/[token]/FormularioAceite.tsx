"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Aviso } from "@/components/Aviso";
import { mascararCpf } from "@/lib/formato";

export function FormularioAceite({ token, associado }: { token: string; associado: any }) {
  const router = useRouter();
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [d, setD] = useState({
    email: associado?.email ?? "",
    telefone: associado?.telefone ?? "",
    cpf: associado?.cpf ?? "",
    senha: "", confirmar: "", lgpd: false,
  });

  const faltaCpf = !associado?.cpf;
  const faltaEmail = !associado?.email;

  async function concluir(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (d.senha.length < 8) { setErro("A senha precisa ter ao menos 8 caracteres."); return; }
    if (d.senha !== d.confirmar) { setErro("As duas senhas não são iguais."); return; }
    if (!d.lgpd) { setErro("É necessário concordar com o tratamento dos dados."); return; }
    setEnviando(true);
    const r = await fetch("/api/convite/aceitar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...d }),
    });
    const j = await r.json();
    setEnviando(false);
    if (!r.ok) { setErro(j.erro ?? "Não foi possível concluir. Tente novamente."); return; }
    router.push("/login?criada=1");
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="cartao p-6 sm:p-8">
        <p className="text-sm text-ascea-600">Etapa {etapa} de 2</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">
          {etapa === 1 ? `Olá, ${String(associado?.nome ?? "").split(" ")[0]}` : "Crie sua senha"}
        </h1>

        {etapa === 1 ? (
          <>
            <p className="mt-2 text-sm text-slate-600">
              Confira seus dados antes de continuar. Se algo estiver errado, corrija aqui.
            </p>

            <dl className="mt-5 divide-y divide-slate-100 rounded-lg border border-slate-200">
              <div className="flex justify-between px-4 py-3 text-sm">
                <dt className="text-slate-500">Nome</dt>
                <dd className="font-medium text-slate-900">{associado?.nome}</dd>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm">
                <dt className="text-slate-500">Categoria</dt>
                <dd className="text-slate-800">{associado?.categorias_associado?.nome}</dd>
              </div>
              {associado?.registro_profissional && (
                <div className="flex justify-between px-4 py-3 text-sm">
                  <dt className="text-slate-500">Registro {associado?.conselho}</dt>
                  <dd className="text-slate-800">{associado.registro_profissional}</dd>
                </div>
              )}
              {!faltaCpf && (
                <div className="flex justify-between px-4 py-3 text-sm">
                  <dt className="text-slate-500">CPF</dt>
                  <dd className="text-slate-800">{mascararCpf(associado.cpf)}</dd>
                </div>
              )}
            </dl>

            <div className="mt-5 space-y-4">
              {faltaCpf && (
                <div>
                  <label className="rotulo">CPF</label>
                  <input className="campo" value={d.cpf} placeholder="000.000.000-00" inputMode="numeric"
                         onChange={(e) => setD({ ...d, cpf: e.target.value })} />
                  <p className="mt-1 text-xs text-slate-500">
                    Não temos seu CPF no cadastro. Se preferir, deixe em branco.
                  </p>
                </div>
              )}
              <div>
                <label className="rotulo">E-mail {faltaEmail && "*"}</label>
                <input type="email" required className="campo" value={d.email}
                       onChange={(e) => setD({ ...d, email: e.target.value })} />
              </div>
              <div>
                <label className="rotulo">Telefone</label>
                <input className="campo" value={d.telefone}
                       onChange={(e) => setD({ ...d, telefone: e.target.value })} />
              </div>
            </div>

            <button className="btn-primario mt-6 w-full"
                    onClick={() => { if (!d.email) { setErro("Informe um e-mail."); return; } setErro(null); setEtapa(2); }}>
              Continuar
            </button>
            {erro && <div className="mt-3"><Aviso tipo="erro">{erro}</Aviso></div>}
          </>
        ) : (
          <form onSubmit={concluir} className="mt-5 space-y-4">
            <div>
              <label className="rotulo">Senha</label>
              <input type="password" required className="campo" value={d.senha} autoComplete="new-password"
                     onChange={(e) => setD({ ...d, senha: e.target.value })} />
              <p className="mt-1 text-xs text-slate-500">Mínimo de 8 caracteres.</p>
            </div>
            <div>
              <label className="rotulo">Repita a senha</label>
              <input type="password" required className="campo" value={d.confirmar} autoComplete="new-password"
                     onChange={(e) => setD({ ...d, confirmar: e.target.value })} />
            </div>

            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input type="checkbox" className="mt-1" checked={d.lgpd}
                     onChange={(e) => setD({ ...d, lgpd: e.target.checked })} />
              <span>
                Autorizo o tratamento dos meus dados conforme a{" "}
                <a href="/privacidade" target="_blank" className="text-ascea-600 underline">
                  política de privacidade
                </a>.
              </span>
            </label>

            {erro && <Aviso tipo="erro">{erro}</Aviso>}

            <div className="flex gap-3">
              <button type="button" className="btn-secundario flex-1" onClick={() => setEtapa(1)}>
                Voltar
              </button>
              <button type="submit" className="btn-primario flex-1" disabled={enviando}>
                {enviando ? "Criando…" : "Criar acesso"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
