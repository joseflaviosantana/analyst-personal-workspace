import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import * as schema from '@/infrastructure/db/schema';
import { SqliteEstudoCasoPortfolioRepository } from '@/infrastructure/db/repositories/sqlite-estudo-caso-portfolio-repository';
import { SqliteAtivoAprendizadoRepository } from '@/infrastructure/db/repositories/sqlite-ativo-aprendizado-repository';
import { EstudoCasoPortfolio } from '@/core/domain/entities/estudo-caso-portfolio';
import { StatusEstudoCaso } from '@/core/domain/enums/status-estudo-caso';
import { TecnicaSanitizacao } from '@/core/domain/enums/tecnica-sanitizacao';
import { CategoriaAtivoAprendizado } from '@/core/domain/enums/categoria-ativo-aprendizado';

describe('Integration: Persistência SQLite de Estudo de Caso e Ativos de Aprendizado (Aba 11)', () => {
  let sqlite: Database.Database;
  let testDb: ReturnType<typeof drizzle<typeof schema>>;
  let caseRepo: SqliteEstudoCasoPortfolioRepository;
  let ativoRepo: SqliteAtivoAprendizadoRepository;

  beforeEach(() => {
    sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');

    testDb = drizzle(sqlite, { schema });

    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    migrate(testDb, { migrationsFolder });

    caseRepo = new SqliteEstudoCasoPortfolioRepository(testDb as any);
    ativoRepo = new SqliteAtivoAprendizadoRepository(testDb as any);

    // Cria projeto e demanda base para integridade referencial
    const now = new Date().toISOString();
    testDb.insert(schema.projetos).values({
      id: 'proj-int-001',
      nome: 'Projeto Integração Portfólio',
      status: 'ATIVO',
      criado_em: now,
      atualizado_em: now,
    }).run();

    testDb.insert(schema.demandas).values({
      id: 'dem-int-001',
      projeto_id: 'proj-int-001',
      titulo: 'Demanda de Integração de Portfólio',
      solicitacao_bruta: 'Texto bruto',
      estado: 'CONCLUIDA',
      criado_em: now,
      atualizado_em: now,
    }).run();
  });

  afterEach(() => {
    sqlite.close();
  });

  it('deve persistir, consultar, atualizar e excluir EstudoCasoPortfolio com campos JSON mapeados', async () => {
    const now = new Date().toISOString();
    const caseEntity: EstudoCasoPortfolio = {
      id: 'case-int-001',
      demanda_id: 'dem-int-001',
      projeto_id: 'proj-int-001',
      titulo: 'Estudo de Caso Analítico Integrado',
      problema_negocio: 'Problema de integração',
      processo_preparacao: 'Processo de preparação com Power Query',
      modelagem_decisoes: 'Modelagem com Star Schema',
      validacao_resultados: 'Resultados validados',
      competencias_demonstradas: ['BI', 'DAX', 'SQL'],
      ferramentas_utilizadas: ['Power BI', 'Excel'],
      metricas_fatos: [
        {
          rotulo: 'Margem Líquida',
          expressaoSanitizada: '+14.2%',
          impactoOuConclusao: 'Crescimento comprovado',
        },
      ],
      tecnicas_sanitizacao: [TecnicaSanitizacao.ANONIMIZACAO, TecnicaSanitizacao.INDEXACAO],
      checklist_sanitizacao: {
        nomesClientesOcultados: true,
        dadosPessoaisOcultados: true,
        dadosFinanceirosSigilososTratados: true,
        metricasFatuaisPreservadas: true,
        declaracaoHumanaAssinada: true,
      },
      status: StatusEstudoCaso.HOMOLOGADO_APROV_10,
      homologado_em: now,
      homologado_por: 'Analista Sênior',
      versao: 1,
      criado_em: now,
      atualizado_em: now,
    };

    // 1. Salvar
    await caseRepo.save(caseEntity);

    // 2. Consultar por demanda
    const recuperado = await caseRepo.findByDemandId('dem-int-001');
    expect(recuperado).not.toBeNull();
    expect(recuperado?.titulo).toBe('Estudo de Caso Analítico Integrado');
    expect(recuperado?.competencias_demonstradas).toEqual(['BI', 'DAX', 'SQL']);
    expect(recuperado?.tecnicas_sanitizacao).toEqual(['ANONIMIZACAO', 'INDEXACAO']);
    expect(recuperado?.metricas_fatos).toHaveLength(1);
    expect(recuperado?.status).toBe(StatusEstudoCaso.HOMOLOGADO_APROV_10);
    expect(recuperado?.homologado_por).toBe('Analista Sênior');

    // 3. Atualizar
    await caseRepo.update('case-int-001', {
      titulo: 'Título Atualizado',
      status: StatusEstudoCaso.RASCUNHO,
    });

    const atualizado = await caseRepo.findById('case-int-001');
    expect(atualizado?.titulo).toBe('Título Atualizado');
    expect(atualizado?.status).toBe(StatusEstudoCaso.RASCUNHO);

    // 4. Excluir
    await caseRepo.delete('case-int-001');
    const posExclusao = await caseRepo.findById('case-int-001');
    expect(posExclusao).toBeNull();
  });

  it('deve persistir, listar por demanda e filtrar AtivoAprendizado', async () => {
    const now = new Date().toISOString();

    const ativo1 = {
      id: 'ativo-001',
      demanda_id: 'dem-int-001',
      titulo: 'Tabela Calendário Inteligente',
      categoria: CategoriaAtivoAprendizado.MODELAGEM,
      descricao: 'Geração de dData com feriados e semanas fiscais',
      procedimento_padrao: '= #table(...)',
      contexto_aplicacao: 'Power Query M para projetos com fechamento fiscal',
      tags: ['PowerQuery', 'Calendario', 'M'],
      criado_em: now,
      atualizado_em: now,
    };

    const ativo2 = {
      id: 'ativo-002',
      demanda_id: 'dem-int-001',
      titulo: 'Medida DAX Churn Rate',
      categoria: CategoriaAtivoAprendizado.DAX,
      descricao: 'Cálculo de evasão proporcional no período',
      procedimento_padrao: 'DIVIDE([Perdidos], [Total], 0)',
      contexto_aplicacao: 'Modelos educacionais e assinaturas SaaS',
      tags: ['DAX', 'Churn'],
      criado_em: now,
      atualizado_em: now,
    };

    await ativoRepo.save(ativo1);
    await ativoRepo.save(ativo2);

    // 1. Listar por demanda
    const ativosDemanda = await ativoRepo.findByDemandId('dem-int-001');
    expect(ativosDemanda).toHaveLength(2);

    // 2. Filtrar por categoria
    const ativosDax = await ativoRepo.findAll({ categoria: CategoriaAtivoAprendizado.DAX });
    expect(ativosDax).toHaveLength(1);
    expect(ativosDax[0].titulo).toBe('Medida DAX Churn Rate');

    // 3. Filtrar por busca textual
    const ativosBusca = await ativoRepo.findAll({ busca: 'Calendário' });
    expect(ativosBusca).toHaveLength(1);
    expect(ativosBusca[0].titulo).toBe('Tabela Calendário Inteligente');
    expect(ativosBusca[0].tags).toEqual(['PowerQuery', 'Calendario', 'M']);
  });
});
