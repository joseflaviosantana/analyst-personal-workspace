import { relations } from 'drizzle-orm';
import { AnySQLiteColumn, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
 * Ativos de Dados (V1 — Bloco 3 / FSD CF-06 e v1-domain-model.md Seção 3.6)
 * Catalogação e metadados de arquivos tabulares locais recebidos para a demanda.
 * Cardinalidade: Demanda 1 → N Ativos de Dados.
 */
export const ativosDados = sqliteTable('ativos_dados', {
  id: text('id').primaryKey(),
  demanda_id: text('demanda_id')
    .notNull()
    .references(() => demandas.id, { onDelete: 'cascade' }),
  nome_arquivo: text('nome_arquivo').notNull(),
  caminho_local: text('caminho_local').notNull(),
  formato: text('formato').notNull(),
  origem: text('origem'),
  descricao_conteudo: text('descricao_conteudo'),
  granularidade: text('granularidade'),
  periodo_inicio: text('periodo_inicio'),
  periodo_fim: text('periodo_fim'),
  versao: text('versao'),
  substitui_ativo_id: text('substitui_ativo_id')
    .references((): AnySQLiteColumn => ativosDados.id),
  tamanho_bytes: integer('tamanho_bytes').notNull().default(0),
  total_linhas: integer('total_linhas').notNull().default(0),
  total_colunas: integer('total_colunas').notNull().default(0),
  hash_sha256: text('hash_sha256').notNull(),
  status: text('status').notNull().default('CADASTRADO'),
  schema_inferido: text('schema_inferido'),
  data_recebimento: text('data_recebimento').notNull(),
  criado_em: text('criado_em').notNull(),
  atualizado_em: text('atualizado_em').notNull(),
});

/**
 * Diagnósticos de Qualidade (V1 — Subunidade 3.4A / ADR-002 Seção 5.3-B)
 * Execuções formais de varreduras de qualidade sobre um ativo de dados.
 * Histórico preservado sem sobrescrita.
 * Cardinalidade: AtivoDados 1 → N DiagnosticosQualidade.
 */
export const diagnosticosQualidade = sqliteTable('diagnosticos_qualidade', {
  id: text('id').primaryKey(),
  ativo_dados_id: text('ativo_dados_id')
    .notNull()
    .references(() => ativosDados.id, { onDelete: 'cascade' }),
  demanda_id: text('demanda_id')
    .notNull()
    .references(() => demandas.id, { onDelete: 'cascade' }),
  iniciado_em: text('iniciado_em').notNull(),
  concluido_em: text('concluido_em'),
  duracao_ms: integer('duracao_ms').notNull().default(0),
  total_linhas_avaliadas: integer('total_linhas_avaliadas').notNull().default(0),
  total_colunas_avaliadas: integer('total_colunas_avaliadas').notNull().default(0),
  verificacoes_executadas: text('verificacoes_executadas').notNull().default('[]'),
  total_problemas_detectados: integer('total_problemas_detectados').notNull().default(0),
  status_execucao: text('status_execucao').notNull().default('EM_ANDAMENTO'),
  erro_mensagem: text('erro_mensagem'),
  resumo_metricas: text('resumo_metricas'),
  criado_em: text('criado_em').notNull(),
  atualizado_em: text('atualizado_em').notNull(),
});

/**
 * Problemas de Qualidade (V1 — Subunidade 3.4A / FSD CF-07 / RF-018 a RF-022)
 * Anomalias e inconsistências factuais detectadas pelo scanner ou registradas pelo analista.
 * Cardinalidade: DiagnosticoQualidade 1 → N ProblemasQualidade.
 */
export const problemasQualidade = sqliteTable('problemas_qualidade', {
  id: text('id').primaryKey(),
  diagnostico_id: text('diagnostico_id')
    .notNull()
    .references(() => diagnosticosQualidade.id, { onDelete: 'cascade' }),
  ativo_dados_id: text('ativo_dados_id')
    .notNull()
    .references(() => ativosDados.id, { onDelete: 'cascade' }),
  demanda_id: text('demanda_id')
    .notNull()
    .references(() => demandas.id, { onDelete: 'cascade' }),
  categoria: text('categoria').notNull(),
  titulo: text('titulo').notNull(),
  descricao: text('descricao').notNull(),
  tabela_afetada: text('tabela_afetada').notNull(),
  coluna_afetada: text('coluna_afetada'),
  total_linhas_afetadas: integer('total_linhas_afetadas').notNull().default(0),
  percentual_linhas_afetadas: real('percentual_linhas_afetadas').notNull().default(0),
  amostra_evidencias: text('amostra_evidencias').notNull().default('[]'),
  severidade: text('severidade').notNull().default('PENDENTE'),
  impacto_calculo: text('impacto_calculo'),
  acao_deliberada: text('acao_deliberada'),
  justificativa_deliberacao: text('justificativa_deliberacao'),
  deliberado_por_humano: integer('deliberado_por_humano').notNull().default(0),
  deliberado_em: text('deliberado_em'),
  status: text('status').notNull().default('ABERTO'),
  origem_deteccao: text('origem_deteccao').notNull().default('AUTOMATICA'),
  criado_em: text('criado_em').notNull(),
  atualizado_em: text('atualizado_em').notNull(),
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
  ativosDados: many(ativosDados),
  diagnosticosQualidade: many(diagnosticosQualidade),
  problemasQualidade: many(problemasQualidade),
}));

export const trilhaAuditoriaRelations = relations(trilhaAuditoria, ({ one }) => ({
  demanda: one(demandas, {
    fields: [trilhaAuditoria.demanda_id],
    references: [demandas.id],
  }),
}));

export const ativosDadosRelations = relations(ativosDados, ({ one, many }) => ({
  demanda: one(demandas, {
    fields: [ativosDados.demanda_id],
    references: [demandas.id],
  }),
  ativoAnterior: one(ativosDados, {
    fields: [ativosDados.substitui_ativo_id],
    references: [ativosDados.id],
    relationName: 'sucessaoAtivos',
  }),
  versoesSucessoras: many(ativosDados, {
    relationName: 'sucessaoAtivos',
  }),
  diagnosticosQualidade: many(diagnosticosQualidade),
  problemasQualidade: many(problemasQualidade),
}));

export const diagnosticosQualidadeRelations = relations(diagnosticosQualidade, ({ one, many }) => ({
  ativoDados: one(ativosDados, {
    fields: [diagnosticosQualidade.ativo_dados_id],
    references: [ativosDados.id],
  }),
  demanda: one(demandas, {
    fields: [diagnosticosQualidade.demanda_id],
    references: [demandas.id],
  }),
  problemas: many(problemasQualidade),
}));

export const problemasQualidadeRelations = relations(problemasQualidade, ({ one }) => ({
  diagnostico: one(diagnosticosQualidade, {
    fields: [problemasQualidade.diagnostico_id],
    references: [diagnosticosQualidade.id],
  }),
  ativoDados: one(ativosDados, {
    fields: [problemasQualidade.ativo_dados_id],
    references: [ativosDados.id],
  }),
  demanda: one(demandas, {
    fields: [problemasQualidade.demanda_id],
    references: [demandas.id],
  }),
}));


