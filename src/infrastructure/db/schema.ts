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
 * Tabela mínima de demonstração da persistência, integridade e timestamps para o Bloco 0
 */
export const bootstrapRegistros = sqliteTable('bootstrap_registros', {
  id: text('id').primaryKey(),
  titulo: text('titulo').notNull(),
  status: text('status').notNull().default('OPERACIONAL'),
  criado_em: text('criado_em').notNull(),
  atualizado_em: text('atualizado_em').notNull(),
});
