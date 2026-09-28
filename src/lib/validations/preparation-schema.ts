import { z } from 'zod';
import { TipoOperacaoPreparacao } from '@/core/domain/enums/tipo-operacao-preparacao';
import { CapacidadeFerramenta } from '@/core/domain/enums/capacidade-ferramenta';
import { PapelEntradaLinhagem } from '@/core/domain/enums/papel-entrada-linhagem';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';

/**
 * Schema para criação de Receita de Preparação (Subunidade 3.5B)
 */
export const criarReceitaPreparacaoSchema = z.object({
  demanda_id: z.string().min(1, 'ID da demanda é obrigatório.'),
  titulo: z
    .string()
    .trim()
    .min(3, 'O título da receita deve conter no mínimo 3 caracteres.')
    .max(150, 'O título da receita deve conter no máximo 150 caracteres.'),
  descricao: z.string().trim().max(2000, 'A descrição deve conter no máximo 2000 caracteres.').nullable().optional(),
});

export type CriarReceitaPreparacaoInput = z.infer<typeof criarReceitaPreparacaoSchema>;

/**
 * Schema para atualização de metadados da Receita de Preparação
 */
export const atualizarReceitaPreparacaoSchema = z.object({
  id: z.string().min(1, 'ID da receita é obrigatório.'),
  titulo: z
    .string()
    .trim()
    .min(3, 'O título da receita deve conter no mínimo 3 caracteres.')
    .max(150, 'O título da receita deve conter no máximo 150 caracteres.')
    .optional(),
  descricao: z.string().trim().max(2000, 'A descrição deve conter no máximo 2000 caracteres.').nullable().optional(),
});

export type AtualizarReceitaPreparacaoInput = z.infer<typeof atualizarReceitaPreparacaoSchema>;

/**
 * Schema para adição de Etapa de Transformação à receita
 */
export const adicionarEtapaTransformacaoSchema = z.object({
  receita_id: z.string().min(1, 'ID da receita é obrigatório.'),
  tipo_operacao: z.nativeEnum(TipoOperacaoPreparacao, {
    message: 'Tipo de operação de preparação inválido.',
  }),
  capacidade_ferramenta: z.nativeEnum(CapacidadeFerramenta, {
    message: 'Capacidade de ferramenta inválida.',
  }),
  ferramenta_nome: z
    .string()
    .trim()
    .min(1, 'O nome da ferramenta é obrigatório.')
    .max(100, 'O nome da ferramenta deve conter no máximo 100 caracteres.'),
  ferramenta_versao: z.string().trim().max(50).nullable().optional(),
  descricao: z
    .string()
    .trim()
    .min(5, 'A descrição da etapa deve conter no mínimo 5 caracteres.')
    .max(2000, 'A descrição da etapa deve conter no máximo 2000 caracteres.'),
  especificacao_tecnica: z.string().trim().nullable().optional(),
  justificativa: z.string().trim().max(2000).nullable().optional(),
  ordem: z.number().int().positive().optional(),
});

export type AdicionarEtapaTransformacaoInput = z.infer<typeof adicionarEtapaTransformacaoSchema>;

/**
 * Schema para atualização de Etapa de Transformação
 */
export const atualizarEtapaTransformacaoSchema = z.object({
  id: z.string().min(1, 'ID da etapa é obrigatório.'),
  descricao: z
    .string()
    .trim()
    .min(5, 'A descrição da etapa deve conter no mínimo 5 caracteres.')
    .max(2000, 'A descrição da etapa deve conter no máximo 2000 caracteres.')
    .optional(),
  especificacao_tecnica: z.string().trim().nullable().optional(),
  ferramenta_nome: z
    .string()
    .trim()
    .min(1, 'O nome da ferramenta não pode ser vazio.')
    .max(100)
    .optional(),
  ferramenta_versao: z.string().trim().max(50).nullable().optional(),
  capacidade_ferramenta: z.nativeEnum(CapacidadeFerramenta).optional(),
  tipo_operacao: z.nativeEnum(TipoOperacaoPreparacao).optional(),
  justificativa: z.string().trim().max(2000).nullable().optional(),
});

export type AtualizarEtapaTransformacaoInput = z.infer<typeof atualizarEtapaTransformacaoSchema>;

/**
 * Schema para reordenação de etapas
 */
export const reordenarEtapasSchema = z.object({
  receita_id: z.string().min(1, 'ID da receita é obrigatório.'),
  ordens: z
    .array(
      z.object({
        id: z.string().min(1, 'ID da etapa é obrigatório.'),
        ordem: z.number().int().positive('A ordem deve ser um inteiro positivo.'),
      })
    )
    .min(1, 'Ao menos uma etapa deve ser informada para reordenação.'),
});

