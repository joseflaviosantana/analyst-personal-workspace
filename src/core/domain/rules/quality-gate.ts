import { DiagnosticoQualidade } from '../entities/diagnostico-qualidade';
import { ProblemaQualidade } from '../entities/problema-qualidade';
import { SeveridadeProblema } from '../enums/severidade-problema';
import { StatusExecucaoDiagnostico } from '../enums/status-execucao-diagnostico';
import { StatusProblemaQualidade } from '../enums/status-problema-qualidade';
import { StatusVerificacaoQualidade } from '../enums/status-verificacao-qualidade';

export type DecisaoQualityGate = 'BLOQUEADO' | 'LIBERADO' | 'LIBERADO_COM_RESSALVA';

export interface QualityGateInput {
  diagnosticoRecente: DiagnosticoQualidade | null;
  problemasUniverso: ProblemaQualidade[]; // Problemas da execução recente + manuais avulsos (diagnostico_id === null)
}

export interface DetalhesQualityGate {
  totalProblemasAvaliados: number;
  totalPendentes: number;
  totalCriticosBloqueantes: number;
  totalAltosBloqueantes: number;
  totalCriticosAceitos: number;
  totalAltosAceitos: number;
  totalTratados: number;
  totalMediosBaixos: number;
  verificacoesLimitadas: string[]; // Nomes das verificações com status LIMITADA_POR_GUARDRAIL
}

export interface ResultadoQualityGate {
  decisao: DecisaoQualityGate;
  liberado: boolean;
  bloqueante: boolean;
  exigeJustificativa: boolean;
  motivo: string;
  detalhes: DetalhesQualityGate;
}

/**
 * QualityWorkflowGate (ADR-002 Seção 3.2 e 10.1, Subunidade 3.4C)
 * Motor puro de decisão determinística para governança de qualidade de dados.
 *
 * Filosofia Central:
 * A máquina detecta e organiza; o humano interpreta, classifica, decide e assume responsabilidade.
 * Nenhum achado automático recebe silenciosamente uma severidade definitiva.
 *
 * Invariantes Rígidas:
 * 1. PENDENTE bloqueia o Gate independentemente do status (invariante de proteção).
 * 2. ALTA/CRITICA + ABERTO/EM_INVESTIGACAO bloqueia.
 * 3. ALTA/CRITICA + TRATADO/ACEITO_COMO_RESTRICAO não bloqueia.
 * 4. MEDIA/BAIXA devidamente deliberado não bloqueia, inclusive se permanecer ABERTO/EM_INVESTIGACAO.
 * 5. O diagnóstico mais recente do ativo ATIVO é a única autoridade; proibido fallback para anterior.
 * 6. FALHA e EM_ANDAMENTO no diagnóstico mais recente bloqueiam.
 * 7. CONCLUIDO_PARCIALMENTE identifica nominalmente cada verificação limitada e gera ressalva.
 */
