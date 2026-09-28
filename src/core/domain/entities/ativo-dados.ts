import { CategoriaAtivoDados } from '../enums/categoria-ativo-dados';
import { FormatoArquivo } from '../enums/formato-arquivo';
import { StatusAtivoDados } from '../enums/status-ativo-dados';

/**
 * AtivoDados (V1 — v1-domain-model.md Seção 3.6 e FSD CF-06 / RF-013 a RF-017)
 * Registro canônico e catalogação de arquivos ou bases locais recebidos para a execução da demanda.
 * Opera sob o princípio Local-First: dados brutos reais residem no disco do analista;
 * a aplicação armazena exclusivamente metadados estruturais, volumetria e hash de integridade.
 */
export interface AtivoDados {
  id: string;
  demanda_id: string;
  nome_arquivo: string;
  caminho_local: string;
  formato: FormatoArquivo;
  origem: string | null;
  descricao_conteudo: string | null;
  granularidade: string | null;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  versao: string | null;
  substitui_ativo_id?: string | null;
  tamanho_bytes: number;
  total_linhas: number;
  total_colunas: number;
  hash_sha256: string;
  status: StatusAtivoDados;
  categoria_ativo?: CategoriaAtivoDados;
  schema_inferido: string | null;
  data_recebimento: string;
  criado_em: string;
  atualizado_em: string;
}
