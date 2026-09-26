import { describe, it, expect, vi } from 'vitest';
import { CheckAssetAccessibilityUseCase } from '@/core/use-cases/data-assets/check-asset-accessibility';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IFileSystemAdapter } from '@/core/domain/adapters/file-system-adapter.interface';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';

describe('CheckAssetAccessibilityUseCase (Unitário)', () => {
  it('deve retornar erro estruturado quando o ativo não existir no repositório', async () => {
    const mockRepo: IAtivoDadosRepository = {
      findById: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      findByDemandId: vi.fn(),
      findByPath: vi.fn(),
      update: vi.fn(),
      countByDemandId: vi.fn(),
    };

    const mockAdapter: IFileSystemAdapter = {
      verificarAcessibilidade: vi.fn(),
      inspecionarArquivo: vi.fn(),
    };

    const useCase = new CheckAssetAccessibilityUseCase(mockRepo, mockAdapter);
    const resultado = await useCase.execute('ast_inexistente');

    expect(resultado.existe).toBe(false);
    expect(resultado.erro).toContain("Ativo de dados 'ast_inexistente' não encontrado");
    expect(mockAdapter.verificarAcessibilidade).not.toHaveBeenCalled();
  });

  it('deve delegar a verificação de acessibilidade ao adaptador com o caminho do ativo', async () => {
    const mockRepo: IAtivoDadosRepository = {
      findById: vi.fn().mockResolvedValue({
        id: 'ast_1',
        demanda_id: 'dem_1',
        nome_arquivo: 'base.csv',
        caminho_local: 'C:\\Dados\\base.csv',
        formato: FormatoArquivo.CSV,
        origem: 'Origem',
        descricao_conteudo: null,
        granularidade: null,
        periodo_inicio: null,
        periodo_fim: null,
        versao: '1.0',
        tamanho_bytes: 100,
        total_linhas: 10,
        total_colunas: 2,
        hash_sha256: 'a'.repeat(64),
        status: StatusAtivoDados.ATIVO,
        schema_inferido: null,
        data_recebimento: '2026-09-26',
        criado_em: '2026-09-26',
        atualizado_em: '2026-09-26',
      }),
      create: vi.fn(),
      findByDemandId: vi.fn(),
      findByPath: vi.fn(),
      update: vi.fn(),
      countByDemandId: vi.fn(),
    };

    const mockAdapter: IFileSystemAdapter = {
      verificarAcessibilidade: vi.fn().mockResolvedValue({
        existe: true,
        legivel: true,
        eArquivoRegular: true,
        caminhoNormalizado: 'C:\\Dados\\base.csv',
      }),
      inspecionarArquivo: vi.fn(),
    };

    const useCase = new CheckAssetAccessibilityUseCase(mockRepo, mockAdapter);
    const resultado = await useCase.execute('ast_1');

    expect(resultado.existe).toBe(true);
    expect(mockAdapter.verificarAcessibilidade).toHaveBeenCalledWith('C:\\Dados\\base.csv');
  });
});
