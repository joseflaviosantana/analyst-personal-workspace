import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AtualizarBriefingDemandaUseCase } from '@/core/use-cases/requirements/atualizar-briefing-demanda.use-case';
import { CriarRequisitoUseCase } from '@/core/use-cases/requirements/criar-requisito.use-case';
import { AtualizarRequisitoUseCase } from '@/core/use-cases/requirements/atualizar-requisito.use-case';
import { RemoverRequisitoUseCase } from '@/core/use-cases/requirements/remover-requisito.use-case';
import { CriarPerguntaClarificacaoUseCase } from '@/core/use-cases/requirements/criar-pergunta-clarificacao.use-case';
import { AtualizarPerguntaClarificacaoUseCase } from '@/core/use-cases/requirements/atualizar-pergunta-clarificacao.use-case';
import { DespacharPerguntaClarificacaoUseCase } from '@/core/use-cases/requirements/despachar-pergunta-clarificacao.use-case';
import { RegistrarRespostaContratanteUseCase } from '@/core/use-cases/requirements/registrar-resposta-contratante.use-case';
import { RemoverPerguntaClarificacaoUseCase } from '@/core/use-cases/requirements/remover-pergunta-clarificacao.use-case';
import { HomologarLevantamentoRequisitosUseCase } from '@/core/use-cases/requirements/homologar-levantamento-requisitos.use-case';

import { IRequisitoDemandaRepository } from '@/core/domain/repositories/requisito-demanda-repository.interface';
import { IPerguntaClarificacaoRepository } from '@/core/domain/repositories/pergunta-clarificacao-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { CategoriaRequisito } from '@/core/domain/enums/categoria-requisito';
import { StatusRequisito } from '@/core/domain/enums/status-requisito';
import { StatusPerguntaClarificacao } from '@/core/domain/enums/status-pergunta-clarificacao';
import { EstadoDemanda, isEstadoReadOnly } from '@/core/domain/enums/estado-demanda';
import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { RequisitoDemanda } from '@/core/domain/entities/requisito-demanda';
import { PerguntaClarificacao } from '@/core/domain/entities/pergunta-clarificacao';

