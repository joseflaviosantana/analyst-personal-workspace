import { describe, it, expect } from 'vitest';
import { AvaliarQualityGateUseCase } from '@/core/use-cases/quality/avaliar-quality-gate.use-case';
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
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { CategoriaProblemaQualidade } from '@/core/domain/enums/categoria-problema-qualidade';

class MockAtivoDadosRepository implements Partial<IAtivoDadosRepository> {
  ativos: AtivoDados[] = [];

  async findByDemandId(demandaId: string): Promise<AtivoDados[]> {
    return this.ativos.filter((a) => a.demanda_id === demandaId);
  }
}

class MockDiagnosticosRepository implements Partial<IDiagnosticosQualidadeRepository> {
  diagnosticos: DiagnosticoQualidade[] = [];

  async findLatestByAssetId(ativoDadosId: string): Promise<DiagnosticoQualidade | null> {
    const list = this.diagnosticos
      .filter((d) => d.ativo_dados_id === ativoDadosId)
      .sort((a, b) => new Date(b.iniciado_em).getTime() - new Date(a.iniciado_em).getTime());
    return list.length > 0 ? list[0] : null;
  }
}

class MockProblemasRepository implements Partial<IProblemasQualidadeRepository> {
  problemas: ProblemaQualidade[] = [];

  async findByDiagnosticId(diagnosticoId: string): Promise<ProblemaQualidade[]> {
    return this.problemas.filter((p) => p.diagnostico_id === diagnosticoId);
  }

  async findByAssetId(ativoDadosId: string): Promise<ProblemaQualidade[]> {
    return this.problemas.filter((p) => p.ativo_dados_id === ativoDadosId);
  }
}

function criarAtivo(id: string, demandaId: string, status = StatusAtivoDados.ATIVO): AtivoDados {
  return {
    id,
    demanda_id: demandaId,
    nome_arquivo: `${id}.csv`,
    caminho_local: `/caminho/${id}.csv`,
    formato: FormatoArquivo.CSV,
    origem: null,
    descricao_conteudo: null,
    granularidade: null,
    periodo_inicio: null,
    periodo_fim: null,
    versao: '1.0',
    tamanho_bytes: 1024,
    total_linhas: 100,
    total_colunas: 5,
    hash_sha256: 'abc123hash',
    status,
    schema_inferido: null,
    data_recebimento: '2026-09-26T18:00:00.000Z',
    criado_em: '2026-09-26T18:00:00.000Z',
    atualizado_em: '2026-09-26T18:00:00.000Z',
  };
}

function criarDiagnostico(
  id: string,
  ativoId: string,
  demandaId: string,
  iniciadoEm: string,
  statusExecucao = StatusExecucaoDiagnostico.CONCLUIDO
): DiagnosticoQualidade {
  return {
    id,
    ativo_dados_id: ativoId,
    demanda_id: demandaId,
    iniciado_em: iniciadoEm,
    concluido_em: iniciadoEm,
    duracao_ms: 500,
    total_linhas_avaliadas: 100,
    total_colunas_avaliadas: 5,
    verificacoes_executadas: [],
    total_problemas_detectados: 0,
    status_execucao: statusExecucao,
    erro_mensagem: null,
    resumo_metricas: null,
    criado_em: iniciadoEm,
    atualizado_em: iniciadoEm,
  };
}

function criarProblema(
  id: string,
  ativoId: string,
  demandaId: string,
  diagnosticoId: string | null,
  severidade: SeveridadeProblema,
  status: StatusProblemaQualidade,
  origem: 'AUTOMATICA' | 'MANUAL' = diagnosticoId ? 'AUTOMATICA' : 'MANUAL'
): ProblemaQualidade {
  return {
    id,
    diagnostico_id: diagnosticoId,
    ativo_dados_id: ativoId,
    demanda_id: demandaId,
    categoria: CategoriaProblemaQualidade.DUPLICIDADES_LINHA,
    titulo: `Problema ${id}`,
    descricao: `Detalhe ${id}`,
    tabela_afetada: 'dados.csv',
    coluna_afetada: 'id',
    total_linhas_afetadas: 1,
    percentual_linhas_afetadas: 1.0,
    amostra_evidencias: [],
    severidade,
    impacto_calculo: null,
    acao_deliberada: null,
    justificativa_deliberacao: null,
    deliberado_por_humano: severidade !== SeveridadeProblema.PENDENTE,
    deliberado_em: null,
    status,
    origem_deteccao: origem,
    criado_em: '2026-09-26T18:00:00.000Z',
    atualizado_em: '2026-09-26T18:00:00.000Z',
  };
}

