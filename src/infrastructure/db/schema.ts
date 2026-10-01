import { relations, sql } from 'drizzle-orm';
import { AnySQLiteColumn, index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

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
  categoria_ativo: text('categoria_ativo').notNull().default('BRUTO_RECEBIDO'),
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
/**
 * Regras de Qualidade de Dados (V1 — Subunidade 3.4B / FSD RF-018 e ADR-002)
 * Regras de negócio declaradas pelo analista humano para avaliação determinística sobre um ativo.
 * Não possui exclusão física. Ciclo de vida: ATIVA <-> INATIVA.
 * Cardinalidade: AtivoDados 1 → N RegrasQualidade.
 */
export const regrasQualidade = sqliteTable('regras_qualidade', {
  id: text('id').primaryKey(),
  ativo_dados_id: text('ativo_dados_id')
    .notNull()
    .references(() => ativosDados.id, { onDelete: 'cascade' }),
  tipo: text('tipo').notNull(),
  coluna: text('coluna'),
  colunas: text('colunas').notNull().default('[]'),
  nome: text('nome').notNull(),
  descricao: text('descricao'),
  parametros: text('parametros').notNull().default('{}'),
  status: text('status').notNull().default('ATIVA'),
  versao: integer('versao').notNull().default(1),
  criado_em: text('criado_em').notNull(),
  atualizado_em: text('atualizado_em').notNull(),
});

/**
 * Problemas de Qualidade (V1 — Subunidades 3.4A e 3.4B / FSD CF-07 / RF-018 a RF-022)
 * Anomalias e inconsistências factuais detectadas pelo scanner, violações de regras ou registradas pelo analista.
 * Cardinalidade: DiagnosticoQualidade 0..1 → N ProblemasQualidade (diagnostico_id é anulável para problemas manuais).
 */
export const problemasQualidade = sqliteTable('problemas_qualidade', {
  id: text('id').primaryKey(),
  diagnostico_id: text('diagnostico_id')
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
  regra_id: text('regra_id')
    .references(() => regrasQualidade.id, { onDelete: 'set null' }),
  regra_snapshot: text('regra_snapshot'),
  criado_em: text('criado_em').notNull(),
  atualizado_em: text('atualizado_em').notNull(),
});

/**
 * Receitas de Preparação (V1 — Subunidade 3.5A / Domínio de Preparação)
 * Plano e registro formal auditável de transformações da demanda.
 * Cardinalidade: Demanda 1 → N ReceitasPreparacao.
 */
export const receitasPreparacao = sqliteTable('receitas_preparacao', {
  id: text('id').primaryKey(),
  demanda_id: text('demanda_id')
    .notNull()
    .references(() => demandas.id, { onDelete: 'cascade' }),
  titulo: text('titulo').notNull(),
  descricao: text('descricao'),
  status: text('status').notNull().default('RASCUNHO'),
  versao: integer('versao').notNull().default(1),
  criado_em: text('criado_em').notNull(),
  atualizado_em: text('atualizado_em').notNull(),
}, (table) => ({
  idxReceitasDemanda: index('idx_receitas_demanda').on(table.demanda_id),
}));

/**
 * Etapas de Transformação (V1 — Subunidade 3.5A / Domínio de Preparação)
 * Operações individuais pertencentes a uma receita de preparação.
 * Cardinalidade: ReceitaPreparacao 1 → N EtapasTransformacao.
 */
export const etapasTransformacao = sqliteTable('etapas_transformacao', {
  id: text('id').primaryKey(),
  receita_id: text('receita_id')
    .notNull()
    .references(() => receitasPreparacao.id, { onDelete: 'cascade' }),
  ordem: integer('ordem').notNull(),
  tipo_operacao: text('tipo_operacao').notNull(),
  capacidade_ferramenta: text('capacidade_ferramenta').notNull(),
  ferramenta_nome: text('ferramenta_nome').notNull(),
  ferramenta_versao: text('ferramenta_versao'),
  descricao: text('descricao').notNull(),
  especificacao_tecnica: text('especificacao_tecnica'),
  status: text('status').notNull().default('PLANEJADA'),
  justificativa: text('justificativa'),
  criado_em: text('criado_em').notNull(),
  atualizado_em: text('atualizado_em').notNull(),
}, (table) => ({
  idxEtapasReceitaOrdem: index('idx_etapas_receita_ordem').on(table.receita_id, table.ordem),
}));

/**
 * Associação N:M entre Etapas de Transformação e Problemas de Qualidade (Subunidade 3.5A)
 * Mapeia quais transformações atuam sobre quais problemas e vice-versa.
 * ON DELETE RESTRICT no problema impede exclusão acidental da anomalia vinculada.
 */
export const etapasProblemasQualidade = sqliteTable('etapas_problemas_qualidade', {
  id: text('id').primaryKey(),
  etapa_transformacao_id: text('etapa_transformacao_id')
    .notNull()
    .references(() => etapasTransformacao.id, { onDelete: 'cascade' }),
  problema_qualidade_id: text('problema_qualidade_id')
    .notNull()
    .references(() => problemasQualidade.id, { onDelete: 'restrict' }),
  criado_em: text('criado_em').notNull(),
}, (table) => ({
  idxEtapasProblemasLookup: index('idx_etapas_problemas_lookup').on(table.etapa_transformacao_id, table.problema_qualidade_id),
}));

/**
 * Linhagem de Ativos (V1 — Subunidade 3.5A / Domínio de Preparação)
 * Arestas direcionadas do grafo acíclico de dados (Origem -> Destino).
 * ON DELETE RESTRICT em ambos os polos protege o histórico consumado.
 * ON DELETE RESTRICT na etapa protege a referência histórica imutável.
 */
export const linhagemAtivos = sqliteTable('linhagem_ativos', {
  id: text('id').primaryKey(),
  demanda_id: text('demanda_id')
    .notNull()
    .references(() => demandas.id, { onDelete: 'cascade' }),
  ativo_origem_id: text('ativo_origem_id')
    .notNull()
    .references(() => ativosDados.id, { onDelete: 'restrict' }),
  ativo_destino_id: text('ativo_destino_id')
    .notNull()
    .references(() => ativosDados.id, { onDelete: 'restrict' }),
  etapa_transformacao_id: text('etapa_transformacao_id')
    .references(() => etapasTransformacao.id, { onDelete: 'restrict' }),
  papel_entrada: text('papel_entrada').notNull().default('ORIGEM_UNICA'),
  criado_em: text('criado_em').notNull(),
}, (table) => ({
  idxLinhagemOrigem: index('idx_linhagem_origem').on(table.ativo_origem_id),
  idxLinhagemDestino: index('idx_linhagem_destino').on(table.ativo_destino_id),
  idxLinhagemDemanda: index('idx_linhagem_demanda').on(table.demanda_id),
}));

/**
 * Datasets Autorizados para Análise (V1 — Subunidade 3.5A / Domínio de Preparação)
 * Homologação formal do dataset para alimentar a Fase de Modelagem e Análise.
 * ON DELETE RESTRICT protege o ativo, o diagnóstico atestador e a receita.
 * Índice Único Parcial garante fisicamente que apenas 1 dataset pode estar VIGENTE por demanda.
 */
export const datasetsAutorizados = sqliteTable(
  'datasets_autorizados',
  {
    id: text('id').primaryKey(),
    demanda_id: text('demanda_id')
      .notNull()
      .references(() => demandas.id, { onDelete: 'cascade' }),
    ativo_dados_id: text('ativo_dados_id')
      .notNull()
      .references(() => ativosDados.id, { onDelete: 'restrict' }),
    diagnostico_qualidade_id: text('diagnostico_qualidade_id')
      .notNull()
      .references(() => diagnosticosQualidade.id, { onDelete: 'restrict' }),
    receita_preparacao_id: text('receita_preparacao_id')
      .references(() => receitasPreparacao.id, { onDelete: 'restrict' }),
    versao_rotulo: text('versao_rotulo').notNull(),
    hash_sha256_snapshot: text('hash_sha256_snapshot').notNull(),
    status: text('status').notNull().default('VIGENTE'),
    justificativa_autorizacao: text('justificativa_autorizacao').notNull(),
    autorizado_por_tipo: text('autorizado_por_tipo').notNull().default('HUMANO'),
    restricoes_aceitas_snapshot: text('restricoes_aceitas_snapshot').notNull().default('[]'),
    autorizado_em: text('autorizado_em').notNull(),
    revogado_em: text('revogado_em'),
    motivo_revogacao: text('motivo_revogacao'),
  },
  (table) => ({
    uniqueVigentePorDemanda: uniqueIndex('idx_unique_dataset_autorizado_vigente')
      .on(table.demanda_id)
      .where(sql`status = 'VIGENTE'`),
  })
);

/**
 * Modelos Analíticos (V1 — Subunidade 3.6A / Domínio de Modelagem)
 * Representa a raiz da modelagem dimensional e semântica de uma demanda.
 * Índice Único Parcial garante que apenas 1 modelo pode estar HOMOLOGADO por demanda.
 */
export const modelosAnaliticos = sqliteTable(
  'modelos_analiticos',
  {
    id: text('id').primaryKey(),
    demanda_id: text('demanda_id')
      .notNull()
      .references(() => demandas.id, { onDelete: 'cascade' }),
    dataset_autorizado_id: text('dataset_autorizado_id')
      .notNull()
      .references(() => datasetsAutorizados.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    descricao: text('descricao'),
    tipo_arquitetura: text('tipo_arquitetura').notNull().default('ESTRELA'),
    status: text('status').notNull().default('RASCUNHO'),
    homologado_em: text('homologado_em'),
    homologado_por: text('homologado_por'),
    justificativa_homologacao: text('justificativa_homologacao'),
    revogado_em: text('revogado_em'),
    motivo_revogacao: text('motivo_revogacao'),
    criado_em: text('criado_em').notNull(),
    atualizado_em: text('atualizado_em').notNull(),
  },
  (table) => ({
    uniqueHomologadoPorDemanda: uniqueIndex('idx_unique_modelo_analitico_homologado')
      .on(table.demanda_id)
      .where(sql`status = 'HOMOLOGADO'`),
    demandaIdx: index('idx_modelos_analiticos_demanda').on(table.demanda_id),
    datasetIdx: index('idx_modelos_analiticos_dataset').on(table.dataset_autorizado_id),
  })
);

/**
 * Entidades Analíticas (V1 — Subunidade 3.6A / Domínio de Modelagem)
 * Tabelas conceituais do modelo (Fato ou Dimensão).
 */
export const entidadesAnaliticas = sqliteTable(
  'entidades_analiticas',
  {
    id: text('id').primaryKey(),
    modelo_id: text('modelo_id')
      .notNull()
      .references(() => modelosAnaliticos.id, { onDelete: 'cascade' }),
    ativo_dados_id: text('ativo_dados_id')
      .references(() => ativosDados.id, { onDelete: 'set null' }),
    nome: text('nome').notNull(),
    tipo: text('tipo').notNull(),
    papel: text('papel').notNull().default('DIMENSAO_PADRAO'),
    origem_tipo: text('origem_tipo').notNull().default('DATASET_AUTORIZADO'),
    descricao: text('descricao'),
    ordem_apresentacao: integer('ordem_apresentacao').notNull().default(0),
    criado_em: text('criado_em').notNull(),
    atualizado_em: text('atualizado_em').notNull(),
  },
  (table) => ({
    modeloIdx: index('idx_entidades_analiticas_modelo').on(table.modelo_id),
    ativoIdx: index('idx_entidades_analiticas_ativo').on(table.ativo_dados_id),
  })
);

/**
 * Atributos Analíticos (V1 — Subunidade 3.6A / Domínio de Modelagem)
 * Colunas/campos das entidades com tipagem, papel dimensional e formato.
 */
export const atributosAnaliticos = sqliteTable(
  'atributos_analiticos',
  {
    id: text('id').primaryKey(),
    entidade_id: text('entidade_id')
      .notNull()
      .references(() => entidadesAnaliticas.id, { onDelete: 'cascade' }),
    nome_original: text('nome_original').notNull(),
    nome_amigavel: text('nome_amigavel').notNull(),
    tipo_dado: text('tipo_dado').notNull().default('TEXTO'),
    papel: text('papel').notNull().default('ATRIBUTO_DESCRITIVO'),
    ordem: integer('ordem').notNull().default(0),
    oculto: integer('oculto').notNull().default(0),
    descricao: text('descricao'),
    formato_exibicao: text('formato_exibicao'),
    criado_em: text('criado_em').notNull(),
    atualizado_em: text('atualizado_em').notNull(),
  },
  (table) => ({
    entidadeIdx: index('idx_atributos_analiticos_entidade').on(table.entidade_id),
  })
);

/**
 * Relacionamentos Analíticos (V1 — Subunidade 3.6A / Domínio de Modelagem)
 * Conexões relacionais entre entidades analíticas.
 * Suporta cardinalidade N:M e filtro bidirecional registrando justificativa (M-03).
 */
export const relacionamentosAnaliticos = sqliteTable(
  'relacionamentos_analiticos',
  {
    id: text('id').primaryKey(),
    modelo_id: text('modelo_id')
      .notNull()
      .references(() => modelosAnaliticos.id, { onDelete: 'cascade' }),
    entidade_origem_id: text('entidade_origem_id')
      .notNull()
      .references(() => entidadesAnaliticas.id, { onDelete: 'cascade' }),
    atributo_origem_id: text('atributo_origem_id')
      .notNull()
      .references(() => atributosAnaliticos.id, { onDelete: 'cascade' }),
    entidade_destino_id: text('entidade_destino_id')
      .notNull()
      .references(() => entidadesAnaliticas.id, { onDelete: 'cascade' }),
    atributo_destino_id: text('atributo_destino_id')
      .notNull()
      .references(() => atributosAnaliticos.id, { onDelete: 'cascade' }),
    tipo_relacionamento: text('tipo_relacionamento').notNull().default('MUITOS_PARA_UM'),
    direcao_filtro: text('direcao_filtro').notNull().default('UNIDIRECIONAL'),
    ativo: integer('ativo').notNull().default(1),
    justificativa: text('justificativa'),
    criado_em: text('criado_em').notNull(),
    atualizado_em: text('atualizado_em').notNull(),
  },
  (table) => ({
    modeloIdx: index('idx_relacionamentos_analiticos_modelo').on(table.modelo_id),
    origemIdx: index('idx_relacionamentos_analiticos_origem').on(table.entidade_origem_id),
    destinoIdx: index('idx_relacionamentos_analiticos_destino').on(table.entidade_destino_id),
  })
);

/**
 * Métricas Analíticas (V1 — Subunidade 3.6A / Domínio de Modelagem)
 * Indicadores semânticos com linhagem semântica explícita (Ajuste 5) e rastreabilidade de negócio (Ajuste 6).
 */
export const metricasAnaliticas = sqliteTable(
  'metricas_analiticas',
  {
    id: text('id').primaryKey(),
    modelo_id: text('modelo_id')
      .notNull()
      .references(() => modelosAnaliticos.id, { onDelete: 'cascade' }),
    entidade_id: text('entidade_id')
      .references(() => entidadesAnaliticas.id, { onDelete: 'set null' }),
    nome: text('nome').notNull(),
    descricao: text('descricao'),
    tipo_agregacao: text('tipo_agregacao').notNull().default('SOMA'),
    tipo_aditividade: text('tipo_aditividade').notNull().default('TOTALMENTE_ADITIVA'),
    formula_declarativa: text('formula_declarativa').notNull(),
    unidade_medida: text('unidade_medida').notNull().default('MOEDA'),
    formato_exibicao: text('formato_exibicao'),
    status: text('status').notNull().default('RASCUNHO'),
    atributos_dependentes_ids: text('atributos_dependentes_ids').notNull().default('[]'),
    metricas_dependentes_ids: text('metricas_dependentes_ids').notNull().default('[]'),
    pergunta_negocio_associada: text('pergunta_negocio_associada'),
    objetivo_negocio_associado: text('objetivo_negocio_associado'),
    ordem: integer('ordem').notNull().default(0),
    criado_em: text('criado_em').notNull(),
    atualizado_em: text('atualizado_em').notNull(),
  },
  (table) => ({
    modeloIdx: index('idx_metricas_analiticas_modelo').on(table.modelo_id),
    entidadeIdx: index('idx_metricas_analiticas_entidade').on(table.entidade_id),
  })
);

/**
 * Validações e Conciliações Numéricas (V1 — Subunidade 3.7A / FSD CF-16 e v1-domain-model.md Seção 3.16)
 * Registra testes determinísticos, conciliações numéricas e checks de integridade com tolerância e precisão.
 * Cardinalidade: Demanda 1 → N Validações.
 */
export const validacoesConciliacao = sqliteTable(
  'validacoes_conciliacao',
  {
    id: text('id').primaryKey(),
    demanda_id: text('demanda_id')
      .notNull()
      .references(() => demandas.id, { onDelete: 'cascade' }),
    modelo_id: text('modelo_id')
      .references(() => modelosAnaliticos.id, { onDelete: 'set null' }),
    metrica_id: text('metrica_id')
      .references(() => metricasAnaliticas.id, { onDelete: 'set null' }),
    titulo: text('titulo').notNull(),
    camada: text('camada').notNull(),
    metodo_verificacao: text('metodo_verificacao').notNull(),
    base_referencia: text('base_referencia'),
    valor_esperado: real('valor_esperado'),
    valor_obtido: real('valor_obtido'),
    divergencia_absoluta: real('divergencia_absoluta'),
    divergencia_percentual: real('divergencia_percentual'),
    tolerancia_permitida: real('tolerancia_permitida').notNull().default(0),
    unidade_medida: text('unidade_medida'),
    resultado: text('resultado').notNull().default('PENDENTE_RETESTE'),
    obrigatoria: integer('obrigatoria', { mode: 'boolean' }).notNull().default(true),
    acao_corretiva: text('acao_corretiva'),
    notas_evidencia: text('notas_evidencia'),
    executado_por: text('executado_por'),
    executado_em: text('executado_em'),
    criado_em: text('criado_em').notNull(),
    atualizado_em: text('atualizado_em').notNull(),
  },
  (table) => ({
    demandaIdIdx: index('idx_validacoes_demanda_id').on(table.demanda_id),
    resultadoIdx: index('idx_validacoes_resultado').on(table.resultado),
  })
);

/**
 * Entregáveis Profissionais de Demanda (V1 — Subunidade 3.7A / FSD CF-17 e v1-domain-model.md Seção 3.18)
 * Registra artefatos finais e respectivo aceite formal (com autor, timestamp e justificativa).
 * Cardinalidade: Demanda 1 → N Entregáveis.
 */
export const entregaveisDemanda = sqliteTable(
  'entregaveis_demanda',
  {
    id: text('id').primaryKey(),
    demanda_id: text('demanda_id')
      .notNull()
      .references(() => demandas.id, { onDelete: 'cascade' }),
    titulo: text('titulo').notNull(),
    tipo: text('tipo').notNull(),
    versao: text('versao').notNull().default('1.0'),
    caminho_arquivo_ou_link: text('caminho_arquivo_ou_link').notNull(),
    descricao_sumario: text('descricao_sumario'),
    obrigatorio: integer('obrigatorio', { mode: 'boolean' }).notNull().default(true),
    status: text('status').notNull().default('DISPONIVEL'),
    aceite_status: text('aceite_status').notNull().default('PENDENTE'),
    aceite_justificativa: text('aceite_justificativa'),
    aceite_por: text('aceite_por'),
    aceite_em: text('aceite_em'),
    criado_em: text('criado_em').notNull(),
    atualizado_em: text('atualizado_em').notNull(),
  },
  (table) => ({
    demandaIdIdx: index('idx_entregaveis_demanda_id').on(table.demanda_id),
    aceiteStatusIdx: index('idx_entregaveis_aceite_status').on(table.aceite_status),
  })
);

/**
 * Modelos Power BI (V1 — Subunidade 3.7 / Bloco 7)
 * Representa arquivos .pbix, .pbip ou declaração de isenção de Power BI vinculados à demanda.
 */
export const modelosPowerBi = sqliteTable(
  'modelos_powerbi',
  {
    id: text('id').primaryKey(),
    demanda_id: text('demanda_id')
      .notNull()
      .references(() => demandas.id, { onDelete: 'cascade' }),
    modelo_analitico_id: text('modelo_analitico_id')
      .references(() => modelosAnaliticos.id, { onDelete: 'set null' }),
    nome_arquivo: text('nome_arquivo').notNull(),
    caminho_local: text('caminho_local'),
    tipo_formato: text('tipo_formato').notNull().default('PBIX'),
    status: text('status').notNull().default('EM_DESENVOLVIMENTO'),
    justificativa_isencao: text('justificativa_isencao'),
    hash_sha256: text('hash_sha256'),
    versao_powerbi: text('versao_powerbi'),
    tamanho_bytes: integer('tamanho_bytes').notNull().default(0),
    criado_em: text('criado_em').notNull(),
    atualizado_em: text('atualizado_em').notNull(),
  },
  (table) => ({
    demandaIdIdx: index('idx_modelos_powerbi_demanda_id').on(table.demanda_id),
    modeloAnaliticoIdIdx: index('idx_modelos_powerbi_modelo_analitico_id').on(table.modelo_analitico_id),
  })
);

/**
 * Medidas DAX (V1 — Subunidade 3.7 / Bloco 7)
 * Especificação e código DAX de medidas calculadas associadas ao modelo Power BI.
 */
export const medidasDax = sqliteTable(
  'medidas_dax',
  {
    id: text('id').primaryKey(),
    modelo_powerbi_id: text('modelo_powerbi_id')
      .notNull()
      .references(() => modelosPowerBi.id, { onDelete: 'cascade' }),
    metrica_analitica_id: text('metrica_analitica_id')
      .references(() => metricasAnaliticas.id, { onDelete: 'set null' }),
    nome: text('nome').notNull(),
    tabela_hospedeira: text('tabela_hospedeira').notNull().default('_Medidas'),
    expressao_dax: text('expressao_dax').notNull(),
    descricao: text('descricao'),
    formato_string: text('formato_string'),
    categoria_dax: text('categoria_dax').notNull().default('AGREGACAO_SIMPLES'),
    ordem: integer('ordem').notNull().default(0),
    criado_em: text('criado_em').notNull(),
    atualizado_em: text('atualizado_em').notNull(),
  },
  (table) => ({
    modeloPowerBiIdIdx: index('idx_medidas_dax_modelo_powerbi_id').on(table.modelo_powerbi_id),
    metricaAnaliticaIdIdx: index('idx_medidas_dax_metrica_id').on(table.metrica_analitica_id),
  })
);

/**
 * Páginas de Relatório (V1 — Subunidade 3.7 / Bloco 7)
 * Especificação e organização das páginas/telas do relatório do dashboard.
 */
export const paginasRelatorio = sqliteTable(
  'paginas_relatorio',
  {
    id: text('id').primaryKey(),
    modelo_powerbi_id: text('modelo_powerbi_id')
      .notNull()
      .references(() => modelosPowerBi.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    ordem: integer('ordem').notNull().default(0),
    objetivo_analitico: text('objetivo_analitico'),
    publico_alvo: text('publico_alvo').notNull().default('EXECUTIVO'),
    layout_grid: text('layout_grid').notNull().default('PADRAO_16_9'),
    criado_em: text('criado_em').notNull(),
    atualizado_em: text('atualizado_em').notNull(),
  },
  (table) => ({
    modeloPowerBiIdIdx: index('idx_paginas_relatorio_modelo_id').on(table.modelo_powerbi_id),
  })
);

/**
 * Visuais do Dashboard (V1 — Subunidade 3.7 / Bloco 7)
 * Especificação dos elementos gráficos do dashboard com justificativa de Data Viz.
 */
export const visuaisDashboard = sqliteTable(
  'visuais_dashboard',
  {
    id: text('id').primaryKey(),
    pagina_id: text('pagina_id')
      .notNull()
      .references(() => paginasRelatorio.id, { onDelete: 'cascade' }),
    titulo: text('titulo').notNull(),
    tipo_visual: text('tipo_visual').notNull().default('CARTAO_KPI'),
    posicao_layout: text('posicao_layout').notNull().default('CENTRAL_TENDENCIAS'),
    medidas_utilizadas_ids: text('medidas_utilizadas_ids').notNull().default('[]'),
    atributos_utilizados_ids: text('atributos_utilizados_ids').notNull().default('[]'),
    justificativa_dataviz: text('justificativa_dataviz'),
    ordem: integer('ordem').notNull().default(0),
    criado_em: text('criado_em').notNull(),
    atualizado_em: text('atualizado_em').notNull(),
  },
  (table) => ({
    paginaIdIdx: index('idx_visuais_dashboard_pagina_id').on(table.pagina_id),
  })
);

/**
 * Evidências Analíticas (V1 — Subunidade 3.8 / Bloco 8 — Evidence Core)
 * Infraestrutura canônica para registro, persistência, consulta e auditoria de evidências.
 */
export const evidenciasAnaliticas = sqliteTable(
  'evidencias_analiticas',
  {
    id: text('id').primaryKey(),
    demanda_id: text('demanda_id')
      .notNull()
      .references(() => demandas.id, { onDelete: 'cascade' }),
    projeto_id: text('projeto_id')
      .references(() => projetos.id, { onDelete: 'set null' }),
    tipo: text('tipo').notNull().default('DADOS'),
    etapa_origem: text('etapa_origem').notNull().default('DADOS'),
    artefato_origem_tipo: text('artefato_origem_tipo'),
    artefato_origem_id: text('artefato_origem_id'),
    titulo: text('titulo').notNull(),
    descricao: text('descricao').notNull(),
    fato_observado: text('fato_observado').notNull(),
    estado_anterior: text('estado_anterior'),
    acao_registrada: text('acao_registrada').notNull(),
    estado_posterior: text('estado_posterior'),
    resultado_mensuravel: text('resultado_mensuravel'),
    inferencia_recomendacao: text('inferencia_recomendacao'),
    decisao_humana: text('decisao_humana'),
    metodo_captura: text('metodo_captura').notNull().default('MANUAL'),
    status_validacao: text('status_validacao').notNull().default('CAPTURADA'),
    classificacao_exposicao: text('classificacao_exposicao').notNull().default('INTERNA'),
    elegibilidade_portfolio: integer('elegibilidade_portfolio', { mode: 'boolean' }).notNull().default(false),
    executor: text('executor').notNull().default('ANALISTA'),
    metadados: text('metadados'),
    criado_em: text('criado_em').notNull(),
    atualizado_em: text('atualizado_em').notNull(),
  },
  (table) => ({
    demandaIdIdx: index('idx_evidencias_analiticas_demanda_id').on(table.demanda_id),
    projetoIdIdx: index('idx_evidencias_analiticas_projeto_id').on(table.projeto_id),
    tipoIdx: index('idx_evidencias_analiticas_tipo').on(table.tipo),
    statusIdx: index('idx_evidencias_analiticas_status').on(table.status_validacao),
  })
);

/**
 * Event Log de Eventos Analíticos (V1 — Subunidade 3.8 / Bloco 8 — Evidence Event Engine)
 * Rastreabilidade, histórico de processamento e chave de idempotência de eventos analíticos.
 */
export const eventosAnaliticosLog = sqliteTable(
  'eventos_analiticos_log',
  {
    id: text('id').primaryKey(),
    id_evento: text('id_evento').notNull().unique(),
    demanda_id: text('demanda_id')
      .notNull()
      .references(() => demandas.id, { onDelete: 'cascade' }),
    projeto_id: text('projeto_id')
      .references(() => projetos.id, { onDelete: 'set null' }),
    tipo_evento: text('tipo_evento').notNull(),
    etapa_origem: text('etapa_origem').notNull(),
    politica_aplicada: text('politica_aplicada').notNull(),
    status_processamento: text('status_processamento').notNull(),
    evidencia_gerada_id: text('evidencia_gerada_id')
      .references(() => evidenciasAnaliticas.id, { onDelete: 'set null' }),
    correlation_id: text('correlation_id'),
    causation_id: text('causation_id'),
    motivo: text('motivo'),
    erro_detalhe: text('erro_detalhe'),
    payload_snapshot: text('payload_snapshot'),
    processado_em: text('processado_em').notNull(),
  },
  (table) => ({
    demandaIdIdx: index('idx_eventos_analiticos_log_demanda_id').on(table.demanda_id),
    tipoEventoIdx: index('idx_eventos_analiticos_log_tipo').on(table.tipo_evento),
    idEventoIdx: index('idx_eventos_analiticos_log_id_evento').on(table.id_evento),
  })
);


/**
 * Relacionamentos declarativos Drizzle ORM
 */
export const projetosRelations = relations(projetos, ({ many }) => ({
  demandas: many(demandas),
  evidencias: many(evidenciasAnaliticas),
  eventosLog: many(eventosAnaliticosLog),
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
  receitasPreparacao: many(receitasPreparacao),
  linhagemAtivos: many(linhagemAtivos),
  datasetsAutorizados: many(datasetsAutorizados),
  modelosAnaliticos: many(modelosAnaliticos),
  validacoesConciliacao: many(validacoesConciliacao),
  entregaveisDemanda: many(entregaveisDemanda),
  modelosPowerBi: many(modelosPowerBi),
  evidencias: many(evidenciasAnaliticas),
  eventosLog: many(eventosAnaliticosLog),
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
  regrasQualidade: many(regrasQualidade),
  linhagensComoOrigem: many(linhagemAtivos, {
    relationName: 'linhagemOrigem',
  }),
  linhagensComoDestino: many(linhagemAtivos, {
    relationName: 'linhagemDestino',
  }),
  datasetsAutorizados: many(datasetsAutorizados),
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
  datasetsAutorizados: many(datasetsAutorizados),
}));

export const regrasQualidadeRelations = relations(regrasQualidade, ({ one, many }) => ({
  ativoDados: one(ativosDados, {
    fields: [regrasQualidade.ativo_dados_id],
    references: [ativosDados.id],
  }),
  problemas: many(problemasQualidade),
}));

export const problemasQualidadeRelations = relations(problemasQualidade, ({ one, many }) => ({
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
  regra: one(regrasQualidade, {
    fields: [problemasQualidade.regra_id],
    references: [regrasQualidade.id],
  }),
  etapasPreparacao: many(etapasProblemasQualidade),
}));

export const receitasPreparacaoRelations = relations(receitasPreparacao, ({ one, many }) => ({
  demanda: one(demandas, {
    fields: [receitasPreparacao.demanda_id],
    references: [demandas.id],
  }),
  etapas: many(etapasTransformacao),
  datasetsAutorizados: many(datasetsAutorizados),
}));

export const etapasTransformacaoRelations = relations(etapasTransformacao, ({ one, many }) => ({
  receita: one(receitasPreparacao, {
    fields: [etapasTransformacao.receita_id],
    references: [receitasPreparacao.id],
  }),
  problemasVinculados: many(etapasProblemasQualidade),
  linhagens: many(linhagemAtivos),
}));

export const etapasProblemasQualidadeRelations = relations(etapasProblemasQualidade, ({ one }) => ({
  etapa: one(etapasTransformacao, {
    fields: [etapasProblemasQualidade.etapa_transformacao_id],
    references: [etapasTransformacao.id],
  }),
  problema: one(problemasQualidade, {
    fields: [etapasProblemasQualidade.problema_qualidade_id],
    references: [problemasQualidade.id],
  }),
}));

export const linhagemAtivosRelations = relations(linhagemAtivos, ({ one }) => ({
  demanda: one(demandas, {
    fields: [linhagemAtivos.demanda_id],
    references: [demandas.id],
  }),
  ativoOrigem: one(ativosDados, {
    fields: [linhagemAtivos.ativo_origem_id],
    references: [ativosDados.id],
    relationName: 'linhagemOrigem',
  }),
  ativoDestino: one(ativosDados, {
    fields: [linhagemAtivos.ativo_destino_id],
    references: [ativosDados.id],
    relationName: 'linhagemDestino',
  }),
  etapa: one(etapasTransformacao, {
    fields: [linhagemAtivos.etapa_transformacao_id],
    references: [etapasTransformacao.id],
  }),
}));

export const datasetsAutorizadosRelations = relations(datasetsAutorizados, ({ one, many }) => ({
  demanda: one(demandas, {
    fields: [datasetsAutorizados.demanda_id],
    references: [demandas.id],
  }),
  ativoDados: one(ativosDados, {
    fields: [datasetsAutorizados.ativo_dados_id],
    references: [ativosDados.id],
  }),
  diagnosticoQualidade: one(diagnosticosQualidade, {
    fields: [datasetsAutorizados.diagnostico_qualidade_id],
    references: [diagnosticosQualidade.id],
  }),
  receitaPreparacao: one(receitasPreparacao, {
    fields: [datasetsAutorizados.receita_preparacao_id],
    references: [receitasPreparacao.id],
  }),
  modelosAnaliticos: many(modelosAnaliticos),
}));

export const modelosAnaliticosRelations = relations(modelosAnaliticos, ({ one, many }) => ({
  demanda: one(demandas, {
    fields: [modelosAnaliticos.demanda_id],
    references: [demandas.id],
  }),
  datasetAutorizado: one(datasetsAutorizados, {
    fields: [modelosAnaliticos.dataset_autorizado_id],
    references: [datasetsAutorizados.id],
  }),
  entidades: many(entidadesAnaliticas),
  relacionamentos: many(relacionamentosAnaliticos),
  metricas: many(metricasAnaliticas),
  modelosPowerBi: many(modelosPowerBi),
}));

export const entidadesAnaliticasRelations = relations(entidadesAnaliticas, ({ one, many }) => ({
  modelo: one(modelosAnaliticos, {
    fields: [entidadesAnaliticas.modelo_id],
    references: [modelosAnaliticos.id],
  }),
  ativoDados: one(ativosDados, {
    fields: [entidadesAnaliticas.ativo_dados_id],
    references: [ativosDados.id],
  }),
  atributos: many(atributosAnaliticos),
  metricas: many(metricasAnaliticas),
}));

export const atributosAnaliticosRelations = relations(atributosAnaliticos, ({ one }) => ({
  entidade: one(entidadesAnaliticas, {
    fields: [atributosAnaliticos.entidade_id],
    references: [entidadesAnaliticas.id],
  }),
}));

export const relacionamentosAnaliticosRelations = relations(relacionamentosAnaliticos, ({ one }) => ({
  modelo: one(modelosAnaliticos, {
    fields: [relacionamentosAnaliticos.modelo_id],
    references: [modelosAnaliticos.id],
  }),
  entidadeOrigem: one(entidadesAnaliticas, {
    fields: [relacionamentosAnaliticos.entidade_origem_id],
    references: [entidadesAnaliticas.id],
    relationName: 'relacionamentoOrigem',
  }),
  atributoOrigem: one(atributosAnaliticos, {
    fields: [relacionamentosAnaliticos.atributo_origem_id],
    references: [atributosAnaliticos.id],
    relationName: 'atributoOrigem',
  }),
  entidadeDestino: one(entidadesAnaliticas, {
    fields: [relacionamentosAnaliticos.entidade_destino_id],
    references: [entidadesAnaliticas.id],
    relationName: 'relacionamentoDestino',
  }),
  atributoDestino: one(atributosAnaliticos, {
    fields: [relacionamentosAnaliticos.atributo_destino_id],
    references: [atributosAnaliticos.id],
    relationName: 'atributoDestino',
  }),
}));

export const metricasAnaliticasRelations = relations(metricasAnaliticas, ({ one, many }) => ({
  modelo: one(modelosAnaliticos, {
    fields: [metricasAnaliticas.modelo_id],
    references: [modelosAnaliticos.id],
  }),
  entidade: one(entidadesAnaliticas, {
    fields: [metricasAnaliticas.entidade_id],
    references: [entidadesAnaliticas.id],
  }),
  medidasDax: many(medidasDax),
}));

export const validacoesConciliacaoRelations = relations(validacoesConciliacao, ({ one }) => ({
  demanda: one(demandas, {
    fields: [validacoesConciliacao.demanda_id],
    references: [demandas.id],
  }),
  modelo: one(modelosAnaliticos, {
    fields: [validacoesConciliacao.modelo_id],
    references: [modelosAnaliticos.id],
  }),
  metrica: one(metricasAnaliticas, {
    fields: [validacoesConciliacao.metrica_id],
    references: [metricasAnaliticas.id],
  }),
}));

export const entregaveisDemandaRelations = relations(entregaveisDemanda, ({ one }) => ({
  demanda: one(demandas, {
    fields: [entregaveisDemanda.demanda_id],
    references: [demandas.id],
  }),
}));

export const modelosPowerBiRelations = relations(modelosPowerBi, ({ one, many }) => ({
  demanda: one(demandas, {
    fields: [modelosPowerBi.demanda_id],
    references: [demandas.id],
  }),
  modeloAnalitico: one(modelosAnaliticos, {
    fields: [modelosPowerBi.modelo_analitico_id],
    references: [modelosAnaliticos.id],
  }),
  medidas: many(medidasDax),
  paginas: many(paginasRelatorio),
}));

export const medidasDaxRelations = relations(medidasDax, ({ one }) => ({
  modeloPowerBi: one(modelosPowerBi, {
    fields: [medidasDax.modelo_powerbi_id],
    references: [modelosPowerBi.id],
  }),
  metricaAnalitica: one(metricasAnaliticas, {
    fields: [medidasDax.metrica_analitica_id],
    references: [metricasAnaliticas.id],
  }),
}));

export const paginasRelatorioRelations = relations(paginasRelatorio, ({ one, many }) => ({
  modeloPowerBi: one(modelosPowerBi, {
    fields: [paginasRelatorio.modelo_powerbi_id],
    references: [modelosPowerBi.id],
  }),
  visuais: many(visuaisDashboard),
}));

export const visuaisDashboardRelations = relations(visuaisDashboard, ({ one }) => ({
  pagina: one(paginasRelatorio, {
    fields: [visuaisDashboard.pagina_id],
    references: [paginasRelatorio.id],
  }),
}));

export const evidenciasAnaliticasRelations = relations(evidenciasAnaliticas, ({ one }) => ({
  demanda: one(demandas, {
    fields: [evidenciasAnaliticas.demanda_id],
    references: [demandas.id],
  }),
  projeto: one(projetos, {
    fields: [evidenciasAnaliticas.projeto_id],
    references: [projetos.id],
  }),
}));

export const eventosAnaliticosLogRelations = relations(eventosAnaliticosLog, ({ one }) => ({
  demanda: one(demandas, {
    fields: [eventosAnaliticosLog.demanda_id],
    references: [demandas.id],
  }),
  projeto: one(projetos, {
    fields: [eventosAnaliticosLog.projeto_id],
    references: [projetos.id],
  }),
  evidenciaGerada: one(evidenciasAnaliticas, {
    fields: [eventosAnaliticosLog.evidencia_gerada_id],
    references: [evidenciasAnaliticas.id],
  }),
}));
