export const metadata = { title: "Privacidade — ASCEA" };

export default function PaginaPrivacidade() {
  return (
    <div className="cartao mx-auto max-w-2xl p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-slate-900">Tratamento de dados pessoais</h1>
      <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-slate-700">
        <p>
          A Associação Sul Catarinense de Engenheiros e Arquitetos (ASCEA) trata os dados
          pessoais de seus associados conforme a Lei 13.709/2018 (LGPD).
        </p>

        <h2 className="pt-2 font-semibold text-slate-900">Quais dados tratamos</h2>
        <p>
          Nome, CPF, número de registro profissional (CREA ou CAU), e-mail, telefone,
          cidade, data de nascimento, título profissional e, para estudantes, instituição
          de ensino e curso.
        </p>

        <h2 className="pt-2 font-semibold text-slate-900">Para que usamos</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Identificar o associado e emitir a carteirinha digital</li>
          <li>Conceder acesso aos convênios firmados pela associação</li>
          <li>Comunicar eventos, reuniões e convocações de assembleia</li>
          <li>Apurar a relação de associados aptos a votar, conforme o Estatuto Social</li>
        </ul>

        <h2 className="pt-2 font-semibold text-slate-900">Com quem compartilhamos</h2>
        <p>
          Com ninguém, salvo obrigação legal. Parceiros conveniados verificam apenas a
          validade da carteirinha, que exibe nome, categoria e situação — nunca CPF,
          e-mail ou telefone.
        </p>

        <h2 className="pt-2 font-semibold text-slate-900">Seus direitos</h2>
        <p>
          Você pode solicitar a qualquer momento acesso, correção ou exclusão dos seus
          dados, bem como revogar o consentimento, escrevendo para{" "}
          <a className="text-ascea-600 underline" href="mailto:ascea1957@gmail.com">
            ascea1957@gmail.com
          </a>
          . A exclusão implica o encerramento do vínculo associativo no sistema.
        </p>

        <h2 className="pt-2 font-semibold text-slate-900">Segurança</h2>
        <p>
          O acesso aos dados é restrito à secretaria e à presidência, com registro de
          autoria e data de toda alteração.
        </p>
      </div>
    </div>
  );
}
