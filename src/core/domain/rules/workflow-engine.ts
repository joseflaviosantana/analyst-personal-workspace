import {
  EstadoDemanda,
  ESTADOS_ORDENADOS_SEQUENCIAIS,
  ROTULOS_ESTADO_DEMANDA,
  isEstadoTerminal,
  normalizarEstadoDemanda,
} from '../enums/estado-demanda';

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

    if (destino === EstadoDemanda.PRONTA_PARA_ENTREGA) {
      if (contexto?.validacoesPendentes !== undefined && contexto.validacoesPendentes > 0) {
        return {
          valida: false,
          mensagem: 'Não é permitido avançar para Pronta para Entrega com validações pendentes ou divergentes.',
        };
      }
    }

    if (destino === EstadoDemanda.CONCLUIDA) {
      if (contexto?.entregaveisHomologados === false) {
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
