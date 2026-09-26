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

export type CreateDemandInput = z.input<typeof createDemandSchema>;
export type UpdateDemandInput = z.input<typeof updateDemandSchema>;
