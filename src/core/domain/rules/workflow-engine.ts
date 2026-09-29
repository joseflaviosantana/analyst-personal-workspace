import {
  EstadoDemanda,
  ESTADOS_ORDENADOS_SEQUENCIAIS,
  ROTULOS_ESTADO_DEMANDA,
  isEstadoTerminal,
  normalizarEstadoDemanda,
} from '../enums/estado-demanda';

import { ResultadoQualityGate } from './quality-gate';
import { ValidacaoConciliacao } from '../entities/validacao-conciliacao';
import { EntregavelDemanda } from '../entities/entregavel-demanda';
import { ValidationRulesEvaluator, ResultadoAvaliacaoValidacao } from './validation-rules-evaluator';

export class WorkflowTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowTransitionError';
  }
}

export interface ContextoTransicao {
  justificativa?: string | null;
  estadoAnterior?: EstadoDemanda | string | null;
  totalAtivosDados?: number;
  validacoesPendentes?: number;
  entregaveisHomologados?: boolean;
  qualityGate?: ResultadoQualityGate;
  // Governança 3.5C (Dataset Autorizado e Integridade)
  datasetAutorizado?: {
    id: string;
    status: string;
    ativo_dados_id: string;
    hash_sha256_snapshot: string;
    receita_preparacao_id?: string | null;
  } | null;
  ativoAutorizado?: {
    id: string;
    status: string;
    hash_sha256: string;
  } | null;
  receitaPreparacao?: {
    id: string;
    status: string;
  } | null;
  problemasPendentesDeTratamento?: number;
  // Governança 3.6C (Modelo Analítico Homologado e Integridade da Modelagem)
  modeloHomologado?: {
    id: string;
    demanda_id: string;
    dataset_autorizado_id: string;
    status: string;
    homologado_em?: string | null;
    revogado_em?: string | null;
    temAlteracaoPosterior?: boolean;
    totalBloqueios?: number;
  } | null;
  // Governança 3.7A (Validação Numérica, Entregáveis e Aceite Formal)
  validacoesContexto?: ValidacaoConciliacao[];
  entregaveisContexto?: EntregavelDemanda[];
  avaliacaoValidacao?: ResultadoAvaliacaoValidacao;
}

export interface ResultadoValidacaoTransicao {
  valida: boolean;
  mensagem?: string;
}

export type TipoAcaoTransicao = 'AVANCAR' | 'SUSPENDER' | 'RETOMAR' | 'CANCELAR';

export interface AcaoTransicaoDisponivel {
  tipo: TipoAcaoTransicao;
  estadoDestino: EstadoDemanda;
  rotulo: string;
  exigeJustificativa: boolean;
  variante: 'primario' | 'secundario' | 'perigo' | 'sucesso';
}

/**
 * WorkflowEngine (ADR-002 Seção 3.2 e 10.1, CF-22 e v1-domain-model.md Seção 7.1)
 * Centraliza estritamente as regras de governança e transição do ciclo de vida da Demanda.
 */
