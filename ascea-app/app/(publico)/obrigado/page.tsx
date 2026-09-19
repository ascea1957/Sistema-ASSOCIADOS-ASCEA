import Link from "next/link";
import { Aviso } from "@/components/Aviso";

export default function PaginaObrigado({
  searchParams,
}: { searchParams: { categoria?: string } }) {
  const ehEngenheiro = searchParams.categoria === "crea";
  return (
    <div className="mx-auto max-w-lg">
      <div className="cartao p-6 sm:p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
          ✓
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">Pedido enviado</h1>
        <p className="mt-2 text-slate-600">
          Sua solicitação de associação foi registrada. A secretaria vai conferir seus
          dados e você receberá um e-mail com o resultado.
        </p>
      </div>

      {ehEngenheiro && (
        <div className="mt-4">
          <Aviso tipo="alerta" titulo="Falta um passo importante">
            <p>
              Para ser reconhecido como associado da ASCEA, você precisa <strong>indicar a
              ASCEA como sua entidade de classe no seu cadastro do CREA-SC</strong>.
            </p>
            <p className="mt-2">
              Sem essa opção, o sistema do conselho não informa seu vínculo à associação, e
              seu acesso fica limitado.
            </p>
            <p className="mt-2">
              Acesse o portal do CREA-SC com seu login, procure a área de cadastro e
              selecione a ASCEA como entidade de classe. Em caso de dúvida, fale com a
              secretaria.
            </p>
          </Aviso>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link href="/login" className="text-sm text-ascea-600 hover:underline">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
