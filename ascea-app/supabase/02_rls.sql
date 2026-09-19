-- =====================================================================
-- ASCEA — App do Associado
-- 02_rls.sql · políticas de segurança em nível de linha
-- PostgreSQL / Supabase · Etapa 2 · 17/09/2026
--
-- Aplicar DEPOIS de 01_schema.sql
--
-- Princípios:
--   · O associado enxerga apenas o próprio cadastro.
--   · Benefícios só para associado ativo e autenticado.
--   · Secretaria toca a rotina; presidência aprova o que retira direitos.
--   · Ninguém apaga associado — desligamento é mudança de status.
--   · audit_log é somente leitura para humanos; só os gatilhos escrevem.
-- =====================================================================

alter table public.usuarios_admin       enable row level security;
alter table public.categorias_associado enable row level security;
alter table public.associados           enable row level security;
alter table public.convites             enable row level security;
alter table public.importacoes_crea     enable row level security;
alter table public.conciliacoes         enable row level security;
alter table public.parceiros            enable row level security;
alter table public.carteirinha_tokens   enable row level security;
alter table public.audit_log            enable row level security;


-- =====================================================================
-- usuarios_admin
-- =====================================================================

create policy admin_le_operadores on public.usuarios_admin
  for select to authenticated
  using (public.e_admin());

create policy presidencia_gerencia_operadores on public.usuarios_admin
  for all to authenticated
  using (public.e_presidencia())
  with check (public.e_presidencia());


-- =====================================================================
-- categorias_associado
-- =====================================================================
-- Leitura liberada a qualquer autenticado: a carteirinha e o perfil
-- exibem o nome da categoria.

create policy todos_leem_categorias on public.categorias_associado
  for select to authenticated
  using (true);

-- Alterar categoria mexe em direito de voto. Privativo da presidência.
create policy presidencia_gerencia_categorias on public.categorias_associado
  for all to authenticated
  using (public.e_presidencia())
  with check (public.e_presidencia());


-- =====================================================================
-- associados
-- =====================================================================

create policy associado_le_o_proprio on public.associados
  for select to authenticated
  using (user_id = auth.uid());

-- O associado edita contato e foto. Categoria, status e registro
-- profissional são protegidos pelo gatilho fn_bloqueia_autoedicao abaixo.
create policy associado_edita_o_proprio on public.associados
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy admin_le_associados on public.associados
  for select to authenticated
  using (public.e_admin());

create policy admin_insere_associados on public.associados
  for insert to authenticated
  with check (public.e_admin());

-- A restrição de status (inativar/desligar) é aplicada pelo gatilho
-- tg_associados_valida_status, não pela política: RLS não distingue coluna.
create policy admin_edita_associados on public.associados
  for update to authenticated
  using (public.e_admin())
  with check (public.e_admin());

-- Nenhuma política de DELETE. Associado não é apagado: recebe status
-- 'desligado', preservando histórico e auditoria.


create or replace function public.fn_bloqueia_autoedicao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admins passam direto; as demais regras valem para o próprio associado.
  if public.e_admin() then
    return new;
  end if;

  if new.categoria_id          is distinct from old.categoria_id
     or new.status             is distinct from old.status
     or new.origem_status      is distinct from old.origem_status
     or new.opcao_confirmada_em is distinct from old.opcao_confirmada_em
     or new.cpf                is distinct from old.cpf
     or new.conselho           is distinct from old.conselho
     or new.registro_profissional is distinct from old.registro_profissional
     or new.data_associacao    is distinct from old.data_associacao
  then
    raise exception
      'Estes dados são alterados pela secretaria. Solicite a correção pelo painel.'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

create trigger tg_associados_bloqueia_autoedicao
  before update on public.associados
  for each row execute function public.fn_bloqueia_autoedicao();


-- =====================================================================
-- convites
-- =====================================================================
-- O fluxo de aceite roda em rota de servidor com a service_role key, que
-- ignora RLS. Aqui só o painel é contemplado.

