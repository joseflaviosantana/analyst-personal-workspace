/**
 * src/core/use-cases/dossier/compilar-dossie-vivo.use-case.ts
 *
 * Caso de uso para compilação concorrente do Dossiê Técnico da Demanda (Subgate 3.9 — Aba 11).
 *
 * O Dossiê é a memória viva e auditável da demanda; é consultável e exportável em qualquer
 * estado do workflow, sem exigir a trava APROV-10 (que se aplica exclusivamente ao portfólio público).
 */

import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IRequisitoDemandaRepository } from '@/core/domain/repositories/requisito-demanda-repository.interface';
import { IPerguntaClarificacaoRepository } from '@/core/domain/repositories/pergunta-clarificacao-repository.interface';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { IModeloPowerBiRepository } from '@/core/domain/repositories/modelo-powerbi-repository.interface';
import { IMedidaDaxRepository } from '@/core/domain/repositories/medida-dax-repository.interface';
import { IEvidenciaAnaliticaRepository } from '@/core/domain/repositories/evidencia-analitica-repository.interface';
import { IValidacaoConciliacaoRepository } from '@/core/domain/repositories/validacao-conciliacao-repository.interface';
import { IEntregavelDemandaRepository } from '@/core/domain/repositories/entregavel-demanda-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import {
  DossierMarkdownCompiler,
  DossierCompilationData,
} from '@/core/domain/dossier/dossier-markdown-compiler';

export interface CompilarDossieVivoInput {
  demandaId: string;
}

export interface CompilarDossieVivoOutput {
  demandaId: string;
  markdown: string;
  totalSecoes: number;
  geradoEm: string;
  compilationData: DossierCompilationData;
}

export class CompilarDossieVivoUseCase {
  constructor(
    private demandRepo: IDemandRepository,
    private requisitoRepo: IRequisitoDemandaRepository,
    private perguntaRepo: IPerguntaClarificacaoRepository,
    private ativoDadosRepo: IAtivoDadosRepository,
    private problemaQualidadeRepo: IProblemasQualidadeRepository,
    private receitaRepo: IReceitaPreparacaoRepository,
    private modeloAnaliticoRepo: IModeloAnaliticoRepository,
    private modeloPowerBiRepo: IModeloPowerBiRepository,
    private medidaDaxRepo: IMedidaDaxRepository,
    private evidenciaRepo: IEvidenciaAnaliticaRepository,
    private validacaoRepo: IValidacaoConciliacaoRepository,
    private entregavelRepo: IEntregavelDemandaRepository,
    private auditRepo: IAuditRepository
  ) {}

  async execute(input: CompilarDossieVivoInput): Promise<CompilarDossieVivoOutput> {
    const demanda = await this.demandRepo.findById(input.demandaId);
    if (!demanda) {
      throw new Error(`Demanda com ID '${input.demandaId}' não encontrada.`);
    }

    const [
      requisitos,
      perguntas,
      ativosDados,
      problemasQualidade,
      receitasPreparacao,
      modelosAnaliticos,
      modelosPowerBi,
      evidencias,
      validacoes,
      entregaveis,
      auditorias,
    ] = await Promise.all([
      this.requisitoRepo.findByDemandId(input.demandaId),
      this.perguntaRepo.findByDemandId(input.demandaId),
      this.ativoDadosRepo.findByDemandId(input.demandaId),
      this.problemaQualidadeRepo.findByDemandId(input.demandaId),
      this.receitaRepo.findByDemandId(input.demandaId),
      this.modeloAnaliticoRepo.findByDemandaId(input.demandaId),
      this.modeloPowerBiRepo.findByDemandaId(input.demandaId),
      this.evidenciaRepo.findByDemandaId(input.demandaId),
      this.validacaoRepo.findByDemandId(input.demandaId),
      this.entregavelRepo.findByDemandId(input.demandaId),
      this.auditRepo.findByDemandaId(input.demandaId),
    ]);

    // Carrega medidas DAX vinculadas aos modelos Power BI da demanda
    const medidasDaxList = [];
    for (const mPbi of modelosPowerBi) {
      const medidas = await this.medidaDaxRepo.findByModeloPowerBiId(mPbi.id);
      medidasDaxList.push(...medidas);
    }

    const compilationData: DossierCompilationData = {
      demanda: {
        ...demanda,
        projeto_nome: demanda.projetoNome,
      },
      requisitos,
      perguntas,
      ativosDados,
      problemasQualidade,
      receitasPreparacao,
      modelosAnaliticos,
      medidasDax: medidasDaxList,
      evidencias,
      validacoes,
      entregaveis,
      auditorias,
    };

    const markdown = DossierMarkdownCompiler.compilar(compilationData);

    return {
      demandaId: input.demandaId,
      markdown,
      totalSecoes: 11,
      geradoEm: new Date().toISOString(),
      compilationData,
    };
  }
}
