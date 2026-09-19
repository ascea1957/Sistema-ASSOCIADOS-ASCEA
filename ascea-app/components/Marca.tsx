export function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ascea-600 font-bold text-white">
        A
      </div>
      {!compacta && (
        <div className="leading-tight">
          <p className="font-semibold text-slate-900">ASCEA</p>
          <p className="text-xs text-slate-500">Área do Associado</p>
        </div>
      )}
    </div>
  );
}
