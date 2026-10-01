/**
 * src/core/use-cases/evidence/registrar-evidencia.use-case.ts
 *
 * Caso de uso: Registrar Evidência Analítica.
 *
 * Garante a criação estruturada de evidências com rigor epistêmico, proveniência
 * e validação estrita de segurança e confidencialidade.
 */

import crypto from 'crypto';
import { EvidenciaAnalitica } from '@/core/domain/entities/evidencia-analitica';
import { TipoEvidenciaAnalitica } from '@/core/domain/enums/tipo-evidencia-analitica';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';
import { MetodoCapturaEvidencia } from '@/core/domain/enums/metodo-captura-evidencia';
import { StatusValidacaoEvidencia } from '@/core/domain/enums/status-validacao-evidencia';
import { ClassificacaoExposicaoEvidencia } from '@/core/domain/enums/classificacao-exposicao-evidencia';
import { IEvidenciaAnaliticaRepository } from '@/core/domain/repositories/evidencia-analitica-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';

export interface RegistrarEvidenciaInput {
  demanda_id: string;
  projeto_id?: string | null;
  tipo: TipoEvidenciaAnalitica;
  etapa_origem: EtapaOrigemEvidencia;
  artefato_origem_tipo?: string | null;
  artefato_origem_id?: string | null;
  titulo: string;
  descricao: string;
  fato_observado: string;
  estado_anterior?: string | null;
  acao_registrada: string;
  estado_posterior?: string | null;
  resultado_mensuravel?: string | null;
  inferencia_recomendacao?: string | null;
  decisao_humana?: string | null;
  metodo_captura?: MetodoCapturaEvidencia;
  status_validacao?: StatusValidacaoEvidencia;
  classificacao_exposicao?: ClassificacaoExposicaoEvidencia;
  elegibilidade_portfolio?: boolean;
  executor?: string;
  metadados?: Record<string, unknown> | null;
}

export class RegistrarEvidenciaUseCase {
  constructor(
    private readonly evidenciaRepo: IEvidenciaAnaliticaRepository,
    private readonly demandRepo: IDemandRepository
  ) {}

  async execute(input: RegistrarEvidenciaInput): Promise<EvidenciaAnalitica> {
    if (!input.demanda_id || typeof input.demanda_id !== 'string') {
      throw new Error('demanda_id é obrigatório para registrar uma evidência analítica.');
    }

    const demanda = await this.demandRepo.findById(input.demanda_id);
    if (!demanda) {
      throw new Error(`Demanda com ID "${input.demanda_id}" não encontrada.`);
    }

    const titulo = input.titulo?.trim();
    if (!titulo || titulo.length < 3) {
      throw new Error('Título da evidência deve conter no mínimo 3 caracteres.');
    }

    const descricao = input.descricao?.trim();
    if (!descricao || descricao.length < 5) {
      throw new Error('Descrição da evidência deve conter no mínimo 5 caracteres.');
    }

    const fatoObservado = input.fato_observado?.trim();
    if (!fatoObservado || fatoObservado.length < 5) {
      throw new Error('Fato observado deve ser explicitamente descrito (mínimo 5 caracteres).');
    }

    const acaoRegistrada = input.acao_registrada?.trim();
    if (!acaoRegistrada || acaoRegistrada.length < 5) {
      throw new Error('Ação registrada deve ser explicitamente descrita (mínimo 5 caracteres).');
    }

    const classificacao =
      input.classificacao_exposicao || ClassificacaoExposicaoEvidencia.INTERNA;

    // Regra Inegociável de Segurança: Evidência CONFIDENCIAL jamais pode ser elegível para portfólio
    let elegibilidadePortfolio = Boolean(input.elegibilidade_portfolio);
    if (classificacao === ClassificacaoExposicaoEvidencia.CONFIDENCIAL && elegibilidadePortfolio) {
      throw new Error(
        'Evidência com classificação CONFIDENCIAL não pode ser elegível para portfólio.'
      );
    }

    const metodoCaptura = input.metodo_captura || MetodoCapturaEvidencia.MANUAL;
    const statusValidacao =
      input.status_validacao ||
      (metodoCaptura === MetodoCapturaEvidencia.MANUAL
        ? StatusValidacaoEvidencia.AGUARDANDO_REVISAO
        : StatusValidacaoEvidencia.CAPTURADA);

    const now = new Date().toISOString();

    const evidencia: EvidenciaAnalitica = {
      id: crypto.randomUUID(),
      demanda_id: input.demanda_id,
      projeto_id: input.projeto_id || demanda.projeto_id || null,
      tipo: input.tipo || TipoEvidenciaAnalitica.DADOS,
      etapa_origem: input.etapa_origem || EtapaOrigemEvidencia.DADOS,
      artefato_origem_tipo: input.artefato_origem_tipo?.trim() || null,
      artefato_origem_id: input.artefato_origem_id?.trim() || null,
      titulo,
      descricao,
      fato_observado: fatoObservado,
      estado_anterior: input.estado_anterior?.trim() || null,
      acao_registrada: acaoRegistrada,
      estado_posterior: input.estado_posterior?.trim() || null,
      resultado_mensuravel: input.resultado_mensuravel?.trim() || null,
      inferencia_recomendacao: input.inferencia_recomendacao?.trim() || null,
      decisao_humana: input.decisao_humana?.trim() || null,
      metodo_captura: metodoCaptura,
      status_validacao: statusValidacao,
      classificacao_exposicao: classificacao,
      elegibilidade_portfolio: elegibilidadePortfolio,
      executor: input.executor?.trim() || 'ANALISTA',
      metadados: input.metadados || null,
      criado_em: now,
      atualizado_em: now,
    };

    return this.evidenciaRepo.create(evidencia);
  }
}
