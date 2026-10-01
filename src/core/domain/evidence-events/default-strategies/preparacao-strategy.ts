/**
 * src/core/domain/evidence-events/default-strategies/preparacao-strategy.ts
 *
 * Estratégia plugável para processamento de eventos da etapa de Preparação de Dados (Subgate 3.5B.3).
 * Abrange:
 * 1. PREPARACAO_DATASET_HOMOLOGADO: Decisão humana soberana de homologação formal do dataset para modelagem.
 * 2. PREPARACAO_RECEITA_CONCLUIDA: Conclusão formal de pipeline de transformação com etapas validadas.
 * 3. PREPARACAO_ATIVO_DERIVADO_REGISTRADO: Materialização de ativo de dados preparado e arestas de linhagem.
 * 4. PREPARACAO_TRATAMENTO_VALIDADO: Validação empírica de problema de qualidade sanado via pipeline.
 *
 * Princípios Epistemológicos Vinculantes:
 * - Captura automática != Autoria automática: Preserva autoria humana de decisões soberanas.
 * - Não fabricação de deltas: Nunca gera percentuais ou reduções não sustentadas por métricas reais.
 */

import {
  EventoAnalitico,
  DecisaoPoliticaCaptura,
  CandidatoEvidencia,
} from '../event-types';
import { IEstrategiaProcessamentoEvento } from '../event-strategy.interface';
import { TipoEvidenciaAnalitica } from '../../enums/tipo-evidencia-analitica';
import { EtapaOrigemEvidencia } from '../../enums/etapa-origem-evidencia';
import { ClassificacaoExposicaoEvidencia } from '../../enums/classificacao-exposicao-evidencia';

export interface PayloadDatasetHomologado {
  autorizacaoId: string;
  ativoDadosId: string;
  nomeArquivo?: string;
  versaoRotulo: string;
  hashSha256Snapshot: string;
  diagnosticoId: string;
  receitaId?: string | null;
  justificativa: string;
  totalRestricoesAceitas: number;
  autorTipo?: 'HUMANO';
  autorizadoEm: string;
}

export interface PayloadReceitaConcluida {
  receitaId: string;
  titulo: string;
  totalEtapasValidadas: number;
  totalEtapasCanceladas: number;
  justificativa?: string | null;
  concluidaEm: string;
  autorTipo?: 'HUMANO' | 'IA';
}

export interface PayloadAtivoDerivadoRegistrado {
  ativoId: string;
  nomeArquivo: string;
  caminhoLocal: string;
  formato: string;
  tamanhoBytes: number;
  totalLinhas: number;
  totalColunas: number;
  hashSha256: string;
  receitaId: string;
  etapaId: string;
  tipoOperacao: string;
  ferramentaNome: string;
  fontesEntradaIds: string[];
  // Métricas de origem opcionais para cálculo de delta real
  linhasOrigemPrincipal?: number | null;
  colunasOrigemPrincipal?: number | null;
  bytesOrigemPrincipal?: number | null;
}

export interface PayloadTratamentoProblemaValidado {
  problemaId: string;
  titulo: string;
  colunaAfetada: string | null;
  etapaId: string;
  ativoDerivadoId: string;
  diagnosticoId: string;
  motivo: string;
  // Métricas quantitativas empíricas (somente preenchidas quando comprovadas)
  linhasAfetadasAntes?: number | null;
  linhasAfetadasDepois?: number | null;
  percentualReducao?: number | null;
  validadoEm: string;
}

export class PreparacaoStrategy implements IEstrategiaProcessamentoEvento {
  readonly codigo = 'ESTRATEGIA_PREPARACAO';
  readonly tiposSuportados = [
    'PREPARACAO_DATASET_HOMOLOGADO',
    'PREPARACAO_RECEITA_CONCLUIDA',
    'PREPARACAO_ATIVO_DERIVADO_REGISTRADO',
    'PREPARACAO_TRATAMENTO_VALIDADO',
  ] as const;

  avaliar(evento: EventoAnalitico): DecisaoPoliticaCaptura {
    switch (evento.tipo_evento) {
      case 'PREPARACAO_DATASET_HOMOLOGADO': {
        const payload = evento.payload as Partial<PayloadDatasetHomologado> | undefined;
        if (!payload?.autorizacaoId || !payload?.ativoDadosId || !payload?.justificativa) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload de homologação de dataset incompleto (autorizacaoId, ativoDadosId ou justificativa ausentes).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Homologação formal de dataset para modelagem realizada com justificativa técnica válida.',
          requer_intervencao_humana: false,
        };
      }

      case 'PREPARACAO_RECEITA_CONCLUIDA': {
        const payload = evento.payload as Partial<PayloadReceitaConcluida> | undefined;
        if (!payload?.receitaId || payload.totalEtapasValidadas === undefined) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload de conclusão de receita incompleto (receitaId ou totalEtapasValidadas ausentes).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Receita de preparação formalmente concluída com etapas validadas por diagnóstico.',
          requer_intervencao_humana: false,
        };
      }

