/** Utilitários de normalização — as mesmas regras usadas na auditoria da base. */

export function somenteDigitos(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "");
}

/**
 * Converte qualquer grafia de registro para o formato canônico NNNNNN-D.
 * A planilha interna guardava "162882", "1293727", "PR1628636", "130300-0".
 * Todos correspondem a 7 dígitos, sendo o último o verificador.
 */
export function registroCanonico(v: string | null | undefined): string | null {
  let d = somenteDigitos(v);
  if (!d) return null;
  if (d.length > 7) d = d.slice(-7);
  d = d.padStart(7, "0");
  return `${d.slice(0, 6)}-${d.slice(6)}`;
}

export function cpfValido(v: string | null | undefined): boolean {
  const d = somenteDigitos(v);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  for (const i of [9, 10]) {
    let soma = 0;
    for (let j = 0; j < i; j++) soma += Number(d[j]) * (i + 1 - j);
    let dig = (soma % 11) < 2 ? 0 : 11 - (soma % 11);
    if (Number(d[i]) !== dig) return false;
  }
  return true;
}

export function mascararCpf(v: string | null | undefined): string {
  const d = somenteDigitos(v);
  if (d.length !== 11) return "—";
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
}

export function emailValido(v: string | null | undefined): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((v ?? "").trim());
}

export function dataBR(v: string | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v.length <= 10 ? `${v}T12:00:00` : v);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
}
