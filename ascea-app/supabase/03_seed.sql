-- =====================================================================
-- ASCEA — App do Associado
-- 03_seed.sql · carga inicial das categorias
-- PostgreSQL / Supabase · Etapa 2 · 17/09/2026
--
-- Aplicar DEPOIS de 01_schema.sql e 02_rls.sql
--
-- ATENÇÃO: estas quatro categorias e seus direitos de voto refletem o que
-- foi definido em 17/09/2026 e ainda dependem de aprovação na AGE da
-- reforma do estatuto (itens E1, E2 e E3 do documento da Etapa 1).
-- Se a AGE decidir diferente, a presidência ajusta pelo painel — os campos
-- são parametrizáveis justamente para não exigir migração de banco.
-- =====================================================================

insert into public.categorias_associado
  (nome, descricao, criterio, conselho_exigido,
   vota_assembleia, vota_conselheiro_crea,
   exige_registro_profissional, e_estudante, ordem)
values

  ('Profissional CREA',
   'Profissional com registro ativo no CREA-SC que indicou a ASCEA como entidade de classe em seu cadastro no conselho.',
   'opcao_crea', 'CREA',
   true,  true,  true,  false, 1),

  ('Profissional CAU',
   'Arquiteto com registro ativo no CAU/SC, associado por adesão direta à ASCEA. Vota em assembleia e na eleição da diretoria; não integra o colégio eleitoral do conselheiro do CREA-SC.',
   'adesao_direta', 'CAU',
   true,  false, true,  false, 2),

  ('Estudante de Engenharia — CREA-Jr',
   'Estudante de curso de engenharia com vínculo CREA-Jr. Migra para Profissional CREA ao obter o registro profissional.',
   'matricula', 'NENHUM',
   false, false, false, true,  3),

  ('Estudante de Arquitetura',
   'Estudante de curso de arquitetura e urbanismo. Migra para Profissional CAU ao obter o registro profissional.',
   'matricula', 'NENHUM',
   false, false, false, true,  4);


-- =====================================================================
-- Primeiro operador do painel
-- =====================================================================
-- Rodar SOMENTE depois de criar o usuário no Auth do Supabase.
-- Substituir o e-mail antes de executar.
--
-- insert into public.usuarios_admin (user_id, nome, papel)
-- select id, 'Franciele Burato', 'presidencia'
--   from auth.users
--  where email = 'presidencia@asceaoficial.com.br';


-- =====================================================================
-- Conferência dos números do quadro social (§3.2 da Etapa 1)
-- =====================================================================
-- Após a carga da Etapa 0, estes três números devem bater com:
--   total 600 · aptos assembleia 500 · colégio conselheiro CREA 400
--
-- select 'total'                 as base, count(*) from associados where status = 'ativo'
-- union all
-- select 'aptos assembleia',      count(*) from vw_aptos_assembleia
-- union all
-- select 'colegio conselheiro',   count(*) from vw_aptos_conselheiro_crea;


-- =====================================================================
-- FIM — 03_seed.sql
-- =====================================================================
