import { z } from 'zod';
import { AcaoProblemaQualidade } from '@/core/domain/enums/acao-problema-qualidade';
import { CategoriaProblemaQualidade } from '@/core/domain/enums/categoria-problema-qualidade';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { StatusRegraQualidade } from '@/core/domain/enums/status-regra-qualidade';
import { TipoRegraQualidade } from '@/core/domain/enums/tipo-regra-qualidade';

/**
 * Schema para avaliação / consulta do Quality Gate
 */
export const evaluateQualityGateSchema = z.object({
  demandaId: z.string().min(1, 'ID da demanda é obrigatório.'),
  ativoDadosId: z.string().optional(),
});

export type EvaluateQualityGateInput = z.infer<typeof evaluateQualityGateSchema>;

/**
 * Schema para deliberação humana de anomalia de qualidade (Unidade 3.4C.1 / 3.4C.2)
 * Invariante: Severidade PENDENTE é rejeitada (somente BAIXA, MEDIA, ALTA ou CRITICA).
 * Invariante: Justificativa mandatória >= 15 caracteres.
 * Invariante: Ação deliberada espelha estritamente o enum AcaoProblemaQualidade.
 */
export const deliberateQualityProblemSchema = z.object({
  problemaId: z.string().min(1, 'ID do problema é obrigatório.'),
  demandaId: z.string().min(1, 'ID da demanda é obrigatório para revalidação.'),
  severidade: z.enum(
    [
      SeveridadeProblema.BAIXA,
      SeveridadeProblema.MEDIA,
      SeveridadeProblema.ALTA,
      SeveridadeProblema.CRITICA,
    ],
    {
      message:
        'A severidade deliberada deve ser BAIXA, MEDIA, ALTA ou CRITICA. O valor PENDENTE representa ausência de deliberação.',
    }
  ),
  acaoDeliberada: z.nativeEnum(AcaoProblemaQualidade, {
    message:
      'Ação deliberada inválida. Opções homologadas: CORRIGIR_NA_FONTE, TRATAR_NO_PIPELINE, SOLICITAR_ESCLARECIMENTO, ACEITAR_COMO_RESTRICAO ou MONITORAR.',
  }),
  justificativa: z
    .string()
    .trim()
    .min(15, 'A justificativa da deliberação é mandatória e deve conter no mínimo 15 caracteres.')
    .max(2000, 'A justificativa deve conter no máximo 2000 caracteres.'),
  status: z.nativeEnum(StatusProblemaQualidade).optional(),
  impactoCalculo: z.string().trim().max(1000).nullable().optional(),
});

export type DeliberateQualityProblemInput = z.infer<typeof deliberateQualityProblemSchema>;

/**
 * Schema para atualização de status operacional do problema
 * Invariante: Justificativa mandatória >= 15 caracteres.
 */
export const updateQualityProblemStatusSchema = z.object({
  problemaId: z.string().min(1, 'ID do problema é obrigatório.'),
  demandaId: z.string().min(1, 'ID da demanda é obrigatório para revalidação.'),
  novoStatus: z.nativeEnum(StatusProblemaQualidade, {
    message: 'Status de problema de qualidade inválido.',
  }),
  justificativa: z
    .string()
    .trim()
    .min(15, 'A justificativa para alteração de status é mandatória e deve conter no mínimo 15 caracteres.')
    .max(2000, 'A justificativa deve conter no máximo 2000 caracteres.'),
});

export type UpdateQualityProblemStatusInput = z.infer<typeof updateQualityProblemStatusSchema>;

/**
 * Schema para execução de diagnóstico determinístico
 */
export const runQualityDiagnosticSchema = z.object({
  ativoDadosId: z.string().min(1, 'ID do ativo de dados é obrigatório.'),
  demandaId: z.string().min(1, 'ID da demanda é obrigatório.'),
  abaAlvoXlsx: z.string().trim().nullable().optional(),
});

export type RunQualityDiagnosticInput = z.infer<typeof runQualityDiagnosticSchema>;

/**
 * Schema para listagem de problemas de qualidade
 */
export const listQualityProblemsSchema = z.object({
  diagnosticoId: z.string().optional(),
  ativoDadosId: z.string().optional(),
  demandaId: z.string().optional(),
});

