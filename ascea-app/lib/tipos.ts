export type StatusAssociado =
  | "pendente_aprovacao" | "recusado" | "ativo"
  | "aguardando_opcao" | "inativo" | "desligado";

export type PapelAdmin = "secretaria" | "presidencia";
export type Conselho = "CREA" | "CAU" | "NENHUM";
export type Criterio = "opcao_crea" | "adesao_direta" | "matricula";

export interface Categoria {
  id: string;
  nome: string;
  descricao: string | null;
  criterio: Criterio;
  conselho_exigido: Conselho;
  vota_assembleia: boolean;
  vota_conselheiro_crea: boolean;
  exige_registro_profissional: boolean;
  e_estudante: boolean;
  ordem: number;
  ativa: boolean;
}

export interface Associado {
  id: string;
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  foto_url: string | null;
  conselho: Conselho;
  registro_profissional: string | null;
  categoria_id: string;
  status: StatusAssociado;
  origem_status: string;
  opcao_confirmada_em: string | null;
  data_associacao: string;
  instituicao_ensino: string | null;
  curso: string | null;
  previsao_conclusao: string | null;
  user_id: string | null;
  observacoes: string | null;
  categorias_associado?: Categoria;
}

export interface Parceiro {
  id: string;
  nome: string;
  categoria: string;
  descricao_beneficio: string;
  como_usar: string | null;
  contato: string | null;
  endereco: string | null;
  site: string | null;
  logo_url: string | null;
  vigencia_inicio: string;
  vigencia_fim: string;
  ativo: boolean;
}

export const ROTULO_STATUS: Record<StatusAssociado, string> = {
  pendente_aprovacao: "Aguardando aprovação",
  recusado: "Pedido recusado",
  ativo: "Situação regular",
  aguardando_opcao: "Aguardando opção no CREA",
  inativo: "Inativo",
  desligado: "Desligado",
};
