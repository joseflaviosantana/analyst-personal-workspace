import { z } from 'zod';

export const createProjectSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, { message: 'O nome do projeto deve ter no mínimo 3 caracteres.' })
    .max(120, { message: 'O nome do projeto deve ter no máximo 120 caracteres.' }),
  descricao: z.string().trim().max(1000, { message: 'A descrição deve ter no máximo 1000 caracteres.' }).nullable().optional(),
  status: z.enum(['ATIVO', 'PAUSADO', 'CONCLUIDO', 'CANCELADO']).optional().default('ATIVO'),
  data_inicio: z.string().nullable().optional(),
  data_conclusao_prevista: z.string().nullable().optional(),
});

export const updateProjectSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, { message: 'O nome do projeto deve ter no mínimo 3 caracteres.' })
    .max(120, { message: 'O nome do projeto deve ter no máximo 120 caracteres.' })
    .optional(),
  descricao: z.string().trim().max(1000).nullable().optional(),
  status: z.enum(['ATIVO', 'PAUSADO', 'CONCLUIDO', 'CANCELADO']).optional(),
  data_inicio: z.string().nullable().optional(),
  data_conclusao_prevista: z.string().nullable().optional(),
  data_conclusao_real: z.string().nullable().optional(),
});

export type CreateProjectInput = z.input<typeof createProjectSchema>;
export type UpdateProjectInput = z.input<typeof updateProjectSchema>;
