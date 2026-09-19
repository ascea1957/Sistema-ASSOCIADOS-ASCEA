# ASCEA — Área do Associado

Sistema de cadastro, carteirinha digital e convênios da Associação Sul Catarinense
de Engenheiros e Arquitetos.

- **Aplicação:** Next.js 14 (App Router) + TypeScript + Tailwind
- **Banco e autenticação:** Supabase (PostgreSQL com RLS)
- **E-mail:** Resend
- **Hospedagem:** Vercel

O site institucional (`asceaoficial.com.br`, WordPress) permanece separado e
inalterado. Este projeto é a área logada, servida em
`associado.asceaoficial.com.br`.

---

## Instalação

### 1. Banco de dados

No SQL Editor do Supabase, aplicar na ordem:

```
supabase/01_schema.sql     estrutura, gatilhos e funções
supabase/02_rls.sql        políticas de segurança por linha
supabase/03_seed.sql       as quatro categorias de associado
supabase/05_buckets.sql    pastas de arquivos
supabase/04_conferencia.sql   verificação (não altera nada)
```

### 2. Variáveis de ambiente

Copiar `.env.example` para `.env.local` e preencher. Na Vercel, as mesmas
variáveis vão em Project Settings → Environment Variables.

`SUPABASE_SERVICE_ROLE_KEY` dá acesso irrestrito ao banco. Ela só existe no
servidor, nunca em componente de navegador.

### 3. Rodar localmente

```bash
npm install
npm run dev
```

### 4. Primeiro operador

Criar o usuário no Auth do Supabase e depois vinculá-lo:

```sql
insert into public.usuarios_admin (user_id, nome, papel)
select id, 'Nome da Pessoa', 'presidencia'
  from auth.users where email = 'endereco@exemplo.com';
```

---

## Regras de negócio que o código implementa

**Quatro categorias, quatro critérios distintos de "associado ativo".** Só o
Profissional CREA vem de lista externa (a opção pela ASCEA no cadastro do
conselho). Os demais entram por adesão direta ou matrícula.

**Direito de voto tem dois escopos.** O profissional CAU vota em assembleia e na
eleição da diretoria, mas não no colégio que elege o conselheiro do CREA-SC.
Por isso `vota_assembleia` e `vota_conselheiro_crea` são campos separados, em
tabela — a presidência ajusta após a AGE sem migração de banco.

**A conciliação mensal só afeta a categoria de optantes.** Um índice único
parcial no banco garante que apenas uma categoria tenha critério `opcao_crea`,
tornando impossível um desligamento em massa das outras categorias.

**Nada é inativado automaticamente.** A importação gera uma prévia; a aplicação
é um segundo passo. Inativar é privativo da presidência, regra aplicada por
gatilho — vale inclusive para acesso direto ao banco.

**Toda importação guarda o arquivo original e seu hash.** As views
`vw_aptos_assembleia` e `vw_aptos_conselheiro_crea` carregam a data de extração
e o hash, de modo que qualquer relação de aptos emitida seja reproduzível até a
fonte no conselho.

**O recém-formado e o engenheiro que se cadastra sozinho entram como
`aguardando_opcao`.** Nenhum dos dois é optante automaticamente: precisam
indicar a ASCEA no cadastro do CREA. Sem esse estado, sairiam na conciliação
seguinte, recém-associados.

**CPF não é chave de identidade.** A auditoria da base encontrou 49 CPFs
atribuídos a mais de uma pessoa (erro de arrasto em planilha) e 87 com dígito
verificador inválido. A chave é o registro profissional; o CPF é opcional e
único apenas quando preenchido.

**E-mail não é único.** Há compartilhamento legítimo entre parentes no mesmo
escritório.

---

## Estrutura

```
app/(publico)/     login · adesão · convite · verificação do QR · privacidade
app/(associado)/   perfil · carteirinha · convênios · migração de registro
app/(admin)/       associados · solicitações · convênios · importação · relatórios
app/api/           rotas de servidor (usam service_role; nunca vão ao navegador)
lib/               clientes Supabase, formatação, conciliação, e-mail
supabase/          scripts SQL
```

---

## Documentação do projeto

As decisões de arquitetura, a auditoria da base e o guia de instalação passo a
passo estão nos documentos do projeto ASCEA, fora deste repositório.
