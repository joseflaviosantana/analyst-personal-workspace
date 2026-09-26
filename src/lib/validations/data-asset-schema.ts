import { z } from 'zod';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';

/**
 * Utilitário para limpar e normalizar caminho local absoluto
 * Remove aspas iniciais/finais (comuns em cópias do Windows Explorer via Shift + Botão Direito)
 */
export function normalizarCaminhoLocal(caminho: string): string {
  if (!caminho) return '';
  let limpo = caminho.trim();
  if ((limpo.startsWith('"') && limpo.endsWith('"')) || (limpo.startsWith("'") && limpo.endsWith("'"))) {
    limpo = limpo.slice(1, -1).trim();
  }
  return limpo;
}

/**
 * Schema para inspeção de arquivo local
 */
export const inspectLocalFileInputSchema = z.object({
  caminho_local: z
    .string()
    .min(1, 'O caminho do arquivo local é obrigatório')
    .transform((val) => normalizarCaminhoLocal(val)),
  aba_alvo_xlsx: z.string().optional().nullable(),
});

export type InspectLocalFileInput = z.infer<typeof inspectLocalFileInputSchema>;

/**
 * Schema para cadastro canônico de Ativo de Dados (Unidade 3.3A)
 * Regra: 'origem' é obrigatório com mínimo de 3 caracteres.
 */
export const registerDataAssetSchema = z.object({
  demanda_id: z.string().min(1, 'ID da demanda é obrigatório'),
  caminho_local: z
    .string()
    .min(1, 'Caminho local é obrigatório')
    .transform((val) => normalizarCaminhoLocal(val)),
  nome_arquivo: z.string().min(1, 'Nome do arquivo é obrigatório'),
  formato: z.nativeEnum(FormatoArquivo),
  tamanho_bytes: z.number().int().nonnegative(),
  total_linhas: z.number().int().nonnegative(),
  total_colunas: z.number().int().nonnegative(),
  hash_sha256: z.string().length(64, 'Hash SHA-256 deve conter exatamente 64 caracteres hexadecimais'),
  schema_inferido: z.string().nullable().optional(),
  origem: z
    .string()
    .trim()
    .min(3, 'A origem informada deve conter no mínimo 3 caracteres'),
  descricao_conteudo: z.string().nullable().optional(),
  granularidade: z.string().nullable().optional(),
  periodo_inicio: z.string().nullable().optional(),
  periodo_fim: z.string().nullable().optional(),
  data_recebimento: z.string().min(1, 'A data de recebimento é obrigatória'),
  versao: z.string().nullable().optional().default('1.0'),
});

export type RegisterDataAssetInput = z.infer<typeof registerDataAssetSchema>;

/**
 * Função pura para sugerir a próxima versão no fluxo de substituição
 * Se o padrão for numérico simples X.Y (ex: "1.0"), sugere "X.(Y+1)" (ex: "1.1").
 * Para versões fora desse padrão (ex: "2024-Rev2", "v2-final"), retorna null exigindo preenchimento humano.
 */
export function sugerirProximaVersao(versaoAnterior: string | null | undefined): string | null {
  if (!versaoAnterior) return null;
  const trimmed = versaoAnterior.trim();
  const match = trimmed.match(/^(\d+)\.(\d+)$/);
  if (match) {
    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);
    return `${major}.${minor + 1}`;
  }
  return null;
}

/**
 * Schema para substituição atômica de Ativo de Dados (Unidade 3.3B)
 * Exige justificativa formal humana com no mínimo 10 caracteres e nova versão obrigatória.
 */
export const replaceDataAssetSchema = z.object({
  demanda_id: z.string().min(1, 'ID da demanda é obrigatório'),
  ativo_antigo_id: z.string().min(1, 'ID do ativo a ser substituído é obrigatório'),
  caminho_local: z
    .string()
    .min(1, 'Caminho local é obrigatório')
    .transform((val) => normalizarCaminhoLocal(val)),
  nome_arquivo: z.string().min(1, 'Nome do arquivo é obrigatório'),
  formato: z.nativeEnum(FormatoArquivo),
  tamanho_bytes: z.number().int().nonnegative(),
  total_linhas: z.number().int().nonnegative(),
  total_colunas: z.number().int().nonnegative(),
  hash_sha256: z.string().length(64, 'Hash SHA-256 deve conter exatamente 64 caracteres hexadecimais'),
  schema_inferido: z.string().nullable().optional(),
  origem: z
    .string()
    .trim()
    .min(3, 'A origem informada deve conter no mínimo 3 caracteres'),
  descricao_conteudo: z.string().nullable().optional(),
  granularidade: z.string().nullable().optional(),
  periodo_inicio: z.string().nullable().optional(),
  periodo_fim: z.string().nullable().optional(),
  data_recebimento: z.string().min(1, 'A data de recebimento é obrigatória'),
  versao: z
    .string()
    .trim()
    .min(1, 'A versão do novo ativo é obrigatória'),
  justificativa: z
    .string()
    .trim()
    .min(10, 'A justificativa da substituição deve conter no mínimo 10 caracteres'),
});

export type ReplaceDataAssetInput = z.infer<typeof replaceDataAssetSchema>;
