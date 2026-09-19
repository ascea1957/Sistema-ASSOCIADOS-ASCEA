"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { Aviso } from "@/components/Aviso";

function FormularioLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [recuperar, setRecuperar] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null); setCarregando(true);
    const supabase = criarClienteNavegador();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setCarregando(false);
    if (error) {
      setErro("E-mail ou senha incorretos. Se você ainda não criou sua senha, use o link do convite que recebeu por e-mail.");
      return;
    }
    router.push(params.get("retorno") || "/");
    router.refresh();
  }

  async function recuperarSenha(e: React.FormEvent) {
    e.preventDefault();
    setErro(null); setCarregando(true);
    const supabase = criarClienteNavegador();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/nova-senha`,
    });
    setCarregando(false);
    if (error) { setErro("Não foi possível enviar o e-mail. Confira o endereço digitado."); return; }
    setEnviado(true);
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="cartao p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-slate-900">
          {recuperar ? "Recuperar senha" : "Entrar"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {recuperar
            ? "Informe seu e-mail cadastrado e enviaremos um link para criar uma nova senha."
            : "Acesse sua carteirinha digital e os convênios da ASCEA."}
        </p>

        {enviado ? (
          <div className="mt-6">
            <Aviso tipo="ok" titulo="E-mail enviado">
              Se houver cadastro com esse endereço, o link chegará em alguns minutos.
              Confira também a caixa de spam.
            </Aviso>
            <button className="btn-secundario mt-4 w-full" onClick={() => { setRecuperar(false); setEnviado(false); }}>
              Voltar ao login
            </button>
          </div>
        ) : (
          <form onSubmit={recuperar ? recuperarSenha : entrar} className="mt-6 space-y-4">
            <div>
              <label className="rotulo" htmlFor="email">E-mail</label>
              <input id="email" type="email" required className="campo" value={email}
                     onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>

            {!recuperar && (
              <div>
                <label className="rotulo" htmlFor="senha">Senha</label>
                <input id="senha" type="password" required className="campo" value={senha}
                       onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" />
              </div>
            )}

            {erro && <Aviso tipo="erro">{erro}</Aviso>}

            <button type="submit" className="btn-primario w-full" disabled={carregando}>
              {carregando ? "Aguarde…" : recuperar ? "Enviar link" : "Entrar"}
            </button>

            <button type="button" className="w-full text-sm text-ascea-600 hover:underline"
                    onClick={() => { setRecuperar(!recuperar); setErro(null); }}>
              {recuperar ? "Voltar ao login" : "Esqueci minha senha"}
            </button>
          </form>
        )}
      </div>

      <div className="cartao mt-4 p-5 text-center">
        <p className="text-sm text-slate-600">Ainda não é associado da ASCEA?</p>
        <Link href="/associar" className="btn-secundario mt-3 w-full">Quero me associar</Link>
      </div>
    </div>
  );
}

export default function PaginaLogin() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md cartao p-8 text-center text-slate-500">Carregando…</div>}>
      <FormularioLogin />
    </Suspense>
  );
}
