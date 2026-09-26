import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { AcaoProblemaQualidade } from '@/core/domain/enums/acao-problema-qualidade';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';

export interface DeliberarProblemaInput {
  problemaId: string;
  severidade: SeveridadeProblema; // BAIXA | MEDIA | ALTA | CRITICA (PENDENTE proibido)
  acaoDeliberada: AcaoProblemaQualidade | string;
  justificativa: string; // Mínimo 15 caracteres
  status?: StatusProblemaQualidade;
  impactoCalculo?: string | null;
  autorTipo?: 'HUMANO' | 'IA';
}

export class DeliberarProblemaQualidadeUseCase {
  constructor(
    private problemasRepo: IProblemasQualidadeRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: DeliberarProblemaInput): Promise<ProblemaQualidade> {
    const problema = await this.problemasRepo.findById(input.problemaId);
    if (!problema) {
      throw new Error(`Problema de qualidade com ID "${input.problemaId}" não encontrado.`);
    }

    // Invariante: PENDENTE não pode ser atribuído como deliberação humana
    if (input.severidade === SeveridadeProblema.PENDENTE) {
      throw new Error(
        'A deliberação exige a atribuição de uma severidade definitiva (BAIXA, MEDIA, ALTA ou CRITICA). O valor PENDENTE representa ausência de deliberação.'
      );
    }

    if (!input.acaoDeliberada || typeof input.acaoDeliberada !== 'string' || input.acaoDeliberada.trim() === '') {
      throw new Error('A ação deliberada sobre o problema é mandatória.');
    }

    const justificativaLimpa = input.justificativa ? input.justificativa.trim() : '';
    if (justificativaLimpa.length < 15) {
      throw new Error(
        'A justificativa da deliberação é mandatória e deve conter no mínimo 15 caracteres.'
      );
    }

    // Determina o novo status operacional
    let novoStatus: StatusProblemaQualidade = input.status ?? problema.status;
    if (input.acaoDeliberada === AcaoProblemaQualidade.ACEITAR_COMO_RESTRICAO) {
      novoStatus = StatusProblemaQualidade.ACEITO_COMO_RESTRICAO;
    }

    const agora = new Date().toISOString();

    const dadosAnteriores = {
      severidade: problema.severidade,
      status: problema.status,
      acao_deliberada: problema.acao_deliberada,
      justificativa_deliberacao: problema.justificativa_deliberacao,
      deliberado_por_humano: problema.deliberado_por_humano,
      deliberado_em: problema.deliberado_em,
    };

    const atualizado = await this.problemasRepo.update(problema.id, {
      severidade: input.severidade,
      acao_deliberada: input.acaoDeliberada,
      justificativa_deliberacao: justificativaLimpa,
      deliberado_por_humano: true,
      deliberado_em: agora,
      status: novoStatus,
      impacto_calculo:
        input.impactoCalculo !== undefined ? input.impactoCalculo : problema.impacto_calculo,
    });

    if (!atualizado) {
      throw new Error(`Falha ao atualizar o problema de qualidade "${problema.id}".`);
    }

    // Auditoria compulsória da deliberação humana (ADR-002 Seção 4.5 e 10.1)
    if (this.auditRepo) {
      const dadosNovos = {
        severidade: atualizado.severidade,
        status: atualizado.status,
        acao_deliberada: atualizado.acao_deliberada,
        justificativa_deliberacao: atualizado.justificativa_deliberacao,
        deliberado_por_humano: atualizado.deliberado_por_humano,
        deliberado_em: atualizado.deliberado_em,
      };

      await this.auditRepo.record({
        demanda_id: problema.demanda_id,
        entidade: 'ProblemaQualidade',
        entidade_id: problema.id,
        tipo_evento: 'DECISAO_HUMANA',
        autor_tipo: input.autorTipo ?? 'HUMANO',
        dados_anteriores: JSON.stringify(dadosAnteriores),
        dados_novos: JSON.stringify(dadosNovos),
        justificativa: justificativaLimpa,
        timestamp: agora,
      });
    }

    return atualizado;
  }
}