export type ListQualityProblemsInput = z.infer<typeof listQualityProblemsSchema>;

/**
 * Schema para registro manual de anomalia de qualidade (Unidade 3.4B)
 * Invariante: A severidade nascerá sempre PENDENTE no caso de uso.
 */
export const registerManualProblemSchema = z.object({
  ativoDadosId: z.string().min(1, 'ID do ativo de dados é obrigatório.'),
  demandaId: z.string().min(1, 'ID da demanda é obrigatório.'),
  diagnosticoId: z.string().nullable().optional(),
  categoria: z
    .nativeEnum(CategoriaProblemaQualidade)
    .default(CategoriaProblemaQualidade.ANOMALIA_MANUAL_DECLARADA),
  titulo: z
    .string()
    .trim()
    .min(3, 'O título do problema deve conter no mínimo 3 caracteres.')
    .max(200, 'O título deve conter no máximo 200 caracteres.'),
  descricao: z
    .string()
    .trim()
    .min(5, 'A descrição deve conter no mínimo 5 caracteres.')
    .max(2000, 'A descrição deve conter no máximo 2000 caracteres.'),
  tabelaAfetada: z.string().trim().min(1, 'A tabela ou arquivo afetado é obrigatório.'),
  colunaAfetada: z.string().trim().nullable().optional(),
  totalLinhasAfetadas: z.number().int().nonnegative().optional(),
  percentualLinhasAfetadas: z.number().min(0).max(100).optional(),
});

export type RegisterManualProblemInput = z.infer<typeof registerManualProblemSchema>;

/**
 * Schema para listagem de regras de qualidade
 */
export const listQualityRulesSchema = z.object({
  ativoDadosId: z.string().min(1, 'ID do ativo de dados é obrigatório.'),
  status: z.nativeEnum(StatusRegraQualidade).optional(),
});

export type ListQualityRulesInput = z.infer<typeof listQualityRulesSchema>;

/**
 * Schema para criação de regra de qualidade (R1 a R5)
 */
export const createQualityRuleSchema = z.object({
  ativoDadosId: z.string().min(1, 'ID do ativo de dados é obrigatório.'),
  demandaId: z.string().min(1, 'ID da demanda é obrigatório.'),
  tipo: z.nativeEnum(TipoRegraQualidade, {
    message: 'Tipo de regra de qualidade inválido.',
  }),
  nome: z
    .string()
    .trim()
    .min(3, 'O nome da regra deve conter no mínimo 3 caracteres.')
    .max(150, 'O nome da regra deve conter no máximo 150 caracteres.'),
  descricao: z.string().trim().max(1000).nullable().optional(),
  coluna: z.string().trim().nullable().optional(),
  colunas: z.array(z.string().trim()).optional(),
  parametros: z.any(),
});

export type CreateQualityRuleInput = z.infer<typeof createQualityRuleSchema>;

/**
 * Schema para atualização de regra de qualidade
 */
export const updateQualityRuleSchema = z.object({
  id: z.string().min(1, 'ID da regra de qualidade é obrigatório.'),
  demandaId: z.string().min(1, 'ID da demanda é obrigatório.'),
  nome: z.string().trim().min(3).max(150).optional(),
  descricao: z.string().trim().max(1000).nullable().optional(),
  tipo: z.nativeEnum(TipoRegraQualidade).optional(),
  coluna: z.string().trim().nullable().optional(),
  colunas: z.array(z.string().trim()).optional(),
  parametros: z.any().optional(),
});

export type UpdateQualityRuleInput = z.infer<typeof updateQualityRuleSchema>;

/**
 * Schema para alternância de status de regra (ATIVA <-> INATIVA)
 */
export const toggleQualityRuleStatusSchema = z.object({
  id: z.string().min(1, 'ID da regra de qualidade é obrigatório.'),
  demandaId: z.string().min(1, 'ID da demanda é obrigatório.'),
  novoStatus: z.nativeEnum(StatusRegraQualidade).optional(),
});

export type ToggleQualityRuleStatusInput = z.infer<typeof toggleQualityRuleStatusSchema>;