export class WorkflowEngine {
  /**
   * Avalia puramente se uma transição entre dois estados é permitida segundo as regras de negócio
   */
  static podeTransitar(
    origemInput: EstadoDemanda | string,
    destinoInput: EstadoDemanda | string,
    contexto?: ContextoTransicao
  ): ResultadoValidacaoTransicao {
    const origem = normalizarEstadoDemanda(origemInput);
    const destino = normalizarEstadoDemanda(destinoInput);

    // 1. Não permite transição para o mesmo estado
    if (origem === destino) {
      return {
        valida: false,
        mensagem: 'A demanda já se encontra no estado informado.',
      };
    }

    // 2. Estados terminais não admitem transições de saída
    if (origem === EstadoDemanda.CONCLUIDA) {
      return {
        valida: false,
        mensagem: 'Demandas no estado Concluída estão finalizadas e não admitem novas transições.',
      };
    }

    if (origem === EstadoDemanda.CANCELADA) {
      return {
        valida: false,
        mensagem: 'Demandas no estado Cancelada possuem histórico congelado e não admitem novas transições.',
      };
    }

    // 3. Transição para Estado Excepcional SUSPENSA
    if (destino === EstadoDemanda.SUSPENSA) {
      if (origem === EstadoDemanda.SUSPENSA) {
        return {
          valida: false,
          mensagem: 'A demanda já se encontra no estado Suspensa.',
        };
      }
      const just = contexto?.justificativa?.trim() ?? '';
      if (just.length < 5) {
        return {
          valida: false,
          mensagem: 'A suspensão da demanda exige justificativa formal com no mínimo 5 caracteres.',
        };
      }
      return { valida: true };
    }

    // 4. Transição para Estado Excepcional CANCELADA
    if (destino === EstadoDemanda.CANCELADA) {
      const just = contexto?.justificativa?.trim() ?? '';
      if (just.length < 5) {
        return {
          valida: false,
          mensagem: 'O cancelamento da demanda exige justificativa formal com no mínimo 5 caracteres.',
        };
      }
      return { valida: true };
    }

    // 5. Transições a partir de Demanda SUSPENSA
    if (origem === EstadoDemanda.SUSPENSA) {
      // Se não for cancelamento, deve ser obrigatoriamente a retomada para o estado em que foi pausada
      if (!contexto?.estadoAnterior) {
        return {
          valida: false,
          mensagem: 'Não é possível retomar demanda suspensa sem o registro do estado anterior de origem.',
        };
      }

      const estadoRetornoEsperado = normalizarEstadoDemanda(contexto.estadoAnterior);
      if (destino !== estadoRetornoEsperado) {
        return {
          valida: false,
          mensagem: `Uma demanda suspensa deve retornar exclusivamente para o estado em que foi pausada (${ROTULOS_ESTADO_DEMANDA[estadoRetornoEsperado]}).`,
        };
      }

      const just = contexto?.justificativa?.trim() ?? '';
      if (just.length < 5) {
        return {
          valida: false,
          mensagem: 'A retomada de demanda suspensa exige justificativa formal com no mínimo 5 caracteres.',
        };
      }

      return { valida: true };
    }

    // 6. Transições na esteira sequencial normal (1 a 8)
    const idxOrigem = ESTADOS_ORDENADOS_SEQUENCIAIS.indexOf(origem);
    const idxDestino = ESTADOS_ORDENADOS_SEQUENCIAIS.indexOf(destino);

    if (idxOrigem === -1 || idxDestino === -1) {
      return {
        valida: false,
        mensagem: 'Transição inválida envolvendo estados fora do catálogo do workflow.',
      };
    }

    // Bloqueia retrocessos na esteira normal
    if (idxDestino < idxOrigem) {
      return {
        valida: false,
        mensagem: `Não é permitido retroceder estados normais na esteira de workflow (${ROTULOS_ESTADO_DEMANDA[origem]} para ${ROTULOS_ESTADO_DEMANDA[destino]}).`,
      };
    }

    // Bloqueia pulo de etapas (ex.: Nova direto para Pronta para Entrega)
    if (idxDestino > idxOrigem + 1) {
      const proximoEsperado = ESTADOS_ORDENADOS_SEQUENCIAIS[idxOrigem + 1];
      return {
        valida: false,
        mensagem: `Não é permitido pular etapas no pipeline. O próximo avanço a partir de ${ROTULOS_ESTADO_DEMANDA[origem]} deve ser exclusivamente para ${ROTULOS_ESTADO_DEMANDA[proximoEsperado]}.`,
      };
    }

    // 7. Gates e Critérios de Qualidade da V1 (CF-22)
    if (destino === EstadoDemanda.EM_QUALIDADE_E_PREPARACAO) {
      if (contexto?.totalAtivosDados !== undefined && contexto.totalAtivosDados === 0) {
        return {
          valida: false,
          mensagem: 'Não é permitido avançar para Em Qualidade e Preparação sem ativo de dados cadastrado.',
        };
      }
    }

    if (origem === EstadoDemanda.EM_QUALIDADE_E_PREPARACAO && destino === EstadoDemanda.EM_MODELAGEM_E_ANALISE) {
      if (!contexto?.qualityGate) {
        return {
          valida: false,
          mensagem: 'Não é permitido avançar para Em Modelagem e Análise sem a avaliação do Quality Gate de qualidade de dados.',
        };
      }
      if (!contexto.qualityGate.liberado) {
        return {
          valida: false,
          mensagem: `Quality Gate bloqueado: ${contexto.qualityGate.motivo}`,
        };
      }
      if (contexto.qualityGate.exigeJustificativa) {
        const just = contexto.justificativa?.trim() ?? '';
        if (just.length < 15) {
          return {
            valida: false,
            mensagem: `O avanço com Quality Gate em ressalva exige justificativa formal com no mínimo 15 caracteres. ${contexto.qualityGate.motivo}`,
          };
        }
      }

      // Governança 3.5C: Verificação de Dataset Autorizado para Análise e Integridade
      if (contexto.datasetAutorizado !== undefined) {
        if (!contexto.datasetAutorizado || contexto.datasetAutorizado.status !== 'VIGENTE') {
          return {
            valida: false,
            mensagem: 'Não é permitido avançar para Em Modelagem e Análise sem um Dataset Autorizado para Análise no status VIGENTE.',
          };
        }

        if (!contexto.ativoAutorizado || contexto.ativoAutorizado.status !== 'ATIVO') {
          return {
            valida: false,
            mensagem: 'O ativo de dados vinculado ao dataset autorizado não é o ativo vigente da demanda.',
          };
        }

        if (contexto.ativoAutorizado.hash_sha256 !== contexto.datasetAutorizado.hash_sha256_snapshot) {
          return {
            valida: false,
            mensagem: 'Violação de integridade física: o hash SHA-256 do arquivo diverge do snapshot registrado na autorização.',
          };
        }

        if (contexto.datasetAutorizado.receita_preparacao_id && contexto.receitaPreparacao?.status !== 'CONCLUIDA') {
          return {
            valida: false,
            mensagem: 'A receita de preparação associada ao dataset autorizado deve estar no status CONCLUIDA.',
          };
        }

        if (contexto.problemasPendentesDeTratamento !== undefined && contexto.problemasPendentesDeTratamento > 0) {
          return {
            valida: false,
            mensagem: `Existem ${contexto.problemasPendentesDeTratamento} problema(s) com plano de tratamento no pipeline que não foram empiricamente resolvidos.`,
          };
        }
      }
    }

    // 8. Governança 3.6C: Verificação de Modelo Analítico Homologado e Válido para avanço
    if (origem === EstadoDemanda.EM_MODELAGEM_E_ANALISE && destino === EstadoDemanda.EM_VALIDACAO) {
      if (!contexto?.modeloHomologado || contexto.modeloHomologado.status !== 'HOMOLOGADO') {
        return {
          valida: false,
          mensagem: 'Não é permitido avançar para Em Validação sem um Modelo Analítico no status HOMOLOGADO.',
        };
      }

      if (contexto.modeloHomologado.revogado_em) {
        return {
          valida: false,
          mensagem: 'O modelo analítico vinculado à demanda foi revogado e não admite avanço de etapa.',
        };
      }

      if (contexto.datasetAutorizado && contexto.modeloHomologado.dataset_autorizado_id !== contexto.datasetAutorizado.id) {
        return {
          valida: false,
          mensagem: 'O modelo analítico homologado não está vinculado ao Dataset Autorizado vigente da demanda.',
        };
      }

      if (contexto.modeloHomologado.temAlteracaoPosterior) {
        return {
          valida: false,
          mensagem: 'O modelo analítico possui alterações materiais posteriores à homologação formal.',
        };
      }

      if (contexto.modeloHomologado.totalBloqueios !== undefined && contexto.modeloHomologado.totalBloqueios > 0) {
        return {
          valida: false,
          mensagem: `O modelo analítico possui ${contexto.modeloHomologado.totalBloqueios} bloqueio(s) de conformidade ativos.`,
        };
      }
    }

    // 9. Governança 3.7A: Validação Numérica, Entregáveis Profissionais e Aceite Formal
    let avaliacaoVal = contexto?.avaliacaoValidacao;
    if (!avaliacaoVal && (contexto?.validacoesContexto !== undefined || contexto?.entregaveisContexto !== undefined)) {
      avaliacaoVal = ValidationRulesEvaluator.avaliar(
        contexto.validacoesContexto ?? [],
        contexto.entregaveisContexto ?? []
      );
    }

    if (destino === EstadoDemanda.PRONTA_PARA_ENTREGA) {
      if (avaliacaoVal) {
        if (!avaliacaoVal.pronto_para_entrega) {
          return {
            valida: false,
            mensagem: avaliacaoVal.bloqueios_entrega[0] ?? 'Não é permitido avançar para Pronta para Entrega com bloqueios de validação ou entregáveis.',
          };
        }
      } else if (contexto?.validacoesPendentes !== undefined && contexto.validacoesPendentes > 0) {
        // Retrocompatibilidade transitória para suites legadas
        return {
          valida: false,
          mensagem: 'Não é permitido avançar para Pronta para Entrega com validações pendentes ou divergentes.',
        };
      }
    }

    if (destino === EstadoDemanda.CONCLUIDA) {
      if (avaliacaoVal) {
        if (!avaliacaoVal.pronto_para_conclusao) {
          return {
            valida: false,
            mensagem: avaliacaoVal.bloqueios_conclusao[0] ?? 'Não é permitido avançar para Concluída sem que todos os entregáveis obrigatórios possuam aceite formal válido.',
          };
        }
      } else if (contexto?.entregaveisHomologados === false) {
        // Retrocompatibilidade transitória para suites legadas
        return {
          valida: false,
          mensagem: 'Não é permitido avançar para Concluída sem que o pacote de entrega esteja registrado e homologado.',
        };
      }
    }

    return { valida: true };
  }

