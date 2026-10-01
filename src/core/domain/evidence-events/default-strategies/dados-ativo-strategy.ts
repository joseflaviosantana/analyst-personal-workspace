/**
 * src/core/domain/evidence-events/default-strategies/dados-ativo-strategy.ts
 *
 * Estratégia plugável para processamento de eventos de Ativos de Dados (Subgate 3.5B.2).
 * Fatos objetivos e mensuráveis de catalogação e substituição material de ativos no inventário.
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

export interface PayloadAtivoRegistrado {
  ativoId: string;
  nomeArquivo: string;
  caminhoLocal: string;
  formato: string;
  origem?: string | null;
  tamanhoBytes: number;
  totalLinhas: number;
  totalColunas: number;
  hashSha256: string;
  versao?: string | null;
  classificacaoExposicao?: ClassificacaoExposicaoEvidencia;
}

export interface PayloadAtivoSubstituido {
  ativoAntigoId: string;
  novoAtivoId: string;
  nomeArquivo: string;
  caminhoLocal: string;
  formato: string;
  versaoAntiga: string;
  versaoNova: string;
  hashAntigo: string;
  hashNovo: string;
  linhasAntigas: number;
  linhasNovas: number;
  colunasAntigas: number;
  colunasNovas: number;
  justificativa: string;
  classificacaoExposicao?: ClassificacaoExposicaoEvidencia;
}

export class DadosAtivoStrategy implements IEstrategiaProcessamentoEvento {
  readonly codigo = 'ESTRATEGIA_DADOS_ATIVO';
  readonly tiposSuportados = [
    'DADOS_ATIVO_REGISTRADO',
    'DADOS_ATIVO_SUBSTITUIDO',
  ] as const;

  avaliar(evento: EventoAnalitico): DecisaoPoliticaCaptura {
    if (evento.tipo_evento === 'DADOS_ATIVO_REGISTRADO') {
      const payload = evento.payload as Partial<PayloadAtivoRegistrado> | undefined;
      if (
        !payload ||
        !payload.ativoId ||
        !payload.nomeArquivo ||
        !payload.hashSha256 ||
        typeof payload.totalLinhas !== 'number' ||
        typeof payload.totalColunas !== 'number'
      ) {
        return {
          politica: 'IGNORAR',
          motivo: 'Evento de ativo registrado sem dados estruturados essenciais.',
          requer_intervencao_humana: false,
        };
      }

      return {
        politica: 'REGISTRAR_AUTOMATICAMENTE',
        motivo: 'Fato objetivo e verificável de catalogação de ativo de dados no inventário da demanda.',
        requer_intervencao_humana: false,
      };
    }

    if (evento.tipo_evento === 'DADOS_ATIVO_SUBSTITUIDO') {
      const payload = evento.payload as Partial<PayloadAtivoSubstituido> | undefined;
      if (
        !payload ||
        !payload.novoAtivoId ||
        !payload.ativoAntigoId ||
        !payload.justificativa ||
        payload.justificativa.trim().length === 0
      ) {
        return {
          politica: 'IGNORAR',
          motivo: 'Evento de substituição de ativo sem identificadores ou justificativa formal.',
          requer_intervencao_humana: false,
        };
      }

      return {
        politica: 'REGISTRAR_AUTOMATICAMENTE',
        motivo: 'Fato material de versionamento e substituição atômica de fonte de dados com justificativa humana.',
        requer_intervencao_humana: false,
      };
    }

    return {
      politica: 'IGNORAR',
      motivo: `Tipo de evento "${evento.tipo_evento}" não reconhecido por DadosAtivoStrategy.`,
      requer_intervencao_humana: false,
    };
  }

  transformar(evento: EventoAnalitico): CandidatoEvidencia | null {
    if (evento.tipo_evento === 'DADOS_ATIVO_REGISTRADO') {
      const payload = evento.payload as Partial<PayloadAtivoRegistrado> | undefined;
      if (
        !payload ||
        !payload.ativoId ||
        !payload.nomeArquivo ||
        !payload.hashSha256 ||
        typeof payload.totalLinhas !== 'number' ||
        typeof payload.totalColunas !== 'number'
      ) {
        return null;
      }

      const classificacao =
        payload.classificacaoExposicao || ClassificacaoExposicaoEvidencia.INTERNA;

      return {
        tipo: TipoEvidenciaAnalitica.DADOS,
        etapa_origem: EtapaOrigemEvidencia.DADOS,
        artefato_origem_tipo: 'ATIVO_DADOS',
        artefato_origem_id: payload.ativoId,
        titulo: `Ativo de Dados Catalogado: ${payload.nomeArquivo}`,
        descricao: `Catalogação do arquivo ${payload.formato?.toUpperCase() || 'TABULAR'} "${payload.nomeArquivo}" no inventário da demanda.`,
        fato_observado: `Ativo "${payload.nomeArquivo}" catalogado com ${payload.totalLinhas} linhas e ${payload.totalColunas} colunas. Integridade física verificada via SHA-256 (${payload.hashSha256}).`,
        estado_anterior: null,
        acao_registrada: `Catalogação de arquivo local no repositório da demanda e validação física de unicidade e integridade.`,
        estado_posterior: `Ativo disponível no estado ATIVO para diagnóstico de qualidade e preparação analítica.`,
        resultado_mensuravel: `${payload.totalLinhas} linhas | ${payload.totalColunas} colunas | ${payload.tamanhoBytes ?? 0} bytes`,
        inferencia_recomendacao: 'Ativo pronto para varredura de regras de qualidade na Aba 4.',
        decisao_humana: null,
        classificacao_exposicao: classificacao,
        elegibilidade_portfolio: classificacao !== ClassificacaoExposicaoEvidencia.CONFIDENCIAL,
        metadados_adicionais: {
          ativo_id: payload.ativoId,
          nome_arquivo: payload.nomeArquivo,
          formato: payload.formato,
          hash_sha256: payload.hashSha256,
          total_linhas: payload.totalLinhas,
          total_colunas: payload.totalColunas,
          tamanho_bytes: payload.tamanhoBytes,
          versao: payload.versao || '1.0',
        },
      };
    }

    if (evento.tipo_evento === 'DADOS_ATIVO_SUBSTITUIDO') {
      const payload = evento.payload as Partial<PayloadAtivoSubstituido> | undefined;
      if (
        !payload ||
        !payload.novoAtivoId ||
        !payload.ativoAntigoId ||
        !payload.justificativa
      ) {
        return null;
      }

      const deltaLinhas = (payload.linhasNovas ?? 0) - (payload.linhasAntigas ?? 0);
      const deltaColunas = (payload.colunasNovas ?? 0) - (payload.colunasAntigas ?? 0);
      const classificacao =
        payload.classificacaoExposicao || ClassificacaoExposicaoEvidencia.INTERNA;

      return {
        tipo: TipoEvidenciaAnalitica.DADOS,
        etapa_origem: EtapaOrigemEvidencia.DADOS,
        artefato_origem_tipo: 'ATIVO_DADOS',
        artefato_origem_id: payload.novoAtivoId,
        titulo: `Substituição e Versionamento de Ativo: ${payload.nomeArquivo}`,
        descricao: `Substituição atômica de versão: v${payload.versaoAntiga || '1.0'} substituída por v${payload.versaoNova}.`,
        fato_observado: `Ativo "${payload.nomeArquivo}" atualizado: versão ${payload.versaoAntiga || '1.0'} (SHA-256: ${payload.hashAntigo}) sucedida pela versão ${payload.versaoNova} (SHA-256: ${payload.hashNovo}).`,
        estado_anterior: `Versão ${payload.versaoAntiga || '1.0'} com ${payload.linhasAntigas ?? 0} linhas e ${payload.colunasAntigas ?? 0} colunas.`,
        acao_registrada: `Execução transacional de substituição de ativo com justificativa formal: "${payload.justificativa}".`,
        estado_posterior: `Versão ${payload.versaoNova} com ${payload.linhasNovas ?? 0} linhas e ${payload.colunasNovas ?? 0} colunas. Ativo anterior arquivado com status SUBSTITUIDO.`,
        resultado_mensuravel: `Delta Linhas: ${deltaLinhas >= 0 ? `+${deltaLinhas}` : deltaLinhas} | Delta Colunas: ${deltaColunas >= 0 ? `+${deltaColunas}` : deltaColunas}`,
        inferencia_recomendacao: 'Reavaliar diagnósticos de qualidade e regras de negócio para a nova versão da base.',
        decisao_humana: payload.justificativa,
        classificacao_exposicao: classificacao,
        elegibilidade_portfolio: classificacao !== ClassificacaoExposicaoEvidencia.CONFIDENCIAL,
        metadados_adicionais: {
          ativo_antigo_id: payload.ativoAntigoId,
          novo_ativo_id: payload.novoAtivoId,
          versao_antiga: payload.versaoAntiga,
          versao_nova: payload.versaoNova,
          hash_antigo: payload.hashAntigo,
          hash_novo: payload.hashNovo,
          delta_linhas: deltaLinhas,
          delta_colunas: deltaColunas,
          justificativa: payload.justificativa,
        },
      };
    }

    return null;
  }
}
