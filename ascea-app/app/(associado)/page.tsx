import Link from "next/link";
import { criarClienteServidor } from "@/lib/supabase/server";
import { EtiquetaStatus } from "@/components/Etiqueta";
import { Aviso } from "@/components/Aviso";
import { dataBR, mascararCpf } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function PaginaPerfil() {
  const supabase = criarClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: a } = await supabase
    .from("associados")
    .select("*, categorias_associado(nome, e_estudante, vota_assembleia, vota_conselheiro_crea)")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (!a) {
    return (
      <Aviso tipo="alerta" titulo="Cadastro não encontrado">
        Sua conta ainda não está vinculada a um cadastro de associado. Fale com a
        secretaria da ASCEA.
      </Aviso>
    );
  }

  const cat: any = a.categorias_associado;

  return (
    <div className="space-y-6">
      <div className="cartao p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{a.nome}</h1>
            <p className="mt-1 text-sm text-slate-500">{cat?.nome}</p>
          </div>
          <EtiquetaStatus status={a.status} />
        </div>
      </div>

      {a.status === "aguardando_opcao" && (
        <Aviso tipo="alerta" titulo="Falta indicar a ASCEA no seu cadastro do CREA">
          <p>
            Seu acesso está limitado porque o CREA-SC ainda não informa a ASCEA como sua
            entidade de classe. Entre no portal do CREA-SC, localize a área de cadastro e
            selecione a ASCEA.
          </p>
          <p className="mt-2">
            A confirmação é automática na próxima conferência mensal feita pela secretaria.
          </p>
        </Aviso>
      )}

      <div className="cartao divide-y divide-slate-100">
        <div className="px-6 py-4">
          <h2 className="font-medium text-slate-900">Dados cadastrais</h2>
        </div>
        <dl className="divide-y divide-slate-100">
          {[
            ["E-mail", a.email ?? "—"],
            ["Telefone", a.telefone ?? "—"],
            ["CPF", mascararCpf(a.cpf)],
            [a.conselho === "NENHUM" ? "Registro" : `Registro ${a.conselho}`, a.registro_profissional ?? "—"],
            ["Associado desde", dataBR(a.data_associacao)],
            ...(cat?.e_estudante
              ? [["Instituição", a.instituicao_ensino ?? "—"], ["Curso", a.curso ?? "—"],
                 ["Previsão de conclusão", dataBR(a.previsao_conclusao)]]
              : []),
          ].map(([r, v]) => (
            <div key={String(r)} className="flex flex-wrap justify-between gap-2 px-6 py-3 text-sm">
              <dt className="text-slate-500">{r}</dt>
              <dd className="font-medium text-slate-900">{v as string}</dd>
            </div>
          ))}
        </dl>
        <div className="px-6 py-4">
          <p className="text-xs text-slate-500">
            Para corrigir nome, CPF, categoria ou registro profissional, fale com a
            secretaria — esses campos são conferidos junto ao conselho.
          </p>
        </div>
      </div>

      {cat?.e_estudante && (
        <div className="cartao p-6">
          <h2 className="font-medium text-slate-900">Já se formou?</h2>
          <p className="mt-1 text-sm text-slate-600">
            Ao obter seu registro profissional, informe o número para migrar de categoria
            sem perder sua data de associação.
          </p>
          <Link href="/migrar-registro" className="btn-secundario mt-4">
            Informar meu registro
          </Link>
        </div>
      )}

      <div className="cartao p-6">
        <h2 className="font-medium text-slate-900">Seus direitos de voto</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span>{cat?.vota_assembleia ? "✅" : "—"}</span>
            <span className={cat?.vota_assembleia ? "text-slate-800" : "text-slate-400"}>
              Assembleias e eleição da diretoria
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span>{cat?.vota_conselheiro_crea ? "✅" : "—"}</span>
            <span className={cat?.vota_conselheiro_crea ? "text-slate-800" : "text-slate-400"}>
              Eleição do conselheiro do CREA-SC
            </span>
          </li>
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Conforme a categoria e o Estatuto Social vigente. O voto exige situação regular.
        </p>
      </div>
    </div>
  );
}
