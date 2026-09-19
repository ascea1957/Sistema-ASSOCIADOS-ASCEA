import { ROTULO_STATUS, type StatusAssociado } from "@/lib/tipos";

const CORES: Record<StatusAssociado, string> = {
  ativo: "bg-emerald-100 text-emerald-800",
  aguardando_opcao: "bg-amber-100 text-amber-800",
  pendente_aprovacao: "bg-sky-100 text-sky-800",
  recusado: "bg-slate-200 text-slate-700",
  inativo: "bg-slate-200 text-slate-700",
  desligado: "bg-red-100 text-red-800",
};

export function EtiquetaStatus({ status }: { status: StatusAssociado }) {
  return <span className={`etiqueta ${CORES[status]}`}>{ROTULO_STATUS[status]}</span>;
}
