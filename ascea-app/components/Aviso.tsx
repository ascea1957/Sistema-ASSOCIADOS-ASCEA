const ESTILOS = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  alerta: "border-amber-200 bg-amber-50 text-amber-900",
  erro: "border-red-200 bg-red-50 text-red-900",
  ok: "border-emerald-200 bg-emerald-50 text-emerald-900",
} as const;

export function Aviso({
  tipo = "info", titulo, children,
}: {
  tipo?: keyof typeof ESTILOS;
  titulo?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`aviso ${ESTILOS[tipo]}`}>
      {titulo && <p className="mb-1 font-semibold">{titulo}</p>}
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}
