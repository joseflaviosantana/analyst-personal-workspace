import { z } from 'zod';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';

export const createDemandSchema = z.object({
  projeto_id: z
    .string()
    .trim()
    .min(1, { message: 'Selecione um projeto válido para a demanda.' }),
  titulo: z
    .string()
    .trim()
    .min(3, { message: 'O título deve ter no mínimo 3 caracteres.' })
    .max(150, { message: 'O título deve ter no máximo 150 caracteres.' }),
  solicitacao_bruta: z
    .string()
    .trim()
    .min(5, { message: 'A solicitação bruta deve conter no mínimo 5 caracteres.' }),
  contexto: z.string().trim().max(2000, { message: 'O contexto deve ter no máximo 2000 caracteres.' }).nullable().optional(),
  objetivo_inicial: z.string().trim().max(1000, { message: 'O objetivo deve ter no máximo 1000 caracteres.' }).nullable().optional(),
  prazo_esperado: z.string().nullable().optional(),
  restricoes_declaradas: z.string().trim().max(1000, { message: 'As restrições devem ter no máximo 1000 caracteres.' }).nullable().optional(),
});

export const updateDemandSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, { message: 'O título deve ter no mínimo 3 caracteres.' })
    .max(150)
    .optional(),
  solicitacao_bruta: z
    .string()
    .trim()
    .min(5, { message: 'A solicitação bruta deve conter no mínimo 5 caracteres.' })
    .optional(),
  contexto: z.string().trim().max(2000).nullable().optional(),
  objetivo_inicial: z.string().trim().max(1000).nullable().optional(),
  prazo_esperado: z.string().nullable().optional(),
  restricoes_declaradas: z.string().trim().max(1000).nullable().optional(),
  estado: z.nativeEnum(EstadoDemanda).optional(),
  data_conclusao: z.string().nullable().optional(),
});

export const transitionDemandSchema = z.object({
  demandaId: z.string().min(1, 'ID da demanda é obrigatório.'),
  novoEstado: z.nativeEnum(EstadoDemanda, { message: 'Estado informado não é válido.' }),
  justificativa: z.string().trim().max(1000).optional().nullable(),
});

export const suspendDemandSchema = z.object({
  demandaId: z.string().min(1, 'ID da demanda é obrigatório.'),
  justificativa: z
    .string()
    .trim()
    .min(5, { message: 'A justificativa de suspensão deve conter no mínimo 5 caracteres.' })
    .max(1000, { message: 'A justificativa deve ter no máximo 1000 caracteres.' }),
});

export const resumeDemandSchema = z.object({
  demandaId: z.string().min(1, 'ID da demanda é obrigatório.'),
  justificativa: z
    .string()
    .trim()
    .min(5, { message: 'A justificativa de retomada deve conter no mínimo 5 caracteres.' })
    .max(1000, { message: 'A justificativa deve ter no máximo 1000 caracteres.' }),
});

export const cancelDemandSchema = z.object({
  demandaId: z.string().min(1, 'ID da demanda é obrigatório.'),
  justificativa: z
    .string()
    .trim()
    .min(5, { message: 'A justificativa de cancelamento deve conter no mínimo 5 caracteres.' })
    .max(1000, { message: 'A justificativa deve ter no máximo 1000 caracteres.' }),
});

export type CreateDemandInput = z.input<typeof createDemandSchema>;
export type UpdateDemandInput = z.input<typeof updateDemandSchema>;
export type TransitionDemandInput = z.input<typeof transitionDemandSchema>;
export type SuspendDemandInput = z.input<typeof suspendDemandSchema>;
export type ResumeDemandInput = z.input<typeof resumeDemandSchema>;
export type CancelDemandInput = z.input<typeof cancelDemandSchema>;
