import { describe, it, expect, beforeEach } from 'vitest';
import { GerarRascunhoEstudoCasoUseCase } from '@/core/use-cases/portfolio/gerar-rascunho-estudo-caso.use-case';
import { AtualizarEstudoCasoUseCase } from '@/core/use-cases/portfolio/atualizar-estudo-caso.use-case';
import { HomologarEstudoCasoPortfolioUseCase } from '@/core/use-cases/portfolio/homologar-estudo-caso-portfolio.use-case';
import { ExportarEstudoCasoPortfolioUseCase } from '@/core/use-cases/portfolio/exportar-estudo-caso-portfolio.use-case';
import { CurarAtivoAprendizadoUseCase } from '@/core/use-cases/portfolio/curar-ativo-aprendizado.use-case';
import { CompilarDossieVivoUseCase } from '@/core/use-cases/dossier/compilar-dossie-vivo.use-case';
import { EstudoCasoPortfolio } from '@/core/domain/entities/estudo-caso-portfolio';
import { StatusEstudoCaso } from '@/core/domain/enums/status-estudo-caso';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { CategoriaAtivoAprendizado } from '@/core/domain/enums/categoria-ativo-aprendizado';

// Mocks em memória para os repositórios
class InMemoryDemandRepo {
  private demands = new Map<string, any>();

  set(id: string, data: any) {
    this.demands.set(id, data);
  }

  async findById(id: string) {
    return this.demands.get(id) || null;
  }
}

class InMemoryCaseRepo {
  private cases = new Map<string, EstudoCasoPortfolio>();

  async findByDemandId(demandaId: string) {
    for (const c of this.cases.values()) {
      if (c.demanda_id === demandaId) return c;
    }
    return null;
  }

  async findById(id: string) {
    return this.cases.get(id) || null;
  }

  async save(c: EstudoCasoPortfolio) {
    this.cases.set(c.id, { ...c });
    return c;
  }
}

class InMemoryAtivoRepo {
  private ativos = new Map<string, any>();

  async save(ativo: any) {
    this.ativos.set(ativo.id, ativo);
    return ativo;
  }

  async findByDemandId(demandaId: string) {
    return Array.from(this.ativos.values()).filter((a) => a.demanda_id === demandaId);
  }
}

class InMemoryEventLogRepo {
  public recordedEvents: any[] = [];

  async create(evento: any) {
    this.recordedEvents.push(evento);
    return evento;
  }

  async record(evento: any) {
    this.recordedEvents.push(evento);
    return evento;
  }
}

class InMemoryAuditRepo {
  public recordedAudits: any[] = [];

  async record(evento: any) {
    this.recordedAudits.push(evento);
    return evento;
  }

  async findByDemandaId(demandaId: string) {
    return this.recordedAudits.filter((a) => a.demanda_id === demandaId);
  }
}

const emptyRepo = {
  findByDemandId: async () => [],
  findByDemandaId: async () => [],
  findByModeloPowerBiId: async () => [],
};

