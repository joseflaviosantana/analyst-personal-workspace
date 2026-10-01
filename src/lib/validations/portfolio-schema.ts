import { z } from 'zod';
import { TecnicaSanitizacao } from '@/core/domain/enums/tecnica-sanitizacao';
import { CategoriaAtivoAprendizado } from '@/core/domain/enums/categoria-ativo-aprendizado';

/**
 * src/lib/validations/portfolio-schema.ts
 *
 * Schemas Zod de validação de dados para a Aba 11 (Dossiê Vivo, Portfólio & Aprendizados).
 */

export const metricaFatoCaseSchema = z.object({
  rotulo: z.string().trim().min(1, 'Rótulo da métrica é obrigatório.'),
  expressaoSanitizada: z.string().trim().min(1, 'Expressão sanitizada é obrigatória.'),
  impactoOuConclusao: z.string().trim().min(1, 'Impacto ou conclusão é obrigatório.'),
});

export const checklistSanitizacaoSchema = z.object({
  nomesClientesOcultados: z.boolean().default(false),
  dadosPessoaisOcultados: z.boolean().default(false),
  dadosFinanceirosSigilososTratados: z.boolean().default(false),
  metricasFatuaisPreservadas: z.boolean().default(false),
  declaracaoHumanaAssinada: z.boolean().default(false),
});

export const atualizarEstudoCasoSchema = z.object({
  caseId: z.string().min(1, 'ID do estudo de caso é obrigatório.'),
  titulo: z.string().trim().min(3, 'Título deve conter ao menos 3 caracteres.').max(250).optional(),
  problema_negocio: z.string().optional(),
  processo_preparacao: z.string().optional(),
  modelagem_decisoes: z.string().optional(),
  validacao_resultados: z.string().optional(),
  competencias_demonstradas: z.array(z.string()).optional(),
  ferramentas_utilizadas: z.array(z.string()).optional(),
  metricas_fatos: z.array(metricaFatoCaseSchema).optional(),
  tecnicas_sanitizacao: z.array(z.nativeEnum(TecnicaSanitizacao)).optional(),
  checklist_sanitizacao: checklistSanitizacaoSchema.partial().optional(),
  ator: z.string().trim().max(100).optional(),
});

export type AtualizarEstudoCasoSchemaInput = z.input<typeof atualizarEstudoCasoSchema>;

export const homologarEstudoCasoSchema = z.object({
  caseId: z.string().min(1, 'ID do estudo de caso é obrigatório.'),
  autor: z.string().trim().min(2, 'Nome do analista responsável pela homologação é obrigatório.').max(100),
  justificativa: z.string().trim().max(1000).optional(),
});

export type HomologarEstudoCasoSchemaInput = z.input<typeof homologarEstudoCasoSchema>;

export const curarAtivoAprendizadoSchema = z.object({
  demandaId: z.string().nullable().optional(),
  titulo: z.string().trim().min(3, 'Título do ativo deve ter ao menos 3 caracteres.').max(200),
  categoria: z.nativeEnum(CategoriaAtivoAprendizado, {
    message: 'Categoria do ativo de aprendizado inválida.',
  }),
  descricao: z.string().trim().max(2000).nullable().optional(),
  procedimento_padrao: z.string().trim().min(3, 'Procedimento padrão / fórmula / código é obrigatório.'),
  contexto_aplicacao: z.string().trim().max(1000).nullable().optional(),
  tags: z.array(z.string().trim()).optional().default([]),
  ator: z.string().trim().max(100).optional(),
});

export type CurarAtivoAprendizadoSchemaInput = z.input<typeof curarAtivoAprendizadoSchema>;
