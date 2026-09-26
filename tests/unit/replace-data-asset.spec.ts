import { describe, it, expect, vi } from 'vitest';
import { ReplaceDataAssetUseCase } from '@/core/use-cases/data-assets/replace-data-asset';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';

describe('ReplaceDataAssetUseCase (Unitário)', () => {
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

  const oldAsset: AtivoDados = {
    id: 'ast_old_1',
    demanda_id: 'dem_1',
    nome_arquivo: 'clientes_v1.csv',
    caminho_local: 'C:\\Dados\\clientes.csv',
    formato: FormatoArquivo.CSV,
    origem: 'CRM Vendas',
    descricao_conteudo: 'Base inicial de clientes',
    granularidade: 'Transacional',
    periodo_inicio: '2024-01-01',
    periodo_fim: '2024-06-30',
    versao: '1.0',
    tamanho_bytes: 1024,
    total_linhas: 100,
    total_colunas: 5,
    hash_sha256: 'a'.repeat(64),
    status: StatusAtivoDados.ATIVO,
    schema_inferido: JSON.stringify({ id: 'number', nome: 'string' }),
    data_recebimento: '2026-09-20',
    substitui_ativo_id: null,
    criado_em: '2026-09-20T10:00:00.000Z',
    atualizado_em: '2026-09-20T10:00:00.000Z',
  };

  const validReplaceInput = {
    demanda_id: 'dem_1',
    ativo_antigo_id: 'ast_old_1',
    caminho_local: 'C:\\Dados\\clientes_atualizado.csv',
    nome_arquivo: 'clientes_atualizado.csv',
    formato: FormatoArquivo.CSV,
    tamanho_bytes: 2048,
    total_linhas: 200,
    total_colunas: 5,
    hash_sha256: 'b'.repeat(64), // hash diferente
    schema_inferido: JSON.stringify({ id: 'number', nome: 'string' }),
    origem: 'CRM Vendas - Fechamento Q3',
    descricao_conteudo: 'Base atualizada até o terceiro trimestre',
    granularidade: 'Transacional',
    periodo_inicio: '2024-01-01',
    periodo_fim: '2024-09-30',
    data_recebimento: '2026-09-26',
    versao: '1.1',
    justificativa: 'Atualização do fechamento financeiro do terceiro trimestre',
  };

  const createMockRepos = () => {
    const ativoDadosRepo: IAtivoDadosRepository = {
      create: vi.fn(),
      findById: vi.fn().mockImplementation(async (id: string) => {
        if (id === 'ast_old_1') return { ...oldAsset };
        return null;
      }),
      findByDemandId: vi.fn(),
      findByPath: vi.fn().mockResolvedValue(null),
      findActiveByPath: vi.fn().mockResolvedValue(null),
      replace: vi.fn(async (params) => ({
        ativoSubstituido: { ...oldAsset, status: StatusAtivoDados.SUBSTITUIDO },
        novoAtivo: params.novoAtivo,
      })),
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
      record: vi.fn(),
      findByDemandaId: vi.fn(),
    };

    return { ativoDadosRepo, demandRepo, auditRepo };
  };

  it('deve substituir com sucesso o ativo anterior e produzir novo ativo com substitui_ativo_id', async () => {
    const { ativoDadosRepo, demandRepo, auditRepo } = createMockRepos();
    const useCase = new ReplaceDataAssetUseCase(ativoDadosRepo, demandRepo);

    const result = await useCase.execute(validReplaceInput);

    expect(result.ativoSubstituido.status).toBe(StatusAtivoDados.SUBSTITUIDO);
    expect(result.novoAtivo.status).toBe(StatusAtivoDados.ATIVO);
    expect(result.novoAtivo.substitui_ativo_id).toBe('ast_old_1');
    expect(result.novoAtivo.versao).toBe('1.1');
    expect(result.novoAtivo.id).toMatch(/^ast_/);

    expect(ativoDadosRepo.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        antigoId: 'ast_old_1',
        novoAtivo: expect.objectContaining({
          substitui_ativo_id: 'ast_old_1',
          status: StatusAtivoDados.ATIVO,
          versao: '1.1',
        }),
        eventoAuditoria: expect.objectContaining({
          demanda_id: 'dem_1',
          entidade: 'AtivoDados',
          tipo_evento: 'TRANSICAO_ESTADO',
          justificativa: 'Atualização do fechamento financeiro do terceiro trimestre',
        }),
      })
    );
  });

  it('deve rejeitar se a demanda não for encontrada', async () => {
    const { ativoDadosRepo, demandRepo, auditRepo } = createMockRepos();
    vi.mocked(demandRepo.findById).mockResolvedValue(null);

    const useCase = new ReplaceDataAssetUseCase(ativoDadosRepo, demandRepo);
    await expect(useCase.execute(validReplaceInput)).rejects.toThrow(
      "Não é possível substituir o ativo: Demanda 'dem_1' não encontrada."
    );
  });

  it('deve rejeitar se a demanda estiver em SUSPENSA', async () => {
    const { ativoDadosRepo, demandRepo, auditRepo } = createMockRepos();
    vi.mocked(demandRepo.findById).mockResolvedValue({
      ...mockDemand,
      estado: EstadoDemanda.SUSPENSA,
    });

    const useCase = new ReplaceDataAssetUseCase(ativoDadosRepo, demandRepo);
    await expect(useCase.execute(validReplaceInput)).rejects.toThrow(
      'Não é permitido substituir ativos de dados em demandas suspensas.'
    );
  });

  it('deve rejeitar se a demanda estiver em CONCLUIDA', async () => {
    const { ativoDadosRepo, demandRepo, auditRepo } = createMockRepos();
    vi.mocked(demandRepo.findById).mockResolvedValue({
      ...mockDemand,
      estado: EstadoDemanda.CONCLUIDA,
    });

    const useCase = new ReplaceDataAssetUseCase(ativoDadosRepo, demandRepo);
    await expect(useCase.execute(validReplaceInput)).rejects.toThrow(
      /Não é permitido substituir ativos de dados em demandas no estado terminal Concluída/
    );
  });

  it('deve rejeitar se a demanda estiver em CANCELADA', async () => {
    const { ativoDadosRepo, demandRepo, auditRepo } = createMockRepos();
    vi.mocked(demandRepo.findById).mockResolvedValue({
      ...mockDemand,
      estado: EstadoDemanda.CANCELADA,
    });

    const useCase = new ReplaceDataAssetUseCase(ativoDadosRepo, demandRepo);
    await expect(useCase.execute(validReplaceInput)).rejects.toThrow(
      /Não é permitido substituir ativos de dados em demandas no estado terminal Cancelada/
    );
  });

  it('deve rejeitar se o ativo antigo não existir', async () => {
    const { ativoDadosRepo, demandRepo, auditRepo } = createMockRepos();
    vi.mocked(ativoDadosRepo.findById).mockResolvedValue(null);

    const useCase = new ReplaceDataAssetUseCase(ativoDadosRepo, demandRepo);
    await expect(useCase.execute(validReplaceInput)).rejects.toThrow(
      "Não é possível substituir o ativo: Ativo 'ast_old_1' não encontrado."
    );
  });

  it('deve rejeitar se o ativo antigo pertencer a outra demanda', async () => {
    const { ativoDadosRepo, demandRepo, auditRepo } = createMockRepos();
    vi.mocked(ativoDadosRepo.findById).mockResolvedValue({
      ...oldAsset,
      demanda_id: 'dem_outra',
    });

    const useCase = new ReplaceDataAssetUseCase(ativoDadosRepo, demandRepo);
    await expect(useCase.execute(validReplaceInput)).rejects.toThrow(
      'O ativo a ser substituído não pertence à demanda especificada.'
    );
  });

  it('deve rejeitar se o ativo antigo não estiver ATIVO (ex: já SUBSTITUIDO)', async () => {
    const { ativoDadosRepo, demandRepo, auditRepo } = createMockRepos();
    vi.mocked(ativoDadosRepo.findById).mockResolvedValue({
      ...oldAsset,
      status: StatusAtivoDados.SUBSTITUIDO,
    });

    const useCase = new ReplaceDataAssetUseCase(ativoDadosRepo, demandRepo);
    await expect(useCase.execute(validReplaceInput)).rejects.toThrow(
      "O ativo 'clientes_v1.csv' não pode ser substituído pois não está no estado ATIVO (status atual: SUBSTITUIDO)."
    );
  });

  it('deve rejeitar com bloqueio mandatório se o SHA-256 for idêntico ao ativo anterior', async () => {
    const { ativoDadosRepo, demandRepo, auditRepo } = createMockRepos();
    const useCase = new ReplaceDataAssetUseCase(ativoDadosRepo, demandRepo);

    const identicalHashPayload = {
      ...validReplaceInput,
      hash_sha256: oldAsset.hash_sha256, // SHA-256 idêntico
    };

    await expect(useCase.execute(identicalHashPayload)).rejects.toThrow(
      'O arquivo inspecionado possui hash SHA-256 idêntico ao ativo atual. Não é permitido substituir um ativo por um arquivo de conteúdo físico idêntico.'
    );
  });

  it('deve rejeitar se a nova versão for idêntica à versão anterior', async () => {
    const { ativoDadosRepo, demandRepo, auditRepo } = createMockRepos();
    const useCase = new ReplaceDataAssetUseCase(ativoDadosRepo, demandRepo);

    const sameVersionPayload = {
      ...validReplaceInput,
      versao: oldAsset.versao || '1.0', // versão idêntica '1.0'
    };

    await expect(useCase.execute(sameVersionPayload)).rejects.toThrow(
      "A nova versão informada ('1.0') deve ser diferente da versão do ativo anterior ('1.0')."
    );
  });

  it('deve rejeitar se o caminho local já estiver em uso por outro ativo ATIVO diferente', async () => {
    const { ativoDadosRepo, demandRepo, auditRepo } = createMockRepos();
    vi.mocked(ativoDadosRepo.findActiveByPath).mockResolvedValue({
      ...oldAsset,
      id: 'ast_outro_ativo',
      caminho_local: 'C:\\Dados\\clientes_atualizado.csv',
    });

    const useCase = new ReplaceDataAssetUseCase(ativoDadosRepo, demandRepo);
    await expect(useCase.execute(validReplaceInput)).rejects.toThrow(
      "Já existe outro ativo ATIVO cadastrado com o caminho 'C:\\Dados\\clientes_atualizado.csv' nesta demanda."
    );
  });

  it('deve permitir o mesmo caminho local se o ativo que ocupa o caminho for o próprio ativo a ser substituído', async () => {
    const { ativoDadosRepo, demandRepo, auditRepo } = createMockRepos();
    // Ativo a ser substituído está no caminho C:\Dados\clientes.csv
    // Novo arquivo sobrescreveu C:\Dados\clientes.csv no disco físico (com hash diferente)
    vi.mocked(ativoDadosRepo.findActiveByPath).mockResolvedValue({
      ...oldAsset, // id é ast_old_1
      caminho_local: 'C:\\Dados\\clientes.csv',
    });

    const samePathPayload = {
      ...validReplaceInput,
      caminho_local: 'C:\\Dados\\clientes.csv',
      hash_sha256: 'c'.repeat(64), // hash diferente
    };

    const useCase = new ReplaceDataAssetUseCase(ativoDadosRepo, demandRepo);
    const result = await useCase.execute(samePathPayload);

    expect(result.novoAtivo.caminho_local).toBe('C:\\Dados\\clientes.csv');
    expect(result.ativoSubstituido.status).toBe(StatusAtivoDados.SUBSTITUIDO);
  });
});
