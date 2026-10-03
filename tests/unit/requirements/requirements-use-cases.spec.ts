import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CriarRequisitoUseCase } from '@/core/use-cases/requirements/criar-requisito.use-case';
import { AtualizarRequisitoUseCase } from '@/core/use-cases/requirements/atualizar-requisito.use-case';
import { RemoverRequisitoUseCase } from '@/core/use-cases/requirements/remover-requisito.use-case';
import { ListarRequisitosUseCase } from '@/core/use-cases/requirements/listar-requisitos.use-case';
import { CriarPerguntaClarificacaoUseCase } from '@/core/use-cases/requirements/criar-pergunta-clarificacao.use-case';
import { AtualizarPerguntaClarificacaoUseCase } from '@/core/use-cases/requirements/atualizar-pergunta-clarificacao.use-case';
import { DespacharPerguntaClarificacaoUseCase } from '@/core/use-cases/requirements/despachar-pergunta-clarificacao.use-case';
import { RegistrarRespostaContratanteUseCase } from '@/core/use-cases/requirements/registrar-resposta-contratante.use-case';
import { RemoverPerguntaClarificacaoUseCase } from '@/core/use-cases/requirements/remover-pergunta-clarificacao.use-case';
import { ListarPerguntasClarificacaoUseCase } from '@/core/use-cases/requirements/listar-perguntas-clarificacao.use-case';
import { AtualizarBriefingDemandaUseCase } from '@/core/use-cases/requirements/atualizar-briefing-demanda.use-case';
import { AvaliarProntidaoRequisitosUseCase } from '@/core/use-cases/requirements/avaliar-prontidao-requisitos.use-case';
import { HomologarLevantamentoRequisitosUseCase } from '@/core/use-cases/requirements/homologar-levantamento-requisitos.use-case';

import { IRequisitoDemandaRepository } from '@/core/domain/repositories/requisito-demanda-repository.interface';
import { IPerguntaClarificacaoRepository } from '@/core/domain/repositories/pergunta-clarificacao-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { CategoriaRequisito } from '@/core/domain/enums/categoria-requisito';
import { StatusRequisito } from '@/core/domain/enums/status-requisito';
import { StatusPerguntaClarificacao } from '@/core/domain/enums/status-pergunta-clarificacao';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { RequisitoDemanda } from '@/core/domain/entities/requisito-demanda';
import { PerguntaClarificacao } from '@/core/domain/entities/pergunta-clarificacao';

