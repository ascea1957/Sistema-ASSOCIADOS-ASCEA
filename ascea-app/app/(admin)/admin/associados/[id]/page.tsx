import Link from "next/link";
import { criarClienteServidor } from "@/lib/supabase/server";
import { FichaAssociado } from "./FichaAssociado";

export const dynamic = "force-dynamic";

export default async function PaginaFicha({ params }: { params: { id: string } }) {
  const supabase = criarClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: a } = await supabase
    .from("associados").select("*, categorias_associado(id, nome)").eq("id", params.id).maybeSingle();
  const { data: cats } = await supabase
    .from("categorias_associado").select("id, nome").eq("ativa", true).order("ordem");
  const { data: admin } = await supabase
    .from("usuarios_admin").select("papel").eq("user_id", user!.id).maybeSingle();
  const { data: convites } = await supabase
    .from("convites").select("enviado_em, aceito_em, ultimo_erro")
    .eq("associado_id", params.id).order("created_at", { ascending: false }).limit(5);

  if (!a) {
    return (
      <div className="cartao p-8 text-center">
        <p className="text-slate-600">Associado não encontrado.</p>
        <Link href="/admin/associados" className="btn-secundario mt-4">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/associados" className="text-sm text-ascea-600 hover:underline">
        ← Voltar à lista
      </Link>
      <FichaAssociado
        associado={a}
        categorias={cats ?? []}
        papel={admin?.papel ?? "secretaria"}
        convites={convites ?? []}
      />
    </div>
  );
}
