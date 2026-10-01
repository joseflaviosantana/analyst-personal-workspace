import { EstadoDemanda } from '../enums/estado-demanda';

export interface Demanda {
  id: string;
  projeto_id: string;
  titulo: string;
  solicitacao_bruta: string;
  contexto: string | null;
  objetivo_inicial: string | null;
  prazo_esperado: string | null;
  restricoes_declaradas: string | null;
  periodo_analise?: string | null;
  granularidade?: string | null;
  formato_entrega?: string | null;
  requisitos_homologados_em?: string | null;
  requisitos_homologados_por?: string | null;
  requisitos_justificativa_homologacao?: string | null;
  requisitos_ressalvas?: string | null;
  estado: EstadoDemanda;
  estado_anterior?: EstadoDemanda | string | null;
  criado_em: string;
  atualizado_em: string;
  data_conclusao: string | null;
}

export interface DemandaComProjeto extends Demanda {
  projetoNome: string;
}
