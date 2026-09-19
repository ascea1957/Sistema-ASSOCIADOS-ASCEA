-- =====================================================================
-- ASCEA — App do Associado
-- 01_schema.sql · estrutura de dados
-- PostgreSQL / Supabase · Etapa 2 · 17/09/2026
--
-- Ordem de aplicação:  01_schema.sql → 02_rls.sql → 03_seed.sql
-- Aplicar no SQL Editor do Supabase, um arquivo por vez.
-- =====================================================================

create extension if not exists pgcrypto;

-- =====================================================================
-- 1. TIPOS
-- =====================================================================

create type conselho_tipo          as enum ('CREA', 'CAU', 'NENHUM');
create type criterio_ativacao      as enum ('opcao_crea', 'adesao_direta', 'matricula');
create type origem_status          as enum ('opcao_crea', 'adesao_direta', 'matricula', 'manual');
create type papel_admin            as enum ('secretaria', 'presidencia');
create type resultado_conciliacao  as enum ('permanece', 'novo', 'saiu', 'nao_identificado');

-- 'aguardando_opcao': recém-formado que migrou de estudante para profissional
--   CREA mas ainda não apareceu na lista de optantes. Ver §6.1 da Etapa 1.
-- 'pendente_aprovacao': pedido de adesão feito pelo formulário público, ainda
--   não conferido. Caminho de entrada dos profissionais CAU e dos estudantes,
--   que não vêm de lista do CREA.
-- 'recusado': pedido de adesão negado na conferência. NÃO é desligamento —
--   por isso secretaria e presidência podem recusar, enquanto inativar ou
--   desligar um associado existente continua privativo da presidência.
create type status_associado       as enum
  ('pendente_aprovacao', 'recusado', 'ativo', 'aguardando_opcao', 'inativo', 'desligado');

-- Como o cadastro entrou no sistema. Distingue quem veio da importação inicial
-- de quem chegou por campanha — sem isso não há como medir resultado.
create type origem_cadastro        as enum
  ('importacao_inicial', 'conciliacao_crea', 'adesao_publica', 'cadastro_manual');


-- =====================================================================
-- 2. UTILITÁRIOS
-- =====================================================================

create or replace function public.fn_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- =====================================================================
-- 3. OPERADORES DO PAINEL
-- =====================================================================

create table public.usuarios_admin (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  nome        text        not null,
  papel       papel_admin not null,
  ativo       boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger tg_usuarios_admin_updated
  before update on public.usuarios_admin
  for each row execute function public.fn_set_updated_at();

comment on table public.usuarios_admin is
  'Operadores do painel. Papéis: secretaria (rotina) e presidencia (atos que retiram direitos).';


-- Funções de apoio às políticas de RLS.
-- SECURITY DEFINER + search_path fixo: evitam recursão de política e
-- sequestro de search_path.

create or replace function public.papel_atual()
returns papel_admin
language sql
stable
security definer
set search_path = public
as $$
  select papel from public.usuarios_admin
   where user_id = auth.uid() and ativo
   limit 1;
$$;

create or replace function public.e_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.usuarios_admin
     where user_id = auth.uid() and ativo
  );
$$;

create or replace function public.e_presidencia()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.usuarios_admin
     where user_id = auth.uid() and ativo and papel = 'presidencia'
  );
$$;


-- =====================================================================
-- 4. CATEGORIAS DE ASSOCIADO
-- =====================================================================
-- Tabela, e não ENUM: as categorias virão do estatuto reformado.
-- A presidência ajusta pelo painel no dia seguinte à AGE, sem migração.
--
-- O direito de voto tem DOIS escopos independentes: o profissional CAU
-- vota em assembleia e na eleição da diretoria, mas não no colégio que
-- elege o conselheiro do CREA-SC.

create table public.categorias_associado (
  id                           uuid primary key default gen_random_uuid(),
  nome                         text not null unique,
  descricao                    text,
  criterio                     criterio_ativacao not null,
  conselho_exigido             conselho_tipo not null default 'NENHUM',
  vota_assembleia              boolean not null default false,
  vota_conselheiro_crea        boolean not null default false,
  exige_registro_profissional  boolean not null default false,
  e_estudante                  boolean not null default false,
  ordem                        smallint not null default 0,
  ativa                        boolean not null default true,
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now()
);

create trigger tg_categorias_updated
  before update on public.categorias_associado
  for each row execute function public.fn_set_updated_at();

