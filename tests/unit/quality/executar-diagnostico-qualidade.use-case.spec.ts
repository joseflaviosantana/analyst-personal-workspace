import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ExecutarDiagnosticoQualidadeUseCase } from '@/core/use-cases/quality/executar-diagnostico-qualidade.use-case';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IDiagnosticosQualidadeRepository } from '@/core/domain/repositories/diagnosticos-qualidade-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { DiagnosticoQualidade } from '@/core/domain/entities/diagnostico-qualidade';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { StatusExecucaoDiagnostico } from '@/core/domain/enums/status-execucao-diagnostico';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';

describe('ExecutarDiagnosticoQualidadeUseCase (Subunidade 3.4A)', () => {
  const tmpDir = path.join(process.cwd(), '.workspace', 'tmp', 'test-quality-usecase');
  let mockAtivosRepo: IAtivoDadosRepository;
  let mockDiagnosticosRepo: IDiagnosticosQualidadeRepository;
  let mockProblemasRepo: IProblemasQualidadeRepository;

  let ativosDb: Map<string, AtivoDados>;
  let diagnosticosDb: Map<string, DiagnosticoQualidade>;
  let problemasDb: Map<string, ProblemaQualidade>;

  beforeEach(() => {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    ativosDb = new Map();
    diagnosticosDb = new Map();
    problemasDb = new Map();

    mockAtivosRepo = {
      create: async (a) => { ativosDb.set(a.id, a); return a; },
      findById: async (id) => ativosDb.get(id) ?? null,
      findByDemandId: async () => Array.from(ativosDb.values()),
      findByPath: async () => null,
      findActiveByPath: async () => null,
      update: async (id, data) => {
        const item = ativosDb.get(id);
        if (!item) return null;
        const updated = { ...item, ...data };
        ativosDb.set(id, updated);
        return updated;
      },
      countByDemandId: async () => ativosDb.size,
      replace: async () => { throw new Error('Not implemented'); },
    };

    mockDiagnosticosRepo = {
      create: async (d) => { diagnosticosDb.set(d.id, d); return d; },
      update: async (id, data) => {
        const item = diagnosticosDb.get(id);
        if (!item) return null;
        const updated = { ...item, ...data };
        diagnosticosDb.set(id, updated);
        return updated;
      },
      findById: async (id) => diagnosticosDb.get(id) ?? null,
      findLatestByAssetId: async (assetId) => {
        const list = Array.from(diagnosticosDb.values()).filter((d) => d.ativo_dados_id === assetId);
        return list.length > 0 ? list[list.length - 1] : null;
      },
      findByAssetId: async (assetId) => {
        return Array.from(diagnosticosDb.values()).filter((d) => d.ativo_dados_id === assetId);
      },
      findByDemandId: async (demandId) => {
        return Array.from(diagnosticosDb.values()).filter((d) => d.demanda_id === demandId);
      },
      salvarConclusaoTransacional: async (diagId, dadosUpdate, probs) => {
        const item = diagnosticosDb.get(diagId);
        if (!item) throw new Error(`Diagnóstico ${diagId} não encontrado`);
        // Simulação de transação atômica: se houver falha, nada é commitado
        for (const p of probs) {
          problemasDb.set(p.id, p);
        }
        const updated = { ...item, ...dadosUpdate };
        diagnosticosDb.set(diagId, updated);
        return { diagnostico: updated, problemas: probs };
      },
    };

    mockProblemasRepo = {
      createMany: async (pList) => {
        for (const p of pList) {
          problemasDb.set(p.id, p);
        }
        return pList;
      },
      findById: async (id) => problemasDb.get(id) ?? null,
      findByDiagnosticId: async (diagId) => {
        return Array.from(problemasDb.values()).filter((p) => p.diagnostico_id === diagId);
      },
      findByAssetId: async (assetId) => {
        return Array.from(problemasDb.values()).filter((p) => p.ativo_dados_id === assetId);
      },
      findByDemandId: async (demandId) => {
        return Array.from(problemasDb.values()).filter((p) => p.demanda_id === demandId);
      },
      update: async (id, data) => {
        const item = problemasDb.get(id);
        if (!item) return null;
        const updated = { ...item, ...data };
        problemasDb.set(id, updated);
        return updated;
      },
    };
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('deve orquestrar a execução do diagnóstico, persistir problemas e registrar status CONCLUIDO', async () => {
    const csvContent = 'id,categoria,valor\n1,Eletronicos,100\n2,,200\n'; // 1 nulo em categoria
    const csvPath = path.join(tmpDir, 'teste-usecase.csv');
    fs.writeFileSync(csvPath, csvContent, 'utf-8');

    const ativo: AtivoDados = {
      id: 'ativo-uc-1',
      demanda_id: 'demanda-uc-1',
      nome_arquivo: 'teste-usecase.csv',
      caminho_local: csvPath,
      formato: FormatoArquivo.CSV,
      origem: null,
      descricao_conteudo: null,
      granularidade: null,
      periodo_inicio: null,
      periodo_fim: null,
      versao: 'v1.0',
      tamanho_bytes: csvContent.length,
      total_linhas: 2,
      total_colunas: 3,
      hash_sha256: 'abc123hash',
      status: StatusAtivoDados.ATIVO,
      schema_inferido: JSON.stringify({ id: 'number', categoria: 'string', valor: 'number' }),
      data_recebimento: new Date().toISOString(),
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    };

    await mockAtivosRepo.create(ativo);

    const useCase = new ExecutarDiagnosticoQualidadeUseCase(
      mockAtivosRepo,
      mockDiagnosticosRepo,
      mockProblemasRepo
    );

    const resultado = await useCase.execute({ ativoDadosId: ativo.id });

    expect(resultado.diagnostico).toBeDefined();
    expect(resultado.diagnostico.status_execucao).toBe(StatusExecucaoDiagnostico.CONCLUIDO);
    expect(resultado.diagnostico.total_linhas_avaliadas).toBe(2);
    expect(resultado.diagnostico.total_colunas_avaliadas).toBe(3);
    expect(resultado.diagnostico.duracao_ms).toBeGreaterThanOrEqual(0);
    expect(resultado.diagnostico.concluido_em).toBeDefined();

    // Deve ter persistido o problema de nulo com severidade PENDENTE
    expect(resultado.problemas).toHaveLength(1);
    expect(resultado.problemas[0].coluna_afetada).toBe('categoria');
    expect(resultado.problemas[0].severidade).toBe(SeveridadeProblema.PENDENTE);
    expect(resultado.problemas[0].total_linhas_afetadas).toBe(1);
    expect(resultado.problemas[0].percentual_linhas_afetadas).toBe(50);
  });

  it('deve registrar status FALHA no diagnóstico caso o arquivo não seja encontrado', async () => {
    const ativo: AtivoDados = {
      id: 'ativo-inexistente',
      demanda_id: 'demanda-uc-2',
      nome_arquivo: 'inexistente.csv',
      caminho_local: path.join(tmpDir, 'inexistente.csv'),
      formato: FormatoArquivo.CSV,
      origem: null,
      descricao_conteudo: null,
      granularidade: null,
      periodo_inicio: null,
      periodo_fim: null,
      versao: 'v1.0',
      tamanho_bytes: 0,
      total_linhas: 0,
      total_colunas: 0,
      hash_sha256: 'xyz',
      status: StatusAtivoDados.ATIVO,
      schema_inferido: null,
      data_recebimento: new Date().toISOString(),
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    };

    await mockAtivosRepo.create(ativo);

    const useCase = new ExecutarDiagnosticoQualidadeUseCase(
      mockAtivosRepo,
      mockDiagnosticosRepo,
      mockProblemasRepo
    );

    const resultado = await useCase.execute({ ativoDadosId: ativo.id });

    expect(resultado.diagnostico.status_execucao).toBe(StatusExecucaoDiagnostico.FALHA);
    expect(resultado.diagnostico.erro_mensagem).toContain('Arquivo não encontrado');
    expect(resultado.problemas).toHaveLength(0);
  });

  it('deve garantir atomicidade transacional e registrar status FALHA sem problemas órfãos se a conclusão falhar', async () => {
    const csvContent = 'id,categoria,valor\n1,,100\n'; // 1 nulo em categoria
    const csvPath = path.join(tmpDir, 'teste-falha-transacional.csv');
    fs.writeFileSync(csvPath, csvContent, 'utf-8');

    const ativo: AtivoDados = {
      id: 'ativo-uc-falha',
      demanda_id: 'demanda-uc-falha',
      nome_arquivo: 'teste-falha-transacional.csv',
      caminho_local: csvPath,
      formato: FormatoArquivo.CSV,
      origem: null,
      descricao_conteudo: null,
      granularidade: null,
      periodo_inicio: null,
      periodo_fim: null,
      versao: 'v1.0',
      tamanho_bytes: csvContent.length,
      total_linhas: 1,
      total_colunas: 3,
      hash_sha256: 'hash-falha',
      status: StatusAtivoDados.ATIVO,
      schema_inferido: JSON.stringify({ id: 'number', categoria: 'string', valor: 'number' }),
      data_recebimento: new Date().toISOString(),
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    };

    await mockAtivosRepo.create(ativo);

    // Simulamos falha na transação atômica (ex: falha de integridade ou I/O no SQLite durante o commit)
    mockDiagnosticosRepo.salvarConclusaoTransacional = async () => {
      // Como a transação falhou no SQLite, nenhum registro de problema permanece gravado (rollback)
      throw new Error('Falha simulada na transação SQLite');
    };

    const useCase = new ExecutarDiagnosticoQualidadeUseCase(
      mockAtivosRepo,
      mockDiagnosticosRepo,
      mockProblemasRepo
    );

    const resultado = await useCase.execute({ ativoDadosId: ativo.id });

    // 1. O diagnóstico NÃO deve ficar como EM_ANDAMENTO; deve registrar formalmente FALHA
    expect(resultado.diagnostico.status_execucao).toBe(StatusExecucaoDiagnostico.FALHA);
    expect(resultado.diagnostico.erro_mensagem).toContain('Falha simulada na transação SQLite');
    expect(resultado.diagnostico.concluido_em).toBeDefined();

    // 2. Não deve haver nenhum problema confirmado retornado
    expect(resultado.problemas).toHaveLength(0);

    // 3. O banco de problemas deve estar estritamente vazio (zero problemas órfãos confirmados persistidos)
    expect(problemasDb.size).toBe(0);

    // 4. Verificação no repositório de diagnósticos: o diagnóstico persistido está marcado como FALHA
    const diagNoBanco = await mockDiagnosticosRepo.findById(resultado.diagnostico.id);
    expect(diagNoBanco).toBeDefined();
    expect(diagNoBanco?.status_execucao).toBe(StatusExecucaoDiagnostico.FALHA);
  });
});