export class QualityWorkflowGate {
  static avaliar(input: QualityGateInput): ResultadoQualityGate {
    const { diagnosticoRecente, problemasUniverso } = input;

    // Detalhes contábeis iniciais
    const detalhes: DetalhesQualityGate = {
      totalProblemasAvaliados: problemasUniverso.length,
      totalPendentes: 0,
      totalCriticosBloqueantes: 0,
      totalAltosBloqueantes: 0,
      totalCriticosAceitos: 0,
      totalAltosAceitos: 0,
      totalTratados: 0,
      totalMediosBaixos: 0,
      verificacoesLimitadas: [],
    };

    // 1. Invariante: Ativo ativo sem diagnóstico executado
    if (!diagnosticoRecente) {
      return {
        decisao: 'BLOQUEADO',
        liberado: false,
        bloqueante: true,
        exigeJustificativa: false,
        motivo: 'O ativo de dados ativo ainda não possui diagnóstico de qualidade executado.',
        detalhes,
      };
    }

    // 2. Invariante: Diagnóstico mais recente ainda em andamento
    if (diagnosticoRecente.status_execucao === StatusExecucaoDiagnostico.EM_ANDAMENTO) {
      return {
        decisao: 'BLOQUEADO',
        liberado: false,
        bloqueante: true,
        exigeJustificativa: false,
        motivo: 'O diagnóstico de qualidade mais recente ainda está em execução.',
        detalhes,
      };
    }

    // 3. Invariante: Diagnóstico mais recente falhou (sem fallback silencioso)
    if (diagnosticoRecente.status_execucao === StatusExecucaoDiagnostico.FALHA) {
      return {
        decisao: 'BLOQUEADO',
        liberado: false,
        bloqueante: true,
        exigeJustificativa: false,
        motivo: 'O diagnóstico de qualidade mais recente falhou. É necessário reexecutar ou investigar a causa-raiz.',
        detalhes,
      };
    }

    // Identifica nominalmente verificações limitadas por guardrail no diagnóstico mais recente
    if (Array.isArray(diagnosticoRecente.verificacoes_executadas)) {
      for (const verif of diagnosticoRecente.verificacoes_executadas) {
        if (verif.status === StatusVerificacaoQualidade.LIMITADA_POR_GUARDRAIL) {
          detalhes.verificacoesLimitadas.push(verif.nome);
        }
      }
    }

    // Contabilização e análise de problemas do universo ativo
    for (const prob of problemasUniverso) {
      // Regra 4: PENDENTE bloqueia com QUALQUER STATUS
      if (prob.severidade === SeveridadeProblema.PENDENTE) {
        detalhes.totalPendentes++;
        continue;
      }

      const isAbertoOuInvestigando =
        prob.status === StatusProblemaQualidade.ABERTO ||
        prob.status === StatusProblemaQualidade.EM_INVESTIGACAO;

      const isTratado = prob.status === StatusProblemaQualidade.TRATADO;
      const isAceito = prob.status === StatusProblemaQualidade.ACEITO_COMO_RESTRICAO;

      if (isTratado) {
        detalhes.totalTratados++;
      }

      if (prob.severidade === SeveridadeProblema.CRITICA) {
        if (isAbertoOuInvestigando) {
          detalhes.totalCriticosBloqueantes++;
        } else if (isAceito) {
          detalhes.totalCriticosAceitos++;
        }
      } else if (prob.severidade === SeveridadeProblema.ALTA) {
        if (isAbertoOuInvestigando) {
          detalhes.totalAltosBloqueantes++;
        } else if (isAceito) {
          detalhes.totalAltosAceitos++;
        }
      } else if (
        prob.severidade === SeveridadeProblema.MEDIA ||
        prob.severidade === SeveridadeProblema.BAIXA
      ) {
        detalhes.totalMediosBaixos++;
      }
    }

    // 4. Bloqueio por problemas com severidade PENDENTE (invariante absoluta)
    if (detalhes.totalPendentes > 0) {
      return {
        decisao: 'BLOQUEADO',
        liberado: false,
        bloqueante: true,
        exigeJustificativa: false,
        motivo: `Existem ${detalhes.totalPendentes} problema(s) de qualidade pendente(s) de deliberação humana.`,
        detalhes,
      };
    }

    // 5. Bloqueio por problemas CRÍTICOS não resolvidos (ABERTO ou EM_INVESTIGACAO)
    if (detalhes.totalCriticosBloqueantes > 0) {
      return {
        decisao: 'BLOQUEADO',
        liberado: false,
        bloqueante: true,
        exigeJustificativa: false,
        motivo: `Existem ${detalhes.totalCriticosBloqueantes} problema(s) crítico(s) em aberto/investigação sem tratamento ou aceite formal.`,
        detalhes,
      };
    }

    // 6. Bloqueio por problemas ALTOS não resolvidos (ABERTO ou EM_INVESTIGACAO)
    if (detalhes.totalAltosBloqueantes > 0) {
      return {
        decisao: 'BLOQUEADO',
        liberado: false,
        bloqueante: true,
        exigeJustificativa: false,
        motivo: `Existem ${detalhes.totalAltosBloqueantes} problema(s) de severidade alta em aberto/investigação sem tratamento ou aceite formal.`,
        detalhes,
      };
    }

    // 7. Diagnóstico Parcial com Guardrail (CONCLUIDO_PARCIALMENTE ou com verificações limitadas)
    const isParcial =
      diagnosticoRecente.status_execucao === StatusExecucaoDiagnostico.CONCLUIDO_PARCIALMENTE ||
      detalhes.verificacoesLimitadas.length > 0;

    if (isParcial) {
      const nomes =
        detalhes.verificacoesLimitadas.length > 0
          ? detalhes.verificacoesLimitadas.join(', ')
          : 'amostra de dados';
      return {
        decisao: 'LIBERADO_COM_RESSALVA',
        liberado: true,
        bloqueante: false,
        exigeJustificativa: true,
        motivo: `Diagnóstico concluído parcialmente: a(s) verificação(ões) [${nomes}] foi(ram) limitada(s) por guardrail. O avanço exige justificativa formal.`,
        detalhes,
      };
    }

    // 8. Se há problemas aceitos como restrição
    if (detalhes.totalCriticosAceitos > 0 || detalhes.totalAltosAceitos > 0) {
      const totalAceitos = detalhes.totalCriticosAceitos + detalhes.totalAltosAceitos;
      return {
        decisao: 'LIBERADO',
        liberado: true,
        bloqueante: false,
        exigeJustificativa: false,
        motivo: `${totalAceitos} problema(s) crítico(s)/alto(s) foram formalmente aceitos como restrição com justificativa auditável.`,
        detalhes,
      };
    }

    // 9. Se há apenas tratados ou médios/baixos deliberados
    if (detalhes.totalProblemasAvaliados > 0) {
      return {
        decisao: 'LIBERADO',
        liberado: true,
        bloqueante: false,
        exigeJustificativa: false,
        motivo: 'Problemas de qualidade foram devidamente deliberados e tratados pelo analista.',
        detalhes,
      };
    }

    // 10. Conforme (0 problemas detectados)
    return {
      decisao: 'LIBERADO',
      liberado: true,
      bloqueante: false,
      exigeJustificativa: false,
      motivo: 'Diagnóstico de qualidade executado com sucesso e sem problemas detectados.',
      detalhes,
    };
  }
}