-- Só a categoria com critério 'opcao_crea' entra no escopo da conciliação
-- mensal. Ver 05_conciliacao e §5.2 da Etapa 1.
create unique index ux_categoria_opcao_crea
  on public.categorias_associado (criterio)
  where criterio = 'opcao_crea';


-- =====================================================================
-- 5. ASSOCIADOS
-- =====================================================================

create table public.associados (
  id                     uuid primary key default gen_random_uuid(),

  nome                   text not null,
  cpf                    text,              -- nullable: ver Etapa 0, §CPF
  email                  text,              -- nullable: 61 optantes sem e-mail
  telefone               text,
  foto_url               text,

  conselho               conselho_tipo not null default 'NENHUM',
  registro_profissional  text,

  categoria_id           uuid not null references public.categorias_associado(id),

  status                 status_associado not null default 'ativo',
  origem_status          origem_status    not null default 'manual',
  opcao_confirmada_em    date,              -- data_referencia da última lista do CREA

  data_associacao        date not null default current_date,

  -- Entrada no sistema
  origem_cadastro        origem_cadastro not null default 'cadastro_manual',
  campanha               text,              -- rótulo livre: 'CAU 2026', etc.
  solicitado_em          timestamptz,       -- quando pediu adesão
  aprovado_por           uuid references auth.users(id),
  aprovado_em            timestamptz,

  -- Estudantes
  instituicao_ensino     text,
  curso                  text,
  previsao_conclusao     date,

  -- Vínculo com a conta de acesso (null enquanto não aceitar o convite)
  user_id                uuid unique references auth.users(id) on delete set null,
  consentimento_lgpd_em  timestamptz,

  observacoes            text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  constraint ck_cpf_digitos
    check (cpf is null or cpf ~ '^[0-9]{11}$'),

  constraint ck_email_formato
    check (email is null or email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),

  -- Quem tem conselho precisa ter registro, e vice-versa
  constraint ck_registro_coerente
    check (
      (conselho = 'NENHUM' and registro_profissional is null)
      or (conselho <> 'NENHUM' and registro_profissional is not null)
    )
);

create trigger tg_associados_updated
  before update on public.associados
  for each row execute function public.fn_set_updated_at();

-- CPF: único QUANDO PREENCHIDO, mas não obrigatório. A auditoria da Etapa 0
-- encontrou 49 CPFs atribuídos a mais de um associado (erro de arrasto na
-- planilha) e 87 com dígito verificador inválido; esses ficaram em branco
-- para conferência com o associado. A chave de identidade real é o registro
-- profissional, não o CPF.
create unique index ux_associados_cpf
  on public.associados (cpf)
  where cpf is not null;

-- E-mail NÃO é único: a Etapa 0 encontrou compartilhamento legítimo (parentes
-- no mesmo escritório). Índice apenas para busca.
create index ix_associados_email on public.associados (lower(email));

-- Chave de conciliação com a lista do CREA. Nunca o nome.
create unique index ux_associados_registro
  on public.associados (conselho, registro_profissional)
  where registro_profissional is not null;

create index ix_associados_categoria on public.associados (categoria_id);
create index ix_associados_status    on public.associados (status);


-- Regra de negócio: inativar ou desligar retira direitos (inclusive o de
-- voto) e é privativo da presidência. A secretaria toca todo o resto da
-- rotina. Ver §5.3 da Etapa 1.
create or replace function public.fn_valida_alteracao_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status
     and new.status in ('inativo', 'desligado')
     and public.papel_atual() is distinct from 'presidencia'
  then
    raise exception
      'Somente a presidência pode inativar ou desligar um associado (id %).', old.id
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger tg_associados_valida_status
  before update on public.associados
  for each row execute function public.fn_valida_alteracao_status();


-- =====================================================================
-- 6. CONVITES
-- =====================================================================

create table public.convites (
  id              uuid primary key default gen_random_uuid(),
  associado_id    uuid not null references public.associados(id) on delete cascade,
  token           text not null unique default encode(gen_random_bytes(24), 'hex'),
  enviado_em      timestamptz,
  expira_em       timestamptz not null default now() + interval '30 days',
  aceito_em       timestamptz,
  tentativas      smallint not null default 0,
  ultimo_erro     text,                   -- registro de bounce por associado
  provider_msg_id text,                   -- id da mensagem no Resend
  created_at      timestamptz not null default now()
);

create index ix_convites_associado on public.convites (associado_id);
create index ix_convites_pendentes on public.convites (aceito_em) where aceito_em is null;

comment on column public.convites.ultimo_erro is
  'Cobertura nominal de e-mail é 100%; a efetiva só aparece no disparo. Este campo é a medição.';