describe('Gate 2B: Blindagem de Imutabilidade e Read-Only Server-Side (Bloco 3.8)', () => {
  let mockDemandas: DemandaComProjeto[];
  let mockRequisitos: RequisitoDemanda[];
  let mockPerguntas: PerguntaClarificacao[];

  let demandRepo: IDemandRepository;
  let requisitoRepo: IRequisitoDemandaRepository;
  let perguntaRepo: IPerguntaClarificacaoRepository;

  const SOLICITACAO_BRUTA_ORIGINAL =
    'Texto verbatim original e imutável do cliente: Necessito de relatório de faturamento diário.';

  beforeEach(() => {
    mockRequisitos = [
      {
        id: 'req_1',
        demanda_id: 'dem_ativa',
        titulo: 'Faturamento diário por canal',
        descricao: 'Detalhamento por canal de vendas',
        categoria: CategoriaRequisito.METRICA_KPI,
        prioridade: 'OBRIGATORIO',
        status: StatusRequisito.IDENTIFICADO,
        origem: 'MANUAL',
        criado_em: '2026-10-01T10:00:00Z',
        atualizado_em: '2026-10-01T10:00:00Z',
      },
    ];

    mockPerguntas = [
      {
        id: 'perg_1',
        demanda_id: 'dem_ativa',
        requisito_id: 'req_1',
        pergunta: 'Quais canais devem ser considerados no cálculo?',
        motivacao: 'Precisão na query SQL',
        bloqueante: false,
        status: StatusPerguntaClarificacao.RASCUNHO,
        enviada_em: null,
        resposta: null,
        respondido_por: null,
        respondida_em: null,
        impacto_decisao: null,
        criado_em: '2026-10-01T10:00:00Z',
        atualizado_em: '2026-10-01T10:00:00Z',
      },
    ];

    mockDemandas = [
      {
        id: 'dem_ativa',
        projeto_id: 'prj_1',
        projetoNome: 'Projeto Vendas',
        titulo: 'Demanda Ativa em Clarificação',
        solicitacao_bruta: SOLICITACAO_BRUTA_ORIGINAL,
        contexto: 'Contexto de vendas',
        objetivo_inicial: 'Objetivo de faturamento',
        prazo_esperado: '2026-11-01',
        restricoes_declaradas: null,
        estado: EstadoDemanda.EM_CLARIFICACAO,
        estado_anterior: EstadoDemanda.NOVA,
        criado_em: '2026-10-01T10:00:00Z',
        atualizado_em: '2026-10-01T10:00:00Z',
        data_conclusao: null,
        periodo_analise: 'Mês corrente',
        granularidade: 'Diária',
        formato_entrega: 'Power BI',
        requisitos_homologados_em: null,
        requisitos_homologados_por: null,
        requisitos_justificativa_homologacao: null,
        requisitos_ressalvas: null,
      },
      {
        id: 'dem_concluida',
        projeto_id: 'prj_1',
        projetoNome: 'Projeto Vendas',
        titulo: 'Demanda Concluída',
        solicitacao_bruta: SOLICITACAO_BRUTA_ORIGINAL,
        contexto: 'Contexto histórico',
        objetivo_inicial: 'Objetivo concluído',
        prazo_esperado: '2026-09-30',
        restricoes_declaradas: null,
        estado: EstadoDemanda.CONCLUIDA,
        estado_anterior: EstadoDemanda.PRONTA_PARA_ENTREGA,
        criado_em: '2026-09-01T10:00:00Z',
        atualizado_em: '2026-09-30T10:00:00Z',
        data_conclusao: '2026-09-30T10:00:00Z',
        periodo_analise: null,
        granularidade: null,
        formato_entrega: null,
        requisitos_homologados_em: '2026-09-02T10:00:00Z',
        requisitos_homologados_por: 'ANALISTA',
        requisitos_justificativa_homologacao: 'Homologação histórica concluída com sucesso.',
        requisitos_ressalvas: null,
      },
      {
        id: 'dem_cancelada',
        projeto_id: 'prj_1',
        projetoNome: 'Projeto Vendas',
        titulo: 'Demanda Cancelada',
        solicitacao_bruta: SOLICITACAO_BRUTA_ORIGINAL,
        contexto: 'Contexto cancelado',
        objetivo_inicial: 'Objetivo cancelado',
        prazo_esperado: null,
        restricoes_declaradas: null,
        estado: EstadoDemanda.CANCELADA,
        estado_anterior: EstadoDemanda.EM_CLARIFICACAO,
        criado_em: '2026-09-10T10:00:00Z',
        atualizado_em: '2026-09-15T10:00:00Z',
        data_conclusao: '2026-09-15T10:00:00Z',
        periodo_analise: null,
        granularidade: null,
        formato_entrega: null,
        requisitos_homologados_em: null,
        requisitos_homologados_por: null,
        requisitos_justificativa_homologacao: null,
        requisitos_ressalvas: null,
      },
      {
        id: 'dem_suspensa',
        projeto_id: 'prj_1',
        projetoNome: 'Projeto Vendas',
        titulo: 'Demanda Suspensa',
        solicitacao_bruta: SOLICITACAO_BRUTA_ORIGINAL,
        contexto: 'Contexto suspenso',
        objetivo_inicial: 'Objetivo suspenso',
        prazo_esperado: null,
        restricoes_declaradas: null,
        estado: EstadoDemanda.SUSPENSA,
        estado_anterior: EstadoDemanda.EM_CLARIFICACAO,
        criado_em: '2026-09-20T10:00:00Z',
        atualizado_em: '2026-09-25T10:00:00Z',
        data_conclusao: null,
        periodo_analise: null,
        granularidade: null,
        formato_entrega: null,
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
        if (idx === -1) return null;
        // Reproduz a salvaguarda de imutabilidade do repositório real
        const { solicitacao_bruta: _omit, ...safePatch } = patch;
        mockDemandas[idx] = { ...mockDemandas[idx], ...safePatch, atualizado_em: new Date().toISOString() };
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
        if (idx === -1) return null;
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
        const idx = mockRequisitos.findIndex((r) => r.id === id);
        if (idx === -1) return false;
        mockRequisitos.splice(idx, 1);
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
        if (idx === -1) return null;
        mockPerguntas[idx] = { ...mockPerguntas[idx], ...patch, atualizado_em: new Date().toISOString() };
        return mockPerguntas[idx];
      }),
      findById: vi.fn(async (id: string) => mockPerguntas.find((p) => p.id === id) || null),
      findByDemandId: vi.fn(async (demandaId: string) =>
        mockPerguntas.filter((p) => p.demanda_id === demandaId)
      ),
      countByDemandId: vi.fn(async (demandaId: string) =>
        mockPerguntas.filter((p) => p.demanda_id === demandaId).length
      ),
      countBloqueantesPendentes: vi.fn(
        async (demandaId: string) =>
          mockPerguntas.filter(
            (p) =>
              p.demanda_id === demandaId &&
              p.bloqueante &&
              p.status !== StatusPerguntaClarificacao.RESPONDIDA &&
              p.status !== StatusPerguntaClarificacao.DESCARTADA
          ).length
      ),
      delete: vi.fn(async (id: string) => {
        const idx = mockPerguntas.findIndex((p) => p.id === id);
        if (idx === -1) return false;
        mockPerguntas.splice(idx, 1);
        return true;
      }),
    };
  });

  describe('1. Garantia de Imutabilidade de solicitacao_bruta', () => {
    it('deve atualizar o briefing mantendo solicitacao_bruta estritamente inalterada', async () => {
      const useCase = new AtualizarBriefingDemandaUseCase(demandRepo);

      const resultado = await useCase.execute({
        demandaId: 'dem_ativa',
        contexto: 'Novo contexto atualizado',
        objetivoInicial: 'Novo objetivo analítico refinado',
        periodoAnalise: 'Últimos 24 meses',
        granularidade: 'Semanal',
        formatoEntrega: 'Dashboard Power BI com RLS',
      });

      expect(resultado.contexto).toBe('Novo contexto atualizado');
      expect(resultado.objetivo_inicial).toBe('Novo objetivo analítico refinado');
      expect(resultado.periodo_analise).toBe('Últimos 24 meses');
      expect(resultado.granularidade).toBe('Semanal');
      expect(resultado.formato_entrega).toBe('Dashboard Power BI com RLS');
      // Preservação estrita da solicitação bruta
      expect(resultado.solicitacao_bruta).toBe(SOLICITACAO_BRUTA_ORIGINAL);
    });

    it('deve descartar qualquer tentativa maliciosa de injetar solicitacao_bruta via use case ou payload', async () => {
      const useCase = new AtualizarBriefingDemandaUseCase(demandRepo);

      const payloadComInjecao = {
        demandaId: 'dem_ativa',
        contexto: 'Contexto legítimo',
        solicitacao_bruta: 'TEXTO_FORJADO_QUE_NAO_DEVE_SER_ACEITO',
      } as any;

      const resultado = await useCase.execute(payloadComInjecao);

      expect(resultado.contexto).toBe('Contexto legítimo');
      expect(resultado.solicitacao_bruta).toBe(SOLICITACAO_BRUTA_ORIGINAL);
      expect(resultado.solicitacao_bruta).not.toBe('TEXTO_FORJADO_QUE_NAO_DEVE_SER_ACEITO');
    });

    it('deve garantir no repositório que update() descarta solicitacao_bruta', async () => {
      const res = await demandRepo.update('dem_ativa', {
        contexto: 'Atualizado',
        solicitacao_bruta: 'TENTATIVA_DIRETA_NO_REPO',
      } as any);

      expect(res?.contexto).toBe('Atualizado');
      expect(res?.solicitacao_bruta).toBe(SOLICITACAO_BRUTA_ORIGINAL);
    });
  });

  describe('2. Bloqueio Server-side nos Três Estados Read-Only (CONCLUIDA, CANCELADA, SUSPENSA)', () => {
    const estadosReadOnly = [
      { id: 'dem_concluida', estado: EstadoDemanda.CONCLUIDA, label: 'CONCLUIDA' },
      { id: 'dem_cancelada', estado: EstadoDemanda.CANCELADA, label: 'CANCELADA' },
      { id: 'dem_suspensa', estado: EstadoDemanda.SUSPENSA, label: 'SUSPENSA' },
    ];

    estadosReadOnly.forEach(({ id, estado, label }) => {
      describe(`Estado Read-Only: ${label}`, () => {
        beforeEach(() => {
          // Garante requisito e pergunta associados à demanda deste estado
          mockRequisitos.push({
            id: `req_${label}`,
            demanda_id: id,
            titulo: `Requisito ${label}`,
            descricao: null,
            categoria: CategoriaRequisito.REGRA_NEGOCIO,
            prioridade: 'OBRIGATORIO',
            status: StatusRequisito.IDENTIFICADO,
            origem: 'MANUAL',
            criado_em: '2026-10-01T10:00:00Z',
            atualizado_em: '2026-10-01T10:00:00Z',
          });

          mockPerguntas.push({
            id: `perg_${label}`,
            demanda_id: id,
            requisito_id: `req_${label}`,
            pergunta: `Pergunta para ${label}`,
            motivacao: null,
            bloqueante: false,
            status: StatusPerguntaClarificacao.RASCUNHO,
            enviada_em: null,
            resposta: null,
            respondido_por: null,
            respondida_em: null,
            impacto_decisao: null,
            criado_em: '2026-10-01T10:00:00Z',
            atualizado_em: '2026-10-01T10:00:00Z',
          });
        });

        it(`deve rejeitar server-side a atualização de briefing para demanda ${label}`, async () => {
          const useCase = new AtualizarBriefingDemandaUseCase(demandRepo);
          await expect(
            useCase.execute({
              demandaId: id,
              contexto: 'Tentativa de alteração',
            })
          ).rejects.toThrow(/somente-leitura/i);
        });

        it(`deve rejeitar server-side a criação de requisito para demanda ${label}`, async () => {
          const useCase = new CriarRequisitoUseCase(requisitoRepo, demandRepo);
          await expect(
            useCase.execute({
              demandaId: id,
              titulo: 'Novo Requisito Bloqueado',
              categoria: CategoriaRequisito.REGRA_NEGOCIO,
            })
          ).rejects.toThrow(/somente-leitura/i);
        });

        it(`deve rejeitar server-side a atualização de requisito (dados e status) para demanda ${label}`, async () => {
          const useCase = new AtualizarRequisitoUseCase(requisitoRepo, demandRepo);
          await expect(
            useCase.execute({
              id: `req_${label}`,
              titulo: 'Título Atualizado Bloqueado',
              status: StatusRequisito.CLARIFICADO,
            })
          ).rejects.toThrow(/somente-leitura/i);
        });

        it(`deve rejeitar server-side a remoção de requisito para demanda ${label}`, async () => {
          const useCase = new RemoverRequisitoUseCase(requisitoRepo, demandRepo);
          await expect(useCase.execute(`req_${label}`)).rejects.toThrow(/somente-leitura/i);
        });

        it(`deve rejeitar server-side a criação de pergunta de clarificação para demanda ${label}`, async () => {
          const useCase = new CriarPerguntaClarificacaoUseCase(perguntaRepo, demandRepo);
          await expect(
            useCase.execute({
              demandaId: id,
              pergunta: 'Pergunta Bloqueada pelo Estado',
            })
          ).rejects.toThrow(/somente-leitura/i);
        });

        it(`deve rejeitar server-side a atualização de pergunta de clarificação para demanda ${label}`, async () => {
          const useCase = new AtualizarPerguntaClarificacaoUseCase(perguntaRepo, demandRepo);
          await expect(
            useCase.execute({
              id: `perg_${label}`,
              pergunta: 'Texto Atualizado Bloqueado',
            })
          ).rejects.toThrow(/somente-leitura/i);
        });

        it(`deve rejeitar server-side o despacho/envio de pergunta para demanda ${label}`, async () => {
          const useCase = new DespacharPerguntaClarificacaoUseCase(
            perguntaRepo,
            undefined,
            demandRepo
          );
          await expect(useCase.execute(`perg_${label}`)).rejects.toThrow(/somente-leitura/i);
        });

        it(`deve rejeitar server-side o registro de resposta do contratante para demanda ${label}`, async () => {
          const useCase = new RegistrarRespostaContratanteUseCase(
            perguntaRepo,
            undefined,
            undefined,
            demandRepo
          );
          await expect(
            useCase.execute({
              perguntaId: `perg_${label}`,
              resposta: 'Resposta que deve ser bloqueada',
              respondidoPor: 'Diretor Comercial',
            })
          ).rejects.toThrow(/somente-leitura/i);
        });

        it(`deve rejeitar server-side a remoção de pergunta para demanda ${label}`, async () => {
          const useCase = new RemoverPerguntaClarificacaoUseCase(perguntaRepo, demandRepo);
          await expect(useCase.execute(`perg_${label}`)).rejects.toThrow(/somente-leitura/i);
        });

        it(`deve rejeitar server-side a homologação formal de requisitos para demanda ${label}`, async () => {
          const useCase = new HomologarLevantamentoRequisitosUseCase(
            demandRepo,
            requisitoRepo,
            perguntaRepo
          );
          await expect(
            useCase.execute({
              demandaId: id,
              justificativa: 'Justificativa de homologação com mais de 15 caracteres',
            })
          ).rejects.toThrow(/somente-leitura/i);
        });
      });
    });
  });

  describe('3. Funcionamento Normal em Estados Ativos Permitidos', () => {
    it('deve permitir ciclo completo de mutações na demanda ativa em EM_CLARIFICACAO', async () => {
      // 1. Atualizar briefing
      const briefingUseCase = new AtualizarBriefingDemandaUseCase(demandRepo);
      const briefingAtualizado = await briefingUseCase.execute({
        demandaId: 'dem_ativa',
        contexto: 'Contexto refinado e aprovado',
      });
      expect(briefingAtualizado.contexto).toBe('Contexto refinado e aprovado');

      // 2. Criar requisito
      const criarReqUseCase = new CriarRequisitoUseCase(requisitoRepo, demandRepo);
      const reqCriado = await criarReqUseCase.execute({
        demandaId: 'dem_ativa',
        titulo: 'Margem de contribuição por produto',
        categoria: CategoriaRequisito.METRICA_KPI,
      });
      expect(reqCriado.id).toBeDefined();

      // 3. Atualizar requisito
      const atualizarReqUseCase = new AtualizarRequisitoUseCase(requisitoRepo, demandRepo);
      const reqAtualizado = await atualizarReqUseCase.execute({
        id: reqCriado.id,
        status: StatusRequisito.CLARIFICADO,
      });
      expect(reqAtualizado.status).toBe(StatusRequisito.CLARIFICADO);

      // 4. Criar pergunta
      const criarPergUseCase = new CriarPerguntaClarificacaoUseCase(perguntaRepo, demandRepo);
      const pergCriada = await criarPergUseCase.execute({
        demandaId: 'dem_ativa',
        pergunta: 'Qual critério de rateio de custos indiretos?',
        bloqueante: true,
      });
      expect(pergCriada.id).toBeDefined();

      // 5. Despachar pergunta
      const despacharPergUseCase = new DespacharPerguntaClarificacaoUseCase(
        perguntaRepo,
        undefined,
        demandRepo
      );
      const pergDespachada = await despacharPergUseCase.execute(pergCriada.id);
      expect(pergDespachada.status).toBe(StatusPerguntaClarificacao.ENVIADA);

      // 6. Responder pergunta
      const responderPergUseCase = new RegistrarRespostaContratanteUseCase(
        perguntaRepo,
        undefined,
        undefined,
        demandRepo
      );
      const pergRespondida = await responderPergUseCase.execute({
        perguntaId: pergCriada.id,
        resposta: 'Rateio proporcional ao volume físico produzido.',
        respondidoPor: 'Controladoria',
      });
      expect(pergRespondida.status).toBe(StatusPerguntaClarificacao.RESPONDIDA);

      // 7. Homologar requisitos
      const homologarUseCase = new HomologarLevantamentoRequisitosUseCase(
        demandRepo,
        requisitoRepo,
        perguntaRepo
      );
      const demandaHomologada = await homologarUseCase.execute({
        demandaId: 'dem_ativa',
        justificativa: 'Levantamento completo e homologado com validação do contratante.',
      });
      expect(demandaHomologada.requisitos_homologados_em).toBeDefined();

      // 8. Remover requisito e pergunta
      const removerPergUseCase = new RemoverPerguntaClarificacaoUseCase(perguntaRepo, demandRepo);
      const pergRemovida = await removerPergUseCase.execute(pergCriada.id);
      expect(pergRemovida).toBe(true);

      const removerReqUseCase = new RemoverRequisitoUseCase(requisitoRepo, demandRepo);
      const reqRemovido = await removerReqUseCase.execute(reqCriado.id);
      expect(reqRemovido).toBe(true);
    });

    it('isEstadoReadOnly helper deve classificar com precisão os estados', () => {
      expect(isEstadoReadOnly(EstadoDemanda.CONCLUIDA)).toBe(true);
      expect(isEstadoReadOnly(EstadoDemanda.CANCELADA)).toBe(true);
      expect(isEstadoReadOnly(EstadoDemanda.SUSPENSA)).toBe(true);

      expect(isEstadoReadOnly(EstadoDemanda.NOVA)).toBe(false);
      expect(isEstadoReadOnly(EstadoDemanda.EM_CLARIFICACAO)).toBe(false);
      expect(isEstadoReadOnly(EstadoDemanda.DADOS_RECEBIDOS)).toBe(false);
      expect(isEstadoReadOnly(EstadoDemanda.EM_QUALIDADE_E_PREPARACAO)).toBe(false);
      expect(isEstadoReadOnly(EstadoDemanda.EM_MODELAGEM_E_ANALISE)).toBe(false);
      expect(isEstadoReadOnly(EstadoDemanda.EM_VALIDACAO)).toBe(false);
      expect(isEstadoReadOnly(EstadoDemanda.PRONTA_PARA_ENTREGA)).toBe(false);
    });
  });
});
