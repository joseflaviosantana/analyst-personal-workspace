import { describe, it, expect, vi } from 'vitest';
import { AtualizarStatusProblemaUseCase } from '@/core/use-cases/quality/atualizar-status-problema.use-case';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { CategoriaProblemaQualidade } from '@/core/domain/enums/categoria-problema-qualidade';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';

class MockProblemasRepository implements Partial<IProblemasQualidadeRepository> {
  problemas: ProblemaQualidade[] = [];

  async findById(id: string): Promise<ProblemaQualidade | null> {
    return this.problemas.find((p) => p.id === id) ?? null;
  }

  async update(id: string, data: Partial<ProblemaQualidade>): Promise<ProblemaQualidade | null> {
    const idx = this.problemas.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const atualizado = {
      ...this.problemas[idx],
      ...data,
      atualizado_em: new Date().toISOString(),
    };
    this.problemas[idx] = atualizado;
    return atualizado;
  }
}

function criarProblemaBase(severidade = SeveridadeProblema.ALTA, status = StatusProblemaQualidade.ABERTO): ProblemaQualidade {
  return {
    id: 'prob-status-01',
    diagnostico_id: 'diag-01',
    ativo_dados_id: 'asset-01',
    demanda_id: 'dem-01',
    categoria: CategoriaProblemaQualidade.DUPLICIDADES_LINHA,
    titulo: 'Chave duplicada',
    descricao: 'Descrição',
    tabela_afetada: 'vendas.csv',
    coluna_afetada: 'id',
    total_linhas_afetadas: 10,
    percentual_linhas_afetadas: 0.1,
    amostra_evidencias: [],
    severidade,
    impacto_calculo: null,
    acao_deliberada: null,
    justificativa_deliberacao: null,
    deliberado_por_humano: severidade !== SeveridadeProblema.PENDENTE,
    deliberado_em: null,
    status,
    origem_deteccao: 'AUTOMATICA',
    criado_em: '2026-09-26T18:00:00.000Z',
    atualizado_em: '2026-09-26T18:00:00.000Z',
  };
}

describe('AtualizarStatusProblemaUseCase (V1 — Subunidade 3.4C)', () => {
  it('deve rejeitar justificativa com menos de 15 caracteres', async () => {
    const repo = new MockProblemasRepository();
    repo.problemas.push(criarProblemaBase());
    const useCase = new AtualizarStatusProblemaUseCase(repo as unknown as IProblemasQualidadeRepository);

    await expect(
      useCase.execute({
        problemaId: 'prob-status-01',
        novoStatus: StatusProblemaQualidade.TRATADO,
        justificativa: 'Curta',
      })
    ).rejects.toThrow('deve conter no mínimo 15 caracteres');
  });

  it('deve proibir transição para ACEITO_COMO_RESTRICAO se severidade for PENDENTE', async () => {
    const repo = new MockProblemasRepository();
    repo.problemas.push(criarProblemaBase(SeveridadeProblema.PENDENTE, StatusProblemaQualidade.ABERTO));
    const useCase = new AtualizarStatusProblemaUseCase(repo as unknown as IProblemasQualidadeRepository);

    await expect(
      useCase.execute({
        problemaId: 'prob-status-01',
        novoStatus: StatusProblemaQualidade.ACEITO_COMO_RESTRICAO,
        justificativa: 'Justificativa válida com mais de 15 caracteres.',
      })
    ).rejects.toThrow('severidade for PENDENTE');
  });

  it('deve atualizar status para TRATADO com auditoria', async () => {
    const repo = new MockProblemasRepository();
    repo.problemas.push(criarProblemaBase(SeveridadeProblema.ALTA, StatusProblemaQualidade.ABERTO));

    const mockAudit: Partial<IAuditRepository> = {
      record: vi.fn().mockResolvedValue({} as any),
    };

    const useCase = new AtualizarStatusProblemaUseCase(
      repo as unknown as IProblemasQualidadeRepository,
      mockAudit as unknown as IAuditRepository
    );

    const res = await useCase.execute({
      problemaId: 'prob-status-01',
      novoStatus: StatusProblemaQualidade.TRATADO,
      justificativa: 'Anomalia resolvida com a substituição do arquivo fonte.',
    });

    expect(res.status).toBe(StatusProblemaQualidade.TRATADO);
    expect(mockAudit.record).toHaveBeenCalledTimes(1);
    expect(mockAudit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo_evento: 'DECISAO_HUMANA',
        justificativa: 'Anomalia resolvida com a substituição do arquivo fonte.',
      })
    );
  });
});
