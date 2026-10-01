/**
 * src/core/use-cases/portfolio/gerar-rascunho-estudo-caso.use-case.ts
 *
 * Gera heuristicamente a versão candidata (rascunho) de estudo de caso para portfólio (Subgate 3.9 — Aba 11).
 *
 * Salvaguardas:
 * 1. Demandas SUSPENSA e CANCELADA bloqueiam a geração de rascunho de portfólio.
 * 2. Demanda CONCLUIDA é permitida para elaboração, revisão e homologação do case.
 * 3. Se havia um case anteriormente HOMOLOGADO_APROV_10, a regeneração invalida a homologação
 *    e retorna deterministicamente para RASCUNHO com versão incrementada.
 * 4. Não polui o Evidence Core com eventos analíticos em rascunhos.
 */

import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IRequisitoDemandaRepository } from '@/core/domain/repositories/requisito-demanda-repository.interface';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { IModeloPowerBiRepository } from '@/core/domain/repositories/modelo-powerbi-repository.interface';
import { IMedidaDaxRepository } from '@/core/domain/repositories/medida-dax-repository.interface';
import { IEvidenciaAnaliticaRepository } from '@/core/domain/repositories/evidencia-analitica-repository.interface';
import { IValidacaoConciliacaoRepository } from '@/core/domain/repositories/validacao-conciliacao-repository.interface';
import { IEntregavelDemandaRepository } from '@/core/domain/repositories/entregavel-demanda-repository.interface';
import { IEstudoCasoPortfolioRepository } from '@/core/domain/repositories/estudo-caso-portfolio-repository.interface';
import { PortfolioCaseGenerator } from '@/core/domain/portfolio/portfolio-case-generator';
import { EstudoCasoPortfolio } from '@/core/domain/entities/estudo-caso-portfolio';
import { StatusEstudoCaso } from '@/core/domain/enums/status-estudo-caso';
import { EstadoDemanda, normalizarEstadoDemanda } from '@/core/domain/enums/estado-demanda';

export interface GerarRascunhoEstudoCasoInput {
  demandaId: string;
}

export class GerarRascunhoEstudoCasoUseCase {
  constructor(
    private demandRepo: IDemandRepository,
    private requisitoRepo: IRequisitoDemandaRepository,
    private ativoDadosRepo: IAtivoDadosRepository,
    private problemaQualidadeRepo: IProblemasQualidadeRepository,
    private receitaRepo: IReceitaPreparacaoRepository,
    private modeloAnaliticoRepo: IModeloAnaliticoRepository,
    private modeloPowerBiRepo: IModeloPowerBiRepository,
    private medidaDaxRepo: IMedidaDaxRepository,
    private evidenciaRepo: IEvidenciaAnaliticaRepository,
    private validacaoRepo: IValidacaoConciliacaoRepository,
    private entregavelRepo: IEntregavelDemandaRepository,
    private caseRepo: IEstudoCasoPortfolioRepository
  ) {}

  async execute(input: GerarRascunhoEstudoCasoInput): Promise<EstudoCasoPortfolio> {
    const demanda = await this.demandRepo.findById(input.demandaId);
    if (!demanda) {
      throw new Error(`Demanda com ID '${input.demandaId}' não encontrada.`);
    }

    const estadoNorm = normalizarEstadoDemanda(demanda.estado);
    if (estadoNorm === EstadoDemanda.SUSPENSA || estadoNorm === EstadoDemanda.CANCELADA) {
      throw new Error(
        `Não é permitido gerar ou modificar estudos de caso para demandas ${estadoNorm}.`
      );
    }

    const [
      requisitos,
      ativosDados,
      problemasQualidade,
      receitasPreparacao,
      modelosAnaliticos,
      modelosPowerBi,
      evidencias,
      validacoes,
      entregaveis,
      existingCase,
    ] = await Promise.all([
      this.requisitoRepo.findByDemandId(input.demandaId),
      this.ativoDadosRepo.findByDemandId(input.demandaId),
      this.problemaQualidadeRepo.findByDemandId(input.demandaId),
      this.receitaRepo.findByDemandId(input.demandaId),
      this.modeloAnaliticoRepo.findByDemandaId(input.demandaId),
      this.modeloPowerBiRepo.findByDemandaId(input.demandaId),
      this.evidenciaRepo.findByDemandaId(input.demandaId),
      this.validacaoRepo.findByDemandId(input.demandaId),
      this.entregavelRepo.findByDemandId(input.demandaId),
      this.caseRepo.findByDemandId(input.demandaId),
    ]);

    const medidasDaxList = [];
    for (const mPbi of modelosPowerBi) {
      const medidas = await this.medidaDaxRepo.findByModeloPowerBiId(mPbi.id);
      medidasDaxList.push(...medidas);
    }

    const generated = PortfolioCaseGenerator.gerar({
      demanda,
      requisitos,
      ativosDados,
      problemasQualidade,
      receitasPreparacao,
      modelosAnaliticos,
      medidasDax: medidasDaxList,
      evidencias,
      validacoes,
      entregaveis,
    });

    if (existingCase) {
      generated.id = existingCase.id;
      generated.versao = existingCase.versao + 1;
      generated.criado_em = existingCase.criado_em;
      // Garante que o status volte para RASCUNHO caso estivesse homologado
      generated.status = StatusEstudoCaso.RASCUNHO;
      generated.homologado_em = null;
      generated.homologado_por = null;
    }

    await this.caseRepo.save(generated);
    return generated;
  }
}
