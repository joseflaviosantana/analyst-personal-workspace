import { describe, it, expect, vi } from 'vitest';
import { DeliberarProblemaQualidadeUseCase } from '@/core/use-cases/quality/deliberar-problema-qualidade.use-case';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { CategoriaProblemaQualidade } from '@/core/domain/enums/categoria-problema-qualidade';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { AcaoProblemaQualidade } from '@/core/domain/enums/acao-problema-qualidade';

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

function criarProblemaBase(id = 'prob-01'): ProblemaQualidade {
  return {
    id,
    diagnostico_id: 'diag-01',
    ativo_dados_id: 'asset-01',
    demanda_id: 'dem-01',
    categoria: CategoriaProblemaQualidade.DUPLICIDADES_LINHA,
    titulo: 'Chave duplicada',
    descricao: 'Linhas com chaves duplicadas',
    tabela_afetada: 'clientes.csv',
    coluna_afetada: 'cpf',
    total_linhas_afetadas: 5,
    percentual_linhas_afetadas: 0.05,
    amostra_evidencias: [],
    severidade: SeveridadeProblema.PENDENTE,
    impacto_calculo: null,
    acao_deliberada: null,
    justificativa_deliberacao: null,
    deliberado_por_humano: false,
    deliberado_em: null,
    status: StatusProblemaQualidade.ABERTO,
    origem_deteccao: 'AUTOMATICA',
    criado_em: '2026-09-26T18:00:00.000Z',
    atualizado_em: '2026-09-26T18:00:00.000Z',
  };
}

describe('DeliberarProblemaQualidadeUseCase (V1 — Subunidade 3.4C)', () => {
  it('deve rejeitar se o problema não existir', async () => {
    const repo = new MockProblemasRepository();
    const useCase = new DeliberarProblemaQualidadeUseCase(repo as unknown as IProblemasQualidadeRepository);

    await expect(
      useCase.execute({
        problemaId: 'inexistente',
        severidade: SeveridadeProblema.ALTA,
        acaoDeliberada: AcaoProblemaQualidade.CORRIGIR_NA_FONTE,
        justificativa: 'Justificativa válida com mais de 15 caracteres.',
      })
    ).rejects.toThrow('não encontrado');
  });

  it('deve rejeitar atribuição de severidade PENDENTE na deliberação', async () => {
    const repo = new MockProblemasRepository();
    repo.problemas.push(criarProblemaBase());
    const useCase = new DeliberarProblemaQualidadeUseCase(repo as unknown as IProblemasQualidadeRepository);

    await expect(
      useCase.execute({
        problemaId: 'prob-01',
        severidade: SeveridadeProblema.PENDENTE,
        acaoDeliberada: AcaoProblemaQualidade.MONITORAR,
        justificativa: 'Justificativa válida com mais de 15 caracteres.',
      })
    ).rejects.toThrow('O valor PENDENTE representa ausência de deliberação');
  });

  it('deve rejeitar justificativa vazia ou com menos de 15 caracteres', async () => {
    const repo = new MockProblemasRepository();
    repo.problemas.push(criarProblemaBase());
    const useCase = new DeliberarProblemaQualidadeUseCase(repo as unknown as IProblemasQualidadeRepository);

    await expect(
      useCase.execute({
        problemaId: 'prob-01',
        severidade: SeveridadeProblema.MEDIA,
        acaoDeliberada: AcaoProblemaQualidade.MONITORAR,
        justificativa: 'Curta',
      })
    ).rejects.toThrow('deve conter no mínimo 15 caracteres');
  });

  it('deve rejeitar sem ação deliberada', async () => {
    const repo = new MockProblemasRepository();
    repo.problemas.push(criarProblemaBase());
    const useCase = new DeliberarProblemaQualidadeUseCase(repo as unknown as IProblemasQualidadeRepository);

    await expect(
      useCase.execute({
        problemaId: 'prob-01',
        severidade: SeveridadeProblema.MEDIA,
        acaoDeliberada: '',
        justificativa: 'Justificativa válida com mais de 15 caracteres.',
      })
    ).rejects.toThrow('A ação deliberada sobre o problema é mandatória');
  });

  it('deve deliberar com sucesso atribuindo severidade e gravando auditoria', async () => {
    const repo = new MockProblemasRepository();
    repo.problemas.push(criarProblemaBase());

    const mockAudit: Partial<IAuditRepository> = {
      record: vi.fn().mockResolvedValue({} as any),
    };

    const useCase = new DeliberarProblemaQualidadeUseCase(
      repo as unknown as IProblemasQualidadeRepository,
      mockAudit as unknown as IAuditRepository
    );

    const res = await useCase.execute({
      problemaId: 'prob-01',
      severidade: SeveridadeProblema.ALTA,
      acaoDeliberada: AcaoProblemaQualidade.TRATAR_NO_PIPELINE,
      justificativa: 'Será tratado na etapa de transformação via Power Query M.',
      autorTipo: 'HUMANO',
    });

    expect(res.severidade).toBe(SeveridadeProblema.ALTA);
    expect(res.acao_deliberada).toBe(AcaoProblemaQualidade.TRATAR_NO_PIPELINE);
    expect(res.deliberado_por_humano).toBe(true);
    expect(res.deliberado_em).not.toBeNull();
    expect(res.justificativa_deliberacao).toBe(
      'Será tratado na etapa de transformação via Power Query M.'
    );

    expect(mockAudit.record).toHaveBeenCalledTimes(1);
    expect(mockAudit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        demanda_id: 'dem-01',
        entidade: 'ProblemaQualidade',
        entidade_id: 'prob-01',
        tipo_evento: 'DECISAO_HUMANA',
        autor_tipo: 'HUMANO',
      })
    );
  });

  it('deve atualizar status para ACEITO_COMO_RESTRICAO quando a ação for ACEITAR_COMO_RESTRICAO', async () => {
    const repo = new MockProblemasRepository();
    repo.problemas.push(criarProblemaBase());

    const useCase = new DeliberarProblemaQualidadeUseCase(repo as unknown as IProblemasQualidadeRepository);

    const res = await useCase.execute({
      problemaId: 'prob-01',
      severidade: SeveridadeProblema.CRITICA,
      acaoDeliberada: AcaoProblemaQualidade.ACEITAR_COMO_RESTRICAO,
      justificativa: 'Aceito como restrição operacional validada pelo sponsor.',
    });

    expect(res.severidade).toBe(SeveridadeProblema.CRITICA);
    expect(res.status).toBe(StatusProblemaQualidade.ACEITO_COMO_RESTRICAO);
    expect(res.deliberado_por_humano).toBe(true);
  });
});
