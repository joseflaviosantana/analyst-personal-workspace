import { describe, it, expect, vi } from 'vitest';
import { RegisterDataAssetUseCase } from '@/core/use-cases/data-assets/register-data-asset';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { Demanda } from '@/core/domain/entities/demanda';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';

describe('RegisterDataAssetUseCase (Unitário)', () => {
  const mockDemand: DemandaComProjeto = {
    id: 'dem_1',
    projeto_id: 'proj_1',
    projetoNome: 'Projeto Teste',
    titulo: 'Análise de Churn',
    solicitacao_bruta: 'Solicitação de teste',
    contexto: null,
    objetivo_inicial: null,
    prazo_esperado: null,
    restricoes_declaradas: null,
    estado: EstadoDemanda.EM_CLARIFICACAO,
    estado_anterior: null,
    criado_em: '2026-09-26T10:00:00.000Z',
    atualizado_em: '2026-09-26T10:00:00.000Z',
    data_conclusao: null,
  };

  const validPayload = {
    demanda_id: 'dem_1',
    caminho_local: 'C:\\Projetos\\clientes.csv',
    nome_arquivo: 'clientes.csv',
    formato: FormatoArquivo.CSV,
    tamanho_bytes: 1024,
    total_linhas: 50,
    total_colunas: 4,
    hash_sha256: 'e'.repeat(64),
    schema_inferido: JSON.stringify({ id: 'number', nome: 'string' }),
    origem: 'Sistema de CRM Corporativo',
    descricao_conteudo: 'Base de clientes ativos',
    granularidade: 'Transacional',
    periodo_inicio: '2024-01-01',
    periodo_fim: '2024-12-31',
    data_recebimento: '2026-09-26',
    versao: '1.0',
  };

  const createMockRepos = () => {
    const ativoDadosRepo: IAtivoDadosRepository = {
      create: vi.fn(async (asset: AtivoDados) => asset),
      findById: vi.fn(),
      findByDemandId: vi.fn(),
      findByPath: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
      countByDemandId: vi.fn(),
    };

    const demandRepo: IDemandRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(mockDemand),
      findByProjectId: vi.fn(),
      findAll: vi.fn(),
      findRecent: vi.fn(),
      update: vi.fn(),
      countActive: vi.fn(),
      countTotal: vi.fn(),
    };

    const auditRepo: IAuditRepository = {
      record: vi.fn(async (evento: any) => ({ ...evento, id: 'audit_123' })),
      findByDemandaId: vi.fn(),
    };

    return { ativoDadosRepo, demandRepo, auditRepo };
  };

  it('deve cadastrar com sucesso um ativo e registrar auditoria na Opção 1', async () => {
    const { ativoDadosRepo, demandRepo, auditRepo } = createMockRepos();
    const useCase = new RegisterDataAssetUseCase(ativoDadosRepo, demandRepo, auditRepo);

    const asset = await useCase.execute(validPayload);

    expect(asset.id).toMatch(/^ast_/);
    expect(asset.demanda_id).toBe('dem_1');
    expect(asset.status).toBe(StatusAtivoDados.ATIVO);
    expect(ativoDadosRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      nome_arquivo: 'clientes.csv',
      origem: 'Sistema de CRM Corporativo',
    }));

    expect(auditRepo.record).toHaveBeenCalledWith(expect.objectContaining({
      demanda_id: 'dem_1',
      entidade: 'AtivoDados',
      entidade_id: asset.id,
      tipo_evento: 'CRIACAO',
      autor_tipo: 'HUMANO',
      justificativa: 'Catalogação de ativo de dados local no inventário da demanda.',
    }));
  });

  it('deve lançar erro se a demanda não existir', async () => {
    const { ativoDadosRepo, demandRepo, auditRepo } = createMockRepos();
    vi.mocked(demandRepo.findById).mockResolvedValueOnce(null);

    const useCase = new RegisterDataAssetUseCase(ativoDadosRepo, demandRepo, auditRepo);
    await expect(useCase.execute(validPayload)).rejects.toThrow(/Demanda 'dem_1' não encontrada/);
  });

  it('deve bloquear cadastro se a demanda estiver SUSPENSA', async () => {
    const { ativoDadosRepo, demandRepo, auditRepo } = createMockRepos();
    vi.mocked(demandRepo.findById).mockResolvedValueOnce({
      ...mockDemand,
      estado: EstadoDemanda.SUSPENSA,
    });

    const useCase = new RegisterDataAssetUseCase(ativoDadosRepo, demandRepo, auditRepo);
    await expect(useCase.execute(validPayload)).rejects.toThrow(
      /Não é permitido cadastrar ativos de dados em demandas suspensas/
    );
  });

  it('deve bloquear cadastro se a demanda estiver CONCLUIDA', async () => {
    const { ativoDadosRepo, demandRepo, auditRepo } = createMockRepos();
    vi.mocked(demandRepo.findById).mockResolvedValueOnce({
      ...mockDemand,
      estado: EstadoDemanda.CONCLUIDA,
    });

    const useCase = new RegisterDataAssetUseCase(ativoDadosRepo, demandRepo, auditRepo);
    await expect(useCase.execute(validPayload)).rejects.toThrow(
      /Não é permitido cadastrar ativos de dados em demandas no estado terminal Concluída/
    );
  });

  it('deve bloquear cadastro se a demanda estiver CANCELADA', async () => {
    const { ativoDadosRepo, demandRepo, auditRepo } = createMockRepos();
    vi.mocked(demandRepo.findById).mockResolvedValueOnce({
      ...mockDemand,
      estado: EstadoDemanda.CANCELADA,
    });

    const useCase = new RegisterDataAssetUseCase(ativoDadosRepo, demandRepo, auditRepo);
    await expect(useCase.execute(validPayload)).rejects.toThrow(
      /Não é permitido cadastrar ativos de dados em demandas no estado terminal Cancelada/
    );
  });

  it('deve rejeitar arquivo já cadastrado na mesma demanda (duplicidade de caminho)', async () => {
    const { ativoDadosRepo, demandRepo, auditRepo } = createMockRepos();
    vi.mocked(ativoDadosRepo.findByPath).mockResolvedValueOnce({
      id: 'ast_existente',
      demanda_id: 'dem_1',
      nome_arquivo: 'clientes.csv',
      caminho_local: 'C:\\Projetos\\clientes.csv',
      formato: FormatoArquivo.CSV,
      origem: 'Antiga',
      descricao_conteudo: null,
      granularidade: null,
      periodo_inicio: null,
      periodo_fim: null,
      versao: '1.0',
      tamanho_bytes: 1024,
      total_linhas: 50,
      total_colunas: 4,
      hash_sha256: 'e'.repeat(64),
      status: StatusAtivoDados.ATIVO,
      schema_inferido: null,
      data_recebimento: '2026-09-20',
      criado_em: '2026-09-20',
      atualizado_em: '2026-09-20',
    });

    const useCase = new RegisterDataAssetUseCase(ativoDadosRepo, demandRepo, auditRepo);
    await expect(useCase.execute(validPayload)).rejects.toThrow(
      /já está cadastrado nesta demanda/
    );
  });
});
