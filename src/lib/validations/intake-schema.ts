import { z } from 'zod';

/**
 * Schema de validação para análise inicial de Intake (Tier 1).
 * Não realiza mutação nem persistência em banco.
 * Preserva o texto da solicitação original sem corte de espaços para integridade epistêmica.
 */
export const analyzeIntakeSchema = z.object({
  solicitacaoOriginal: z
    .string()
    .min(5, { message: 'A solicitação original deve conter no mínimo 5 caracteres.' }),
});

export type AnalyzeIntakeInput = z.input<typeof analyzeIntakeSchema>;

/**
 * Item de pergunta preliminar aceita/revisada pelo humano.
 */
export const intakePerguntaSchema = z.object({
  id: z.string().optional(),
  pergunta: z
    .string()
    .trim()
    .min(5, { message: 'A pergunta preliminar deve ter no mínimo 5 caracteres.' }),
  motivacao: z.string().trim().max(1000).nullable().optional(),
  bloqueante: z.boolean().optional().default(false),
  aceita: z.boolean().optional().default(true),
});

export type IntakePerguntaInput = z.input<typeof intakePerguntaSchema>;

/**
 * Requisito proposto/identificado pelo Intake aguardando validação humana.
 */
export const intakeRequisitoPropostoSchema = z.object({
  id: z.string().optional(),
  titulo: z.string().trim().min(3, { message: 'O título do requisito deve ter no mínimo 3 caracteres.' }),
  descricao: z.string().trim().max(1000).nullable().optional(),
  categoria: z.string().trim().default('METRICA_KPI'),
  prioridade: z.enum(['OBRIGATORIO', 'DESEJAVEL']).default('OBRIGATORIO'),
});

export type IntakeRequisitoPropostoInput = z.input<typeof intakeRequisitoPropostoSchema>;

/**
 * Schema de validação para confirmação e materialização transacional do Intake.
 *
 * Regras estritas:
 * 1. solicitacaoOriginal NÃO sofre trim() para assegurar preservação byte-a-byte em solicitacao_bruta.
 * 2. Se projetoDecisao === 'NOVO', novoProjeto.nome deve ter no mínimo 3 caracteres.
 * 3. Se projetoDecisao === 'EXISTENTE', projetoIdExistente deve ser uma string não vazia.
 * 4. Demanda requer título válido (min 3 caracteres).
 */
export const confirmIntakeSchema = z
  .object({
    solicitacaoOriginal: z
      .string()
      .min(5, { message: 'A solicitação original deve conter no mínimo 5 caracteres.' }),
    projetoDecisao: z.enum(['NOVO', 'EXISTENTE']),
    novoProjeto: z
      .object({
        nome: z
          .string()
          .trim()
          .min(3, { message: 'O nome do novo projeto deve ter no mínimo 3 caracteres.' })
          .max(120, { message: 'O nome do projeto deve ter no máximo 120 caracteres.' }),
        descricao: z.string().trim().max(1000).nullable().optional(),
      })
      .nullable()
      .optional(),
    projetoIdExistente: z.string().trim().nullable().optional(),
    demanda: z.object({
      titulo: z
        .string()
        .trim()
        .min(3, { message: 'O título da demanda deve ter no mínimo 3 caracteres.' })
        .max(150, { message: 'O título da demanda deve ter no máximo 150 caracteres.' }),
      contexto: z.string().trim().max(2000).nullable().optional(),
      objetivo_inicial: z.string().trim().max(1000).nullable().optional(),
      prazo_esperado: z.string().nullable().optional(),
      restricoes_declaradas: z.string().trim().max(1000).nullable().optional(),
    }),
    perguntasPreliminares: z.array(intakePerguntaSchema).optional().default([]),
    requisitosPropostos: z.array(intakeRequisitoPropostoSchema).optional().default([]),
    intakeSnapshot: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.projetoDecisao === 'NOVO') {
        return !!data.novoProjeto && !!data.novoProjeto.nome && data.novoProjeto.nome.trim().length >= 3;
      }
      if (data.projetoDecisao === 'EXISTENTE') {
        return !!data.projetoIdExistente && data.projetoIdExistente.trim().length > 0;
      }
      return false;
    },
    {
      message:
        'Para projeto NOVO, informe o nome do projeto (mínimo 3 caracteres). Para projeto EXISTENTE, selecione um projeto válido.',
      path: ['projetoDecisao'],
    }
  );

export type ConfirmIntakeInput = z.input<typeof confirmIntakeSchema>;
export type ConfirmIntakeOutput = z.output<typeof confirmIntakeSchema>;
