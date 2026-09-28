import { AtivoDados } from '../entities/ativo-dados';
import { LinhagemAtivos } from '../entities/linhagem-ativos';
import { PapelEntradaLinhagem } from '../enums/papel-entrada-linhagem';

export interface OrigemComPapel {
  ativo: AtivoDados;
  papel: PapelEntradaLinhagem;
  etapa_transformacao_id: string | null;
}

/**
 * Contrato de repositório para o Grafo Direcionado Acíclico (DAG) de Linhagem de Ativos (Subunidade 3.5A)
 */
export interface ILinhagemAtivosRepository {
  registrarVinculo(vinculo: LinhagemAtivos): Promise<LinhagemAtivos>;
  obterOrigens(ativoDestinoId: string): Promise<OrigemComPapel[]>;
  obterDestinos(ativoOrigemId: string): Promise<AtivoDados[]>;
  obterArestasPorDemanda(demandaId: string): Promise<LinhagemAtivos[]>;
  obterArestasPorEtapa(etapaId: string): Promise<LinhagemAtivos[]>;
  // Remoção física permitida APENAS se o ativo destino for rascunho sem autorização nem diagnósticos
  deleteDraftEdgeOnly(id: string): Promise<boolean>;
}
