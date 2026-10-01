/**
 * src/lib/validations/evidence-schema.ts
 *
 * Schemas de validação Zod para o Evidence Core (Subgate 3.5A).
 */

import { z } from 'zod';
import { TipoEvidenciaAnalitica } from '@/core/domain/enums/tipo-evidencia-analitica';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';
import { MetodoCapturaEvidencia } from '@/core/domain/enums/metodo-captura-evidencia';
import { StatusValidacaoEvidencia } from '@/core/domain/enums/status-validacao-evidencia';
import { ClassificacaoExposicaoEvidencia } from '@/core/domain/enums/classificacao-exposicao-evidencia';

export const registrarEvidenciaSchema = z
  .object({
    demandaId: z.string().min(1, 'ID da demanda é obrigatório'),
    projetoId: z.string().nullable().optional(),
    tipo: z.nativeEnum(TipoEvidenciaAnalitica).default(TipoEvidenciaAnalitica.DADOS),
    etapaOrigem: z.nativeEnum(EtapaOrigemEvidencia).default(EtapaOrigemEvidencia.DADOS),
    artefatoOrigemTipo: z.string().nullable().optional(),
    artefatoOrigemId: z.string().nullable().optional(),
    titulo: z
      .string()
      .min(3, 'Título deve ter pelo menos 3 caracteres')
      .max(255, 'Título não pode exceder 255 caracteres'),
    descricao: z.string().min(5, 'Descrição deve ter pelo menos 5 caracteres'),
    fatoObservado: z.string().min(5, 'Fato observado deve ter pelo menos 5 caracteres'),
    estadoAnterior: z.string().nullable().optional(),
    acaoRegistrada: z.string().min(5, 'Ação registrada deve ter pelo menos 5 caracteres'),
    estadoPosterior: z.string().nullable().optional(),
    resultadoMensuravel: z.string().nullable().optional(),
    inferenciaRecomendacao: z.string().nullable().optional(),
    decisaoHumana: z.string().nullable().optional(),
    metodoCaptura: z.nativeEnum(MetodoCapturaEvidencia).default(MetodoCapturaEvidencia.MANUAL),
    statusValidacao: z.nativeEnum(StatusValidacaoEvidencia).optional(),
    classificacaoExposicao: z
      .nativeEnum(ClassificacaoExposicaoEvidencia)
      .default(ClassificacaoExposicaoEvidencia.INTERNA),
    elegibilidadePortfolio: z.boolean().default(false),
    executor: z.string().default('ANALISTA'),
    metadados: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .refine(
    (data) => {
      if (
        data.classificacaoExposicao === ClassificacaoExposicaoEvidencia.CONFIDENCIAL &&
        data.elegibilidadePortfolio
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Evidências CONFIDENCIAIS não podem ser marcadas como elegíveis para portfólio.',
      path: ['elegibilidadePortfolio'],
    }
  );

export type RegistrarEvidenciaInputSchema = z.input<typeof registrarEvidenciaSchema>;

export const deliberarEvidenciaSchema = z.object({
  id: z.string().min(1, 'ID da evidência é obrigatório'),
  status: z.enum(['CONFIRMADA', 'REJEITADA', 'AGUARDANDO_REVISAO']),
  decisaoHumana: z.string().min(3, 'Justificativa da decisão humana é obrigatória (mínimo 3 caracteres)'),
  revisor: z.string().optional(),
});

export type DeliberarEvidenciaInputSchema = z.input<typeof deliberarEvidenciaSchema>;

export const alterarExposicaoEvidenciaSchema = z
  .object({
    id: z.string().min(1, 'ID da evidência é obrigatório'),
    classificacaoExposicao: z.nativeEnum(ClassificacaoExposicaoEvidencia),
    elegibilidadePortfolio: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (
        data.classificacaoExposicao === ClassificacaoExposicaoEvidencia.CONFIDENCIAL &&
        data.elegibilidadePortfolio
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Evidência CONFIDENCIAL não pode ser elegível para portfólio.',
      path: ['elegibilidadePortfolio'],
    }
  );

export type AlterarExposicaoEvidenciaInputSchema = z.input<typeof alterarExposicaoEvidenciaSchema>;

export const consultarEvidenciasDemandaSchema = z.object({
  demandaId: z.string().min(1, 'ID da demanda é obrigatório'),
  tipo: z.nativeEnum(TipoEvidenciaAnalitica).optional(),
  etapaOrigem: z.nativeEnum(EtapaOrigemEvidencia).optional(),
  statusValidacao: z.nativeEnum(StatusValidacaoEvidencia).optional(),
  classificacaoExposicao: z.nativeEnum(ClassificacaoExposicaoEvidencia).optional(),
  elegibilidadePortfolio: z.boolean().optional(),
});

export type ConsultarEvidenciasDemandaInputSchema = z.input<typeof consultarEvidenciasDemandaSchema>;
