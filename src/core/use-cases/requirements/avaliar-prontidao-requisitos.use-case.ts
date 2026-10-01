import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IRequisitoDemandaRepository } from '@/core/domain/repositories/requisito-demanda-repository.interface';
import { IPerguntaClarificacaoRepository } from '@/core/domain/repositories/pergunta-clarificacao-repository.interface';
import { StatusPerguntaClarificacao } from '@/core/domain/enums/status-pergunta-clarificacao';

export interface ProntidaoRequisitosOutput {
  liberadoParaAvanco: boolean;
  bloqueado: boolean;
  motivosBloqueio: string[];
  avisosConsultivos: string[];
  exigeJustificativaRessalva: boolean;
  isHomologado: boolean;
  homologadoEm: string | null;
  homologadoPor: string | null;
  totalRequisitos: number;
  totalObrigatorios: number;
  totalPerguntas: number;
  perguntasBloqueantesPendentes: number;
  perguntasNaoBloqueantesPendentes: number;
  temObjetivoDelimitado: boolean;
  temGranularidadeOuPeriodo: boolean;
}

export class AvaliarProntidaoRequisitosUseCase {
  constructor(
    private demandRepo: IDemandRepository,
    private requisitoRepo: IRequisitoDemandaRepository,
    private perguntaRepo: IPerguntaClarificacaoRepository
  ) {}

  async execute(demandaId: string): Promise<ProntidaoRequisitosOutput> {
    const demanda = await this.demandRepo.findById(demandaId);
    if (!demanda) {
      throw new Error(`Demanda '${demandaId}' não encontrada.`);
    }

    const requisitos = await this.requisitoRepo.findByDemandId(demandaId);
    const perguntas = await this.perguntaRepo.findByDemandId(demandaId);

    const motivosBloqueio: string[] = [];
    const avisosConsultivos: string[] = [];

    // 1. Verificação de Perguntas Bloqueantes Pendentes (G-REQ-02)
    const perguntasBloqueantes = perguntas.filter(
      (p) =>
        p.bloqueante &&
        (p.status === StatusPerguntaClarificacao.RASCUNHO ||
          p.status === StatusPerguntaClarificacao.ENVIADA)
    );
    if (perguntasBloqueantes.length > 0) {
      motivosBloqueio.push(
        `Existem ${perguntasBloqueantes.length} pergunta(s) bloqueante(s) aguardando retorno do contratante.`
      );
    }

    // 2. Verificação de Delimitação Mínima de Escopo (G-REQ-03 Revisada)
    const temObjetivoDelimitado = Boolean(demanda.objetivo_inicial && demanda.objetivo_inicial.trim().length >= 5);
    const totalObrigatorios = requisitos.filter((r) => r.prioridade === 'OBRIGATORIO').length;

    if (!temObjetivoDelimitado && totalObrigatorios === 0) {
      motivosBloqueio.push(
        'A demanda requer ao menos um requisito obrigatório formalizado ou objetivo analítico delimitado no briefing.'
      );
    }

    // 3. Avisos Consultivos (não impeditivos, geram necessidade de ressalva se avançar)
    const perguntasNaoBloqueantesPendentes = perguntas.filter(
      (p) =>
        !p.bloqueante &&
        (p.status === StatusPerguntaClarificacao.RASCUNHO ||
          p.status === StatusPerguntaClarificacao.ENVIADA)
    ).length;

    if (perguntasNaoBloqueantesPendentes > 0) {
      avisosConsultivos.push(
        `Existem ${perguntasNaoBloqueantesPendentes} pergunta(s) informativa(s) ainda não respondidas pelo cliente.`
      );
    }

    const temGranularidadeOuPeriodo = Boolean(
      (demanda.granularidade && demanda.granularidade.trim().length > 0) ||
      (demanda.periodo_analise && demanda.periodo_analise.trim().length > 0)
    );

    if (!temGranularidadeOuPeriodo) {
      avisosConsultivos.push(
        'O grão de análise ou período temporal não foram especificados no briefing.'
      );
    }

    const isHomologado = Boolean(demanda.requisitos_homologados_em);
    if (!isHomologado) {
      avisosConsultivos.push(
        'O levantamento de requisitos ainda não foi formalmente homologado pelo analista.'
      );
    }

    const bloqueado = motivosBloqueio.length > 0;
    const exigeJustificativaRessalva = !bloqueado && (avisosConsultivos.length > 0 || !isHomologado);
    const liberadoParaAvanco = !bloqueado;

    return {
      liberadoParaAvanco,
      bloqueado,
      motivosBloqueio,
      avisosConsultivos,
      exigeJustificativaRessalva,
      isHomologado,
      homologadoEm: demanda.requisitos_homologados_em || null,
      homologadoPor: demanda.requisitos_homologados_por || null,
      totalRequisitos: requisitos.length,
      totalObrigatorios,
      totalPerguntas: perguntas.length,
      perguntasBloqueantesPendentes: perguntasBloqueantes.length,
      perguntasNaoBloqueantesPendentes,
      temObjetivoDelimitado,
      temGranularidadeOuPeriodo,
    };
  }
}