describe('Aba 11 — Salvaguardas Críticas de Portfólio e Dossiê (Gate 1B)', () => {
  let demandRepo: InMemoryDemandRepo;
  let caseRepo: InMemoryCaseRepo;
  let ativoRepo: InMemoryAtivoRepo;
  let eventLogRepo: InMemoryEventLogRepo;
  let auditRepo: InMemoryAuditRepo;

  beforeEach(() => {
    demandRepo = new InMemoryDemandRepo();
    caseRepo = new InMemoryCaseRepo();
    ativoRepo = new InMemoryAtivoRepo();
    eventLogRepo = new InMemoryEventLogRepo();
    auditRepo = new InMemoryAuditRepo();
  });

  const setupDemanda = (id: string, estado: EstadoDemanda) => {
    demandRepo.set(id, {
      id,
      projeto_id: 'proj-1',
      titulo: 'Demanda de Teste',
      solicitacao_bruta: 'Solicitação bruta de teste',
      contexto: 'Problema de teste',
      objetivo_inicial: 'Objetivo de teste',
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado,
      criado_em: '2026-02-01T00:00:00Z',
      atualizado_em: '2026-02-01T00:00:00Z',
      data_conclusao: null,
    });
  };

  it('Salvaguarda 1 & 2: A edição material de um case em HOMOLOGADO_APROV_10 deve invalidar a homologação e retornar para RASCUNHO', async () => {
    setupDemanda('dem-1', EstadoDemanda.PRONTA_PARA_ENTREGA);

    const caseInicial: EstudoCasoPortfolio = {
      id: 'case-1',
      demanda_id: 'dem-1',
      projeto_id: null,
      titulo: 'Case Homologado Original',
      problema_negocio: 'Problema Original',
      processo_preparacao: 'Processo Original',
      modelagem_decisoes: 'Modelagem Original',
      validacao_resultados: 'Resultados Originais',
      competencias_demonstradas: ['BI'],
      ferramentas_utilizadas: ['Power BI'],
      metricas_fatos: [],
      tecnicas_sanitizacao: ['ANONIMIZACAO'],
      checklist_sanitizacao: {
        nomesClientesOcultados: true,
        dadosPessoaisOcultados: true,
        dadosFinanceirosSigilososTratados: true,
        metricasFatuaisPreservadas: true,
        declaracaoHumanaAssinada: true,
      },
      status: StatusEstudoCaso.HOMOLOGADO_APROV_10,
      homologado_em: '2026-02-01T10:00:00Z',
      homologado_por: 'Analista Sênior',
      versao: 1,
      criado_em: '2026-02-01T09:00:00Z',
      atualizado_em: '2026-02-01T10:00:00Z',
    };
    await caseRepo.save(caseInicial);

    // Verifica que antes da edição, a exportação é autorizada
    const exportarUseCase = new ExportarEstudoCasoPortfolioUseCase(caseRepo as any);
    const exportPre = await exportarUseCase.execute({ caseId: 'case-1' });
    expect(exportPre.markdown).toContain('# Case Homologado Original');

    // Executa edição material (alterando o título e o problema de negócio)
    const atualizarUseCase = new AtualizarEstudoCasoUseCase(
      caseRepo as any,
      demandRepo as any,
      auditRepo as any
    );

    const updated = await atualizarUseCase.execute({
      caseId: 'case-1',
      titulo: 'Novo Título Materialmente Alterado',
      ator: 'Analista Pleno',
    });

    // Comprova que o status foi invalidado server-side para RASCUNHO
    expect(updated.status).toBe(StatusEstudoCaso.RASCUNHO);
    expect(updated.homologado_em).toBeNull();
    expect(updated.homologado_por).toBeNull();
    expect(updated.versao).toBe(2);

    // Comprova que agora a exportação pública é bloqueada deterministicamente
    await expect(exportarUseCase.execute({ caseId: 'case-1' })).rejects.toThrow(
      /A exportação pública de estudo de caso de portfólio exige prévia deliberação e homologação soberana humana \(APROV-10\)/
    );

    // Comprova que a invalidação foi registrada na trilha de auditoria
    const auditRecords = await auditRepo.findByDemandaId('dem-1');
    expect(
      auditRecords.some(
        (a) =>
          a.entidade === 'ESTUDO_CASO_PORTFOLIO' &&
          a.justificativa?.includes('invalidada por alteração de conteúdo material')
      )
    ).toBe(true);
  });

  it('Salvaguarda 3: Demandas SUSPENSA e CANCELADA bloqueiam mutações da camada Portfólio & Aprendizados', async () => {
    setupDemanda('dem-suspensa', EstadoDemanda.SUSPENSA);
    setupDemanda('dem-cancelada', EstadoDemanda.CANCELADA);

    const gerarUseCase = new GerarRascunhoEstudoCasoUseCase(
      demandRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      caseRepo as any
    );

    // Tentativa de gerar rascunho em demanda suspensa deve falhar
    await expect(gerarUseCase.execute({ demandaId: 'dem-suspensa' })).rejects.toThrow(
      /Não é permitido gerar ou modificar estudos de caso para demandas SUSPENSA/
    );

    // Tentativa de gerar rascunho em demanda cancelada deve falhar
    await expect(gerarUseCase.execute({ demandaId: 'dem-cancelada' })).rejects.toThrow(
      /Não é permitido gerar ou modificar estudos de caso para demandas CANCELADA/
    );

    // Tentativa de curar ativo de aprendizado em demanda suspensa deve falhar
    const curarUseCase = new CurarAtivoAprendizadoUseCase(
      ativoRepo as any,
      demandRepo as any,
      eventLogRepo as any,
      auditRepo as any
    );

    await expect(
      curarUseCase.execute({
        demandaId: 'dem-suspensa',
        titulo: 'DAX Reutilizável',
        categoria: CategoriaAtivoAprendizado.DAX,
        procedimento_padrao: 'CALCULATE(...)',
      })
    ).rejects.toThrow(/Não é permitido curar ativos de aprendizado para demandas SUSPENSA/);
  });

  it('Salvaguarda 4: Demanda CONCLUIDA pode continuar sendo utilizada para elaboração, revisão e homologação do case', async () => {
    setupDemanda('dem-concluida', EstadoDemanda.CONCLUIDA);

    const gerarUseCase = new GerarRascunhoEstudoCasoUseCase(
      demandRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      caseRepo as any
    );

    // Gerar rascunho em demanda concluída deve funcionar
    const rascunho = await gerarUseCase.execute({ demandaId: 'dem-concluida' });
    expect(rascunho.status).toBe(StatusEstudoCaso.RASCUNHO);

    // Atualizar checklist de sanitização na demanda concluída deve funcionar
    const atualizarUseCase = new AtualizarEstudoCasoUseCase(
      caseRepo as any,
      demandRepo as any,
      auditRepo as any
    );

    await atualizarUseCase.execute({
      caseId: rascunho.id,
      checklist_sanitizacao: {
        nomesClientesOcultados: true,
        dadosPessoaisOcultados: true,
        dadosFinanceirosSigilososTratados: true,
        metricasFatuaisPreservadas: true,
        declaracaoHumanaAssinada: true,
      },
    });

    // Homologar APROV-10 na demanda concluída deve funcionar com sucesso
    const homologarUseCase = new HomologarEstudoCasoPortfolioUseCase(
      caseRepo as any,
      demandRepo as any,
      eventLogRepo as any,
      auditRepo as any
    );

    const homologado = await homologarUseCase.execute({
      caseId: rascunho.id,
      autor: 'Analista de Dados',
    });

    expect(homologado.status).toBe(StatusEstudoCaso.HOMOLOGADO_APROV_10);
    expect(homologado.homologado_por).toBe('Analista de Dados');

    // Comprova que o evento analítico foi emitido
    expect(
      eventLogRepo.recordedEvents.some((e) => e.tipo_evento === 'PORTFOLIO_CASO_HOMOLOGADO_APROV_10')
    ).toBe(true);

    // Curar ativo de aprendizado na demanda concluída deve funcionar com sucesso
    const curarUseCase = new CurarAtivoAprendizadoUseCase(
      ativoRepo as any,
      demandRepo as any,
      eventLogRepo as any,
      auditRepo as any
    );

    const ativo = await curarUseCase.execute({
      demandaId: 'dem-concluida',
      titulo: 'Fórmula M de Calendário',
      categoria: CategoriaAtivoAprendizado.POWER_QUERY_M,
      procedimento_padrao: '= List.Dates(...)',
    });

    expect(ativo.titulo).toBe('Fórmula M de Calendário');
    expect(
      eventLogRepo.recordedEvents.some((e) => e.tipo_evento === 'ATIVO_APRENDIZADO_CURADO')
    ).toBe(true);
  });

  it('Salvaguarda 5: O Dossiê Técnico permanece consultável e exportável em qualquer estado da demanda e sem exigir APROV-10', async () => {
    // Testa compilação em demanda suspensa
    setupDemanda('dem-suspensa-dossier', EstadoDemanda.SUSPENSA);

    const compilarUseCase = new CompilarDossieVivoUseCase(
      demandRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any,
      emptyRepo as any
    );

    const res = await compilarUseCase.execute({ demandaId: 'dem-suspensa-dossier' });

    expect(res.markdown).toContain('# DOSSIÊ TÉCNICO CONCORRENTE — Demanda de Teste');
    expect(res.markdown).toContain('Estado Operacional no Workflow:** `SUSPENSA`');
    expect(res.totalSecoes).toBe(11);
  });

  it('Trava APROV-10: Impede homologação se o checklist de sanitização não estiver 100% completo', async () => {
    setupDemanda('dem-check-incompleto', EstadoDemanda.PRONTA_PARA_ENTREGA);

    const caseIncompleto: EstudoCasoPortfolio = {
      id: 'case-inc',
      demanda_id: 'dem-check-incompleto',
      projeto_id: null,
      titulo: 'Case Incompleto',
      problema_negocio: 'Problema',
      processo_preparacao: 'Processo',
      modelagem_decisoes: 'Modelagem',
      validacao_resultados: 'Resultados',
      competencias_demonstradas: [],
      ferramentas_utilizadas: [],
      metricas_fatos: [],
      tecnicas_sanitizacao: [],
      checklist_sanitizacao: {
        nomesClientesOcultados: true,
        dadosPessoaisOcultados: false, // Incompleto!
        dadosFinanceirosSigilososTratados: true,
        metricasFatuaisPreservadas: true,
        declaracaoHumanaAssinada: false, // Incompleto!
      },
      status: StatusEstudoCaso.RASCUNHO,
      homologado_em: null,
      homologado_por: null,
      versao: 1,
      criado_em: '2026-02-01T09:00:00Z',
      atualizado_em: '2026-02-01T09:00:00Z',
    };
    await caseRepo.save(caseIncompleto);

    const homologarUseCase = new HomologarEstudoCasoPortfolioUseCase(
      caseRepo as any,
      demandRepo as any,
      eventLogRepo as any,
      auditRepo as any
    );

    await expect(
      homologarUseCase.execute({ caseId: 'case-inc', autor: 'Analista' })
    ).rejects.toThrow(
      /A homologação soberana APROV-10 exige que todos os itens do checklist de sanitização e a declaração de revisão humana estejam atestados como verdadeiros/
    );
  });
});