  /**
   * Valida a transição e dispara WorkflowTransitionError caso a regra seja violada
   */
  static validarTransicao(
    origemInput: EstadoDemanda | string,
    destinoInput: EstadoDemanda | string,
    contexto?: ContextoTransicao
  ): void {
    const resultado = this.podeTransitar(origemInput, destinoInput, contexto);
    if (!resultado.valida) {
      throw new WorkflowTransitionError(resultado.mensagem || 'Transição de estado não permitida pelo workflow.');
    }
  }

  /**
   * Retorna o próximo estado sequencial normal da esteira, se houver
   */
  static proximoEstadoNormal(atualInput: EstadoDemanda | string): EstadoDemanda | null {
    const atual = normalizarEstadoDemanda(atualInput);
    const idx = ESTADOS_ORDENADOS_SEQUENCIAIS.indexOf(atual);
    if (idx >= 0 && idx < ESTADOS_ORDENADOS_SEQUENCIAIS.length - 1) {
      return ESTADOS_ORDENADOS_SEQUENCIAIS[idx + 1];
    }
    return null;
  }

  /**
   * Avalia de forma pura se o estado é terminal/imutável (Concluída ou Cancelada)
   */
  static isEstadoTerminal(estado: EstadoDemanda | string): boolean {
    return isEstadoTerminal(estado);
  }