create policy admin_gerencia_convites on public.convites
  for all to authenticated
  using (public.e_admin())
  with check (public.e_admin());


-- =====================================================================
-- importacoes_crea e conciliacoes
-- =====================================================================
-- Ambas as operadoras têm login no sistema do CREA, então ambas importam.
-- A diferença está em aplicar o resultado 'saiu' — barrado pelo gatilho
-- tg_conciliacoes_valida.

create policy admin_le_importacoes on public.importacoes_crea
  for select to authenticated
  using (public.e_admin());

create policy admin_cria_importacoes on public.importacoes_crea
  for insert to authenticated
  with check (public.e_admin());

create policy admin_edita_importacoes on public.importacoes_crea
  for update to authenticated
  using (public.e_admin())
  with check (public.e_admin());

create policy admin_le_conciliacoes on public.conciliacoes
  for select to authenticated
  using (public.e_admin());

create policy admin_cria_conciliacoes on public.conciliacoes
  for insert to authenticated
  with check (public.e_admin());

create policy admin_edita_conciliacoes on public.conciliacoes
  for update to authenticated
  using (public.e_admin())
  with check (public.e_admin());

-- Importação não se apaga: é registro de origem de decisões sobre quem
-- vota. Nenhuma política de DELETE.


-- =====================================================================
-- parceiros (benefícios)
-- =====================================================================
-- Convênio vigente é visível apenas ao associado ATIVO e autenticado.
-- Quem está inativo, desligado ou apenas visitando não vê a tabela.

create policy associado_ativo_le_beneficios on public.parceiros
  for select to authenticated
  using (
    ativo = true
    and vigencia_fim >= current_date
    and exists (
      select 1 from public.associados a
       where a.user_id = auth.uid()
         and a.status = 'ativo'
    )
  );

create policy admin_le_todos_beneficios on public.parceiros
  for select to authenticated
  using (public.e_admin());

create policy admin_gerencia_beneficios on public.parceiros
  for all to authenticated
  using (public.e_admin())
  with check (public.e_admin());


-- =====================================================================
-- carteirinha_tokens
-- =====================================================================
-- Sem acesso direto. Emissão por obter_token_carteirinha(), verificação
-- por verificar_carteirinha(). Nenhuma política: a tabela fica fechada
-- e só as funções SECURITY DEFINER a alcançam.


-- =====================================================================
-- audit_log
-- =====================================================================
-- Leitura para os dois papéis (a tela de relatórios mostra o histórico).
-- Escrita apenas por fn_audit(), que é SECURITY DEFINER.

create policy admin_le_auditoria on public.audit_log
  for select to authenticated
  using (public.e_admin());


-- =====================================================================
-- PERMISSÕES DE EXECUÇÃO
-- =====================================================================

revoke all on function public.obter_token_carteirinha()      from public, anon;
grant  execute on function public.obter_token_carteirinha()   to authenticated;

-- A verificação da carteirinha é pública por definição: o parceiro que
-- lê o QR não tem conta no sistema.
grant  execute on function public.verificar_carteirinha(text) to anon, authenticated;

revoke all on function public.papel_atual()    from public, anon;
revoke all on function public.e_admin()        from public, anon;
revoke all on function public.e_presidencia()  from public, anon;
grant  execute on function public.papel_atual()   to authenticated;
grant  execute on function public.e_admin()       to authenticated;
grant  execute on function public.e_presidencia() to authenticated;


-- =====================================================================
-- VIEWS DE APTOS
-- =====================================================================
-- Views não herdam RLS das tabelas de base quando criadas por superusuário.
-- security_invoker garante que as políticas de associados sejam aplicadas
-- na identidade de quem consulta.

alter view public.vw_aptos_assembleia        set (security_invoker = true);
alter view public.vw_aptos_conselheiro_crea  set (security_invoker = true);


-- =====================================================================
-- FIM — 02_rls.sql
-- =====================================================================
