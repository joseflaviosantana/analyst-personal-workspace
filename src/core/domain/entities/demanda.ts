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
  estado: EstadoDemanda;
  criado_em: string;
  atualizado_em: string;
  data_conclusao: string | null;
}

export interface DemandaComProjeto extends Demanda {
  projetoNome: string;
}
