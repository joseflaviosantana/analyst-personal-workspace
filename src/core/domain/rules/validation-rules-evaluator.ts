import { ValidacaoConciliacao } from '../entities/validacao-conciliacao';
import { EntregavelDemanda } from '../entities/entregavel-demanda';
import { ResultadoValidacao } from '../enums/resultado-validacao';
import { StatusEntregavel } from '../enums/status-entregavel';
import { StatusAceiteEntrega } from '../enums/status-aceite-entrega';

export interface DiagnosticoValidacao {
  codigo: string; // Ex.: V-01, V-02, V-03, V-04
  tipo: 'BLOQUEIO' | 'ALERTA_CRITICO' | 'RECOMENDACAO';
  mensagem: string;
  item_afetado?: string;
}

export interface ResultadoAvaliacaoValidacao {
  total_validacoes: number;
  total_obrigatorias: number;
  total_aprovadas: number;
  total_divergentes: number;
  total_rejeitadas: number;
  total_pendentes_reteste: number;
  total_entregaveis: number;
  total_entregaveis_obrigatorios: number;
  total_entregaveis_disponiveis: number;
  total_entregaveis_aceitos: number;
  bloqueios_entrega: string[];
  bloqueios_conclusao: string[];
  alertas_criticos: string[];
  recomendacoes: string[];
  pronto_para_entrega: boolean;
  pronto_para_conclusao: boolean;
  diagnosticos: DiagnosticoValidacao[];
}

/**
 * Motor Determinístico de Avaliação de Regras de Validação e Entregáveis (V1 — Subunidade 3.7A)
 * Centraliza as regras de governança V-01 a V-04 para transição de estados do Workflow.
 */
