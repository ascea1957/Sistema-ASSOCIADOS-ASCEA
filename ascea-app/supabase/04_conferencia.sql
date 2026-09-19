-- =====================================================================
-- ASCEA — App do Associado
-- 04_conferencia.sql · verificação da instalação  (versão 2)
--
-- Correção da v1: a contagem de gatilhos agora se restringe ao schema
-- 'public'. A versão anterior somava também os gatilhos internos do
-- Supabase (auth, storage), o que produzia um falso alerta.
--
-- Rode DEPOIS dos três arquivos anteriores. Não altera nada.
-- =====================================================================

with
alvo as (
  select unnest(array['usuarios_admin','categorias_associado','associados','convites',
                      'importacoes_crea','conciliacoes','parceiros','carteirinha_tokens',
                      'audit_log']) as t
),
tabelas as (select count(*) n from pg_tables where schemaname='public' and tablename in (select t from alvo)),
tipos as (
  select count(*) n from pg_type ty join pg_namespace ns on ns.oid=ty.typnamespace
   where ns.nspname='public'
     and ty.typname in ('conselho_tipo','criterio_ativacao','origem_status','papel_admin',
                        'resultado_conciliacao','status_associado','origem_cadastro')
),
politicas as (select count(*) n from pg_policies where schemaname='public'),
rls as (select count(*) n from pg_tables where schemaname='public' and rowsecurity and tablename in (select t from alvo)),
funcoes as (
  select count(*) n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public'
     and p.proname in ('papel_atual','e_admin','e_presidencia','obter_token_carteirinha',
                       'verificar_carteirinha','fn_audit','fn_valida_alteracao_status',
                       'fn_valida_aplicacao_conciliacao','fn_bloqueia_autoedicao','fn_set_updated_at')
),
gatilhos as (
  select count(*) n from pg_trigger tg
    join pg_class c  on c.oid = tg.tgrelid
    join pg_namespace ns on ns.oid = c.relnamespace
   where not tg.tgisinternal and ns.nspname='public' and c.relname in (select t from alvo)
),
visoes as (select count(*) n from pg_views where schemaname='public' and viewname in ('vw_aptos_assembleia','vw_aptos_conselheiro_crea')),
cats as (select count(*) n from public.categorias_associado),
votos as (
  select count(*) n from public.categorias_associado
   where (nome='Profissional CREA' and vota_assembleia and vota_conselheiro_crea)
      or (nome='Profissional CAU'  and vota_assembleia and not vota_conselheiro_crea)
      or (e_estudante and not vota_assembleia and not vota_conselheiro_crea)
),
buckets as (select count(*) n from storage.buckets where id in ('importacoes','fotos','logos'))
select item, encontrado, esperado,
       case when encontrado = esperado then '✅ OK' else '❌ CONFERIR' end as situacao
from (
  select  1 ord, 'Tabelas criadas'              item, (select n from tabelas)   encontrado, 9 esperado
  union all select  2, 'Tipos (enums) criados',       (select n from tipos),     7
  union all select  3, 'Tabelas com RLS ligada',      (select n from rls),       9
  union all select  4, 'Políticas de segurança',      (select n from politicas),20
  union all select  5, 'Funções do sistema',          (select n from funcoes),  10
  union all select  6, 'Gatilhos nas nossas tabelas', (select n from gatilhos), 11
  union all select  7, 'Relatórios de aptos (views)', (select n from visoes),    2
  union all select  8, 'Categorias de associado',     (select n from cats),      4
  union all select  9, 'Regras de voto corretas',     (select n from votos),     4
  union all select 10, 'Pastas de arquivos (buckets)',(select n from buckets),   3
) t order by ord;
