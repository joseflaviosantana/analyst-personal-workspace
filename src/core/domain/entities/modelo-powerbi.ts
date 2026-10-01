import { TipoFormatoModeloPowerBi } from '../enums/tipo-formato-modelo-powerbi';
import { StatusModeloPowerBi } from '../enums/status-modelo-powerbi';
import { MedidaDax } from './medida-dax';
import { PaginaRelatorioComVisuais } from './pagina-relatorio';

/**
 * ModeloPowerBi (V1 — Subunidade 3.7 / Bloco 7)
 * Agregado que representa um modelo Power BI (.pbix, .pbip) ou declaração formal de isenção de BI.
 */
export interface ModeloPowerBi {
  id: string;
  demanda_id: string;
  modelo_analitico_id: string | null;
  nome_arquivo: string;
  caminho_local: string | null;
  tipo_formato: TipoFormatoModeloPowerBi;
  status: StatusModeloPowerBi;
  justificativa_isencao: string | null;
  hash_sha256: string | null;
  versao_powerbi: string | null;
  tamanho_bytes: number;
  criado_em: string;
  atualizado_em: string;
}

export interface ModeloPowerBiCompleto extends ModeloPowerBi {
  medidas: MedidaDax[];
  paginas: PaginaRelatorioComVisuais[];
}
