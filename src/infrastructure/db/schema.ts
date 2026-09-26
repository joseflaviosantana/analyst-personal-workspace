import { relations } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Tabela de controle de integridade e metadados do sistema (Bootstrap Técnico)
 */
export const sistemaInfo = sqliteTable('sistema_info', {
  id: text('id').primaryKey(),
  chave: text('chave').notNull().unique(),
  valor: text('valor').notNull(),
  criado_em: text('criado_em').notNull(),
  atualizado_em: text('atualizado_em').notNull(),
});

/**
 * Tabela de demonstração da persistência do Bloco 0
 */
export const bootstrapRegistros = sqliteTable('bootstrap_registros', {
  id: text('id').primaryKey(),
  titulo: text('titulo').notNull(),
  status: text('status').notNull().default('OPERACIONAL'),
  criado_em: text('criado_em').notNull(),
  atualizado_em: text('atualizado_em').notNull(),
});

/**
 * Projetos (V1 — Bloco 1)
 * Agrupador contextual e estratégico que organiza demandas de negócio.
 */
export const projetos = sqliteTable('projetos', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  descricao: text('descricao'),
  status: text('status').notNull().default('ATIVO'),
  data_inicio: text('data_inicio'),
  data_conclusao_prevista: text('data_conclusao_prevista'),
  data_conclusao_real: text('data_conclusao_real'),
  criado_em: text('criado_em').notNull(),
  atualizado_em: text('atualizado_em').notNull(),
});

/**
 * Demandas (V1 — Bloco 1)
 * Unidade atômica de trabalho profissional no pipeline.
 * Cardinalidade: Projeto 1 → N Demandas.
 */
export const demandas = sqliteTable('demandas', {
  id: text('id').primaryKey(),
  projeto_id: text('projeto_id')
    .notNull()
    .references(() => projetos.id, { onDelete: 'cascade' }),
  titulo: text('titulo').notNull(),
  solicitacao_bruta: text('solicitacao_bruta').notNull(),
  contexto: text('contexto'),
  objetivo_inicial: text('objetivo_inicial'),
  prazo_esperado: text('prazo_esperado'),
  restricoes_declaradas: text('restricoes_declaradas'),
  estado: text('estado').notNull().default('BACKLOG'),
  criado_em: text('criado_em').notNull(),
  atualizado_em: text('atualizado_em').notNull(),
  data_conclusao: text('data_conclusao'),
});

/**
 * Relacionamentos declarativos Drizzle ORM
 */
export const projetosRelations = relations(projetos, ({ many }) => ({
  demandas: many(demandas),
}));

export const demandasRelations = relations(demandas, ({ one }) => ({
  projeto: one(projetos, {
    fields: [demandas.projeto_id],
    references: [projetos.id],
  }),
}));
