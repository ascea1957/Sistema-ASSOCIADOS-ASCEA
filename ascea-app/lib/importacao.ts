import * as XLSX from "xlsx";
import { registroCanonico } from "@/lib/formato";

export interface LinhaCrea {
  registro: string | null;
  nome: string;
  optante: boolean;
  situacao: string;
  dataOpcao: string | null;
}

/** Situações que a ASCEA determinou ignorar — não entram no sistema. */
export const SITUACOES_EXCLUIDAS = [
  "desligado pelo crea-sc",
  "desligado pelo(a) - profissional",
  "desligado pela entidade",
  "recusado",
];

const MESES: Record<string, number> = {
  janeiro: 1, fevereiro: 2, "março": 3, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

/** O CREA exporta datas por extenso: "15 de Setembro de 2026". */
export function dataExtenso(v: unknown): string | null {
  const t = String(v ?? "").trim().toLowerCase();
  const m = t.match(/^(\d{1,2})\s+de\s+([a-zçãé]+)\s+de\s+(\d{4})$/i);
  if (!m) return null;
  const mes = MESES[m[2]];
  if (!mes) return null;
  return `${m[3]}-${String(mes).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

export function lerPlanilhaCrea(buffer: ArrayBuffer): LinhaCrea[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const aba = wb.Sheets[wb.SheetNames[0]];
  const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(aba, { defval: "" });

  const achar = (obj: Record<string, unknown>, ...termos: string[]) => {
    const chave = Object.keys(obj).find((k) =>
      termos.some((t) => k.toLowerCase().includes(t))
    );
    return chave ? String(obj[chave] ?? "").trim() : "";
  };

  return linhas
    .map((l) => ({
      registro: registroCanonico(achar(l, "registro")),
      nome: achar(l, "profissional", "nome"),
      optante: achar(l, "optante").toLowerCase().startsWith("s"),
      situacao: achar(l, "situa"),
      dataOpcao: dataExtenso(achar(l, "data da op")),
    }))
    .filter((l) => l.nome || l.registro);
}

export interface Diferenca {
  permanece: { registro: string; nome: string }[];
  novo: { registro: string; nome: string; dataOpcao: string | null }[];
  saiu: { id: string; registro: string; nome: string }[];
  naoIdentificado: { registro: string | null; nome: string; motivo: string }[];
  ignorados: number;
}

export function compararBases(
  daLista: LinhaCrea[],
  naBase: { id: string; registro_profissional: string; nome: string }[]
): Diferenca {
  const validas = daLista.filter(
    (l) => !SITUACOES_EXCLUIDAS.includes(l.situacao.toLowerCase())
  );
  const optantes = validas.filter((l) => l.optante && l.registro);

  const porRegistro = new Map(naBase.map((a) => [a.registro_profissional, a]));
  const daListaSet = new Set(optantes.map((l) => l.registro!));

  const d: Diferenca = {
    permanece: [], novo: [], saiu: [], naoIdentificado: [],
    ignorados: daLista.length - validas.length,
  };

  for (const l of optantes) {
    const existente = porRegistro.get(l.registro!);
    if (existente) d.permanece.push({ registro: l.registro!, nome: existente.nome });
    else d.novo.push({ registro: l.registro!, nome: l.nome, dataOpcao: l.dataOpcao });
  }

  for (const a of naBase) {
    if (!daListaSet.has(a.registro_profissional)) {
      d.saiu.push({ id: a.id, registro: a.registro_profissional, nome: a.nome });
    }
  }

  for (const l of validas) {
    if (l.optante && !l.registro) {
      d.naoIdentificado.push({ registro: null, nome: l.nome, motivo: "registro ilegível na planilha" });
    }
  }

  return d;
}
