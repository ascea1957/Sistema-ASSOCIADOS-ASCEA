import QRCode from "qrcode";
import { criarClienteServidor } from "@/lib/supabase/server";
import { Aviso } from "@/components/Aviso";
import { dataBR } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function PaginaCarteirinha() {
  const supabase = criarClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: a } = await supabase
    .from("associados")
    .select("nome, status, conselho, registro_profissional, data_associacao, categorias_associado(nome)")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (!a) return <Aviso tipo="alerta">Cadastro não encontrado.</Aviso>;

  if (a.status !== "ativo") {
    return (
      <Aviso tipo="alerta" titulo="Carteirinha indisponível">
        A carteirinha digital é emitida apenas para associados em situação regular.
        {a.status === "aguardando_opcao" &&
          " Indique a ASCEA como entidade de classe no seu cadastro do CREA-SC para regularizar."}
      </Aviso>
    );
  }

  // Token rotativo de 24h, emitido pela função do banco.
  const { data: token, error } = await supabase.rpc("obter_token_carteirinha");
  if (error || !token) {
    return <Aviso tipo="erro">Não foi possível emitir a carteirinha agora. Tente novamente.</Aviso>;
  }

  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/v/${token}`;
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 400, errorCorrectionLevel: "M" });
  const cat: any = a.categorias_associado;

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <div className="cartao overflow-hidden">
        <div className="bg-ascea-700 px-6 py-5 text-white">
          <p className="text-xs uppercase tracking-widest text-ascea-200">
            Associação Sul Catarinense
          </p>
          <p className="text-sm font-semibold">de Engenheiros e Arquitetos</p>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Associado</p>
            <p className="text-lg font-semibold leading-tight text-slate-900">{a.nome}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Categoria</p>
              <p className="text-sm font-medium text-slate-800">{cat?.nome}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {a.conselho === "NENHUM" ? "Registro" : a.conselho}
              </p>
              <p className="text-sm font-medium text-slate-800">
                {a.registro_profissional ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Situação</p>
              <p className="text-sm font-medium text-emerald-700">Regular</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Desde</p>
              <p className="text-sm font-medium text-slate-800">{dataBR(a.data_associacao)}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR code de verificação" className="mx-auto h-44 w-44" />
            <p className="mt-2 text-xs text-slate-500">
              Aponte a câmera para verificar a autenticidade
            </p>
          </div>
        </div>
      </div>

      <Aviso tipo="info">
        O código é renovado a cada 24 horas. Se alguém fotografar esta tela, o código
        deixa de valer no dia seguinte.
      </Aviso>
    </div>
  );
}
