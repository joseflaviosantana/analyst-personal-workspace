import { z } from 'zod';
import { CamadaValidacao } from '@/core/domain/enums/camada-validacao';
import { ResultadoValidacao } from '@/core/domain/enums/resultado-validacao';
import { TipoEntregavel } from '@/core/domain/enums/tipo-entregavel';
import { StatusEntregavel } from '@/core/domain/enums/status-entregavel';
import { StatusAceiteEntrega } from '@/core/domain/enums/status-aceite-entrega';

/**
 * Schema para registro de Validação e Conciliação Numérica (Subunidade 3.7A)
 */
export const createValidacaoConciliacaoSchema = z.object({
  demanda_id: z.string().min(1, 'ID da demanda é obrigatório.'),
  modelo_id: z.string().nullable().optional(),
  metrica_id: z.string().nullable().optional(),
  titulo: z.string().trim().min(3, 'Título deve conter ao menos 3 caracteres.').max(200),
  camada: z.nativeEnum(CamadaValidacao, {
    message: 'Camada de validação inválida.',
  }),
  metodo_verificacao: z.string().trim().min(5, 'Método de verificação deve conter ao menos 5 caracteres.').max(1000),
  base_referencia: z.string().trim().max(500).nullable().optional(),
  valor_esperado: z.number().nullable().optional(),
  valor_obtido: z.number().nullable().optional(),
  tolerancia_permitida: z.number().min(0, 'Tolerância não pode ser negativa.').default(0),
  unidade_medida: z.string().trim().max(50).nullable().optional(),
  resultado: z.nativeEnum(ResultadoValidacao).default(ResultadoValidacao.PENDENTE_RETESTE),
  obrigatoria: z.boolean().default(true),
  acao_corretiva: z.string().trim().max(1000).nullable().optional(),
  notas_evidencia: z.string().trim().max(2000).nullable().optional(),
  executado_por: z.string().trim().max(100).nullable().optional(),
});

export type CreateValidacaoConciliacaoInput = z.input<typeof createValidacaoConciliacaoSchema>;

/**
 * Schema para atualização de Validação e Conciliação Numérica
 */
export const updateValidacaoConciliacaoSchema = z.object({
  id: z.string().min(1, 'ID da validação é obrigatório.'),
  titulo: z.string().trim().min(3).max(200).optional(),
  camada: z.nativeEnum(CamadaValidacao).optional(),
  metodo_verificacao: z.string().trim().min(5).max(1000).optional(),
  base_referencia: z.string().trim().max(500).nullable().optional(),
  valor_esperado: z.number().nullable().optional(),
  valor_obtido: z.number().nullable().optional(),
  tolerancia_permitida: z.number().min(0).optional(),
  unidade_medida: z.string().trim().max(50).nullable().optional(),
  resultado: z.nativeEnum(ResultadoValidacao).optional(),
  obrigatoria: z.boolean().optional(),
  acao_corretiva: z.string().trim().max(1000).nullable().optional(),
  notas_evidencia: z.string().trim().max(2000).nullable().optional(),
  executado_por: z.string().trim().max(100).nullable().optional(),
});

export type UpdateValidacaoConciliacaoInput = z.input<typeof updateValidacaoConciliacaoSchema>;

/**
 * Schema para reteste / execução de Validação
 */
export const retestValidacaoConciliacaoSchema = z.object({
  id: z.string().min(1, 'ID da validação é obrigatório.'),
  valor_obtido: z.number({ message: 'Valor obtido no reteste é obrigatório.' }),
  executado_por: z.string().trim().min(1, 'Identificação do executor é obrigatória.').max(100),
  notas_evidencia: z.string().trim().max(2000).nullable().optional(),
});

export type RetestValidacaoConciliacaoInput = z.input<typeof retestValidacaoConciliacaoSchema>;

/**
 * Schema para registro de Entregável Profissional (Subunidade 3.7A)
 */
export const createEntregavelDemandaSchema = z.object({
  demanda_id: z.string().min(1, 'ID da demanda é obrigatório.'),
  titulo: z.string().trim().min(3, 'Título deve conter ao menos 3 caracteres.').max(200),
  tipo: z.nativeEnum(TipoEntregavel, {
    message: 'Tipo de entregável inválido.',
  }),
  versao: z.string().trim().min(1, 'Versão é obrigatória.').max(50).default('1.0'),
  caminho_arquivo_ou_link: z.string().trim().min(1, 'Caminho de arquivo ou URL do artefato é obrigatório.').max(1000),
  descricao_sumario: z.string().trim().max(2000).nullable().optional(),
  obrigatorio: z.boolean().default(true),
  status: z.nativeEnum(StatusEntregavel).default(StatusEntregavel.DISPONIVEL),
});

export type CreateEntregavelDemandaInput = z.input<typeof createEntregavelDemandaSchema>;

/**
 * Schema para atualização de Entregável Profissional
 */
export const updateEntregavelDemandaSchema = z.object({
  id: z.string().min(1, 'ID do entregável é obrigatório.'),
  titulo: z.string().trim().min(3).max(200).optional(),
  tipo: z.nativeEnum(TipoEntregavel).optional(),
  versao: z.string().trim().min(1).max(50).optional(),
  caminho_arquivo_ou_link: z.string().trim().min(1).max(1000).optional(),
  descricao_sumario: z.string().trim().max(2000).nullable().optional(),
  obrigatorio: z.boolean().optional(),
  status: z.nativeEnum(StatusEntregavel).optional(),
});

export type UpdateEntregavelDemandaInput = z.input<typeof updateEntregavelDemandaSchema>;

/**
 * Schema para registro de Aceite Formal de Entregável (Ajuste Vinculante: Autoria humana, decisão formal, timestamp e justificativa)
 */
export const registrarAceiteEntregaSchema = z.object({
  id: z.string().min(1, 'ID do entregável é obrigatório.'),
  aceite_status: z.enum(
    [StatusAceiteEntrega.ACEITO, StatusAceiteEntrega.REJEITADO, StatusAceiteEntrega.AJUSTES_SOLICITADOS],
    { message: 'Decisão de aceite formal inválida.' }
  ),
  aceite_por: z.string().trim().min(2, 'Identificação de autoria humana é obrigatória (mínimo 2 caracteres).').max(100),
  aceite_justificativa: z.string().trim().max(2000).nullable().optional(),
}).refine(
  (data) => {
    // Se rejeitado ou ajustes solicitados, justificativa é obrigatória
    if (data.aceite_status === StatusAceiteEntrega.REJEITADO || data.aceite_status === StatusAceiteEntrega.AJUSTES_SOLICITADOS) {
      return Boolean(data.aceite_justificativa && data.aceite_justificativa.trim().length >= 10);
    }
    return true;
  },
  {
    message: 'Justificativa com ao menos 10 caracteres é obrigatória quando o aceite for rejeitado ou houver ajustes solicitados.',
    path: ['aceite_justificativa'],
  }
);

export type RegistrarAceiteEntregaInput = z.input<typeof registrarAceiteEntregaSchema>;

/**
 * Schema para avaliação de prontidão de validação / entregáveis
 */
export const evaluateValidationReadinessSchema = z.object({
  demanda_id: z.string().min(1, 'ID da demanda é obrigatório.'),
});

export type EvaluateValidationReadinessInput = z.input<typeof evaluateValidationReadinessSchema>;