describe('Unit Tests: Use Cases de Requisitos & Perguntas ao Contratante (Bloco 3.8)', () => {
  let mockDemandas: DemandaComProjeto[];
  let mockRequisitos: RequisitoDemanda[];
  let mockPerguntas: PerguntaClarificacao[];

  let demandRepo: IDemandRepository;
  let requisitoRepo: IRequisitoDemandaRepository;
  let perguntaRepo: IPerguntaClarificacaoRepository;
  let auditRepo: IAuditRepository;
  let mockProcessarEventoUseCase: any;

  beforeEach(() => {
    mockRequisitos = [];
    mockPerguntas = [];
    mockDemandas = [
      {
        id: 'dem_test_1',
        projeto_id: 'prj_test_1',
        projetoNome: 'Projeto Teste',
        titulo: 'Demanda de Faturamento e Churn',
        solicitacao_bruta: 'Original verbatim: Preciso de um dashboard de faturamento por filial e churn mensal.',
        contexto: 'Contexto de vendas',
        objetivo_inicial: 'Objetivo de faturamento e churn',
        prazo_esperado: '2026-10-15',
        restricoes_declaradas: 'Restrito ao ano corrente',
        estado: EstadoDemanda.EM_CLARIFICACAO,
        estado_anterior: EstadoDemanda.NOVA,
        criado_em: '2026-10-01T10:00:00Z',
        atualizado_em: '2026-10-01T10:00:00Z',
        data_conclusao: null,
        periodo_analise: 'Últimos 12 meses',
        granularidade: 'Mensal por filial',
        formato_entrega: 'Power BI',
        requisitos_homologados_em: null,
        requisitos_homologados_por: null,
        requisitos_justificativa_homologacao: null,
        requisitos_ressalvas: null,
      },
    ];

    demandRepo = {
      findById: vi.fn(async (id: string) => mockDemandas.find((d) => d.id === id) || null),
      findByProjectId: vi.fn(async (pId: string) => mockDemandas.filter((d) => d.projeto_id === pId)),
      findAll: vi.fn(async () => mockDemandas),
      findRecent: vi.fn(async () => mockDemandas),
      create: vi.fn(async (data: any) => data),
      update: vi.fn(async (id: string, patch: any) => {
        const idx = mockDemandas.findIndex((d) => d.id === id);
        if (idx === -1) throw new Error('Demanda não encontrada');
        mockDemandas[idx] = { ...mockDemandas[idx], ...patch, atualizado_em: new Date().toISOString() };
        return mockDemandas[idx];
      }),
      countActive: vi.fn(async () => mockDemandas.length),
      countTotal: vi.fn(async () => mockDemandas.length),
    };

    requisitoRepo = {
      create: vi.fn(async (data: any) => {
        mockRequisitos.push(data);
        return data;
      }),
      update: vi.fn(async (id: string, patch: any) => {
        const idx = mockRequisitos.findIndex((r) => r.id === id);
        if (idx === -1) throw new Error('Requisito não encontrado');
        mockRequisitos[idx] = { ...mockRequisitos[idx], ...patch, atualizado_em: new Date().toISOString() };
        return mockRequisitos[idx];
      }),
      findById: vi.fn(async (id: string) => mockRequisitos.find((r) => r.id === id) || null),
      findByDemandId: vi.fn(async (demandaId: string) =>
        mockRequisitos.filter((r) => r.demanda_id === demandaId)
      ),
      countByDemandId: vi.fn(async (demandaId: string) =>
        mockRequisitos.filter((r) => r.demanda_id === demandaId).length
      ),
      delete: vi.fn(async (id: string) => {
        mockRequisitos = mockRequisitos.filter((r) => r.id !== id);
        return true;
      }),
    };

    perguntaRepo = {
      create: vi.fn(async (data: any) => {
        mockPerguntas.push(data);
        return data;
      }),
      update: vi.fn(async (id: string, patch: any) => {
        const idx = mockPerguntas.findIndex((p) => p.id === id);
        if (idx === -1) throw new Error('Pergunta não encontrada');
        mockPerguntas[idx] = { ...mockPerguntas[idx], ...patch, atualizado_em: new Date().toISOString() };
        return mockPerguntas[idx];
      }),
      findById: vi.fn(async (id: string) => mockPerguntas.find((p) => p.id === id) || null),
      findByDemandId: vi.fn(async (demandaId: string) =>
        mockPerguntas.filter((p) => p.demanda_id === demandaId)
      ),
      countBloqueantesPendentes: vi.fn(async (demandaId: string) =>
        mockPerguntas.filter(
          (p) =>
            p.demanda_id === demandaId &&
            p.bloqueante &&
            (p.status === StatusPerguntaClarificacao.RASCUNHO ||
              p.status === StatusPerguntaClarificacao.ENVIADA)
        ).length
      ),
      countByDemandId: vi.fn(async (demandaId: string) =>
        mockPerguntas.filter((p) => p.demanda_id === demandaId).length
      ),
      delete: vi.fn(async (id: string) => {
        mockPerguntas = mockPerguntas.filter((p) => p.id !== id);
        return true;
      }),
    };

    auditRepo = {
      record: vi.fn(async (entry: any) => entry),
      findByDemandaId: vi.fn(async () => []),
    };

    mockProcessarEventoUseCase = {
      execute: vi.fn(async (evento: any) => ({
        id_evento: evento.id_evento,
        demanda_id: evento.demanda_id,
        politica_aplicada: 'REGISTRAR_AUTOMATICAMENTE',
        evidencia_registrada: true,
        id_evidencia: 'evi_test_1',
        sucesso: true,
      })),
    };
  });

  describe('Requisitos CRUD & Regras de Negócio', () => {
    it('deve criar um requisito com categoria e prioridade válidas', async () => {
      const useCase = new CriarRequisitoUseCase(requisitoRepo, demandRepo);
      const req = await useCase.execute({
        demandaId: 'dem_test_1',
        titulo: 'Faturamento Bruto Mensal',
        categoria: CategoriaRequisito.METRICA_KPI,
        prioridade: 'OBRIGATORIO',
        descricao: 'Soma dos valores das notas fiscais emitidas no mês',
      });

      expect(req.id).toMatch(/^req_/);
      expect(req.titulo).toBe('Faturamento Bruto Mensal');
      expect(req.categoria).toBe(CategoriaRequisito.METRICA_KPI);
      expect(req.prioridade).toBe('OBRIGATORIO');
      expect(req.status).toBe(StatusRequisito.IDENTIFICADO);
    });

    it('deve atualizar o status de um requisito existente', async () => {
      const criar = new CriarRequisitoUseCase(requisitoRepo, demandRepo);
      const req = await criar.execute({
        demandaId: 'dem_test_1',
        titulo: 'Filtro por Filial',
        categoria: CategoriaRequisito.DIMENSAO_FILTRO,
      });

      const atualizar = new AtualizarRequisitoUseCase(requisitoRepo);
      const atualizado = await atualizar.execute({
        id: req.id,
        status: StatusRequisito.CLARIFICADO,
      });

      expect(atualizado.status).toBe(StatusRequisito.CLARIFICADO);
    });

    it('deve remover um requisito', async () => {
      const criar = new CriarRequisitoUseCase(requisitoRepo, demandRepo);
      const req = await criar.execute({
        demandaId: 'dem_test_1',
        titulo: 'Requisito a remover',
        categoria: CategoriaRequisito.REGRA_NEGOCIO,
      });

      const remover = new RemoverRequisitoUseCase(requisitoRepo);
      await remover.execute(req.id);

      const listar = new ListarRequisitosUseCase(requisitoRepo);
      const lista = await listar.execute('dem_test_1');
      expect(lista).toHaveLength(0);
    });
  });

  describe('Perguntas de Clarificação & Registro de Resposta', () => {
    it('deve criar pergunta em estado RASCUNHO e permitir despachar', async () => {
      const criar = new CriarPerguntaClarificacaoUseCase(perguntaRepo, demandRepo);
      const pergunta = await criar.execute({
        demandaId: 'dem_test_1',
        pergunta: 'Como calcular o churn de clientes inativos por 90 dias?',
        motivacao: 'Definir regra de cálculo DAX',
        bloqueante: true,
      });

      expect(pergunta.id).toMatch(/^perg_/);
      expect(pergunta.status).toBe(StatusPerguntaClarificacao.RASCUNHO);
      expect(pergunta.bloqueante).toBe(true);

      const despachar = new DespacharPerguntaClarificacaoUseCase(perguntaRepo, auditRepo);
      const despachada = await despachar.execute(pergunta.id);

      expect(despachada.status).toBe(StatusPerguntaClarificacao.ENVIADA);
      expect(despachada.enviada_em).toBeTruthy();
    });

    it('deve registrar resposta do contratante e emitir evento analítico determinístico', async () => {
      const criar = new CriarPerguntaClarificacaoUseCase(perguntaRepo, demandRepo);
      const pergunta = await criar.execute({
        demandaId: 'dem_test_1',
        pergunta: 'Devoluções abatem do faturamento?',
        bloqueante: true,
      });

      const despachar = new DespacharPerguntaClarificacaoUseCase(perguntaRepo, auditRepo);
      await despachar.execute(pergunta.id);

      const registrarResposta = new RegistrarRespostaContratanteUseCase(
        perguntaRepo,
        auditRepo,
        mockProcessarEventoUseCase
      );

      const respondida = await registrarResposta.execute({
        perguntaId: pergunta.id,
        resposta: 'Sim, abatem integralmente na competência da devolução.',
        respondidoPor: 'Diretor Comercial',
        impactoDecisao: 'Criar coluna de dedução no pipeline',
      });

      expect(respondida.status).toBe(StatusPerguntaClarificacao.RESPONDIDA);
      expect(respondida.resposta).toBe('Sim, abatem integralmente na competência da devolução.');
      expect(respondida.respondido_por).toBe('Diretor Comercial');
      expect(respondida.respondida_em).toBeTruthy();

      // Verifica disparo do Evidence Event Engine com id canônico estável
      expect(mockProcessarEventoUseCase.execute).toHaveBeenCalledTimes(1);
      const eventoDisparado = mockProcessarEventoUseCase.execute.mock.calls[0][0];
      expect(eventoDisparado.tipo_evento).toBe('REQUISITOS_RESPOSTA_CONTRATANTE_REGISTRADA');
      expect(eventoDisparado.id_evento).toBe(`evento_${pergunta.id}_resp_${respondida.respondida_em}`);
    });
  });

  describe('Briefing Estruturado & Imutabilidade da Solicitação Bruta', () => {
    it('deve atualizar campos de briefing sem permitir alteração da solicitacao_bruta', async () => {
      const useCase = new AtualizarBriefingDemandaUseCase(demandRepo, auditRepo);
      const updated = await useCase.execute({
        demandaId: 'dem_test_1',
        periodoAnalise: '2024 a 2026',
        granularidade: 'Semanal por Região',
        formatoEntrega: 'Dashboard Power BI + Tabela CSV',
      });

      expect(updated.periodo_analise).toBe('2024 a 2026');
      expect(updated.granularidade).toBe('Semanal por Região');
      expect(updated.formato_entrega).toBe('Dashboard Power BI + Tabela CSV');
      // Preservação estrita da solicitação bruta
      expect(updated.solicitacao_bruta).toBe(
        'Original verbatim: Preciso de um dashboard de faturamento por filial e churn mensal.'
      );
    });
  });

  describe('Avaliação de Prontidão (G-REQ-01 a G-REQ-04) & Homologação Humana', () => {
    it('deve bloquear avanço se houver pergunta bloqueante não respondida', async () => {
      const criarPergunta = new CriarPerguntaClarificacaoUseCase(perguntaRepo, demandRepo);
      await criarPergunta.execute({
        demandaId: 'dem_test_1',
        pergunta: 'Fonte oficial do faturamento?',
        bloqueante: true,
      });

      const avaliarProntidao = new AvaliarProntidaoRequisitosUseCase(
        demandRepo,
        requisitoRepo,
        perguntaRepo
      );
      const prontidao = await avaliarProntidao.execute('dem_test_1');

      expect(prontidao.bloqueado).toBe(true);
      expect(prontidao.liberadoParaAvanco).toBe(false);
      expect(prontidao.motivosBloqueio[0]).toContain('pergunta(s) bloqueante(s)');
    });

    it('deve exigir justificativa se faltar período ou granularidade', async () => {
      // Atualiza demanda para período vazio
      mockDemandas[0].periodo_analise = null;
      mockDemandas[0].granularidade = null;

      const avaliarProntidao = new AvaliarProntidaoRequisitosUseCase(
        demandRepo,
        requisitoRepo,
        perguntaRepo
      );
      const prontidao = await avaliarProntidao.execute('dem_test_1');

      expect(prontidao.bloqueado).toBe(false);
      expect(prontidao.exigeJustificativaRessalva).toBe(true);
      expect(prontidao.avisosConsultivos.length).toBeGreaterThan(0);
    });

    it('deve emitir aviso consultivo de prontidão quando houver requisitos do Intake aguardando deliberação humana (origem === INTAKE && status === IDENTIFICADO), sem bloquear o avanço', async () => {
      mockRequisitos.push({
        id: 'req_intake_1',
        demanda_id: 'dem_test_1',
        titulo: 'Métrica sugerida pelo Intake',
        descricao: 'Sugestão inicial do snapshot',
        categoria: CategoriaRequisito.METRICA_KPI,
        prioridade: 'OBRIGATORIO',
        status: StatusRequisito.IDENTIFICADO,
        origem: 'INTAKE',
        criado_em: '2026-10-01T10:00:00Z',
        atualizado_em: '2026-10-01T10:00:00Z',
      });

      const avaliarProntidao = new AvaliarProntidaoRequisitosUseCase(
        demandRepo,
        requisitoRepo,
        perguntaRepo
      );
      const prontidao = await avaliarProntidao.execute('dem_test_1');

      expect(prontidao.bloqueado).toBe(false);
      expect(prontidao.requisitosIntakePendentes).toBe(1);
      expect(
        prontidao.avisosConsultivos.some((aviso) =>
          aviso.includes('Intake aguardando deliberação humana')
        )
      ).toBe(true);
    });

    it('deve registrar homologação humana persistida e emitir evento com id canônico', async () => {
      const useCase = new HomologarLevantamentoRequisitosUseCase(
        demandRepo,
        requisitoRepo,
        perguntaRepo,
        auditRepo,
        mockProcessarEventoUseCase
      );

      const homologada = await useCase.execute({
        demandaId: 'dem_test_1',
        justificativa: 'Levantamento de requisitos aprovado formalmente com o solicitante.',
        ressalvas: 'Dados históricos anteriores a 2024 são restritos.',
        homologadoPor: 'Analista Sênior',
      });

      expect(homologada.requisitos_homologados_em).toBeTruthy();
      expect(homologada.requisitos_homologados_por).toBe('Analista Sênior');
      expect(homologada.requisitos_justificativa_homologacao).toBe(
        'Levantamento de requisitos aprovado formalmente com o solicitante.'
      );
      expect(homologada.requisitos_ressalvas).toBe('Dados históricos anteriores a 2024 são restritos.');

      // Idempotência canônica: id gerado baseado em marco persistido
      expect(mockProcessarEventoUseCase.execute).toHaveBeenCalledTimes(1);
      const evento = mockProcessarEventoUseCase.execute.mock.calls[0][0];
      expect(evento.tipo_evento).toBe('REQUISITOS_LEVANTAMENTO_HOMOLOGADO');
      expect(evento.id_evento).toBe(`evento_dem_test_1_req_homolog_${homologada.requisitos_homologados_em}`);
    });
  });
});
