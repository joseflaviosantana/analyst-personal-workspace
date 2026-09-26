import { describe, it, expect } from 'vitest';
import { QualityWorkflowGate, QualityGateInput } from '@/core/domain/rules/quality-gate';
import { DiagnosticoQualidade, ResultadoItemVerificacao } from '@/core/domain/entities/diagnostico-qualidade';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { CategoriaProblemaQualidade } from '@/core/domain/enums/categoria-problema-qualidade';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { StatusExecucaoDiagnostico } from '@/core/domain/enums/status-execucao-diagnostico';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { StatusVerificacaoQualidade } from '@/core/domain/enums/status-verificacao-qualidade';

function criarDiagnosticoValido(
  statusExecucao = StatusExecucaoDiagnostico.CONCLUIDO,
  verificacoes: ResultadoItemVerificacao[] = []
): DiagnosticoQualidade {
  return {
    id: 'diag-001',
    ativo_dados_id: 'asset-001',
    demanda_id: 'dem-001',
    iniciado_em: '2026-09-26T18:00:00.000Z',
    concluido_em: '2026-09-26T18:00:01.000Z',
    duracao_ms: 1000,
    total_linhas_avaliadas: 10000,
    total_colunas_avaliadas: 10,
    verificacoes_executadas: verificacoes,
    total_problemas_detectados: 0,
    status_execucao: statusExecucao,
    erro_mensagem: null,
    resumo_metricas: null,
    criado_em: '2026-09-26T18:00:00.000Z',
    atualizado_em: '2026-09-26T18:00:01.000Z',
  };
}

function criarProblema(
  id: string,
  severidade: SeveridadeProblema,
  status: StatusProblemaQualidade,
  diagnosticoId: string | null = 'diag-001'
): ProblemaQualidade {
  return {
    id,
    diagnostico_id: diagnosticoId,
    ativo_dados_id: 'asset-001',
    demanda_id: 'dem-001',
    categoria: CategoriaProblemaQualidade.DUPLICIDADES_LINHA,
    titulo: `Problema ${id}`,
    descricao: `Descrição do problema ${id}`,
    tabela_afetada: 'vendas.csv',
    coluna_afetada: 'id',
    total_linhas_afetadas: 10,
    percentual_linhas_afetadas: 0.1,
    amostra_evidencias: [],
    severidade,
    impacto_calculo: null,
    acao_deliberada: null,
    justificativa_deliberacao: null,
    deliberado_por_humano: severidade !== SeveridadeProblema.PENDENTE,
    deliberado_em: severidade !== SeveridadeProblema.PENDENTE ? '2026-09-26T18:05:00.000Z' : null,
    status,
    origem_deteccao: diagnosticoId ? 'AUTOMATICA' : 'MANUAL',
    criado_em: '2026-09-26T18:00:00.000Z',
    atualizado_em: '2026-09-26T18:00:00.000Z',
  };
}

