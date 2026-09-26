import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';

export interface AtualizarStatusProblemaInput {
  problemaId: string;
  novoStatus: StatusProblemaQualidade;
  justificativa: string; // Mínimo 15 caracteres
  autorTipo?: 'HUMANO' | 'IA';
}

export class AtualizarStatusProblemaUseCase {
  constructor(
    private problemasRepo: IProblemasQualidadeRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: AtualizarStatusProblemaInput): Promise<ProblemaQualidade> {
    const problema = await this.problemasRepo.findById(input.problemaId);
    if (!problema) {
      throw new Error(`Problema de qualidade com ID "${input.problemaId}" não encontrado.`);
    }

    if (problema.status === input.novoStatus) {
      return problema;
    }

    const justificativaLimpa = input.justificativa ? input.justificativa.trim() : '';
    if (justificativaLimpa.length < 15) {
      throw new Error(
        'A justificativa para alteração de status é mandatória e deve conter no mínimo 15 caracteres.'
      );
    }

    // Invariante: Não é permitido aceitar como restrição se a severidade for PENDENTE
    if (input.novoStatus === StatusProblemaQualidade.ACEITO_COMO_RESTRICAO) {
      if (problema.severidade === SeveridadeProblema.PENDENTE) {
        throw new Error(
          'Não é permitido alterar o status para Aceito como Restrição quando a severidade for PENDENTE. O problema deve ser deliberado primeiro.'
        );
      }
    }

    const agora = new Date().toISOString();

    const dadosAnteriores = {
      status: problema.status,
      severidade: problema.severidade,
    };

    const atualizado = await this.problemasRepo.update(problema.id, {
      status: input.novoStatus,
    });

    if (!atualizado) {
      throw new Error(`Falha ao atualizar status do problema "${problema.id}".`);
    }

    if (this.auditRepo) {
      const dadosNovos = {
        status: atualizado.status,
        severidade: atualizado.severidade,
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