export class ValidationRulesEvaluator {
  static avaliar(
    validacoes: ValidacaoConciliacao[],
    entregaveis: EntregavelDemanda[]
  ): ResultadoAvaliacaoValidacao {
    const diagnosticos: DiagnosticoValidacao[] = [];
    const bloqueiosEntrega: string[] = [];
    const bloqueiosConclusao: string[] = [];
    const alertasCriticos: string[] = [];
    const recomendacoes: string[] = [];

    // Contadores de Validações
    const totalValidacoes = validacoes.length;
    const obrigatorias = validacoes.filter((v) => v.obrigatoria);
    const totalObrigatorias = obrigatorias.length;
    const totalAprovadas = validacoes.filter((v) => v.resultado === ResultadoValidacao.APROVADO).length;
    const totalDivergentes = validacoes.filter((v) => v.resultado === ResultadoValidacao.DIVERGENTE).length;
    const totalRejeitadas = validacoes.filter((v) => v.resultado === ResultadoValidacao.REJEITADO).length;
    const totalPendentesReteste = validacoes.filter((v) => v.resultado === ResultadoValidacao.PENDENTE_RETESTE).length;

    // Contadores de Entregáveis
    const totalEntregaveis = entregaveis.length;
    const entregaveisObrigatorios = entregaveis.filter((e) => e.obrigatorio && e.status !== StatusEntregavel.SUBSTITUIDO);
    const totalEntregaveisObrigatorios = entregaveisObrigatorios.length;
    const totalEntregaveisDisponiveis = entregaveis.filter(
      (e) => e.status === StatusEntregavel.DISPONIVEL || e.status === StatusEntregavel.HOMOLOGADO
    ).length;
    const totalEntregaveisAceitos = entregaveis.filter((e) => e.aceite_status === StatusAceiteEntrega.ACEITO).length;

    // =========================================================================
    // REGRA V-01: Existência Mínima de Validação para Entrega
    // =========================================================================
    if (totalValidacoes === 0) {
      const msg = 'A demanda não possui nenhuma validação analítica ou conciliação cadastrada.';
      diagnosticos.push({
        codigo: 'V-01',
        tipo: 'BLOQUEIO',
        mensagem: msg,
      });
      bloqueiosEntrega.push(msg);
    }

    // =========================================================================
    // REGRA V-02: Resolução de Checks de Validação e Divergências
    // =========================================================================
    for (const val of validacoes) {
      if (val.obrigatoria) {
        if (val.resultado === ResultadoValidacao.DIVERGENTE) {
          const divStr = val.divergencia_absoluta !== null && val.divergencia_absoluta !== undefined
            ? `divergência de ${val.divergencia_absoluta}`
            : 'divergência detectada';
          const msg = `Validação obrigatória "${val.titulo}" está com resultado DIVERGENTE (${divStr} além da tolerância ${val.tolerancia_permitida}).`;
          diagnosticos.push({
            codigo: 'V-02',
            tipo: 'BLOQUEIO',
            mensagem: msg,
            item_afetado: val.id,
          });
          bloqueiosEntrega.push(msg);
        } else if (val.resultado === ResultadoValidacao.REJEITADO) {
          const msg = `Validação obrigatória "${val.titulo}" foi REJEITADA e requer tratamento ou reteste aprovado.`;
          diagnosticos.push({
            codigo: 'V-02',
            tipo: 'BLOQUEIO',
            mensagem: msg,
            item_afetado: val.id,
          });
          bloqueiosEntrega.push(msg);
        } else if (val.resultado === ResultadoValidacao.PENDENTE_RETESTE) {
          const msg = `Validação obrigatória "${val.titulo}" está com resultado PENDENTE DE RETESTE.`;
          diagnosticos.push({
            codigo: 'V-02',
            tipo: 'BLOQUEIO',
            mensagem: msg,
            item_afetado: val.id,
          });
          bloqueiosEntrega.push(msg);
        }
      } else {
        // Validação não obrigatória com pendência gera alerta crítico sem bloquear compulsoriamente
        if (val.resultado === ResultadoValidacao.DIVERGENTE || val.resultado === ResultadoValidacao.REJEITADO) {
          const msg = `Validação recomendada "${val.titulo}" apresentou divergência ou rejeição.`;
          diagnosticos.push({
            codigo: 'V-02-ALERTA',
            tipo: 'ALERTA_CRITICO',
            mensagem: msg,
            item_afetado: val.id,
          });
          alertasCriticos.push(msg);
        }
      }
    }

    // =========================================================================
    // REGRA V-03: Prontidão dos Entregáveis para PRONTA_PARA_ENTREGA
    // =========================================================================
    if (totalEntregaveis === 0) {
      const msg = 'A demanda não possui nenhum entregável profissional cadastrado no pacote de entrega.';
      diagnosticos.push({
        codigo: 'V-03',
        tipo: 'BLOQUEIO',
        mensagem: msg,
      });
      bloqueiosEntrega.push(msg);
    } else {
      if (totalEntregaveisDisponiveis === 0) {
        const msg = 'Nenhum entregável profissional está com status DISPONÍVEL ou HOMOLOGADO.';
        diagnosticos.push({
          codigo: 'V-03',
          tipo: 'BLOQUEIO',
          mensagem: msg,
        });
        bloqueiosEntrega.push(msg);
      }

      for (const ent of entregaveisObrigatorios) {
        if (ent.status === StatusEntregavel.RASCUNHO) {
          const msg = `O entregável obrigatório "${ent.titulo}" (versão ${ent.versao}) ainda está em status RASCUNHO.`;
          diagnosticos.push({
            codigo: 'V-03',
            tipo: 'BLOQUEIO',
            mensagem: msg,
            item_afetado: ent.id,
          });
          bloqueiosEntrega.push(msg);
        }
      }
    }

    // =========================================================================
    // REGRA V-04: Aceite Formal e Conclusão (PRONTA_PARA_ENTREGA -> CONCLUIDA)
    // Ajuste Vinculante: TODOS os entregáveis obrigatórios vigentes devem estar aceitos.
    // =========================================================================
    if (totalEntregaveisObrigatorios === 0) {
      const msg = 'A conclusão da demanda exige ao menos um entregável profissional obrigatório cadastrado.';
      diagnosticos.push({
        codigo: 'V-04',
        tipo: 'BLOQUEIO',
        mensagem: msg,
      });
      bloqueiosConclusao.push(msg);
    } else {
      for (const ent of entregaveisObrigatorios) {
        if (ent.aceite_status === StatusAceiteEntrega.PENDENTE) {
          const msg = `O entregável obrigatório "${ent.titulo}" está com aceite PENDENTE.`;
          diagnosticos.push({
            codigo: 'V-04',
            tipo: 'BLOQUEIO',
            mensagem: msg,
            item_afetado: ent.id,
          });
          bloqueiosConclusao.push(msg);
        } else if (ent.aceite_status === StatusAceiteEntrega.REJEITADO) {
          const msg = `O entregável obrigatório "${ent.titulo}" foi REJEITADO no aceite formal.`;
          diagnosticos.push({
            codigo: 'V-04',
            tipo: 'BLOQUEIO',
            mensagem: msg,
            item_afetado: ent.id,
          });
          bloqueiosConclusao.push(msg);
        } else if (ent.aceite_status === StatusAceiteEntrega.AJUSTES_SOLICITADOS) {
          const msg = `O entregável obrigatório "${ent.titulo}" possui AJUSTES SOLICITADOS pendentes.`;
          diagnosticos.push({
            codigo: 'V-04',
            tipo: 'BLOQUEIO',
            mensagem: msg,
            item_afetado: ent.id,
          });
          bloqueiosConclusao.push(msg);
        } else if (ent.aceite_status === StatusAceiteEntrega.ACEITO) {
          // Validação da integridade do registro formal de aceite
          if (!ent.aceite_por || ent.aceite_por.trim().length === 0) {
            const msg = `O aceite formal do entregável "${ent.titulo}" carece de identificação de autoria humana.`;
            diagnosticos.push({
              codigo: 'V-04',
              tipo: 'BLOQUEIO',
              mensagem: msg,
              item_afetado: ent.id,
            });
            bloqueiosConclusao.push(msg);
          }
          if (!ent.aceite_em || ent.aceite_em.trim().length === 0) {
            const msg = `O aceite formal do entregável "${ent.titulo}" carece de timestamp formal UTC.`;
            diagnosticos.push({
              codigo: 'V-04',
              tipo: 'BLOQUEIO',
              mensagem: msg,
              item_afetado: ent.id,
            });
            bloqueiosConclusao.push(msg);
          }
        }
      }
    }

    // Entregáveis não obrigatórios que foram rejeitados geram alerta crítico
    const naoObrigatorios = entregaveis.filter((e) => !e.obrigatorio && e.status !== StatusEntregavel.SUBSTITUIDO);
    for (const ent of naoObrigatorios) {
      if (ent.aceite_status === StatusAceiteEntrega.REJEITADO) {
        const msg = `O entregável opcional "${ent.titulo}" foi rejeitado.`;
        diagnosticos.push({
          codigo: 'V-04-ALERTA',
          tipo: 'ALERTA_CRITICO',
          mensagem: msg,
          item_afetado: ent.id,
        });
        alertasCriticos.push(msg);
      }
    }

    // Recomendações informativas de boas práticas
    if (totalValidacoes > 0 && totalObrigatorias === 0) {
      const msg = 'Recomendado classificar ao menos uma validação cruzada de KPI como obrigatória.';
      diagnosticos.push({
        codigo: 'V-REC-01',
        tipo: 'RECOMENDACAO',
        mensagem: msg,
      });
      recomendacoes.push(msg);
    }

    return {
      total_validacoes: totalValidacoes,
      total_obrigatorias: totalObrigatorias,
      total_aprovadas: totalAprovadas,
      total_divergentes: totalDivergentes,
      total_rejeitadas: totalRejeitadas,
      total_pendentes_reteste: totalPendentesReteste,
      total_entregaveis: totalEntregaveis,
      total_entregaveis_obrigatorios: totalEntregaveisObrigatorios,
      total_entregaveis_disponiveis: totalEntregaveisDisponiveis,
      total_entregaveis_aceitos: totalEntregaveisAceitos,
      bloqueios_entrega: bloqueiosEntrega,
      bloqueios_conclusao: bloqueiosConclusao,
      alertas_criticos: alertasCriticos,
      recomendacoes: recomendacoes,
      pronto_para_entrega: bloqueiosEntrega.length === 0,
      pronto_para_conclusao: bloqueiosConclusao.length === 0,
      diagnosticos,
    };
  }
}