describe('QualityWorkflowGate (V1 — Subunidade 3.4C)', () => {
  describe('1. Invariantes de Estado de Execução do Diagnóstico', () => {
    it('deve bloquear quando não houver diagnóstico executado (diagnosticoRecente === null)', () => {
      const input: QualityGateInput = {
        diagnosticoRecente: null,
        problemasUniverso: [],
      };
      const res = QualityWorkflowGate.avaliar(input);
      expect(res.decisao).toBe('BLOQUEADO');
      expect(res.liberado).toBe(false);
      expect(res.bloqueante).toBe(true);
      expect(res.motivo).toContain('ainda não possui diagnóstico');
    });

    it('deve bloquear quando a execução mais recente estiver EM_ANDAMENTO', () => {
      const diag = criarDiagnosticoValido(StatusExecucaoDiagnostico.EM_ANDAMENTO);
      const input: QualityGateInput = {
        diagnosticoRecente: diag,
        problemasUniverso: [],
      };
      const res = QualityWorkflowGate.avaliar(input);
      expect(res.decisao).toBe('BLOQUEADO');
      expect(res.liberado).toBe(false);
      expect(res.motivo).toContain('ainda está em execução');
    });

    it('deve bloquear quando a execução mais recente for FALHA', () => {
      const diag = criarDiagnosticoValido(StatusExecucaoDiagnostico.FALHA);
      const input: QualityGateInput = {
        diagnosticoRecente: diag,
        problemasUniverso: [],
      };
      const res = QualityWorkflowGate.avaliar(input);
      expect(res.decisao).toBe('BLOQUEADO');
      expect(res.liberado).toBe(false);
      expect(res.motivo).toContain('falhou');
    });
  });

  describe('2. Invariante Obrigatória: PENDENTE bloqueia com QUALQUER STATUS', () => {
    it('PENDENTE + ABERTO → BLOQUEADO', () => {
      const diag = criarDiagnosticoValido();
      const prob = criarProblema('p-pendente-aberto', SeveridadeProblema.PENDENTE, StatusProblemaQualidade.ABERTO);

      const res = QualityWorkflowGate.avaliar({
        diagnosticoRecente: diag,
        problemasUniverso: [prob],
      });

      expect(res.decisao).toBe('BLOQUEADO');
      expect(res.liberado).toBe(false);
      expect(res.detalhes.totalPendentes).toBe(1);
      expect(res.motivo).toContain('pendente(s) de deliberação humana');
    });

    it('PENDENTE + EM_INVESTIGACAO → BLOQUEADO', () => {
      const diag = criarDiagnosticoValido();
      const prob = criarProblema('p-pendente-inv', SeveridadeProblema.PENDENTE, StatusProblemaQualidade.EM_INVESTIGACAO);

      const res = QualityWorkflowGate.avaliar({
        diagnosticoRecente: diag,
        problemasUniverso: [prob],
      });

      expect(res.decisao).toBe('BLOQUEADO');
      expect(res.liberado).toBe(false);
      expect(res.detalhes.totalPendentes).toBe(1);
      expect(res.motivo).toContain('pendente(s) de deliberação humana');
    });

    it('PENDENTE + TRATADO → BLOQUEADO', () => {
      const diag = criarDiagnosticoValido();
      const prob = criarProblema('p-pendente-tratado', SeveridadeProblema.PENDENTE, StatusProblemaQualidade.TRATADO);

      const res = QualityWorkflowGate.avaliar({
        diagnosticoRecente: diag,
        problemasUniverso: [prob],
      });

      expect(res.decisao).toBe('BLOQUEADO');
      expect(res.liberado).toBe(false);
      expect(res.detalhes.totalPendentes).toBe(1);
      expect(res.motivo).toContain('pendente(s) de deliberação humana');
    });

    it('PENDENTE + ACEITO_COMO_RESTRICAO → BLOQUEADO', () => {
      const diag = criarDiagnosticoValido();
      const prob = criarProblema('p-pendente-aceito', SeveridadeProblema.PENDENTE, StatusProblemaQualidade.ACEITO_COMO_RESTRICAO);

      const res = QualityWorkflowGate.avaliar({
        diagnosticoRecente: diag,
        problemasUniverso: [prob],
      });

      expect(res.decisao).toBe('BLOQUEADO');
      expect(res.liberado).toBe(false);
      expect(res.detalhes.totalPendentes).toBe(1);
      expect(res.motivo).toContain('pendente(s) de deliberação humana');
    });
  });

  describe('3. Matriz de Severidade ALTA', () => {
    it('ALTA + ABERTO → bloqueado', () => {
      const diag = criarDiagnosticoValido();
      const prob = criarProblema('p-alta-aberto', SeveridadeProblema.ALTA, StatusProblemaQualidade.ABERTO);

      const res = QualityWorkflowGate.avaliar({
        diagnosticoRecente: diag,
        problemasUniverso: [prob],
      });

      expect(res.decisao).toBe('BLOQUEADO');
      expect(res.liberado).toBe(false);
      expect(res.detalhes.totalAltosBloqueantes).toBe(1);
      expect(res.motivo).toContain('severidade alta em aberto/investigação');
    });

    it('ALTA + EM_INVESTIGACAO → bloqueado', () => {
      const diag = criarDiagnosticoValido();
      const prob = criarProblema('p-alta-inv', SeveridadeProblema.ALTA, StatusProblemaQualidade.EM_INVESTIGACAO);

      const res = QualityWorkflowGate.avaliar({
        diagnosticoRecente: diag,
        problemasUniverso: [prob],
      });

      expect(res.decisao).toBe('BLOQUEADO');
      expect(res.liberado).toBe(false);
      expect(res.detalhes.totalAltosBloqueantes).toBe(1);
    });

    it('ALTA + TRATADO → liberado', () => {
      const diag = criarDiagnosticoValido();
      const prob = criarProblema('p-alta-tratado', SeveridadeProblema.ALTA, StatusProblemaQualidade.TRATADO);

      const res = QualityWorkflowGate.avaliar({
        diagnosticoRecente: diag,
        problemasUniverso: [prob],
      });

      expect(res.decisao).toBe('LIBERADO');
      expect(res.liberado).toBe(true);
      expect(res.detalhes.totalTratados).toBe(1);
      expect(res.detalhes.totalAltosBloqueantes).toBe(0);
    });

    it('ALTA + ACEITO_COMO_RESTRICAO → liberado com restrição', () => {
      const diag = criarDiagnosticoValido();
      const prob = criarProblema('p-alta-aceito', SeveridadeProblema.ALTA, StatusProblemaQualidade.ACEITO_COMO_RESTRICAO);

      const res = QualityWorkflowGate.avaliar({
        diagnosticoRecente: diag,
        problemasUniverso: [prob],
      });

      expect(res.decisao).toBe('LIBERADO');
      expect(res.liberado).toBe(true);
      expect(res.detalhes.totalAltosAceitos).toBe(1);
      expect(res.motivo).toContain('aceitos como restrição com justificativa auditável');
    });
  });

  describe('4. Matriz de Severidade CRITICA', () => {
    it('CRITICA + ABERTO → bloqueado', () => {
      const diag = criarDiagnosticoValido();
      const prob = criarProblema('p-crit-aberto', SeveridadeProblema.CRITICA, StatusProblemaQualidade.ABERTO);

      const res = QualityWorkflowGate.avaliar({
        diagnosticoRecente: diag,
        problemasUniverso: [prob],
      });

      expect(res.decisao).toBe('BLOQUEADO');
      expect(res.liberado).toBe(false);
      expect(res.detalhes.totalCriticosBloqueantes).toBe(1);
      expect(res.motivo).toContain('crítico(s) em aberto/investigação');
    });

    it('CRITICA + EM_INVESTIGACAO → bloqueado', () => {
      const diag = criarDiagnosticoValido();
      const prob = criarProblema('p-crit-inv', SeveridadeProblema.CRITICA, StatusProblemaQualidade.EM_INVESTIGACAO);

      const res = QualityWorkflowGate.avaliar({
        diagnosticoRecente: diag,
        problemasUniverso: [prob],
      });

      expect(res.decisao).toBe('BLOQUEADO');
      expect(res.liberado).toBe(false);
      expect(res.detalhes.totalCriticosBloqueantes).toBe(1);
    });

    it('CRITICA + TRATADO → liberado', () => {
      const diag = criarDiagnosticoValido();
      const prob = criarProblema('p-crit-tratado', SeveridadeProblema.CRITICA, StatusProblemaQualidade.TRATADO);

      const res = QualityWorkflowGate.avaliar({
        diagnosticoRecente: diag,
        problemasUniverso: [prob],
      });

      expect(res.decisao).toBe('LIBERADO');
      expect(res.liberado).toBe(true);
      expect(res.detalhes.totalCriticosBloqueantes).toBe(0);
    });

    it('CRITICA + ACEITO_COMO_RESTRICAO → liberado com restrição', () => {
      const diag = criarDiagnosticoValido();
      const prob = criarProblema('p-crit-aceito', SeveridadeProblema.CRITICA, StatusProblemaQualidade.ACEITO_COMO_RESTRICAO);

      const res = QualityWorkflowGate.avaliar({
        diagnosticoRecente: diag,
        problemasUniverso: [prob],
      });

      expect(res.decisao).toBe('LIBERADO');
      expect(res.liberado).toBe(true);
      expect(res.detalhes.totalCriticosAceitos).toBe(1);
    });
  });

  describe('5. Matriz de Severidade MEDIA e BAIXA deliberada', () => {
    it('MEDIA + ABERTO → liberado (informativo, não bloqueia)', () => {
      const diag = criarDiagnosticoValido();
      const prob = criarProblema('p-med-aberto', SeveridadeProblema.MEDIA, StatusProblemaQualidade.ABERTO);

      const res = QualityWorkflowGate.avaliar({
        diagnosticoRecente: diag,
        problemasUniverso: [prob],
      });

      expect(res.decisao).toBe('LIBERADO');
      expect(res.liberado).toBe(true);
      expect(res.bloqueante).toBe(false);
      expect(res.detalhes.totalMediosBaixos).toBe(1);
    });

    it('BAIXA + EM_INVESTIGACAO → liberado (informativo, não bloqueia)', () => {
      const diag = criarDiagnosticoValido();
      const prob = criarProblema('p-bx-inv', SeveridadeProblema.BAIXA, StatusProblemaQualidade.EM_INVESTIGACAO);

      const res = QualityWorkflowGate.avaliar({
        diagnosticoRecente: diag,
        problemasUniverso: [prob],
      });

      expect(res.decisao).toBe('LIBERADO');
      expect(res.liberado).toBe(true);
      expect(res.bloqueante).toBe(false);
      expect(res.detalhes.totalMediosBaixos).toBe(1);
    });
  });

  describe('6. CONCLUIDO_PARCIALMENTE e Verificações Limitadas por Guardrail', () => {
    it('identifica nominalmente a verificação limitada e gera LIBERADO_COM_RESSALVA', () => {
      const verificacoes: ResultadoItemVerificacao[] = [
        {
          categoria: CategoriaProblemaQualidade.DUPLICIDADES_LINHA,
          nome: 'Duplicidade de Linhas',
          status: StatusVerificacaoQualidade.LIMITADA_POR_GUARDRAIL,
          totalProblemas: 0,
          observacao: 'Interrompida na linha 300.000 pelo guardrail de memória.',
        },
        {
          categoria: CategoriaProblemaQualidade.NULOS_BRANCOS,
          nome: 'Completude de Campos',
          status: StatusVerificacaoQualidade.EXECUTADA_SEM_PROBLEMAS,
          totalProblemas: 0,
        },
      ];

      const diag = criarDiagnosticoValido(StatusExecucaoDiagnostico.CONCLUIDO_PARCIALMENTE, verificacoes);

      const res = QualityWorkflowGate.avaliar({
        diagnosticoRecente: diag,
        problemasUniverso: [],
      });

      expect(res.decisao).toBe('LIBERADO_COM_RESSALVA');
      expect(res.liberado).toBe(true);
      expect(res.bloqueante).toBe(false);
      expect(res.exigeJustificativa).toBe(true);
      expect(res.detalhes.verificacoesLimitadas).toEqual(['Duplicidade de Linhas']);
      expect(res.motivo).toContain('Duplicidade de Linhas');
      expect(res.motivo).toContain('limitada(s) por guardrail');
    });

    it('mesmo em CONCLUIDO_PARCIALMENTE, se houver problema PENDENTE, o Gate BLOQUEIA com prioridade', () => {
      const verificacoes: ResultadoItemVerificacao[] = [
        {
          categoria: CategoriaProblemaQualidade.DUPLICIDADES_LINHA,
          nome: 'Duplicidade de Linhas',
          status: StatusVerificacaoQualidade.LIMITADA_POR_GUARDRAIL,
          totalProblemas: 1,
        },
      ];
      const diag = criarDiagnosticoValido(StatusExecucaoDiagnostico.CONCLUIDO_PARCIALMENTE, verificacoes);
      const prob = criarProblema('p-pendente', SeveridadeProblema.PENDENTE, StatusProblemaQualidade.ABERTO);

      const res = QualityWorkflowGate.avaliar({
        diagnosticoRecente: diag,
        problemasUniverso: [prob],
      });

      expect(res.decisao).toBe('BLOQUEADO');
      expect(res.liberado).toBe(false);
      expect(res.motivo).toContain('pendente(s) de deliberação');
    });

    it('mesmo em CONCLUIDO_PARCIALMENTE, se houver problema ALTA ABERTO, o Gate BLOQUEIA com prioridade', () => {
      const verificacoes: ResultadoItemVerificacao[] = [
        {
          categoria: CategoriaProblemaQualidade.DUPLICIDADES_LINHA,
          nome: 'Duplicidade de Linhas',
          status: StatusVerificacaoQualidade.LIMITADA_POR_GUARDRAIL,
          totalProblemas: 1,
        },
      ];
      const diag = criarDiagnosticoValido(StatusExecucaoDiagnostico.CONCLUIDO_PARCIALMENTE, verificacoes);
      const prob = criarProblema('p-alta', SeveridadeProblema.ALTA, StatusProblemaQualidade.ABERTO);

      const res = QualityWorkflowGate.avaliar({
        diagnosticoRecente: diag,
        problemasUniverso: [prob],
      });

      expect(res.decisao).toBe('BLOQUEADO');
      expect(res.liberado).toBe(false);
    });
  });

  describe('7. Diagnóstico 100% Conforme (0 Problemas)', () => {
    it('retorna LIBERADO sem bloqueio ou ressalva', () => {
      const diag = criarDiagnosticoValido();
      const res = QualityWorkflowGate.avaliar({
        diagnosticoRecente: diag,
        problemasUniverso: [],
      });

      expect(res.decisao).toBe('LIBERADO');
      expect(res.liberado).toBe(true);
      expect(res.bloqueante).toBe(false);
      expect(res.exigeJustificativa).toBe(false);
      expect(res.motivo).toContain('sem problemas detectados');
    });
  });
});
