import { createClient } from "@supabase/supabase-js";

/**
 * Cliente administrativo. IGNORA TODAS AS POLÍTICAS DE RLS.
 *
 * Usar EXCLUSIVAMENTE em rotas de API (pasta app/api). Nunca importar em
 * componente que vá para o navegador — a chave vazaria para o usuário.
 */
export function criarClienteAdmin() {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chave) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