export type ReordenarEtapasInput = z.infer<typeof reordenarEtapasSchema>;

/**
 * Schema para cancelamento auditado de etapa
 */
export const cancelarEtapaSchema = z.object({
  id: z.string().min(1, 'ID da etapa é obrigatório.'),
  justificativa: z
    .string()
    .trim()
    .min(15, 'A justificativa de cancelamento da etapa deve conter no mínimo 15 caracteres.')
    .max(2000, 'A justificativa deve conter no máximo 2000 caracteres.'),
});

export type CancelarEtapaInput = z.infer<typeof cancelarEtapaSchema>;

/**
 * Schema para associação de Problema de Qualidade à Etapa
 */
export const associarProblemaEtapaSchema = z.object({
  etapa_id: z.string().min(1, 'ID da etapa é obrigatório.'),
  problema_id: z.string().min(1, 'ID do problema de qualidade é obrigatório.'),
});

export type AssociarProblemaEtapaInput = z.infer<typeof associarProblemaEtapaSchema>;

/**
 * Schema para desassociação de Problema de Qualidade da Etapa
 */
export const desassociarProblemaEtapaSchema = z.object({
  etapa_id: z.string().min(1, 'ID da etapa é obrigatório.'),
  problema_id: z.string().min(1, 'ID do problema de qualidade é obrigatório.'),
});

export type DesassociarProblemaEtapaInput = z.infer<typeof desassociarProblemaEtapaSchema>;

/**
 * Fonte de entrada do ativo derivado
 */
export const fonteEntradaSchema = z.object({
  ativo_origem_id: z.string().min(1, 'ID do ativo de origem é obrigatório.'),
  papel: z.nativeEnum(PapelEntradaLinhagem, {
    message: 'Papel da entrada de linhagem inválido.',
  }),
});

export type FonteEntradaInput = z.infer<typeof fonteEntradaSchema>;

/**
 * Schema para registro de Ativo de Dados Derivado (Subunidade 3.5B)
 */
export const registrarAtivoDerivadoSchema = z.object({
  demanda_id: z.string().min(1, 'ID da demanda é obrigatório.'),
  receita_id: z.string().min(1, 'ID da receita é obrigatório.'),
  etapa_id: z.string().min(1, 'ID da etapa de transformação é obrigatório.'),
  fontes_entrada: z
    .array(fonteEntradaSchema)
    .min(1, 'Ao menos uma fonte de entrada deve ser informada para o ativo derivado.'),
  nome_arquivo: z.string().trim().min(1, 'Nome do arquivo é obrigatório.'),
  caminho_local: z.string().trim().min(1, 'Caminho local do arquivo é obrigatório.'),
  formato: z.nativeEnum(FormatoArquivo, {
    message: 'Formato do arquivo inválido.',
  }),
  tamanho_bytes: z.number().int().nonnegative('Tamanho em bytes deve ser não negativo.'),
  total_linhas: z.number().int().nonnegative('Total de linhas deve ser não negativo.'),
  total_colunas: z.number().int().nonnegative('Total de colunas deve ser não negativo.'),
  hash_sha256: z.string().trim().min(1, 'Hash SHA-256 é obrigatório.'),
  origem: z.string().trim().nullable().optional(),
  descricao_conteudo: z.string().trim().nullable().optional(),
  granularidade: z.string().trim().nullable().optional(),
  periodo_inicio: z.string().trim().nullable().optional(),
  periodo_fim: z.string().trim().nullable().optional(),
  versao: z.string().trim().nullable().optional(),
  schema_inferido: z.string().trim().nullable().optional(),
  justificativa: z.string().trim().max(2000).nullable().optional(),
});

export type RegistrarAtivoDerivadoInput = z.infer<typeof registrarAtivoDerivadoSchema>;

/**
 * Schema para registro de aresta de linhagem avulsa
 */
export const registrarArestaLinhagemSchema = z.object({
  demanda_id: z.string().min(1, 'ID da demanda é obrigatório.'),
  ativo_origem_id: z.string().min(1, 'ID do ativo de origem é obrigatório.'),
  ativo_destino_id: z.string().min(1, 'ID do ativo de destino é obrigatório.'),
  papel_entrada: z.nativeEnum(PapelEntradaLinhagem, {
    message: 'Papel da entrada de linhagem inválido.',
  }),
  etapa_transformacao_id: z.string().nullable().optional(),
});

export type RegistrarArestaLinhagemInput = z.infer<typeof registrarArestaLinhagemSchema>;
