import { describe, it, expect } from 'vitest';
import { 
  EstadoDemanda, 
  ESTADOS_ORDENADOS_SEQUENCIAIS,
  ESTADOS_TERMINAIS,
  ROTULOS_ESTADO_DEMANDA,
  isEstadoTerminal,
} from '@/core/domain/enums/estado-demanda';
import { WorkflowEngine, WorkflowTransitionError } from '@/core/domain/rules/workflow-engine';

describe('Core Domain: Workflow Engine & Governança de Estados (V1 — Bloco 2)', () => {
  describe('1. Transições Válidas da Esteira Sequencial Normal (1 a 8)', () => {
    it('deve permitir todo o encadeamento sequencial normal passo a passo', () => {
      const contextoValido = {
        totalAtivosDados: 1,
        qualityGate: {
          decisao: 'LIBERADO' as const,
          liberado: true,
          bloqueante: false,
          exigeJustificativa: false,
          motivo: 'Critérios de qualidade atendidos com sucesso.',
          detalhes: {} as any,
        },
        entregaveisHomologados: true,
        modeloHomologado: {
          id: 'mod-1',
          demanda_id: 'dem-1',
          dataset_autorizado_id: 'ds-1',
          status: 'HOMOLOGADO' as const,
        },
      };

      for (let i = 0; i < ESTADOS_ORDENADOS_SEQUENCIAIS.length - 1; i++) {
        const origem = ESTADOS_ORDENADOS_SEQUENCIAIS[i];
        const destino = ESTADOS_ORDENADOS_SEQUENCIAIS[i + 1];

        const resultado = WorkflowEngine.podeTransitar(origem, destino, contextoValido);
        expect(resultado.valida).toBe(true);
        expect(() => WorkflowEngine.validarTransicao(origem, destino, contextoValido)).not.toThrow();
      }
    });

    it('deve permitir transição direta de NOVA para EM_CLARIFICACAO', () => {
      const res = WorkflowEngine.podeTransitar(EstadoDemanda.NOVA, EstadoDemanda.EM_CLARIFICACAO);
      expect(res.valida).toBe(true);
    });

    it('deve permitir avanço de PRONTA_PARA_ENTREGA para CONCLUIDA com entregáveis homologados', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.PRONTA_PARA_ENTREGA,
        EstadoDemanda.CONCLUIDA,
        { entregaveisHomologados: true }
      );
      expect(res.valida).toBe(true);
    });
  });

  describe('2. Rejeição Estrita de Transições Inválidas', () => {
    it('não deve permitir transição de um estado para si mesmo', () => {
      const res = WorkflowEngine.podeTransitar(EstadoDemanda.NOVA, EstadoDemanda.NOVA);
      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('já se encontra no estado');
      expect(() => WorkflowEngine.validarTransicao(EstadoDemanda.NOVA, EstadoDemanda.NOVA))
        .toThrow(WorkflowTransitionError);
    });

    it('não deve permitir pular etapas para frente (ex.: NOVA direto para PRONTA_PARA_ENTREGA)', () => {
      const res = WorkflowEngine.podeTransitar(EstadoDemanda.NOVA, EstadoDemanda.PRONTA_PARA_ENTREGA);
      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('Não é permitido pular etapas');
      expect(() => WorkflowEngine.validarTransicao(EstadoDemanda.NOVA, EstadoDemanda.PRONTA_PARA_ENTREGA))
        .toThrow(WorkflowTransitionError);
    });

    it('não deve permitir pular etapas para frente (ex.: DADOS_RECEBIDOS direto para CONCLUIDA)', () => {
      const res = WorkflowEngine.podeTransitar(EstadoDemanda.DADOS_RECEBIDOS, EstadoDemanda.CONCLUIDA);
      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('Não é permitido pular etapas');
    });

    it('não deve permitir retroceder estados normais na esteira (ex.: EM_VALIDACAO para EM_MODELAGEM_E_ANALISE)', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_VALIDACAO,
        EstadoDemanda.EM_MODELAGEM_E_ANALISE
      );
      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('Não é permitido retroceder');
    });

    it('não deve permitir nenhuma transição a partir do estado terminal CONCLUIDA', () => {
      const res = WorkflowEngine.podeTransitar(EstadoDemanda.CONCLUIDA, EstadoDemanda.NOVA);
      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('Concluída estão finalizadas');
      expect(() => WorkflowEngine.validarTransicao(EstadoDemanda.CONCLUIDA, EstadoDemanda.NOVA))
        .toThrow(WorkflowTransitionError);
    });

    it('não deve permitir nenhuma transição a partir do estado terminal CANCELADA', () => {
      const res = WorkflowEngine.podeTransitar(EstadoDemanda.CANCELADA, EstadoDemanda.NOVA);
      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('Cancelada possuem histórico congelado');
      expect(() => WorkflowEngine.validarTransicao(EstadoDemanda.CANCELADA, EstadoDemanda.EM_CLARIFICACAO))
        .toThrow(WorkflowTransitionError);
    });
  });

  describe('3. Estados Excepcionais: Suspensão e Justificativa Mandatória', () => {
    it('deve permitir transição para SUSPENSA a partir de qualquer estado ativo com justificativa válida', () => {
      const estadosAtivos = [
        EstadoDemanda.NOVA,
        EstadoDemanda.EM_CLARIFICACAO,
        EstadoDemanda.DADOS_RECEBIDOS,
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        EstadoDemanda.EM_VALIDACAO,
        EstadoDemanda.PRONTA_PARA_ENTREGA,
      ];

      for (const estado of estadosAtivos) {
        const res = WorkflowEngine.podeTransitar(estado, EstadoDemanda.SUSPENSA, {
          justificativa: 'Pausa solicitada pelo cliente por auditoria contábil interna.',
        });
        expect(res.valida).toBe(true);
      }
    });

    it('deve rejeitar suspensão sem justificativa formal', () => {
      const res = WorkflowEngine.podeTransitar(EstadoDemanda.EM_MODELAGEM_E_ANALISE, EstadoDemanda.SUSPENSA);
      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('exige justificativa formal');
      expect(() =>
        WorkflowEngine.validarTransicao(EstadoDemanda.EM_MODELAGEM_E_ANALISE, EstadoDemanda.SUSPENSA)
      ).toThrow(WorkflowTransitionError);
    });

    it('deve rejeitar suspensão com justificativa muito curta (< 5 caracteres)', () => {
      const res = WorkflowEngine.podeTransitar(EstadoDemanda.EM_MODELAGEM_E_ANALISE, EstadoDemanda.SUSPENSA, {
        justificativa: 'abc',
      });
      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('mínimo 5 caracteres');
    });

    it('deve rejeitar suspender demanda já suspensa', () => {
      const res = WorkflowEngine.podeTransitar(EstadoDemanda.SUSPENSA, EstadoDemanda.SUSPENSA, {
        justificativa: 'Tentando suspender novamente.',
      });
      expect(res.valida).toBe(false);
    });

    it('deve rejeitar suspender demanda já concluída', () => {
      const res = WorkflowEngine.podeTransitar(EstadoDemanda.CONCLUIDA, EstadoDemanda.SUSPENSA, {
        justificativa: 'Pausa após conclusão.',
      });
      expect(res.valida).toBe(false);
    });
  });

  describe('4. Estados Excepcionais: Retomada Segura de Demanda Suspensa', () => {
    it('deve permitir retomar demanda suspensa para o seu estado original exato com justificativa', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.SUSPENSA,
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        {
          estadoAnterior: EstadoDemanda.EM_MODELAGEM_E_ANALISE,
          justificativa: 'Cliente concluiu auditoria e autorizou a continuidade dos trabalhos.',
        }
      );
      expect(res.valida).toBe(true);
    });

    it('não deve permitir retomar demanda suspensa para um estado diferente do estado em que foi pausada', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.SUSPENSA,
        EstadoDemanda.PRONTA_PARA_ENTREGA,
        {
          estadoAnterior: EstadoDemanda.EM_MODELAGEM_E_ANALISE,
          justificativa: 'Tentando adiantar etapa após retomada.',
        }
      );
      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('exclusivamente para o estado em que foi pausada');
      expect(() =>
        WorkflowEngine.validarTransicao(EstadoDemanda.SUSPENSA, EstadoDemanda.PRONTA_PARA_ENTREGA, {
          estadoAnterior: EstadoDemanda.EM_MODELAGEM_E_ANALISE,
          justificativa: 'Tentando adiantar etapa após retomada.',
        })
      ).toThrow(WorkflowTransitionError);
    });

    it('não deve permitir retomar sem justificativa formal de reativação', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.SUSPENSA,
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        {
          estadoAnterior: EstadoDemanda.EM_MODELAGEM_E_ANALISE,
          justificativa: '',
        }
      );
      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('exige justificativa formal');
    });

    it('não deve permitir retomar se não houver registro do estado anterior', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.SUSPENSA,
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        {
          justificativa: 'Tentando retomar sem estado anterior salvo.',
        }
      );
      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('sem o registro do estado anterior');
    });
  });

  describe('5. Estados Excepcionais: Cancelamento com Justificativa', () => {
    it('deve permitir cancelar demanda ativa com justificativa obrigatória', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        EstadoDemanda.CANCELADA,
        {
          justificativa: 'Cliente rescindiu o projeto por reestruturação corporativa.',
        }
      );
      expect(res.valida).toBe(true);
    });

    it('deve permitir cancelar demanda suspensa com justificativa', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.SUSPENSA,
        EstadoDemanda.CANCELADA,
        {
          justificativa: 'Após período suspensa, contrato foi formalmente rescindido.',
        }
      );
      expect(res.valida).toBe(true);
    });

    it('deve rejeitar cancelamento sem justificativa', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        EstadoDemanda.CANCELADA
      );
      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('exige justificativa formal');
    });

    it('deve rejeitar cancelar demanda que já está concluída', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.CONCLUIDA,
        EstadoDemanda.CANCELADA,
        {
          justificativa: 'Cancelamento tardio.',
        }
      );
      expect(res.valida).toBe(false);
    });
  });

  describe('6. Gates e Critérios de Qualidade da V1 (CF-22)', () => {
    it('deve bloquear avanço para EM_QUALIDADE_E_PREPARACAO se totalAtivosDados === 0', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.DADOS_RECEBIDOS,
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        { totalAtivosDados: 0 }
      );
      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('sem ativo de dados cadastrado');
    });

    it('deve permitir avanço para EM_QUALIDADE_E_PREPARACAO se totalAtivosDados > 0', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.DADOS_RECEBIDOS,
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        { totalAtivosDados: 1 }
      );
      expect(res.valida).toBe(true);
    });

    it('deve bloquear avanço para PRONTA_PARA_ENTREGA se houver validações pendentes/divergentes', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_VALIDACAO,
        EstadoDemanda.PRONTA_PARA_ENTREGA,
        { validacoesPendentes: 2 }
      );
      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('validações pendentes ou divergentes');
    });

    it('deve bloquear avanço para CONCLUIDA se entregaveisHomologados === false', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.PRONTA_PARA_ENTREGA,
        EstadoDemanda.CONCLUIDA,
        { entregaveisHomologados: false }
      );
      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('sem que o pacote de entrega esteja registrado e homologado');
    });
  });

  describe('7. Funções Utilitárias e de Ações Disponíveis', () => {
    it('proximoEstadoNormal deve retornar o estado seguinte correto', () => {
      expect(WorkflowEngine.proximoEstadoNormal(EstadoDemanda.NOVA)).toBe(EstadoDemanda.EM_CLARIFICACAO);
      expect(WorkflowEngine.proximoEstadoNormal(EstadoDemanda.EM_CLARIFICACAO)).toBe(EstadoDemanda.DADOS_RECEBIDOS);
      expect(WorkflowEngine.proximoEstadoNormal(EstadoDemanda.PRONTA_PARA_ENTREGA)).toBe(EstadoDemanda.CONCLUIDA);
      expect(WorkflowEngine.proximoEstadoNormal(EstadoDemanda.CONCLUIDA)).toBeNull();
      expect(WorkflowEngine.proximoEstadoNormal(EstadoDemanda.SUSPENSA)).toBeNull();
      expect(WorkflowEngine.proximoEstadoNormal(EstadoDemanda.CANCELADA)).toBeNull();
    });

    it('obterAcoesDisponiveis deve fornecer ações corretas para estado ativo normal', () => {
      const acoes = WorkflowEngine.obterAcoesDisponiveis({ estado: EstadoDemanda.NOVA });
      expect(acoes).toHaveLength(3);
      expect(acoes[0]).toMatchObject({ tipo: 'AVANCAR', estadoDestino: EstadoDemanda.EM_CLARIFICACAO });
      expect(acoes[1]).toMatchObject({ tipo: 'SUSPENDER', estadoDestino: EstadoDemanda.SUSPENSA });
      expect(acoes[2]).toMatchObject({ tipo: 'CANCELAR', estadoDestino: EstadoDemanda.CANCELADA });
    });

    it('obterAcoesDisponiveis deve fornecer ação de RETOMAR para demanda suspensa', () => {
      const acoes = WorkflowEngine.obterAcoesDisponiveis({
        estado: EstadoDemanda.SUSPENSA,
        estado_anterior: EstadoDemanda.EM_MODELAGEM_E_ANALISE,
      });
      expect(acoes).toHaveLength(2);
      expect(acoes[0]).toMatchObject({
        tipo: 'RETOMAR',
        estadoDestino: EstadoDemanda.EM_MODELAGEM_E_ANALISE,
      });
      expect(acoes[1]).toMatchObject({
        tipo: 'CANCELAR',
        estadoDestino: EstadoDemanda.CANCELADA,
      });
    });

    it('obterAcoesDisponiveis deve retornar lista vazia para estados terminais', () => {
      expect(WorkflowEngine.obterAcoesDisponiveis({ estado: EstadoDemanda.CONCLUIDA })).toHaveLength(0);
      expect(WorkflowEngine.obterAcoesDisponiveis({ estado: EstadoDemanda.CANCELADA })).toHaveLength(0);
    });

    it('isEstadoTerminal e WorkflowEngine.isEstadoTerminal devem identificar CONCLUIDA e CANCELADA como estados terminais', () => {
      expect(isEstadoTerminal(EstadoDemanda.CONCLUIDA)).toBe(true);
      expect(isEstadoTerminal(EstadoDemanda.CANCELADA)).toBe(true);
      expect(WorkflowEngine.isEstadoTerminal(EstadoDemanda.CONCLUIDA)).toBe(true);
      expect(WorkflowEngine.isEstadoTerminal(EstadoDemanda.CANCELADA)).toBe(true);
      expect(WorkflowEngine.isEstadoTerminal(EstadoDemanda.NOVA)).toBe(false);
      expect(WorkflowEngine.isEstadoTerminal(EstadoDemanda.SUSPENSA)).toBe(false);
      expect(WorkflowEngine.isEstadoTerminal(EstadoDemanda.PRONTA_PARA_ENTREGA)).toBe(false);
      expect(ESTADOS_TERMINAIS).toEqual([EstadoDemanda.CONCLUIDA, EstadoDemanda.CANCELADA]);
    });
  });

  describe('8. Quality Gate na Transição EM_QUALIDADE_E_PREPARACAO → EM_MODELAGEM_E_ANALISE', () => {
    it('deve bloquear a transição quando executada SEM qualityGate (impossibilidade de bypass)', () => {
      // Sem contexto
      const resSemContexto = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        EstadoDemanda.EM_MODELAGEM_E_ANALISE
      );
      expect(resSemContexto.valida).toBe(false);
      expect(resSemContexto.mensagem).toContain('sem a avaliação do Quality Gate');
      expect(() =>
        WorkflowEngine.validarTransicao(
          EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
          EstadoDemanda.EM_MODELAGEM_E_ANALISE
        )
      ).toThrow(WorkflowTransitionError);

      // Com contexto mas sem qualityGate
      const resSemGate = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        { justificativa: 'Tentativa sem gate' }
      );
      expect(resSemGate.valida).toBe(false);
      expect(resSemGate.mensagem).toContain('sem a avaliação do Quality Gate');
    });

    it('deve bloquear a transição quando o Quality Gate estiver bloqueado por diagnóstico mais recente FALHA', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        {
          qualityGate: {
            decisao: 'BLOQUEADO',
            liberado: false,
            bloqueante: true,
            exigeJustificativa: false,
            motivo: 'O diagnóstico de qualidade mais recente falhou. É necessário reexecutar ou investigar a causa-raiz.',
            detalhes: {} as any,
          },
        }
      );

      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('falhou');
      expect(() =>
        WorkflowEngine.validarTransicao(
          EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
          EstadoDemanda.EM_MODELAGEM_E_ANALISE,
          {
            qualityGate: {
              decisao: 'BLOQUEADO',
              liberado: false,
              bloqueante: true,
              exigeJustificativa: false,
              motivo: 'O diagnóstico de qualidade mais recente falhou.',
              detalhes: {} as any,
            },
          }
        )
      ).toThrow(WorkflowTransitionError);
    });

    it('deve bloquear a transição quando o Quality Gate estiver bloqueado por diagnóstico mais recente EM_ANDAMENTO', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        {
          qualityGate: {
            decisao: 'BLOQUEADO',
            liberado: false,
            bloqueante: true,
            exigeJustificativa: false,
            motivo: 'O diagnóstico de qualidade mais recente ainda está em execução.',
            detalhes: {} as any,
          },
        }
      );

      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('ainda está em execução');
    });

    it('deve bloquear a transição quando houver problemas PENDENTE de deliberação', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        {
          qualityGate: {
            decisao: 'BLOQUEADO',
            liberado: false,
            bloqueante: true,
            exigeJustificativa: false,
            motivo: 'Existem 3 problema(s) de qualidade pendente(s) de deliberação humana.',
            detalhes: {} as any,
          },
        }
      );

      expect(res.valida).toBe(false);
      expect(res.mensagem).toContain('pendente(s) de deliberação humana');
    });

    it('deve bloquear a transição quando houver problemas ALTA ou CRITICA não resolvidos', () => {
      const resAlta = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        {
          qualityGate: {
            decisao: 'BLOQUEADO',
            liberado: false,
            bloqueante: true,
            exigeJustificativa: false,
            motivo: 'Existem 1 problema(s) de severidade alta em aberto/investigação sem tratamento ou aceite formal.',
            detalhes: {} as any,
          },
        }
      );

      expect(resAlta.valida).toBe(false);
      expect(resAlta.mensagem).toContain('severidade alta em aberto/investigação');

      const resCritica = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        {
          qualityGate: {
            decisao: 'BLOQUEADO',
            liberado: false,
            bloqueante: true,
            exigeJustificativa: false,
            motivo: 'Existem 1 problema(s) crítico(s) em aberto/investigação sem tratamento ou aceite formal.',
            detalhes: {} as any,
          },
        }
      );

      expect(resCritica.valida).toBe(false);
      expect(resCritica.mensagem).toContain('crítico(s) em aberto/investigação');
    });

    it('deve exigir justificativa >= 15 caracteres quando o Quality Gate estiver em ressalva (CONCLUIDO_PARCIALMENTE)', () => {
      const resSemJust = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        {
          qualityGate: {
            decisao: 'LIBERADO_COM_RESSALVA',
            liberado: true,
            bloqueante: false,
            exigeJustificativa: true,
            motivo: 'Diagnóstico concluído parcialmente: a(s) verificação(ões) [Duplicidade de Linhas] foi(ram) limitada(s) por guardrail.',
            detalhes: {} as any,
          },
        }
      );

      expect(resSemJust.valida).toBe(false);
      expect(resSemJust.mensagem).toContain('exige justificativa formal com no mínimo 15 caracteres');

      const resJustCurta = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        {
          justificativa: 'Menor que 15',
          qualityGate: {
            decisao: 'LIBERADO_COM_RESSALVA',
            liberado: true,
            bloqueante: false,
            exigeJustificativa: true,
            motivo: 'Guardrail atingido.',
            detalhes: {} as any,
          },
        }
      );

      expect(resJustCurta.valida).toBe(false);

      const resComJustValida = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        {
          justificativa: 'Ciente de que a verificação de duplicidade foi limitada pelo guardrail de 300k linhas.',
          qualityGate: {
            decisao: 'LIBERADO_COM_RESSALVA',
            liberado: true,
            bloqueante: false,
            exigeJustificativa: true,
            motivo: 'Diagnóstico concluído parcialmente.',
            detalhes: {} as any,
          },
        }
      );

      expect(resComJustValida.valida).toBe(true);
      expect(() =>
        WorkflowEngine.validarTransicao(
          EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
          EstadoDemanda.EM_MODELAGEM_E_ANALISE,
          {
            justificativa: 'Ciente de que a verificação de duplicidade foi limitada pelo guardrail de 300k linhas.',
            qualityGate: {
              decisao: 'LIBERADO_COM_RESSALVA',
              liberado: true,
              bloqueante: false,
              exigeJustificativa: true,
              motivo: 'Diagnóstico concluído parcialmente.',
              detalhes: {} as any,
            },
          }
        )
      ).not.toThrow();
    });

    it('deve permitir avanço direto quando o Quality Gate estiver liberado sem ressalva', () => {
      const res = WorkflowEngine.podeTransitar(
        EstadoDemanda.EM_QUALIDADE_E_PREPARACAO,
        EstadoDemanda.EM_MODELAGEM_E_ANALISE,
        {
          qualityGate: {
            decisao: 'LIBERADO',
            liberado: true,
            bloqueante: false,
            exigeJustificativa: false,
            motivo: 'Todos os problemas deliberados e tratados.',
            detalhes: {} as any,
          },
        }
      );

      expect(res.valida).toBe(true);
    });
  });
});
