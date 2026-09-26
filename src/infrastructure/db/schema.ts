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
 * Demandas (V1 — Bloco 1 e Bloco 2)
 * Unidade atômica de trabalho profissional no pipeline com suporte a workflow.
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
  estado: text('estado').notNull().default('NOVA'),
  estado_anterior: text('estado_anterior'),
  criado_em: text('criado_em').notNull(),
  atualizado_em: text('atualizado_em').notNull(),
  data_conclusao: text('data_conclusao'),
});

/**
 * Trilha de Auditoria (V1 — Bloco 2 / ADR-002 Seção 4.5 e 10.1)
 * Registra mutações críticas, eventos do workflow e justificativas com timestamp ISO 8601 em UTC.
 */
export const trilhaAuditoria = sqliteTable('trilha_auditoria', {
  id: text('id').primaryKey(),
  demanda_id: text('demanda_id')
    .references(() => demandas.id, { onDelete: 'cascade' }),
  entidade: text('entidade').notNull(),
  entidade_id: text('entidade_id').notNull(),
  tipo_evento: text('tipo_evento').notNull(),
  autor_tipo: text('autor_tipo').notNull(),
  dados_anteriores: text('dados_anteriores'),
  dados_novos: text('dados_novos'),
  justificativa: text('justificativa'),
  timestamp: text('timestamp').notNull(),
});

/**
 * Relacionamentos declarativos Drizzle ORM
 */
export const projetosRelations = relations(projetos, ({ many }) => ({
  demandas: many(demandas),
}));

export const demandasRelations = relations(demandas, ({ one, many }) => ({
  projeto: one(projetos, {
    fields: [demandas.projeto_id],
    references: [projetos.id],
  }),
  auditorias: many(trilhaAuditoria),
}));

export const trilhaAuditoriaRelations = relations(trilhaAuditoria, ({ one }) => ({
  demanda: one(demandas, {
    fields: [trilhaAuditoria.demanda_id],
    references: [demandas.id],
  }),
}));
