-- =====================================================================
-- ASCEA — App do Associado
-- 05_buckets.sql · criação das pastas de arquivos (Storage)
--
-- Equivale a criar os três buckets pela tela Storage → New bucket.
-- Rodar no SQL Editor do Supabase. Pode ser executado mais de uma vez
-- sem efeito colateral.
-- =====================================================================

insert into storage.buckets (id, name, public)
values
  -- Arquivos exportados do CREA. Contêm nome e registro de centenas de
  -- profissionais: privado, sem exceção.
  ('importacoes', 'importacoes', false),

  -- Fotos dos associados usadas na carteirinha: privado.
  ('fotos', 'fotos', false),

  -- Marcas dos parceiros conveniados: público, pois aparecem na lista
  -- de convênios e não contêm dado pessoal.
  ('logos', 'logos', true)
on conflict (id) do nothing;


-- Conferência
select id, name,
       case when public then 'PÚBLICO' else 'privado' end as acesso,
       case
         when id = 'logos' and public then '✅ OK'
         when id in ('importacoes','fotos') and not public then '✅ OK'
         else '❌ CONFERIR — acesso incorreto'
       end as situacao
from storage.buckets
where id in ('importacoes','fotos','logos')
order by id;
