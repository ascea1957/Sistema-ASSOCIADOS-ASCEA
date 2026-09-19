"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { Aviso } from "@/components/Aviso";

export default function PaginaNovaSenha() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha.length < 8) { setErro("A senha precisa ter ao menos 8 caracteres."); return; }
    if (senha !== confirmar) { setErro("As duas senhas não são iguais."); return; }
    setSalvando(true);
    const { error } = await criarClienteNavegador().auth.updateUser({ password: senha });
    setSalvando(false);
    if (error) { setErro("O link expirou. Peça um novo em 'Esqueci minha senha'."); return; }
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={salvar} className="cartao space-y-4 p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-slate-900">Definir nova senha</h1>
        <div>
          <label className="rotulo">Nova senha</label>
          <input type="password" required className="campo" value={senha}
                 onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />
        </div>
        <div>
          <label className="rotulo">Repita a senha</label>
          <input type="password" required className="campo" value={confirmar}
                 onChange={(e) => setConfirmar(e.target.value)} autoComplete="new-password" />
        </div>
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        <button className="btn-primario w-full" disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar"}
        </button>
      </form>
    </div>
  );
}