describe('AvaliarQualityGateUseCase (V1 — Subunidade 3.4C)', () => {
  it('deve bloquear quando a demanda não tiver nenhum ativo ativo', async () => {
    const ativoRepo = new MockAtivoDadosRepository();
    const diagRepo = new MockDiagnosticosRepository();
    const probRepo = new MockProblemasRepository();

    const useCase = new AvaliarQualityGateUseCase(
      ativoRepo as unknown as IAtivoDadosRepository,
      diagRepo as unknown as IDiagnosticosQualidadeRepository,
      probRepo as unknown as IProblemasQualidadeRepository
    );

    const res = await useCase.execute({ demandaId: 'dem-vazia' });
    expect(res.decisao).toBe('BLOQUEADO');
    expect(res.liberado).toBe(false);
    expect(res.motivo).toContain('Nenhum ativo de dados ativo');
  });

  it('Invariante de Autoridade: último diagnóstico FALHA com anterior CONCLUIDO bloqueia (zero fallback)', async () => {
    const ativoRepo = new MockAtivoDadosRepository();
    const diagRepo = new MockDiagnosticosRepository();
    const probRepo = new MockProblemasRepository();

    const ativo = criarAtivo('asset-1', 'dem-1');
    ativoRepo.ativos.push(ativo);

    // Diagnóstico antigo bem sucedido
    diagRepo.diagnosticos.push(
      criarDiagnostico('diag-antigo', ativo.id, 'dem-1', '2026-09-26T10:00:00.000Z', StatusExecucaoDiagnostico.CONCLUIDO)
    );

    // Diagnóstico mais recente que falhou
    diagRepo.diagnosticos.push(
      criarDiagnostico('diag-recente', ativo.id, 'dem-1', '2026-09-26T12:00:00.000Z', StatusExecucaoDiagnostico.FALHA)
    );

    const useCase = new AvaliarQualityGateUseCase(
      ativoRepo as unknown as IAtivoDadosRepository,
      diagRepo as unknown as IDiagnosticosQualidadeRepository,
      probRepo as unknown as IProblemasQualidadeRepository
    );

    const res = await useCase.execute({ demandaId: 'dem-1' });

    // Deve avaliar estritamente o recente (FALHA) e NÃO fazer fallback para o antigo CONCLUIDO
    expect(res.decisao).toBe('BLOQUEADO');
    expect(res.liberado).toBe(false);
    expect(res.motivo).toContain('falhou');
  });

  it('Isolamento Histórico: problema crítico de diagnóstico antigo NÃO bloqueia diagnóstico novo conforme', async () => {
    const ativoRepo = new MockAtivoDadosRepository();
    const diagRepo = new MockDiagnosticosRepository();
    const probRepo = new MockProblemasRepository();

    const ativo = criarAtivo('asset-1', 'dem-1');
    ativoRepo.ativos.push(ativo);

    // Diagnóstico 1 antigo com problema crítico em aberto
    const diagAntigo = criarDiagnostico('diag-1', ativo.id, 'dem-1', '2026-09-26T10:00:00.000Z');
    diagRepo.diagnosticos.push(diagAntigo);
    probRepo.problemas.push(
      criarProblema('prob-crit-antigo', ativo.id, 'dem-1', diagAntigo.id, SeveridadeProblema.CRITICA, StatusProblemaQualidade.ABERTO)
    );

    // Diagnóstico 2 recente sem problemas (arquivo corrigido ou regras saneadas)
    const diagRecente = criarDiagnostico('diag-2', ativo.id, 'dem-1', '2026-09-26T14:00:00.000Z');
    diagRepo.diagnosticos.push(diagRecente);

    const useCase = new AvaliarQualityGateUseCase(
      ativoRepo as unknown as IAtivoDadosRepository,
      diagRepo as unknown as IDiagnosticosQualidadeRepository,
      probRepo as unknown as IProblemasQualidadeRepository
    );

    const res = await useCase.execute({ demandaId: 'dem-1' });

    // O problema do diagnóstico antigo não deve ser considerado no Gate do diagnóstico novo
    expect(res.decisao).toBe('LIBERADO');
    expect(res.liberado).toBe(true);
    expect(res.detalhes.totalProblemasAvaliados).toBe(0);
  });

  it('Problema manual avulso PENDENTE (diagnostico_id = null) bloqueia o Gate', async () => {
    const ativoRepo = new MockAtivoDadosRepository();
    const diagRepo = new MockDiagnosticosRepository();
    const probRepo = new MockProblemasRepository();

    const ativo = criarAtivo('asset-1', 'dem-1');
    ativoRepo.ativos.push(ativo);

    // Diagnóstico automatizado sem problemas
    const diagRecente = criarDiagnostico('diag-1', ativo.id, 'dem-1', '2026-09-26T14:00:00.000Z');
    diagRepo.diagnosticos.push(diagRecente);

    // Problema manual avulso registrado pelo analista para o ativo
    probRepo.problemas.push(
      criarProblema('prob-manual', ativo.id, 'dem-1', null, SeveridadeProblema.PENDENTE, StatusProblemaQualidade.ABERTO, 'MANUAL')
    );

    const useCase = new AvaliarQualityGateUseCase(
      ativoRepo as unknown as IAtivoDadosRepository,
      diagRepo as unknown as IDiagnosticosQualidadeRepository,
      probRepo as unknown as IProblemasQualidadeRepository
    );

    const res = await useCase.execute({ demandaId: 'dem-1' });

    expect(res.decisao).toBe('BLOQUEADO');
    expect(res.liberado).toBe(false);
    expect(res.detalhes.totalPendentes).toBe(1);
    expect(res.motivo).toContain('pendente(s) de deliberação humana');
  });

  it('Problema manual avulso ALTA + TRATADO permite liberação do Gate', async () => {
    const ativoRepo = new MockAtivoDadosRepository();
    const diagRepo = new MockDiagnosticosRepository();
    const probRepo = new MockProblemasRepository();

    const ativo = criarAtivo('asset-1', 'dem-1');
    ativoRepo.ativos.push(ativo);

    const diagRecente = criarDiagnostico('diag-1', ativo.id, 'dem-1', '2026-09-26T14:00:00.000Z');
    diagRepo.diagnosticos.push(diagRecente);

    // Problema manual já deliberado como ALTA e marcado como TRATADO
    probRepo.problemas.push(
      criarProblema('prob-manual', ativo.id, 'dem-1', null, SeveridadeProblema.ALTA, StatusProblemaQualidade.TRATADO, 'MANUAL')
    );

    const useCase = new AvaliarQualityGateUseCase(
      ativoRepo as unknown as IAtivoDadosRepository,
      diagRepo as unknown as IDiagnosticosQualidadeRepository,
      probRepo as unknown as IProblemasQualidadeRepository
    );

    const res = await useCase.execute({ demandaId: 'dem-1' });

    expect(res.decisao).toBe('LIBERADO');
    expect(res.liberado).toBe(true);
    expect(res.detalhes.totalTratados).toBe(1);
    expect(res.detalhes.totalAltosBloqueantes).toBe(0);
  });

  it('Reexecução automática NÃO elimina problema manual avulso do universo de avaliação', async () => {
    const ativoRepo = new MockAtivoDadosRepository();
    const diagRepo = new MockDiagnosticosRepository();
    const probRepo = new MockProblemasRepository();

    const ativo = criarAtivo('asset-1', 'dem-1');
    ativoRepo.ativos.push(ativo);

    // Problema manual avulso registrado pelo analista que ainda está em investigação
    probRepo.problemas.push(
      criarProblema('prob-manual', ativo.id, 'dem-1', null, SeveridadeProblema.ALTA, StatusProblemaQualidade.EM_INVESTIGACAO, 'MANUAL')
    );

    // Diagnóstico 1 executado
    diagRepo.diagnosticos.push(
      criarDiagnostico('diag-1', ativo.id, 'dem-1', '2026-09-26T10:00:00.000Z')
    );

    // Reexecução de Diagnóstico 2 executado posteriormente (scanner determinístico)
    diagRepo.diagnosticos.push(
      criarDiagnostico('diag-2', ativo.id, 'dem-1', '2026-09-26T15:00:00.000Z')
    );

    const useCase = new AvaliarQualityGateUseCase(
      ativoRepo as unknown as IAtivoDadosRepository,
      diagRepo as unknown as IDiagnosticosQualidadeRepository,
      probRepo as unknown as IProblemasQualidadeRepository
    );

    const res = await useCase.execute({ demandaId: 'dem-1' });

    // O problema manual avulso deve continuar no universo avaliado do ativo ativo e bloquear
    expect(res.decisao).toBe('BLOQUEADO');
    expect(res.liberado).toBe(false);
    expect(res.detalhes.totalAltosBloqueantes).toBe(1);
  });

  it('Ativo SUBSTITUIDO não interfere no Gate do ativo vigente', async () => {
    const ativoRepo = new MockAtivoDadosRepository();
    const diagRepo = new MockDiagnosticosRepository();
    const probRepo = new MockProblemasRepository();

    // Ativo 1 substituído com problema crítico
    const ativoAntigo = criarAtivo('asset-v1', 'dem-1', StatusAtivoDados.SUBSTITUIDO);
    ativoRepo.ativos.push(ativoAntigo);
    const diagAntigo = criarDiagnostico('diag-v1', ativoAntigo.id, 'dem-1', '2026-09-26T10:00:00.000Z');
    diagRepo.diagnosticos.push(diagAntigo);
    probRepo.problemas.push(
      criarProblema('prob-v1', ativoAntigo.id, 'dem-1', diagAntigo.id, SeveridadeProblema.CRITICA, StatusProblemaQualidade.ABERTO)
    );

    // Ativo 2 ativo e conforme
    const ativoNovo = criarAtivo('asset-v2', 'dem-1', StatusAtivoDados.ATIVO);
    ativoRepo.ativos.push(ativoNovo);
    const diagNovo = criarDiagnostico('diag-v2', ativoNovo.id, 'dem-1', '2026-09-26T12:00:00.000Z');
    diagRepo.diagnosticos.push(diagNovo);

    const useCase = new AvaliarQualityGateUseCase(
      ativoRepo as unknown as IAtivoDadosRepository,
      diagRepo as unknown as IDiagnosticosQualidadeRepository,
      probRepo as unknown as IProblemasQualidadeRepository
    );

    const res = await useCase.execute({ demandaId: 'dem-1' });

    // O ativo novo está conforme, o ativo substituído é histórico e ignorado
    expect(res.decisao).toBe('LIBERADO');
    expect(res.liberado).toBe(true);
    expect(res.detalhes.totalCriticosBloqueantes).toBe(0);
  });
});
