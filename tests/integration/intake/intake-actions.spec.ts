import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import fs from 'fs';
import * as schema from '@/infrastructure/db/schema';
import { eq } from 'drizzle-orm';
import { SqliteIntakePersistenceManager } from '@/infrastructure/db/repositories/sqlite-intake-persistence-manager';
import { analyzeIntakeAction, confirmIntakeAction } from '@/app/actions/intake-actions';
import { ConfirmIntakeInput } from '@/lib/validations/intake-schema';
import { StatusPerguntaClarificacao } from '@/core/domain/enums/status-pergunta-clarificacao';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Integration Tests: Intake Inteligente — Subgate 2: Orquestração e Transação Atômica', () => {
  const testDbDir = path.join(process.cwd(), '.workspace', 'data');
  const testDbPath = path.join(testDbDir, 'test_intake_subgate2.db');

  let sqlite: Database.Database;
  let testDb: ReturnType<typeof drizzle<typeof schema>>;
  let persistenceManager: SqliteIntakePersistenceManager;

  const countTableRows = () => {
    const projetosCount = testDb.select().from(schema.projetos).all().length;
    const demandasCount = testDb.select().from(schema.demandas).all().length;
    const perguntasCount = testDb.select().from(schema.perguntasClarificacao).all().length;
    const auditCount = testDb.select().from(schema.trilhaAuditoria).all().length;

    return {
      projetosCount,
      demandasCount,
      perguntasCount,
      auditCount,
      total: projetosCount + demandasCount + perguntasCount + auditCount,
    };
  };

  beforeAll(() => {
    if (!fs.existsSync(testDbDir)) {
      fs.mkdirSync(testDbDir, { recursive: true });
    }

    const filesToClean = [testDbPath, `${testDbPath}-wal`, `${testDbPath}-shm`];
    for (const f of filesToClean) {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
        } catch {
          // ignore
        }
      }
    }

    sqlite = new Database(testDbPath);
    sqlite.pragma('foreign_keys = ON');
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('synchronous = NORMAL');
    sqlite.pragma('busy_timeout = 5000');

    testDb = drizzle(sqlite, { schema });
    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    migrate(testDb, { migrationsFolder });

    persistenceManager = new SqliteIntakePersistenceManager(testDb);
  });

  afterAll(() => {
    if (sqlite) {
      sqlite.close();
    }
    const filesToClean = [testDbPath, `${testDbPath}-wal`, `${testDbPath}-shm`];
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

  it('1. analyzeIntakeAction é read/compute-only e NÃO persiste nada no banco', async () => {
    const countsBefore = countTableRows();
    expect(countsBefore.total).toBe(0);

    const inputSolicitacao =
      'Precisamos de um dashboard em Power BI com o faturamento mensal de 2025 para a diretoria, com base na planilha vendas_2025.xlsx.';

    const result = await analyzeIntakeAction(inputSolicitacao);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.solicitacaoOriginal).toBe(inputSolicitacao);
    expect(result.data?.fatos.ativosDadosMencionados.length).toBeGreaterThan(0);
    expect(result.data?.proposta.projetoSugerido.nome).toBeDefined();

    // Verificação estrita de não-persistência
    const countsAfter = countTableRows();
    expect(countsAfter.projetosCount).toBe(0);
    expect(countsAfter.demandasCount).toBe(0);
    expect(countsAfter.perguntasCount).toBe(0);
    expect(countsAfter.auditCount).toBe(0);
    expect(countsAfter.total).toBe(0);
  });

  it('2. Criação atômica completa de NOVO Projeto + Demanda + Perguntas aceitas + Auditoria', async () => {
    const rawText = 'Solicitação piloto de teste para criação de novo projeto e demanda.';

    const payload: ConfirmIntakeInput = {
      solicitacaoOriginal: rawText,
      projetoDecisao: 'NOVO',
      novoProjeto: {
        nome: 'Projeto Expansão Comercial',
        descricao: 'Projeto criado a partir do Intake de vendas',
      },
      demanda: {
        titulo: 'Análise de Desempenho Regional',
        contexto: 'Contexto revisado pelo analista',
        objetivo_inicial: 'Objetivo aprovado',
        prazo_esperado: '2026-04-30',
        restricoes_declaradas: 'Apenas dados de filiais ativas',
      },
      perguntasPreliminares: [
        {
          pergunta: 'Qual o formato exato da planilha de vendas?',
          motivacao: 'Definir pipeline de ingestão',
          bloqueante: true,
          aceita: true,
        },
        {
          pergunta: 'As devoluções devem ser abatidas do faturamento bruto?',
          motivacao: 'Regra contábil necessária',
          bloqueante: false,
          aceita: true,
        },
      ],
    };

    const actionRes = await confirmIntakeAction(payload, { persistenceManager });

    expect(actionRes.success).toBe(true);
    expect(actionRes.data).toBeDefined();

    const output = actionRes.data!;
    expect(output.projeto.isNovo).toBe(true);
    expect(output.projeto.nome).toBe('Projeto Expansão Comercial');
    expect(output.demanda.titulo).toBe('Análise de Desempenho Regional');
    expect(output.demanda.estado).toBe(EstadoDemanda.NOVA);
    expect(output.perguntasCriadasCount).toBe(2);

    // Validação direta no SQLite
    const projetoSalvo = testDb
      .select()
      .from(schema.projetos)
      .where(eq(schema.projetos.id, output.projeto.id))
      .get();
    expect(projetoSalvo).toBeDefined();
    expect(projetoSalvo?.nome).toBe('Projeto Expansão Comercial');

    const demandaSalva = testDb
      .select()
      .from(schema.demandas)
      .where(eq(schema.demandas.id, output.demanda.id))
      .get();
    expect(demandaSalva).toBeDefined();
    expect(demandaSalva?.projeto_id).toBe(output.projeto.id);
    expect(demandaSalva?.solicitacao_bruta).toBe(rawText);

    const perguntasSalvas = testDb
      .select()
      .from(schema.perguntasClarificacao)
      .where(eq(schema.perguntasClarificacao.demanda_id, output.demanda.id))
      .all();
    expect(perguntasSalvas.length).toBe(2);
    expect(perguntasSalvas.every((p) => p.status === StatusPerguntaClarificacao.RASCUNHO)).toBe(true);

    const auditorias = testDb
      .select()
      .from(schema.trilhaAuditoria)
      .where(eq(schema.trilhaAuditoria.demanda_id, output.demanda.id))
      .all();
    expect(auditorias.length).toBeGreaterThanOrEqual(1);

    const auditDemanda = auditorias.find((a) => a.entidade === 'Demanda');
    expect(auditDemanda).toBeDefined();
    expect(auditDemanda?.tipo_evento).toBe('CRIACAO');
    expect(auditDemanda?.autor_tipo).toBe('HUMANO');

    const parsedNovos = JSON.parse(auditDemanda?.dados_novos || '{}');
    expect(parsedNovos.origem).toBe('INTAKE');
    expect(parsedNovos.motor_analise).toBe('TIER_1_LOCAL');
    expect(parsedNovos.projeto_id).toBe(output.projeto.id);
  });

  it('3. Utilização de Projeto EXISTENTE (Opção B) sem duplicar projeto', async () => {
    // Busca o projeto existente criado no teste anterior
    const projetosExistentes = testDb.select().from(schema.projetos).all();
    expect(projetosExistentes.length).toBe(1);
    const existingProject = projetosExistentes[0];

    const payload: ConfirmIntakeInput = {
      solicitacaoOriginal: 'Segunda demanda vinculada ao mesmo projeto existente.',
      projetoDecisao: 'EXISTENTE',
      projetoIdExistente: existingProject.id,
      demanda: {
        titulo: 'Segunda Demanda do Projeto',
        contexto: 'Mesmo contexto estratégico',
        objetivo_inicial: 'Objetivo complementar',
      },
      perguntasPreliminares: [],
    };

    const actionRes = await confirmIntakeAction(payload, { persistenceManager });

    expect(actionRes.success).toBe(true);
    expect(actionRes.data?.projeto.id).toBe(existingProject.id);
    expect(actionRes.data?.projeto.isNovo).toBe(false);

    // O total de projetos no banco DEVE continuar exatamente 1 (não duplica projeto!)
    const projetosApos = testDb.select().from(schema.projetos).all();
    expect(projetosApos.length).toBe(1);

    // O total de demandas agora deve ser 2, ambas apontando para o mesmo projeto
    const demandas = testDb.select().from(schema.demandas).all();
    expect(demandas.length).toBe(2);
    expect(demandas.every((d) => d.projeto_id === existingProject.id)).toBe(true);
  });

  it('4. Preservação byte-for-byte de solicitacao_bruta (sem trim, sem alteração de whitespace)', async () => {
    const rawComplexVerbatim =
      '  \r\n\tSolicitação Verbatim com Caracteres Especiais:\n- "Item 1": 100%\n- \'Item 2\': R$ 50.000,00  \t\r\n   Espaços finais   \t\n\n';

    const projetos = testDb.select().from(schema.projetos).all();
    const existingProjId = projetos[0].id;

    const payload: ConfirmIntakeInput = {
      solicitacaoOriginal: rawComplexVerbatim,
      projetoDecisao: 'EXISTENTE',
      projetoIdExistente: existingProjId,
      demanda: {
        titulo: 'Demanda Teste Preservação Verbatim',
      },
    };

    const actionRes = await confirmIntakeAction(payload, { persistenceManager });
    expect(actionRes.success).toBe(true);

    const savedDemand = testDb
      .select()
      .from(schema.demandas)
      .where(eq(schema.demandas.id, actionRes.data!.demanda.id))
      .get();

    expect(savedDemand?.solicitacao_bruta).toBe(rawComplexVerbatim);
    expect(savedDemand?.solicitacao_bruta.length).toBe(rawComplexVerbatim.length);
    // Verificação byte a byte
    expect(Buffer.from(savedDemand!.solicitacao_bruta, 'utf8')).toEqual(
      Buffer.from(rawComplexVerbatim, 'utf8')
    );
  });

  it('5. Perguntas aceitas são persistidas como RASCUNHO e perguntas rejeitadas são descartadas', async () => {
    const projetos = testDb.select().from(schema.projetos).all();
    const existingProjId = projetos[0].id;

    const payload: ConfirmIntakeInput = {
      solicitacaoOriginal: 'Demanda com perguntas filtradas pelo analista humano.',
      projetoDecisao: 'EXISTENTE',
      projetoIdExistente: existingProjId,
      demanda: {
        titulo: 'Demanda com Filtro de Perguntas',
      },
      perguntasPreliminares: [
        {
          pergunta: 'Pergunta 1 — Aceita pelo analista',
          motivacao: 'Motivação 1',
          bloqueante: true,
          aceita: true,
        },
        {
          pergunta: 'Pergunta 2 — REJEITADA pelo analista',
          motivacao: 'Motivação que não interessa',
          bloqueante: false,
          aceita: false, // Rejeitada!
        },
        {
          pergunta: 'Pergunta 3 — Aceita pelo analista',
          motivacao: 'Motivação 3',
          bloqueante: false,
          aceita: true,
        },
      ],
    };

    const actionRes = await confirmIntakeAction(payload, { persistenceManager });
    expect(actionRes.success).toBe(true);
    expect(actionRes.data?.perguntasCriadasCount).toBe(2);

    const savedPerguntas = testDb
      .select()
      .from(schema.perguntasClarificacao)
      .where(eq(schema.perguntasClarificacao.demanda_id, actionRes.data!.demanda.id))
      .all();

    expect(savedPerguntas.length).toBe(2);
    expect(savedPerguntas.some((p) => p.pergunta.includes('Pergunta 1'))).toBe(true);
    expect(savedPerguntas.some((p) => p.pergunta.includes('Pergunta 3'))).toBe(true);
    expect(savedPerguntas.some((p) => p.pergunta.includes('Pergunta 2'))).toBe(false);
    expect(savedPerguntas.every((p) => p.status === 'RASCUNHO')).toBe(true);
  });

  it('6. Trilha de auditoria registra proveniência inequívoca INTAKE e autoria HUMANA', async () => {
    const payload: ConfirmIntakeInput = {
      solicitacaoOriginal: 'Demanda para validação detalhada da trilha de auditoria de Intake.',
      projetoDecisao: 'NOVO',
      novoProjeto: {
        nome: 'Projeto Auditoria Intake',
      },
      demanda: {
        titulo: 'Demanda com Auditoria Validada',
      },
      perguntasPreliminares: [],
    };

    const actionRes = await confirmIntakeAction(payload, { persistenceManager });
    expect(actionRes.success).toBe(true);

    const auditRecords = testDb
      .select()
      .from(schema.trilhaAuditoria)
      .where(eq(schema.trilhaAuditoria.demanda_id, actionRes.data!.demanda.id))
      .all();

    expect(auditRecords.length).toBeGreaterThanOrEqual(1);

    const auditDemanda = auditRecords.find((a) => a.entidade === 'Demanda');
    expect(auditDemanda).toBeDefined();
    expect(auditDemanda?.tipo_evento).toBe('CRIACAO');
    expect(auditDemanda?.autor_tipo).toBe('HUMANO');
    expect(auditDemanda?.justificativa).toContain('Intake Inteligente');

    const dadosNovos = JSON.parse(auditDemanda?.dados_novos || '{}');
    expect(dadosNovos.origem).toBe('INTAKE');
    expect(dadosNovos.motor_analise).toBe('TIER_1_LOCAL');
    expect(dadosNovos.decisao_projeto).toBe('NOVO');
    expect(dadosNovos.projeto_id).toBe(actionRes.data!.projeto.id);
  });

  it('7. Projeto existente inválido/inexistente rejeita e não persiste absolutamente nada', async () => {
    const countsBefore = countTableRows();

    const payload: ConfirmIntakeInput = {
      solicitacaoOriginal: 'Tentativa de vincular a projeto que não existe.',
      projetoDecisao: 'EXISTENTE',
      projetoIdExistente: 'proj_fantasma_inexistente_9999',
      demanda: {
        titulo: 'Demanda Não Deve Ser Criada',
      },
    };

    const actionRes = await confirmIntakeAction(payload, { persistenceManager });

    expect(actionRes.success).toBe(false);
    expect(actionRes.error).toContain('não foi encontrado');

    const countsAfter = countTableRows();
    expect(countsAfter.total).toBe(countsBefore.total);
    expect(countsAfter.demandasCount).toBe(countsBefore.demandasCount);
    expect(countsAfter.projetosCount).toBe(countsBefore.projetosCount);
  });

  it('8. Falha proposital ao criar Projeto -> ROLLBACK INTEGRAL', async () => {
    const countsBefore = countTableRows();

    const payload: ConfirmIntakeInput = {
      solicitacaoOriginal: 'Solicitação para teste de falha ao criar projeto.',
      projetoDecisao: 'NOVO',
      novoProjeto: {
        nome: 'Projeto que Deve Falhar',
      },
      demanda: {
        titulo: 'Demanda do Projeto que Deve Falhar',
      },
      perguntasPreliminares: [
        {
          pergunta: 'Pergunta teste que deve sumir',
          aceita: true,
        },
      ],
    };

    const actionRes = await confirmIntakeAction(
      payload,
      { persistenceManager },
      { failAtStep: 'PROJECT' }
    );

    expect(actionRes.success).toBe(false);
    expect(actionRes.error).toContain('[SIMULATED_FAILURE]');

    const countsAfter = countTableRows();
    expect(countsAfter.total).toBe(countsBefore.total);
    expect(countsAfter.projetosCount).toBe(countsBefore.projetosCount);
    expect(countsAfter.demandasCount).toBe(countsBefore.demandasCount);
    expect(countsAfter.perguntasCount).toBe(countsBefore.perguntasCount);
    expect(countsAfter.auditCount).toBe(countsBefore.auditCount);
  });

  it('9. Falha proposital ao criar Demanda -> ROLLBACK INTEGRAL (Novo Projeto NÃO fica órfão)', async () => {
    const countsBefore = countTableRows();

    const payload: ConfirmIntakeInput = {
      solicitacaoOriginal: 'Solicitação para teste de falha na criação da Demanda.',
      projetoDecisao: 'NOVO',
      novoProjeto: {
        nome: 'Projeto que Não Pode Ficar Órfão',
      },
      demanda: {
        titulo: 'Demanda que Falhará',
      },
      perguntasPreliminares: [
        {
          pergunta: 'Pergunta teste que não deve ser salva',
          aceita: true,
        },
      ],
    };

    const actionRes = await confirmIntakeAction(
      payload,
      { persistenceManager },
      { failAtStep: 'DEMAND' }
    );

    expect(actionRes.success).toBe(false);
    expect(actionRes.error).toContain('[SIMULATED_FAILURE]');

    // Confirmação cabal: o projeto NOVO não foi commitado no banco!
    const countsAfter = countTableRows();
    expect(countsAfter.projetosCount).toBe(countsBefore.projetosCount);
    expect(countsAfter.demandasCount).toBe(countsBefore.demandasCount);
    expect(countsAfter.perguntasCount).toBe(countsBefore.perguntasCount);
    expect(countsAfter.auditCount).toBe(countsBefore.auditCount);
    expect(countsAfter.total).toBe(countsBefore.total);

    const orphanProj = testDb
      .select()
      .from(schema.projetos)
      .where(eq(schema.projetos.nome, 'Projeto que Não Pode Ficar Órfão'))
      .get();
    expect(orphanProj).toBeUndefined();
  });

  it('10. Falha proposital ao criar Perguntas -> ROLLBACK INTEGRAL', async () => {
    const countsBefore = countTableRows();

    const payload: ConfirmIntakeInput = {
      solicitacaoOriginal: 'Solicitação para teste de falha nas Perguntas.',
      projetoDecisao: 'NOVO',
      novoProjeto: {
        nome: 'Projeto que Deve Sofrer Rollback por Pergunta',
      },
      demanda: {
        titulo: 'Demanda que Deve Sofrer Rollback',
      },
      perguntasPreliminares: [
        {
          pergunta: 'Pergunta que causará erro na transação',
          aceita: true,
        },
      ],
    };

    const actionRes = await confirmIntakeAction(
      payload,
      { persistenceManager },
      { failAtStep: 'QUESTIONS' }
    );

    expect(actionRes.success).toBe(false);
    expect(actionRes.error).toContain('[SIMULATED_FAILURE]');

    const countsAfter = countTableRows();
    expect(countsAfter.total).toBe(countsBefore.total);
    expect(countsAfter.projetosCount).toBe(countsBefore.projetosCount);
    expect(countsAfter.demandasCount).toBe(countsBefore.demandasCount);
    expect(countsAfter.perguntasCount).toBe(countsBefore.perguntasCount);
  });

  it('11. Falha proposital ao registrar Auditoria -> ROLLBACK INTEGRAL', async () => {
    const countsBefore = countTableRows();

    const payload: ConfirmIntakeInput = {
      solicitacaoOriginal: 'Solicitação para teste de falha na Auditoria.',
      projetoDecisao: 'NOVO',
      novoProjeto: {
        nome: 'Projeto que Deve Sofrer Rollback por Falha de Auditoria',
      },
      demanda: {
        titulo: 'Demanda que Deve Sofrer Rollback por Auditoria',
      },
      perguntasPreliminares: [
        {
          pergunta: 'Pergunta pré-auditoria',
          aceita: true,
        },
      ],
    };

    const actionRes = await confirmIntakeAction(
      payload,
      { persistenceManager },
      { failAtStep: 'AUDIT' }
    );

    expect(actionRes.success).toBe(false);
    expect(actionRes.error).toContain('[SIMULATED_FAILURE]');

    const countsAfter = countTableRows();
    expect(countsAfter.total).toBe(countsBefore.total);
    expect(countsAfter.projetosCount).toBe(countsBefore.projetosCount);
    expect(countsAfter.demandasCount).toBe(countsBefore.demandasCount);
    expect(countsAfter.perguntasCount).toBe(countsBefore.perguntasCount);
    expect(countsAfter.auditCount).toBe(countsBefore.auditCount);
  });

  it('12. Demonstração factual: nenhuma entidade parcial permanece no banco após qualquer falha', async () => {
    const counts = countTableRows();
    // O banco contém apenas os registros dos testes bem-sucedidos (testes 2, 3, 4, 5, 6)
    // Nenhuma entidade resultante dos testes com falha (testes 7, 8, 9, 10, 11) foi persistida
    const projetosComFalha = testDb
      .select()
      .from(schema.projetos)
      .where(eq(schema.projetos.nome, 'Projeto que Deve Falhar'))
      .all();
    expect(projetosComFalha.length).toBe(0);

    const demandasComFalha = testDb
      .select()
      .from(schema.demandas)
      .where(eq(schema.demandas.titulo, 'Demanda Não Deve Ser Criada'))
      .all();
    expect(demandasComFalha.length).toBe(0);

    // Integridade referencial completa: todas as demandas apontam para projetos existentes
    const todasDemandas = testDb.select().from(schema.demandas).all();
    const todosProjetos = testDb.select().from(schema.projetos).all();
    const projetoIds = new Set(todosProjetos.map((p) => p.id));

    for (const d of todasDemandas) {
      expect(projetoIds.has(d.projeto_id)).toBe(true);
    }

    // Todas as perguntas apontam para demandas existentes
    const todasPerguntas = testDb.select().from(schema.perguntasClarificacao).all();
    const demandaIds = new Set(todasDemandas.map((d) => d.id));
    for (const p of todasPerguntas) {
      expect(demandaIds.has(p.demanda_id)).toBe(true);
    }
  });

  it('13. Persistência de requisitos propostos com status IDENTIFICADO, origem INTAKE e intake_snapshot em demandas', async () => {
    const rawText = 'Solicitação para validação de requisitos propostos e snapshot do Intake.';

    const payload: ConfirmIntakeInput = {
      solicitacaoOriginal: rawText,
      projetoDecisao: 'NOVO',
      novoProjeto: {
        nome: 'Projeto Requisitos Intake',
      },
      demanda: {
        titulo: 'Demanda com Requisitos Propostos do Copiloto',
      },
      perguntasPreliminares: [
        {
          pergunta: 'Qual a periodicidade de atualização?',
          aceita: true,
        },
      ],
      requisitosPropostos: [
        {
          titulo: 'Métrica: Faturamento Líquido Mensal',
          descricao: 'Identificada como essencial no pedido',
          categoria: 'METRICA_KPI',
          prioridade: 'OBRIGATORIO',
        },
        {
          titulo: 'Dimensão: Filtro Regional por Estado',
          descricao: 'Sugerida para segmentação da análise',
          categoria: 'DIMENSAO_FILTRO',
          prioridade: 'DESEJAVEL',
        },
      ],
      intakeSnapshot: JSON.stringify({
        fatos: { ativosDados: ['vendas_2024.xlsx'], prazo: 'Fim do mês' },
        descobertasDados: { dimensoes: ['Região', 'Produto'] },
        sinteseProximaAcao: { proximaAcaoRecomendada: 'Clarificar com o cliente' },
      }),
    };

    const actionRes = await confirmIntakeAction(payload, { persistenceManager });

    expect(actionRes.success).toBe(true);
    expect(actionRes.data).toBeDefined();

    const output = actionRes.data!;
    expect(output.requisitosCriadosCount).toBe(2);

    // Validação no banco SQLite
    const demandaSalva = testDb
      .select()
      .from(schema.demandas)
      .where(eq(schema.demandas.id, output.demanda.id))
      .get();
    expect(demandaSalva).toBeDefined();
    expect(demandaSalva?.intake_snapshot).toBeDefined();
    expect(demandaSalva?.intake_snapshot).toContain('vendas_2024.xlsx');

    const requisitosSalvos = testDb
      .select()
      .from(schema.requisitosDemanda)
      .where(eq(schema.requisitosDemanda.demanda_id, output.demanda.id))
      .all();

    expect(requisitosSalvos.length).toBe(2);

    // Salvaguarda: Nascem como IDENTIFICADO (propostos), com origem INTAKE
    for (const r of requisitosSalvos) {
      expect(r.status).toBe('IDENTIFICADO');
      expect(r.origem).toBe('INTAKE');
    }

    const reqObrigatorio = requisitosSalvos.find((r) => r.titulo.includes('Faturamento'));
    expect(reqObrigatorio?.prioridade).toBe('OBRIGATORIO');

    const reqDesejavel = requisitosSalvos.find((r) => r.titulo.includes('Filtro Regional'));
    expect(reqDesejavel?.prioridade).toBe('DESEJAVEL');
  });

  it('14. Salvaguarda Epistêmica e Atômica: Rollback integral se falhar na etapa de requisitos (failAtStep: REQUIREMENTS)', async () => {
    const countsBefore = countTableRows();

    const payload: ConfirmIntakeInput = {
      solicitacaoOriginal: 'Solicitação para teste de rollback em requisitos.',
      projetoDecisao: 'NOVO',
      novoProjeto: {
        nome: 'Projeto que Deve Sofrer Rollback em Requisitos',
      },
      demanda: {
        titulo: 'Demanda que Deve Sofrer Rollback em Requisitos',
      },
      perguntasPreliminares: [
        {
          pergunta: 'Pergunta preliminar',
          aceita: true,
        },
      ],
      requisitosPropostos: [
        {
          titulo: 'Métrica que falhará no commit',
          categoria: 'METRICA_KPI',
          prioridade: 'OBRIGATORIO',
        },
      ],
    };

    const actionRes = await confirmIntakeAction(
      payload,
      { persistenceManager },
      { failAtStep: 'REQUIREMENTS' }
    );

    expect(actionRes.success).toBe(false);
    expect(actionRes.error).toContain('[SIMULATED_FAILURE]');

    const countsAfter = countTableRows();
    expect(countsAfter.total).toBe(countsBefore.total);
    expect(countsAfter.projetosCount).toBe(countsBefore.projetosCount);
    expect(countsAfter.demandasCount).toBe(countsBefore.demandasCount);
    expect(countsAfter.perguntasCount).toBe(countsBefore.perguntasCount);

    const requisitosOrfaos = testDb
      .select()
      .from(schema.requisitosDemanda)
      .where(eq(schema.requisitosDemanda.titulo, 'Métrica que falhará no commit'))
      .all();
    expect(requisitosOrfaos.length).toBe(0);
  });

  it('15. Salvaguarda Epistêmica: Nenhum requisito originado do Intake pode tornar-se aprovado sem ação humana deliberada', async () => {
    // Todos os requisitos inseridos nos testes com origem INTAKE devem estar em IDENTIFICADO
    const todosRequisitosIntake = testDb
      .select()
      .from(schema.requisitosDemanda)
      .where(eq(schema.requisitosDemanda.origem, 'INTAKE'))
      .all();

    expect(todosRequisitosIntake.length).toBeGreaterThan(0);
    for (const r of todosRequisitosIntake) {
      expect(r.status).toBe('IDENTIFICADO');
      expect(r.status).not.toBe('CLARIFICADO');
      expect(r.status).not.toBe('ATENDIDO');
    }
  });
});
