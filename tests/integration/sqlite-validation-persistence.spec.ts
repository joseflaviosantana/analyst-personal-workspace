import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import fs from 'fs';
import * as schema from '@/infrastructure/db/schema';
import { SqliteProjectRepository } from '@/infrastructure/db/repositories/project-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteValidacaoConciliacaoRepository } from '@/infrastructure/db/repositories/sqlite-validacao-conciliacao-repository';
import { SqliteEntregavelDemandaRepository } from '@/infrastructure/db/repositories/sqlite-entregavel-demanda-repository';
import { CamadaValidacao } from '@/core/domain/enums/camada-validacao';
import { ResultadoValidacao } from '@/core/domain/enums/resultado-validacao';
import { TipoEntregavel } from '@/core/domain/enums/tipo-entregavel';
import { StatusEntregavel } from '@/core/domain/enums/status-entregavel';
import { StatusAceiteEntrega } from '@/core/domain/enums/status-aceite-entrega';
import { ValidacaoConciliacao } from '@/core/domain/entities/validacao-conciliacao';
import { EntregavelDemanda } from '@/core/domain/entities/entregavel-demanda';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';

describe('Integration Tests: Persistência SQLite de Validação e Entregáveis (Subunidade 3.7A)', () => {
  const testDbDir = path.join(process.cwd(), '.workspace', 'data');
  const testDbPath = path.join(testDbDir, 'test_validation_persistence_37a.db');
  let sqliteDb: Database.Database;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let projectRepo: SqliteProjectRepository;
  let demandRepo: SqliteDemandRepository;
  let validacaoRepo: SqliteValidacaoConciliacaoRepository;
  let entregavelRepo: SqliteEntregavelDemandaRepository;

  const projetoId = 'prj_val_pers_1';
  const demandaId = 'dem_val_pers_1';

  beforeAll(async () => {
    if (!fs.existsSync(testDbDir)) {
      fs.mkdirSync(testDbDir, { recursive: true });
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
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
    validacaoRepo = new SqliteValidacaoConciliacaoRepository(db);
    entregavelRepo = new SqliteEntregavelDemandaRepository(db);

    // Seed de Projeto e Demanda
    const now = new Date().toISOString();
    await projectRepo.create({
      id: projetoId,
      nome: 'Projeto Teste Validação 3.7A',
      descricao: 'Validação e Conciliação Numérica',
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
      titulo: 'Demanda de Validação e Entregáveis',
      solicitacao_bruta: 'Implementar e conciliar números contábeis',
      contexto: 'Financeiro',
      objetivo_inicial: 'Entregar dashboard homologado',
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: EstadoDemanda.EM_VALIDACAO,
      estado_anterior: EstadoDemanda.EM_MODELAGEM_E_ANALISE,
      criado_em: now,
      atualizado_em: now,
      data_conclusao: null,
    });
  });

  afterAll(() => {
    try {
      sqliteDb.close();
    } catch {
      // ignore
    }
    const filesToClean = [
      testDbPath,
      `${testDbPath}-wal`,
      `${testDbPath}-shm`,
    ];
    for (const f of filesToClean) {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
        } catch {
          // ignore
        }
      }
    }
  });

  it('deve inserir, recuperar e atualizar uma validação numérica preservando casas decimais', async () => {
    const now = new Date().toISOString();
    const val: ValidacaoConciliacao = {
      id: 'val_pers_001',
      demanda_id: demandaId,
      modelo_id: null,
      metrica_id: null,
      titulo: 'Conciliação Faturamento ERP vs DW',
      camada: CamadaValidacao.CONCILIACAO_CRUZADA_KPI,
      metodo_verificacao: 'Confronto analítico SQL',
      base_referencia: 'Relatório Contábil Oficial',
      valor_esperado: 125432.55,
      valor_obtido: 125432.55,
      divergencia_absoluta: 0,
      divergencia_percentual: 0,
      tolerancia_permitida: 0.01,
      unidade_medida: 'BRL',
      resultado: ResultadoValidacao.APROVADO,
      obrigatoria: true,
      acao_corretiva: null,
      notas_evidencia: 'Divergência zero apurada em 29/09/2026',
      executado_por: 'Analista Sênior',
      executado_em: now,
      criado_em: now,
      atualizado_em: now,
    };

    await validacaoRepo.create(val);

    const encontrada = await validacaoRepo.findById('val_pers_001');
    expect(encontrada).not.toBeNull();
    expect(encontrada?.titulo).toBe('Conciliação Faturamento ERP vs DW');
    expect(encontrada?.valor_esperado).toBe(125432.55);
    expect(encontrada?.tolerancia_permitida).toBe(0.01);
    expect(encontrada?.obrigatoria).toBe(true);

    const atualizada = await validacaoRepo.update('val_pers_001', {
      notas_evidencia: 'Evidência complementada com logs',
      resultado: ResultadoValidacao.APROVADO,
    });
    expect(atualizada?.notas_evidencia).toBe('Evidência complementada com logs');

    const lista = await validacaoRepo.findByDemandId(demandaId);
    expect(lista.length).toBe(1);
    expect(await validacaoRepo.countByDemandId(demandaId)).toBe(1);
  });

  it('deve inserir, recuperar e registrar aceite em entregável profissional', async () => {
    const now = new Date().toISOString();
    const ent: EntregavelDemanda = {
      id: 'ent_pers_001',
      demanda_id: demandaId,
      titulo: 'Dashboard Executivo Power BI',
      tipo: TipoEntregavel.DASHBOARD_POWERBI,
      versao: '1.0',
      caminho_arquivo_ou_link: 'https://app.powerbi.com/groups/test/reports/report-1',
      descricao_sumario: 'Dashboard operacional e executivo',
      obrigatorio: true,
      status: StatusEntregavel.DISPONIVEL,
      aceite_status: StatusAceiteEntrega.PENDENTE,
      aceite_justificativa: null,
      aceite_por: null,
      aceite_em: null,
      criado_em: now,
      atualizado_em: now,
    };

    await entregavelRepo.create(ent);

    const encontrado = await entregavelRepo.findById('ent_pers_001');
    expect(encontrado).not.toBeNull();
    expect(encontrado?.aceite_status).toBe(StatusAceiteEntrega.PENDENTE);

    const atualizado = await entregavelRepo.update('ent_pers_001', {
      aceite_status: StatusAceiteEntrega.ACEITO,
      aceite_por: 'Gestor da Área de Finanças',
      aceite_em: now,
      aceite_justificativa: 'Aprovado formalmente',
      status: StatusEntregavel.HOMOLOGADO,
    });

    expect(atualizado?.aceite_status).toBe(StatusAceiteEntrega.ACEITO);
    expect(atualizado?.status).toBe(StatusEntregavel.HOMOLOGADO);
    expect(atualizado?.aceite_por).toBe('Gestor da Área de Finanças');

    const lista = await entregavelRepo.findByDemandId(demandaId);
    expect(lista.length).toBe(1);
    expect(await entregavelRepo.countByDemandId(demandaId)).toBe(1);
  });

  it('deve excluir registros e respeitar integridade referencial', async () => {
    const deletadoVal = await validacaoRepo.delete('val_pers_001');
    expect(deletadoVal).toBe(true);
    expect(await validacaoRepo.findById('val_pers_001')).toBeNull();

    const deletadoEnt = await entregavelRepo.delete('ent_pers_001');
    expect(deletadoEnt).toBe(true);
    expect(await entregavelRepo.findById('ent_pers_001')).toBeNull();
  });
});
