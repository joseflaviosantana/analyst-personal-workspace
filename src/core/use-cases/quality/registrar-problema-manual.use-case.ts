import crypto from 'node:crypto';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { EvidenciaProblemaQualidade, ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { CategoriaProblemaQualidade } from '@/core/domain/enums/categoria-problema-qualidade';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';

export interface RegistrarProblemaManualInput {
  ativoDadosId: string;
  demandaId: string;
  diagnosticoId?: string | null;
  categoria?: CategoriaProblemaQualidade;
  titulo: string;
  descricao: string;
  tabelaAfetada: string;
  colunaAfetada?: string | null;
  totalLinhasAfetadas?: number;
  percentualLinhasAfetadas?: number;
  amostraEvidencias?: EvidenciaProblemaQualidade[];
}

/**
 * RegistrarProblemaManualUseCase (V1 — Subunidade 3.4B)
 * Permite ao analista humano registrar anomalias e problemas de qualidade identificados manualmente.
 *
 * REGRA NORMATIVA INEGOCIÁVEL DE SEVERIDADE:
 * Todo problema manual nasce INVARIAVELMENTE com severidade PENDENTE.
 * Nenhuma decisão de severidade (BAIXA, MEDIA, ALTA, CRITICA) da Subunidade 3.4C
 * pode ser antecipada nesta etapa.
 */
export class RegistrarProblemaManualUseCase {
  constructor(
    private ativoDadosRepo: IAtivoDadosRepository,
    private problemasRepo: IProblemasQualidadeRepository
  ) {}

  async execute(input: RegistrarProblemaManualInput): Promise<ProblemaQualidade> {
    const ativo = await this.ativoDadosRepo.findById(input.ativoDadosId);
    if (!ativo) {
      throw new Error(`Ativo de dados com ID "${input.ativoDadosId}" não encontrado.`);
    }

    if (!input.titulo || input.titulo.trim() === '') {
      throw new Error('O título do problema é obrigatório.');
    }

    if (!input.descricao || input.descricao.trim() === '') {
      throw new Error('A descrição do problema é obrigatória.');
    }

    if (!input.tabelaAfetada || input.tabelaAfetada.trim() === '') {
      throw new Error('O nome da tabela ou arquivo afetado é obrigatório.');
    }

    const agora = new Date().toISOString();
    const totalLinhas = input.totalLinhasAfetadas ?? 0;
    const totalAtivo = ativo.total_linhas > 0 ? ativo.total_linhas : 0;
    const pct = input.percentualLinhasAfetadas !== undefined
      ? input.percentualLinhasAfetadas
      : totalAtivo > 0 ? Number(((totalLinhas / totalAtivo) * 100).toFixed(2)) : 0;

    const problema: ProblemaQualidade = {
      id: crypto.randomUUID(),
      diagnostico_id: input.diagnosticoId ?? null,
      ativo_dados_id: input.ativoDadosId,
      demanda_id: input.demandaId,
      categoria: input.categoria ?? CategoriaProblemaQualidade.ANOMALIA_MANUAL_DECLARADA,
      titulo: input.titulo.trim(),
      descricao: input.descricao.trim(),
      tabela_afetada: input.tabelaAfetada.trim(),
      coluna_afetada: input.colunaAfetada ? input.colunaAfetada.trim() : null,
      total_linhas_afetadas: totalLinhas,
      percentual_linhas_afetadas: pct,
      amostra_evidencias: input.amostraEvidencias ?? [],
      severidade: SeveridadeProblema.PENDENTE, // REGRA INEGOCIÁVEL: Invariavelmente PENDENTE
      impacto_calculo: null,
      acao_deliberada: null,
      justificativa_deliberacao: null,
      deliberado_por_humano: false,
      deliberado_em: null,
      status: StatusProblemaQualidade.ABERTO,
      origem_deteccao: 'MANUAL',
      regra_id: null,
      regra_snapshot: null,
      criado_em: agora,
      atualizado_em: agora,
    };

    return await this.problemasRepo.create(problema);
  }
}