      case 'PREPARACAO_ATIVO_DERIVADO_REGISTRADO': {
        const payload = evento.payload as Partial<PayloadAtivoDerivadoRegistrado> | undefined;
        if (!payload?.ativoId || !payload?.receitaId || !payload?.etapaId) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload de ativo derivado incompleto (ativoId, receitaId ou etapaId ausentes).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Ativo derivado de preparação registrado no inventário com linhagem estrutural estabelecida.',
          requer_intervencao_humana: false,
        };
      }

      case 'PREPARACAO_TRATAMENTO_VALIDADO': {
        const payload = evento.payload as Partial<PayloadTratamentoProblemaValidado> | undefined;
        if (!payload?.problemaId || !payload?.etapaId || !payload?.diagnosticoId) {
          return {
            politica: 'IGNORAR',
            motivo: 'Payload de tratamento validado incompleto (problemaId, etapaId ou diagnosticoId ausentes).',
            requer_intervencao_humana: false,
          };
        }
        return {
          politica: 'REGISTRAR_AUTOMATICAMENTE',
          motivo: 'Tratamento de problema de qualidade validado empiricamente pelo pipeline de preparação.',
          requer_intervencao_humana: false,
        };
      }

      default:
        return {
          politica: 'IGNORAR',
          motivo: `Tipo de evento de preparação desconhecido: ${evento.tipo_evento}`,
          requer_intervencao_humana: false,
        };
    }
  }

  transformar(evento: EventoAnalitico): CandidatoEvidencia {
    switch (evento.tipo_evento) {
      case 'PREPARACAO_DATASET_HOMOLOGADO':
        return this.transformarDatasetHomologado(evento);
      case 'PREPARACAO_RECEITA_CONCLUIDA':
        return this.transformarReceitaConcluida(evento);
      case 'PREPARACAO_ATIVO_DERIVADO_REGISTRADO':
        return this.transformarAtivoDerivado(evento);
      case 'PREPARACAO_TRATAMENTO_VALIDADO':
        return this.transformarTratamentoValidado(evento);
      default:
        throw new Error(`Tipo de evento não suportado pela estratégia de preparação: ${evento.tipo_evento}`);
    }
  }

  private transformarDatasetHomologado(evento: EventoAnalitico): CandidatoEvidencia {
    const payload = evento.payload as unknown as PayloadDatasetHomologado;
    const nomeAtivo = payload.nomeArquivo || 'Ativo Homologado';
    const rotuloVersao = payload.versaoRotulo || '1.0';

    return {
      tipo: TipoEvidenciaAnalitica.PREPARACAO,
      etapa_origem: EtapaOrigemEvidencia.PREPARACAO,
      artefato_origem_tipo: 'DATASET_AUTORIZADO',
      artefato_origem_id: payload.autorizacaoId,
      titulo: `Homologação Formal de Dataset para Modelagem: ${nomeAtivo} (${rotuloVersao})`,
      descricao: `O conjunto de dados '${nomeAtivo}' foi formalmente homologado pelo analista como apto para alimentar a fase de Modelagem Analítica, com congelamento de integridade e registro de restrições aceitas.`,

      // Rigor Epistêmico (Captura Automática != Autoria Automática)
      fato_observado: `Dataset '${nomeAtivo}' certificado pelo diagnóstico '${payload.diagnosticoId}' com hash SHA-256 '${payload.hashSha256Snapshot}'. Restrições formais aceitas: ${payload.totalRestricoesAceitas}.`,
      estado_anterior: 'Dataset em processo de preparação/validação, não homologado para modelagem.',
      acao_registrada: 'Homologação humana soberana realizada pelo analista mediante justificativa formal auditável.',
      estado_posterior: 'Dataset homologado no status VIGENTE, habilitado como fonte oficial da fase de Modelagem.',
      resultado_mensuravel: `Integridade criptográfica congelada (${payload.hashSha256Snapshot.substring(0, 12)}...) e conformidade atestada com ${payload.totalRestricoesAceitas} restrição(ões) aceita(s).`,
      decisao_humana: payload.justificativa,
      inferencia_recomendacao: 'Prosseguir para a Fase de Modelagem utilizando este dataset como base dimensional.',

      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: true,
      metadados_adicionais: {
        autorizacao_id: payload.autorizacaoId,
        ativo_dados_id: payload.ativoDadosId,
        hash_sha256: payload.hashSha256Snapshot,
        total_restricoes_aceitas: payload.totalRestricoesAceitas,
        diagnostico_id: payload.diagnosticoId,
        receita_id: payload.receitaId ?? null,
        autor_tipo: 'HUMANO',
        captura_automatica: true,
      },
    };
  }

  private transformarReceitaConcluida(evento: EventoAnalitico): CandidatoEvidencia {
    const payload = evento.payload as unknown as PayloadReceitaConcluida;

    return {
      tipo: TipoEvidenciaAnalitica.PREPARACAO,
      etapa_origem: EtapaOrigemEvidencia.PREPARACAO,
      artefato_origem_tipo: 'RECEITA_PREPARACAO',
      artefato_origem_id: payload.receitaId,
      titulo: `Conclusão da Receita de Preparação: ${payload.titulo}`,
      descricao: `A receita de preparação '${payload.titulo}' foi concluída com sucesso após a validação diagnóstica de todas as suas ${payload.totalEtapasValidadas} etapa(s) de transformação.`,

      // Rigor Epistêmico
      fato_observado: `Receita '${payload.titulo}' atingiu conformidade com ${payload.totalEtapasValidadas} etapa(s) validadas e ${payload.totalEtapasCanceladas} cancelada(s).`,
      estado_anterior: 'Receita em execução com etapas de transformação pendentes de validação diagnóstica.',
      acao_registrada: 'Conclusão formal da receita após verificação determinística de que não restam pendências de qualidade no pipeline.',
      estado_posterior: 'Receita no status CONCLUIDA, consolidando o histórico de transformações aplicadas.',
      resultado_mensuravel: `${payload.totalEtapasValidadas} etapa(s) de transformação validadas formalmente por diagnóstico.`,
      decisao_humana: payload.justificativa ?? null,
      inferencia_recomendacao: 'Os ativos derivados gerados por esta receita estão aptos para análise de conformidade de modelagem.',

      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: true,
      metadados_adicionais: {
        receita_id: payload.receitaId,
        total_etapas_validadas: payload.totalEtapasValidadas,
        total_etapas_canceladas: payload.totalEtapasCanceladas,
      },
    };
  }

  private transformarAtivoDerivado(evento: EventoAnalitico): CandidatoEvidencia {
    const payload = evento.payload as unknown as PayloadAtivoDerivadoRegistrado;

    // Cálculo estrito e não fabricado de variação volumétrica
    let deltaDescricao: string | null = null;
    let variacaoLinhas: number | null = null;
    let variacaoPercentual: number | null = null;

    if (
      payload.linhasOrigemPrincipal !== undefined &&
      payload.linhasOrigemPrincipal !== null &&
      payload.linhasOrigemPrincipal > 0
    ) {
      variacaoLinhas = payload.totalLinhas - payload.linhasOrigemPrincipal;
      variacaoPercentual = Number(
        (((payload.totalLinhas - payload.linhasOrigemPrincipal) / payload.linhasOrigemPrincipal) * 100).toFixed(2)
      );
      const sinal = variacaoLinhas >= 0 ? '+' : '';
      deltaDescricao = `Variação volumétrica: ${sinal}${variacaoLinhas.toLocaleString('pt-BR')} linhas (${sinal}${variacaoPercentual}% em relação à origem).`;
    }

    return {
      tipo: TipoEvidenciaAnalitica.PREPARACAO,
      etapa_origem: EtapaOrigemEvidencia.PREPARACAO,
      artefato_origem_tipo: 'ATIVO_DADOS',
      artefato_origem_id: payload.ativoId,
      titulo: `Materialização de Ativo Derivado: ${payload.nomeArquivo}`,
      descricao: `Ativo de dados derivado '${payload.nomeArquivo}' registrado a partir da etapa '${payload.tipoOperacao}' utilizando a ferramenta '${payload.ferramentaNome}'.`,

      // Rigor Epistêmico (Antes x Ação x Depois)
      fato_observado: `Ativo derivado gerado com ${payload.totalLinhas.toLocaleString('pt-BR')} linhas, ${payload.totalColunas} colunas e ${payload.tamanhoBytes.toLocaleString('pt-BR')} bytes.`,
      estado_anterior: payload.linhasOrigemPrincipal !== undefined && payload.linhasOrigemPrincipal !== null
        ? `Ativo de origem principal com ${payload.linhasOrigemPrincipal.toLocaleString('pt-BR')} linhas.`
        : 'Ativo bruto de entrada pendente de transformação.',
      acao_registrada: `Execução da etapa de transformação '${payload.tipoOperacao}' via '${payload.ferramentaNome}'.`,
      estado_posterior: `Novo ativo derivado '${payload.nomeArquivo}' materializado e conectado ao grafo de linhagem.`,
      resultado_mensuravel: deltaDescricao ?? `${payload.totalLinhas.toLocaleString('pt-BR')} linhas estruturadas no ativo derivado.`,
      inferencia_recomendacao: 'Executar diagnóstico de qualidade sobre o ativo derivado para certificar a transformação.',

      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: true,
      metadados_adicionais: {
        ativo_id: payload.ativoId,
        receita_id: payload.receitaId,
        etapa_id: payload.etapaId,
        tipo_operacao: payload.tipoOperacao,
        ferramenta_nome: payload.ferramentaNome,
        total_linhas: payload.totalLinhas,
        total_colunas: payload.totalColunas,
        tamanho_bytes: payload.tamanhoBytes,
        hash_sha256: payload.hashSha256,
        variacao_linhas: variacaoLinhas,
        variacao_percentual: variacaoPercentual,
      },
    };
  }

  private transformarTratamentoValidado(evento: EventoAnalitico): CandidatoEvidencia {
    const payload = evento.payload as unknown as PayloadTratamentoProblemaValidado;

    // Regra Epistêmica: Nunca fabricar deltas ou percentuais se não fornecidos pelo domínio real
    let resultadoFactual: string;
    let estadoAnteriorFactual: string;

    if (
      payload.linhasAfetadasAntes !== undefined &&
      payload.linhasAfetadasAntes !== null &&
      payload.linhasAfetadasDepois !== undefined &&
      payload.linhasAfetadasDepois !== null
    ) {
      // Métricas quantitativas reais fornecidas
      const reducaoLinhas = payload.linhasAfetadasAntes - payload.linhasAfetadasDepois;
      const percentual = payload.linhasAfetadasAntes > 0
        ? ((reducaoLinhas / payload.linhasAfetadasAntes) * 100).toFixed(1)
        : '0.0';
      estadoAnteriorFactual = `Problema aberto com ${payload.linhasAfetadasAntes.toLocaleString('pt-BR')} linha(s) afetada(s) na coluna '${payload.colunaAfetada || 'Geral'}'.`;
      resultadoFactual = `Redução comprovada de ${reducaoLinhas.toLocaleString('pt-BR')} ocorrência(s) (${percentual}% de saneamento), restando ${payload.linhasAfetadasDepois} ocorrência(s).`;
    } else {
      // Registro conservador e factual sem fabricação de números
      estadoAnteriorFactual = `Problema de qualidade '${payload.titulo}' pendente de tratamento no pipeline na coluna '${payload.colunaAfetada || 'Geral'}'.`;
      resultadoFactual = 'Tratamento validado e aprovado segundo a regra determinística aplicável no ativo derivado.';
    }

    return {
      tipo: TipoEvidenciaAnalitica.PREPARACAO,
      etapa_origem: EtapaOrigemEvidencia.PREPARACAO,
      artefato_origem_tipo: 'PROBLEMA_QUALIDADE',
      artefato_origem_id: payload.problemaId,
      titulo: `Saneamento Empírico de Qualidade no Pipeline: ${payload.titulo}`,
      descricao: `O problema de qualidade '${payload.titulo}' foi validado empiricamente e transicionado para TRATADO através da etapa '${payload.etapaId}'.`,

      // Rigor Epistêmico (Sem extrapolação)
      fato_observado: `Problema de qualidade '${payload.titulo}' verificado pelo diagnóstico '${payload.diagnosticoId}' no ativo derivado '${payload.ativoDerivadoId}'.`,
      estado_anterior: estadoAnteriorFactual,
      acao_registrada: `Aplicação do tratamento no pipeline e conferência determinística pós-transformação. Motivo: ${payload.motivo}`,
      estado_posterior: 'Problema transicionado formalmente para o status TRATADO.',
      resultado_mensuravel: resultadoFactual,
      inferencia_recomendacao: 'Anomalia sanada; ativo liberado para compor a receita de preparação.',

      classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      elegibilidade_portfolio: true,
      metadados_adicionais: {
        problema_id: payload.problemaId,
        etapa_id: payload.etapaId,
        diagnostico_id: payload.diagnosticoId,
        ativo_derivado_id: payload.ativoDerivadoId,
        linhas_afetadas_antes: payload.linhasAfetadasAntes ?? null,
        linhas_afetadas_depois: payload.linhasAfetadasDepois ?? null,
      },
    };
  }
}