comment on column public.convites.provider_msg_id is
  'O plano gratuito do Resend retém logs por 30 dias. A prova de envio é da ASCEA, não do fornecedor: este id fica no banco.';


-- =====================================================================
-- 7. CONCILIAÇÃO COM A LISTA DO CREA-SC
-- =====================================================================

create table public.importacoes_crea (
  id               uuid primary key default gen_random_uuid(),
  data_referencia  date not null,          -- data da extração no sistema do CREA
  arquivo_path     text not null,          -- Storage: bucket 'importacoes'
  arquivo_nome     text not null,
  arquivo_hash     text not null,          -- sha256 do arquivo original
  qtd_registros    integer not null,
  importado_por    uuid not null references auth.users(id),
  confirmado_por   uuid references auth.users(id),
  confirmado_em    timestamptz,
  observacoes      text,
  created_at       timestamptz not null default now()
);

create index ix_importacoes_referencia on public.importacoes_crea (data_referencia desc);

comment on table public.importacoes_crea is
  'Guarda o arquivo original exportado do CREA e seu hash. Toda relação de aptos emitida pelo app é reproduzível a partir da fonte.';


create table public.conciliacoes (
  id               uuid primary key default gen_random_uuid(),
  importacao_id    uuid not null references public.importacoes_crea(id) on delete cascade,
  associado_id     uuid references public.associados(id) on delete set null,

  -- Dados como vieram do arquivo do CREA, preservados mesmo sem match
  registro_lido    text,
  nome_lido        text,
  cpf_lido         text,

  resultado        resultado_conciliacao not null,
  aplicado         boolean not null default false,
  decidido_por     uuid references auth.users(id),
  decidido_em      timestamptz,
  created_at       timestamptz not null default now()
);

create index ix_conciliacoes_importacao on public.conciliacoes (importacao_id);
create index ix_conciliacoes_pendentes  on public.conciliacoes (aplicado) where aplicado = false;


-- Resultado 'saiu' = proposta de inativação. Aplicar é ato da presidência.
create or replace function public.fn_valida_aplicacao_conciliacao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.aplicado and not coalesce(old.aplicado, false)
     and new.resultado = 'saiu'
     and public.papel_atual() is distinct from 'presidencia'
  then
    raise exception
      'A inativação proposta pela conciliação exige aprovação da presidência.'
      using errcode = 'insufficient_privilege';
  end if;

  if new.aplicado and not coalesce(old.aplicado, false) then
    new.decidido_por := auth.uid();
    new.decidido_em  := now();
  end if;

  return new;
end;
$$;

create trigger tg_conciliacoes_valida
  before update on public.conciliacoes
  for each row execute function public.fn_valida_aplicacao_conciliacao();


-- =====================================================================
-- 8. BENEFÍCIOS E CONVÊNIOS
-- =====================================================================

create table public.parceiros (
  id                   uuid primary key default gen_random_uuid(),
  nome                 text not null,
  categoria            text not null,          -- saúde, educação, lazer, ...
  descricao_beneficio  text not null,
  como_usar            text,
  contato              text,
  endereco             text,
  site                 text,
  logo_url             text,
  vigencia_inicio      date not null default current_date,
  vigencia_fim         date not null,          -- obrigatória: evita convênio vencido no ar
  ativo                boolean not null default true,
  ordem                smallint not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint ck_vigencia check (vigencia_fim >= vigencia_inicio)
);

create trigger tg_parceiros_updated
  before update on public.parceiros
  for each row execute function public.fn_set_updated_at();

create index ix_parceiros_vigentes
  on public.parceiros (vigencia_fim)
  where ativo = true;


-- =====================================================================
-- 9. CARTEIRINHA DIGITAL
-- =====================================================================

create table public.carteirinha_tokens (
  id             uuid primary key default gen_random_uuid(),
  associado_id   uuid not null references public.associados(id) on delete cascade,
  token_publico  text not null unique,
  gerado_em      timestamptz not null default now()
);

create index ix_carteirinha_associado on public.carteirinha_tokens (associado_id, gerado_em desc);


-- Emissão: o associado logado obtém (ou renova) seu token. Rotação de 24h
-- impede que a foto de um QR antigo seja reusada por quem foi desligado.
create or replace function public.obter_token_carteirinha()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_associado uuid;
  v_token     text;
