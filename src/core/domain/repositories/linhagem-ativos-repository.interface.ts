import { AtivoDados } from '../entities/ativo-dados';
import { LinhagemAtivos } from '../entities/linhagem-ativos';
import { PapelEntradaLinhagem } from '../enums/papel-entrada-linhagem';
import { TrilhaAuditoria } from '../entities/trilha-auditoria';

export interface OrigemComPapel {
  ativo: AtivoDados;
  papel: PapelEntradaLinhagem;
  etapa_transformacao_id: string | null;
}

export interface RegistrarDerivacaoParams {
  novoAtivo: AtivoDados;
  arestas: LinhagemAtivos[];
  etapaId: string;
  receitaId: string;
  atualizarReceitaParaEmExecucao: boolean;
  eventoAuditoria?: TrilhaAuditoria;
}

/**
 * Contrato de repositório para o Grafo Direcionado Acíclico (DAG) de Linhagem de Ativos (Subunidade 3.5A / 3.5B)
 */
export interface ILinhagemAtivosRepository {
  registrarVinculo(vinculo: LinhagemAtivos): Promise<LinhagemAtivos>;
  obterOrigens(ativoDestinoId: string): Promise<OrigemComPapel[]>;
  obterDestinos(ativoOrigemId: string): Promise<AtivoDados[]>;
  obterArestasPorDemanda(demandaId: string): Promise<LinhagemAtivos[]>;
  obterArestasPorEtapa(etapaId: string): Promise<LinhagemAtivos[]>;
  // Remoção física permitida APENAS se o ativo destino for rascunho sem autorização nem diagnósticos
  deleteDraftEdgeOnly(id: string): Promise<boolean>;
  // Operação atômica coordenada para registro de ativo derivado com linhagem, etapa, receita e auditoria
  registrarDerivacaoTransacional(params: RegistrarDerivacaoParams): Promise<{
    ativo: AtivoDados;
    arestas: LinhagemAtivos[];
  }>;
}
