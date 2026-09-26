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