begin
  select id into v_associado
    from public.associados
   where user_id = auth.uid();

  if v_associado is null then
    raise exception 'Usuário não vinculado a um associado.'
      using errcode = 'insufficient_privilege';
  end if;

  select token_publico into v_token
    from public.carteirinha_tokens
   where associado_id = v_associado
     and gerado_em > now() - interval '24 hours'
   order by gerado_em desc
   limit 1;

  if v_token is null then
    v_token := encode(gen_random_bytes(24), 'hex');
    insert into public.carteirinha_tokens (associado_id, token_publico)
    values (v_associado, v_token);
  end if;

  return v_token;
end;
$$;


-- Verificação pública (/v/{token}): devolve o mínimo necessário.
-- Sem CPF, sem e-mail, sem telefone.
create or replace function public.verificar_carteirinha(p_token text)
returns table (
  nome           text,
  categoria      text,
  situacao       text,
  verificado_em  timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.nome,
    c.nome,
    case when a.status = 'ativo'
         then 'situação regular'
         else 'sem registro ativo' end,
    now()
  from public.carteirinha_tokens t
  join public.associados a           on a.id = t.associado_id
  join public.categorias_associado c on c.id = a.categoria_id
  where t.token_publico = p_token
    and t.gerado_em > now() - interval '24 hours';
$$;


-- =====================================================================
-- 10. AUDITORIA
-- =====================================================================

create table public.audit_log (
  id           bigserial primary key,
  ator         uuid references auth.users(id),
  papel        papel_admin,
  acao         text not null,          -- INSERT | UPDATE | DELETE
  tabela       text not null,
  registro_id  uuid,
  antes        jsonb,
  depois       jsonb,
  em           timestamptz not null default now()
);

create index ix_audit_tabela   on public.audit_log (tabela, em desc);
create index ix_audit_registro on public.audit_log (registro_id, em desc);
create index ix_audit_ator     on public.audit_log (ator, em desc);


create or replace function public.fn_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_antes  jsonb;
  v_depois jsonb;
begin
  if tg_op = 'INSERT' then
    v_antes := null;            v_depois := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    v_antes := to_jsonb(old);   v_depois := to_jsonb(new);
  else
    v_antes := to_jsonb(old);   v_depois := null;
  end if;

  insert into public.audit_log (ator, papel, acao, tabela, registro_id, antes, depois)
  values (
    auth.uid(),
    public.papel_atual(),
    tg_op,
    tg_table_name,
    coalesce(v_depois ->> 'id', v_antes ->> 'id')::uuid,
    v_antes,
    v_depois
  );

  return coalesce(new, old);
end;
$$;

create trigger tg_audit_associados
  after insert or update or delete on public.associados
  for each row execute function public.fn_audit();

create trigger tg_audit_parceiros
  after insert or update or delete on public.parceiros
  for each row execute function public.fn_audit();

create trigger tg_audit_categorias
  after insert or update or delete on public.categorias_associado
  for each row execute function public.fn_audit();

create trigger tg_audit_usuarios_admin
  after insert or update or delete on public.usuarios_admin
  for each row execute function public.fn_audit();


-- =====================================================================
-- 11. RELATÓRIO DE APTOS A VOTAR
-- =====================================================================
-- Sai carimbado com a data de referência da última lista do CREA e o hash
-- do arquivo de origem. É isso que sustenta o quórum numa AGE contestada.

create or replace view public.vw_aptos_assembleia as
select
  a.id,
  a.nome,
  a.conselho,
  a.registro_profissional,
  c.nome as categoria,
  a.opcao_confirmada_em,
  i.data_referencia  as base_crea_referencia,
  i.arquivo_hash     as base_crea_hash
from public.associados a
join public.categorias_associado c on c.id = a.categoria_id
left join lateral (
  select data_referencia, arquivo_hash
    from public.importacoes_crea
   where confirmado_em is not null
   order by data_referencia desc
   limit 1
) i on true
where a.status = 'ativo'
  and c.vota_assembleia = true;


create or replace view public.vw_aptos_conselheiro_crea as
select
  a.id,
  a.nome,
  a.registro_profissional,
  c.nome as categoria,
  a.opcao_confirmada_em,
  i.data_referencia  as base_crea_referencia,
  i.arquivo_hash     as base_crea_hash
from public.associados a
join public.categorias_associado c on c.id = a.categoria_id
left join lateral (
  select data_referencia, arquivo_hash
    from public.importacoes_crea
   where confirmado_em is not null
   order by data_referencia desc
   limit 1
) i on true
where a.status = 'ativo'
  and c.vota_conselheiro_crea = true;


-- =====================================================================
-- FIM — 01_schema.sql
-- =====================================================================
