/**
 * tests/unit/requirements/triagem-semantica-intake.spec.ts
 *
 * Suíte de Testes Unitários e Integrados da Triagem Semântica Pós-Intake.
 *
 * Invariantes Cobertas:
 * 1. Descarte sem perda de rastreabilidade (preservação de histórico e origem INTAKE via StatusRequisito.DESCARTADO, sem exclusão física).
 * 2. Capacidade de restauração de requisito descartado sem quebra de integridade.
 * 3. Gate 1B: Requisitos origem === 'INTAKE' && status === 'IDENTIFICADO' emitem aviso consultivo de prontidão sem bloqueio indevido.
 * 4. Resolução da deliberação (validar ou descartar) remove o aviso consultivo de propostas pendentes.
 * 5. Precedência estrita dos dados humanos no preenchimento assistido de sugestões do Briefing.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AtualizarRequisitoUseCase } from '@/core/use-cases/requirements/atualizar-requisito.use-case';
import { AvaliarProntidaoRequisitosUseCase } from '@/core/use-cases/requirements/avaliar-prontidao-requisitos.use-case';
import { aplicarSugestoesIntakeNoBriefing } from '@/core/domain/intake/intake-briefing-merger';
import { IRequisitoDemandaRepository } from '@/core/domain/repositories/requisito-demanda-repository.interface';
import { IPerguntaClarificacaoRepository } from '@/core/domain/repositories/pergunta-clarificacao-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { CategoriaRequisito } from '@/core/domain/enums/categoria-requisito';
import { StatusRequisito } from '@/core/domain/enums/status-requisito';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { RequisitoDemanda } from '@/core/domain/entities/requisito-demanda';

describe('Unit Tests: Triagem Semântica Pós-Intake (Governança e Rastreabilidade)', () => {
  let mockDemandas: DemandaComProjeto[];
  let mockRequisitos: RequisitoDemanda[];
  let demandRepo: IDemandRepository;
  let requisitoRepo: IRequisitoDemandaRepository;
  let perguntaRepo: IPerguntaClarificacaoRepository;

  beforeEach(() => {
    mockDemandas = [
      {
        id: 'dem_triagem_1',
        projeto_id: 'prj_triagem_1',
        projetoNome: 'Projeto Triagem',
        titulo: 'Demanda de Avaliação Semântica',
        solicitacao_bruta: 'Solicitação original verbatim para fins de auditoria.',
        contexto: 'Contexto de testes',
        objetivo_inicial: 'Objetivo de teste válido com mais de cinco caracteres',
        prazo_esperado: null,
        restricoes_declaradas: null,
        estado: EstadoDemanda.EM_CLARIFICACAO,
        estado_anterior: EstadoDemanda.NOVA,
        criado_em: '2026-10-01T10:00:00Z',
        atualizado_em: '2026-10-01T10:00:00Z',
        data_conclusao: null,
        periodo_analise: '2026',
        granularidade: 'Mensal',
        formato_entrega: null,
        requisitos_homologados_em: null,
        requisitos_homologados_por: null,
        requisitos_justificativa_homologacao: null,
        requisitos_ressalvas: null,
      },
    ];

    mockRequisitos = [
      {
        id: 'req_intake_001',
        demanda_id: 'dem_triagem_1',
        titulo: 'Receita Bruta Mensal',
        descricao: 'Sugerido via extração de intake',
        categoria: CategoriaRequisito.METRICA_KPI,
        prioridade: 'OBRIGATORIO',
        status: StatusRequisito.IDENTIFICADO,
        origem: 'INTAKE',
        criado_em: '2026-10-01T10:00:00Z',
        atualizado_em: '2026-10-01T10:00:00Z',
      },
      {
        id: 'req_intake_002',
        demanda_id: 'dem_triagem_1',
        titulo: 'Margem de Contribuição por Canal',
        descricao: 'Sugerido via inferência semântica',
        categoria: CategoriaRequisito.METRICA_KPI,
        prioridade: 'DESEJAVEL',
        status: StatusRequisito.IDENTIFICADO,
        origem: 'INTAKE',
        criado_em: '2026-10-01T10:00:00Z',
        atualizado_em: '2026-10-01T10:00:00Z',
      },
    ];

    demandRepo = {
      findById: vi.fn(async (id: string) => mockDemandas.find((d) => d.id === id) || null),
      findByProjectId: vi.fn(async () => mockDemandas),
      findAll: vi.fn(async () => mockDemandas),
      findRecent: vi.fn(async () => mockDemandas),
      create: vi.fn(async (data: any) => data),
      update: vi.fn(async (id: string, patch: any) => {
        const idx = mockDemandas.findIndex((d) => d.id === id);
        if (idx === -1) throw new Error('Demanda não encontrada');
        mockDemandas[idx] = { ...mockDemandas[idx], ...patch };
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
        const idx = mockRequisitos.findIndex((r) => r.id === id);
        if (idx !== -1) mockRequisitos.splice(idx, 1);
        return true;
      }),
    };

    perguntaRepo = {
      create: vi.fn(async (data: any) => data),
      update: vi.fn(async (_id: string, patch: any) => patch),
      findById: vi.fn(async () => null),
      findByDemandId: vi.fn(async () => []),
      delete: vi.fn(async () => true),
      countByDemandId: vi.fn(async () => 0),
      countBloqueantesPendentes: vi.fn(async () => 0),
    };
  });

  describe('1. Descarte sem perda de rastreabilidade (Condição 1)', () => {
    it('deve descartar proposta do Intake alterando seu status para DESCARTADO sem exclusão física', async () => {
      const useCase = new AtualizarRequisitoUseCase(requisitoRepo, demandRepo);

      const descartado = await useCase.execute({
        id: 'req_intake_002',
        status: StatusRequisito.DESCARTADO,
      });

      // Validação de descarte lógico
      expect(descartado.status).toBe(StatusRequisito.DESCARTADO);
      expect(descartado.origem).toBe('INTAKE');
      expect(descartado.titulo).toBe('Margem de Contribuição por Canal');

      // Garantir que a entidade NÃO foi excluída fisicamente do repositório
      expect(requisitoRepo.delete).not.toHaveBeenCalled();
      const todosNoRepo = await requisitoRepo.findByDemandId('dem_triagem_1');
      expect(todosNoRepo).toHaveLength(2);
      expect(todosNoRepo.find((r) => r.id === 'req_intake_002')).toBeDefined();
    });

    it('deve permitir restaurar um requisito descartado para CLARIFICADO preservando proveniência', async () => {
      const useCase = new AtualizarRequisitoUseCase(requisitoRepo, demandRepo);

      // Descarte prévio
      await useCase.execute({
        id: 'req_intake_001',
        status: StatusRequisito.DESCARTADO,
      });

      // Restauração humana
      const restaurado = await useCase.execute({
        id: 'req_intake_001',
        status: StatusRequisito.CLARIFICADO,
      });

      expect(restaurado.status).toBe(StatusRequisito.CLARIFICADO);
      expect(restaurado.origem).toBe('INTAKE');
      expect(restaurado.titulo).toBe('Receita Bruta Mensal');
    });
  });

  describe('2. Gate 1B e Avaliação de Prontidão (Condição 2)', () => {
    it('deve listar propostas do Intake IDENTIFICADO como avisos consultivos sem bloquear prontidão', async () => {
      const avaliarProntidao = new AvaliarProntidaoRequisitosUseCase(
        demandRepo,
        requisitoRepo,
        perguntaRepo
      );

      const prontidao = await avaliarProntidao.execute('dem_triagem_1');

      // Não bloqueia avanço
      expect(prontidao.bloqueado).toBe(false);
      expect(prontidao.requisitosIntakePendentes).toBe(2);

      // Aviso consultivo explícito presente
      const avisoIntake = prontidao.avisosConsultivos.find((a) =>
        a.includes('requisito(s) propostos pelo Intake aguardando deliberação humana')
      );
      expect(avisoIntake).toBeDefined();
      expect(avisoIntake).toContain('2 requisito(s)');
    });

    it('deve remover o aviso consultivo do Intake após deliberação humana (validação e descarte)', async () => {
      const atualizarUseCase = new AtualizarRequisitoUseCase(requisitoRepo, demandRepo);

      // Humano valida uma proposta e descarta a outra
      await atualizarUseCase.execute({
        id: 'req_intake_001',
        status: StatusRequisito.CLARIFICADO,
      });
      await atualizarUseCase.execute({
        id: 'req_intake_002',
        status: StatusRequisito.DESCARTADO,
      });

      const avaliarProntidao = new AvaliarProntidaoRequisitosUseCase(
        demandRepo,
        requisitoRepo,
        perguntaRepo
      );

      const prontidao = await avaliarProntidao.execute('dem_triagem_1');

      expect(prontidao.requisitosIntakePendentes).toBe(0);
      const avisoIntake = prontidao.avisosConsultivos.find((a) =>
        a.includes('requisito(s) propostos pelo Intake aguardando deliberação humana')
      );
      expect(avisoIntake).toBeUndefined();
    });
  });

  describe('3. Precedência de Dados Humanos no Briefing (Condição 3)', () => {
    it('invariante: campos com valor humano não são sobrescritos por sugestões do Intake', () => {
      const snapshot = JSON.stringify({
        fatos: {
          periodo: '2024 a 2025',
          prazo: '31/12/2025',
          entregaveis: ['Dashboard Executivo'],
        },
        descobertasDados: {
          dimensoes: ['Região', 'Produto'],
        },
      });

      const formComEntradaHumana = {
        contexto: 'Contexto manual',
        objetivoInicial: 'Objetivo manual',
        periodoAnalise: 'Período customizado 2026', // Já preenchido
        granularidade: '', // Vazio
        formatoEntrega: '', // Vazio
        restricoesDeclaradas: '',
        prazoEsperado: '15/10/2026', // Já preenchido
      };

      const resultado = aplicarSugestoesIntakeNoBriefing(formComEntradaHumana, snapshot);

      // Precedência de dados humanos
      expect(resultado.valores.periodoAnalise).toBe('Período customizado 2026');
      expect(resultado.valores.prazoEsperado).toBe('15/10/2026');

      // Preenchimento de campos vazios
      expect(resultado.valores.granularidade).toBe('Região, Produto');
      expect(resultado.valores.formatoEntrega).toBe('Dashboard Executivo');

      expect(resultado.camposPreenchidos).toEqual(['Granularidade', 'Formato de Entrega']);
    });
  });
});