  /**
   * Retorna as ações operacionais disponíveis para a demanda no seu estado atual
   */
  static obterAcoesDisponiveis(demanda: {
    estado: EstadoDemanda | string;
    estado_anterior?: EstadoDemanda | string | null;
  }): AcaoTransicaoDisponivel[] {
    const estado = normalizarEstadoDemanda(demanda.estado);
    const acoes: AcaoTransicaoDisponivel[] = [];

    // Se estiver suspensa, a ação primária é a retomada ao estado anterior
    if (estado === EstadoDemanda.SUSPENSA) {
      if (demanda.estado_anterior) {
        const estadoRetorno = normalizarEstadoDemanda(demanda.estado_anterior);
        acoes.push({
          tipo: 'RETOMAR',
          estadoDestino: estadoRetorno,
          rotulo: `Retomar para ${ROTULOS_ESTADO_DEMANDA[estadoRetorno]}`,
          exigeJustificativa: true,
          variante: 'primario',
        });
      }
      acoes.push({
        tipo: 'CANCELAR',
        estadoDestino: EstadoDemanda.CANCELADA,
        rotulo: 'Cancelar Demanda',
        exigeJustificativa: true,
        variante: 'perigo',
      });
      return acoes;
    }

    // Se estiver em estado terminal (concluída ou cancelada), nenhuma ação está disponível
    if (this.isEstadoTerminal(estado)) {
      return acoes;
    }

    // Para qualquer outro estado ativo:
    // 1. Próximo avanço normal
    const proximo = this.proximoEstadoNormal(estado);
    if (proximo) {
      acoes.push({
        tipo: 'AVANCAR',
        estadoDestino: proximo,
        rotulo: `Avançar para ${ROTULOS_ESTADO_DEMANDA[proximo]}`,
        exigeJustificativa: false,
        variante: 'primario',
      });
    }

    // 2. Suspender
    acoes.push({
      tipo: 'SUSPENDER',
      estadoDestino: EstadoDemanda.SUSPENSA,
      rotulo: 'Suspender Demanda',
      exigeJustificativa: true,
      variante: 'secundario',
    });

    // 3. Cancelar
    acoes.push({
      tipo: 'CANCELAR',
      estadoDestino: EstadoDemanda.CANCELADA,
      rotulo: 'Cancelar Demanda',
      exigeJustificativa: true,
      variante: 'perigo',
    });

    return acoes;
  }
}
