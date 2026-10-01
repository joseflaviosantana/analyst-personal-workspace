import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import fs from 'fs';
import * as schema from '@/infrastructure/db/schema';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteRequisitoDemandaRepository } from '@/infrastructure/db/repositories/sqlite-requisito-repository';
import { SqlitePerguntaClarificacaoRepository } from '@/infrastructure/db/repositories/sqlite-pergunta-clarificacao-repository';
import { CategoriaRequisito } from '@/core/domain/enums/categoria-requisito';
import { StatusRequisito } from '@/core/domain/enums/status-requisito';
import { StatusPerguntaClarificacao } from '@/core/domain/enums/status-pergunta-clarificacao';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';

describe('Integration Tests: Persistência SQLite de Requisitos e Perguntas (Bloco 3.8)', () => {
  const testDbDir = path.join(process.cwd(), '.workspace', 'data');
  const testDbPath = path.join(testDbDir, 'test_requirements_persistence_38.db');
  let sqliteDb: Database.Database;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let projectRepo: SqliteProjectRepository;
  let demandRepo: SqliteDemandRepository;
  let requisitoRepo: SqliteRequisitoDemandaRepository;
  let perguntaRepo: SqlitePerguntaClarificacaoRepository;

  const projetoId = 'prj_req_pers_1';
  const demandaId = 'dem_req_pers_1';

  beforeAll(async () => {
    if (!fs.existsSync(testDbDir)) {
      fs.mkdirSync(testDbDir, { recursive: true });
    }
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch {}
    }

    sqliteDb = new Database(testDbPath);
    sqliteDb.pragma('foreign_keys = ON');
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('synchronous = NORMAL');
    sqliteDb.pragma('busy_timeout = 5000');

    db = drizzle(sqliteDb, { schema });
    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    migrate(db, { migrationsFolder });

    projectRepo = new SqliteProjectRepository(db);
    demandRepo = new SqliteDemandRepository(db);
    requisitoRepo = new SqliteRequisitoDemandaRepository(db);
    perguntaRepo = new SqlitePerguntaClarificacaoRepository(db);

    // Seed de Projeto e Demanda
    const now = new Date().toISOString();
    await projectRepo.create({
      id: projetoId,
      nome: 'Projeto Requisitos',
      descricao: 'Projeto para testes de persistência da Aba 2',
      status: 'ATIVO',
      data_inicio: now,
      data_conclusao_prevista: null,
      data_conclusao_real: null,
      criado_em: now,
      atualizado_em: now,
    });

    await demandRepo.create({
      id: demandaId,
      projeto_id: projetoId,
      titulo: 'Demanda de Teste de Persistência',
      solicitacao_bruta: 'Solicitação bruta inalterável para conferência.',
      contexto: 'Contexto inicial',
      objetivo_inicial: 'Objetivo analítico delimitado',
      prazo_esperado: '2026-11-01',
      restricoes_declaradas: 'Restrições técnicas',
      estado: EstadoDemanda.EM_CLARIFICACAO,
      data_conclusao: null,
      criado_em: now,
      atualizado_em: now,
    });
  });

  afterAll(() => {
    try {
      if (sqliteDb) sqliteDb.close();
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    } catch {}
  });

  it('deve persistir e recuperar requisitos analíticos com integridade', async () => {
    const now = new Date().toISOString();
    const req1 = await requisitoRepo.create({
      id: 'req_pers_1',
      demanda_id: demandaId,
      titulo: 'Margem de Contribuição por Canal',
      descricao: 'Fórmula: (Receita - Custo Direto) / Receita',
      categoria: CategoriaRequisito.METRICA_KPI,
      prioridade: 'OBRIGATORIO',
      status: StatusRequisito.IDENTIFICADO,
      origem: 'MANUAL',
      criado_em: now,
      atualizado_em: now,
    });

    expect(req1.id).toBe('req_pers_1');

    const recuperados = await requisitoRepo.findByDemandId(demandaId);
    expect(recuperados).toHaveLength(1);
    expect(recuperados[0].titulo).toBe('Margem de Contribuição por Canal');
    expect(recuperados[0].categoria).toBe(CategoriaRequisito.METRICA_KPI);
    expect(recuperados[0].prioridade).toBe('OBRIGATORIO');

    // Atualizar status
    const atualizado = await requisitoRepo.update('req_pers_1', {
      status: StatusRequisito.ATENDIDO,
    });
    expect(atualizado?.status).toBe(StatusRequisito.ATENDIDO);

    // Contagem
    const total = await requisitoRepo.countByDemandId(demandaId);
    expect(total).toBe(1);
  });

  it('deve persistir e recuperar perguntas de clarificação com respostas e impactos', async () => {
    const now = new Date().toISOString();
    const perg1 = await perguntaRepo.create({
      id: 'perg_pers_1',
      demanda_id: demandaId,
      requisito_id: 'req_pers_1',
      pergunta: 'Quais filiais operam com custos indiretos centralizados?',
      motivacao: 'Rateio analítico na etapa de preparação',
      bloqueante: true,
      status: StatusPerguntaClarificacao.RASCUNHO,
      enviada_em: null,
      resposta: null,
      respondido_por: null,
      respondida_em: null,
      impacto_decisao: null,
      criado_em: now,
      atualizado_em: now,
    });

    expect(perg1.id).toBe('perg_pers_1');

    // Despachar (ENVIADA)
    const enviadaEm = new Date().toISOString();
    await perguntaRepo.update('perg_pers_1', {
      status: StatusPerguntaClarificacao.ENVIADA,
      enviada_em: enviadaEm,
    });

    // Registrar Resposta
    const respondidaEm = new Date().toISOString();
    const respondida = await perguntaRepo.update('perg_pers_1', {
      status: StatusPerguntaClarificacao.RESPONDIDA,
      resposta: 'Todas as filiais do estado de SP utilizam custo centralizado.',
      respondido_por: 'Coordenador de Controladoria',
      respondida_em: respondidaEm,
      impacto_decisao: 'Aplicar rateio no pipeline de preparação para SP.',
    });

    expect(respondida?.status).toBe(StatusPerguntaClarificacao.RESPONDIDA);
    expect(respondida?.resposta).toContain('Todas as filiais');
    expect(respondida?.respondido_por).toBe('Coordenador de Controladoria');
    expect(respondida?.respondida_em).toBe(respondidaEm);
    expect(respondida?.impacto_decisao).toContain('Aplicar rateio');

    // Verificação de perguntas bloqueantes pendentes (deve ser zero agora)
    const bloqueantesPendentes = await perguntaRepo.countBloqueantesPendentes(demandaId);
    expect(bloqueantesPendentes).toBe(0);
  });

  it('deve persistir os novos campos de briefing e de homologação humana na tabela demandas', async () => {
    const homologadoEm = '2026-10-01T16:00:00.000Z';
    const updatedDemand = await demandRepo.update(demandaId, {
      periodo_analise: '2024-2026',
      granularidade: 'Diária por SKU e Loja',
      formato_entrega: 'Dashboard Power BI com Atualização Automática',
      requisitos_homologados_em: homologadoEm,
      requisitos_homologados_por: 'Analista de BI Principal',
      requisitos_justificativa_homologacao: 'Briefing e perguntas de negócio completamente alinhados com o contratante.',
      requisitos_ressalvas: 'Nenhuma ressalva pendente.',
    });

    expect(updatedDemand?.periodo_analise).toBe('2024-2026');
    expect(updatedDemand?.granularidade).toBe('Diária por SKU e Loja');
    expect(updatedDemand?.formato_entrega).toBe('Dashboard Power BI com Atualização Automática');
    expect(updatedDemand?.requisitos_homologados_em).toBe(homologadoEm);
    expect(updatedDemand?.requisitos_homologados_por).toBe('Analista de BI Principal');
    expect(updatedDemand?.requisitos_justificativa_homologacao).toContain('Briefing e perguntas');
    expect(updatedDemand?.requisitos_ressalvas).toBe('Nenhuma ressalva pendente.');

    // Consulta direta para confirmar persistência física
    const recuperada = await demandRepo.findById(demandaId);
    expect(recuperada).not.toBeNull();
    expect(recuperada?.requisitos_homologados_em).toBe(homologadoEm);
    expect(recuperada?.requisitos_homologados_por).toBe('Analista de BI Principal');
  });
});
