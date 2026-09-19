import { criarClienteServidor } from "@/lib/supabase/server";
import { GestorParceiros } from "./GestorParceiros";

export const dynamic = "force-dynamic";

export default async function PaginaBeneficiosAdmin() {
  const supabase = criarClienteServidor();
  const { data } = await supabase.from("parceiros").select("*").order("categoria").order("nome");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Convênios e parceiros</h1>
        <p className="mt-1 text-sm text-slate-500">
          Só aparecem para o associado os convênios ativos e dentro da vigência.
        </p>
      </div>
      <GestorParceiros iniciais={data ?? []} />
    </div>
  );
}
