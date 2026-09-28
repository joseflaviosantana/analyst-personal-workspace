import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowEngine } from '@/core/domain/rules/workflow-engine';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { TransitionDemandStateUseCase } from '@/core/use-cases/workflow/transition-demand-state';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { Demanda, DemandaComProjeto } from '@/core/domain/entities/demanda';
import { TrilhaAuditoria } from '@/core/domain/entities/trilha-auditoria';

describe('Integração de Modelagem Homologada com WorkflowEngine (Subunidade 3.6C)', () => {
  let demandRepo: IDemandRepository;
  let auditRepo: IAuditRepository;
  let demandas: Map<string, Demanda>;
  let auditoria: TrilhaAuditoria[];

  beforeEach(() => {
    demandas = new Map();
    auditoria = [];

    demandRepo = {
      create: async (d) => {
        demandas.set(d.id, d);
        return { ...d, projetoNome: 'Proj' };
      },
      findById: async (id): Promise<DemandaComProjeto | null> => {
        const d = demandas.get(id);
        if (!d) return null;
        return { ...d, projetoNome: 'Projeto Vendas' };
      },
      findAll: async () => Array.from(demandas.values()).map((d) => ({ ...d, projetoNome: 'Proj' })),
      findByProjectId: async () => [],
      findRecent: async () => [],
      countActive: async () => 0,
      countTotal: async () => 0,
      update: async (id, partial) => {
        const d = demandas.get(id);
        if (!d) return null;
        const updated = { ...d, ...partial, atualizado_em: new Date().toISOString() };
        demandas.set(id, updated);
        return { ...updated, projetoNome: 'Proj' };
      },
    };

    auditRepo = {
      record: async (evento) => {
        const saved: TrilhaAuditoria = {
          ...evento,
          id: evento.id ?? 'audit-1',
        };
        auditoria.push(saved);
        return saved;
      },
      findByDemandaId: async () => auditoria,
    };
  });

  describe('WorkflowEngine.podeTransitar — Regra de Modelagem Homologada', () => {
    it('deve bloquear avanço de EM_MODELAGEM_E_ANALISE para EM_VALIDACAO sem modelo homologado', () => {
      const res1 = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        EstadoDemanda.EM_VALIDACAO
      );
      expect(res1.valida).toBe(false);
      expect(res1.mensagem).toContain('sem um Modelo Analítico no status HOMOLOGADO');

      const res2 = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        EstadoDemanda.EM_VALIDACAO,
        {
          modeloHomologado: null,
        }
      );
      expect(res2.valida).toBe(false);
      expect(res2.mensagem).toContain('sem um Modelo Analítico no status HOMOLOGADO');
    });

    it('deve bloquear avanço quando o modelo está em RASCUNHO', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        EstadoDemanda.EM_VALIDACAO,
        {
          modeloHomologado: {
            id: 'mod-1',
            demanda_id: 'dem-1',
            dataset_autorizado_id: 'ds-1',
            status: 'RASCUNHO',
          },
        }
      );
      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('sem um Modelo Analítico no status HOMOLOGADO');
    });

    it('deve bloquear avanço quando o modelo homologado foi revogado', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        EstadoDemanda.EM_VALIDACAO,
        {
          modeloHomologado: {
            id: 'mod-1',
            demanda_id: 'dem-1',
            dataset_autorizado_id: 'ds-1',
            status: 'HOMOLOGADO',
            revogado_em: '2026-09-28T19:00:00Z',
          },
        }
      );
      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('foi revogado e não admite avanço');
    });

    it('deve bloquear avanço quando o modelo possui alterações posteriores à homologação', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        EstadoDemanda.EM_VALIDACAO,
        {
          modeloHomologado: {
            id: 'mod-1',
            demanda_id: 'dem-1',
            dataset_autorizado_id: 'ds-1',
            status: 'HOMOLOGADO',
            temAlteracaoPosterior: true,
          },
        }
      );
      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('alterações materiais posteriores à homologação');
    });

    it('deve bloquear avanço quando o modelo possui bloqueios de conformidade ativos', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        EstadoDemanda.EM_VALIDACAO,
        {
          modeloHomologado: {
            id: 'mod-1',
            demanda_id: 'dem-1',
            dataset_autorizado_id: 'ds-1',
            status: 'HOMOLOGADO',
            totalBloqueios: 1,
          },
        }
      );
      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('bloqueio(s) de conformidade ativos');
    });

    it('deve bloquear avanço quando o modelo pertence a dataset divergente do vigente', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        EstadoDemanda.EM_VALIDACAO,
        {
          datasetAutorizado: {
            id: 'ds-vigente',
            status: 'VIGENTE',
            ativo_dados_id: 'atv-1',
            hash_sha256_snapshot: 'hash',
          },
          modeloHomologado: {
            id: 'mod-1',
            demanda_id: 'dem-1',
            dataset_autorizado_id: 'ds-outro-antigo',
            status: 'HOMOLOGADO',
            temAlteracaoPosterior: false,
            totalBloqueios: 0,
          },
        }
      );
      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('não está vinculado ao Dataset Autorizado vigente');
    });

    it('deve liberar avanço quando o modelo homologado é plenamente válido e conforme', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        EstadoDemanda.EM_VALIDACAO,
        {
          datasetAutorizado: {
            id: 'ds-vigente',
            status: 'VIGENTE',
            ativo_dados_id: 'atv-1',
            hash_sha256_snapshot: 'hash',
          },
          modeloHomologado: {
            id: 'mod-1',
            demanda_id: 'dem-1',
            dataset_autorizado_id: 'ds-vigente',
            status: 'HOMOLOGADO',
            homologado_em: '2026-09-28T18:00:00Z',
            revogado_em: null,
            temAlteracaoPosterior: false,
            totalBloqueios: 0,
          },
        }
      );
      expect(res.valida).toBe(true);
    });
  });

  describe('Compatibilidade com Jornadas Anteriores do Workspace', () => {
    it('não deve exigir modelo homologado para transições em etapas anteriores à modelagem', () => {
      // 1. NOVA -> EM_CLARIFICACAO
      const r1 = WorkflowEngine.podeTransitar(EstadoDemanda.NOVA, EstadoDemanda.EM_CLARIFICACAO);
      expect(r1.valida).toBe(true);

      // 2. EM_CLARIFICACAO -> DADOS_RECEBIDOS
      const r2 = WorkflowEngine.podeTransitar(EstadoDemanda.EM_CLARIFICACAO, EstadoDemanda.DADOS_RECEBIDOS);
      expect(r2.valida).toBe(true);

      // 3. DADOS_RECEBIDOS -> EM_QUALIDADE_E_PREPARACAO (exige apenas totalAtivosDados > 0)
      const r3 = WorkflowEngine.podeTransitar(
        EstadoDemanda.DADOS_RECEBIDOS,
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        { totalAtivosDados: 1 }
      );
      expect(r3.valida).toBe(true);
    });
  });

  describe('Execução Integrada com TransitionDemandStateUseCase', () => {
    it('deve avançar estado da demanda quando modelo analítico homologado é fornecido no contexto', async () => {
      const demanda: Demanda = {
        id: 'dem-01',
        projeto_id: 'proj-01',
        titulo: 'Demanda de Vendas',
        solicitacao_bruta: 'Análise de Vendas',
        contexto: 'Contexto',
        objetivo_inicial: 'Objetivo',
        prazo_esperado: null,
        restricoes_declaradas: null,
        estado: EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        estado_anterior: null,
        data_conclusao: null,
        criado_em: '2026-09-28T18:00:00Z',
        atualizado_em: '2026-09-28T18:00:00Z',
      };
      demandas.set(demanda.id, demanda);

      const useCase = new TransitionDemandStateUseCase(demandRepo, auditRepo);

      const updated = await useCase.execute({
        demandaId: 'dem-01',
        novoEstado: EstadoDemanda.EM_VALIDACAO,
        justificativa: 'Modelagem analítica homologada com sucesso.',
        contextoExtra: {
          modeloHomologado: {
            id: 'mod-01',
            demanda_id: 'dem-01',
            dataset_autorizado_id: 'ds-vigente',
            status: 'HOMOLOGADO',
            homologado_em: '2026-09-28T18:30:00Z',
            revogado_em: null,
            temAlteracaoPosterior: false,
            totalBloqueios: 0,
          },
        },
      });

      expect(updated.estado).toBe(EstadoDemanda.EM_VALIDACAO);
      expect(auditoria.length).toBe(1);
      expect(auditoria[0].tipo_evento).toBe('TRANSICAO_ESTADO');
    });

    it('deve rejeitar avanço da demanda quando modelo não está homologado', async () => {
      const demanda: Demanda = {
        id: 'dem-01',
        projeto_id: 'proj-01',
        titulo: 'Demanda de Vendas',
        solicitacao_bruta: 'Análise de Vendas',
        contexto: 'Contexto',
        objetivo_inicial: 'Objetivo',
        prazo_esperado: null,
        restricoes_declaradas: null,
        estado: EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        estado_anterior: null,
        data_conclusao: null,
        criado_em: '2026-09-28T18:00:00Z',
        atualizado_em: '2026-09-28T18:00:00Z',
      };
      demandas.set(demanda.id, demanda);

      const useCase = new TransitionDemandStateUseCase(demandRepo, auditRepo);

      await expect(
        useCase.execute({
          demandaId: 'dem-01',
          novoEstado: EstadoDemanda.EM_VALIDACAO,
          justificativa: 'Tentativa sem homologação',
          contextoExtra: {
            modeloHomologado: null,
          },
        })
      ).rejects.toThrow('sem um Modelo Analítico no status HOMOLOGADO');
    });
  });
});
