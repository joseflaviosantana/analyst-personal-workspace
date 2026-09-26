import { describe, it, expect, vi } from 'vitest';
import { InspectLocalFileUseCase } from '@/core/use-cases/data-assets/inspect-local-file';
import { IFileSystemAdapter, ResultadoInspecaoArquivo } from '@/core/domain/adapters/file-system-adapter.interface';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';

describe('InspectLocalFileUseCase (Unitário)', () => {
  const mockAdapter: IFileSystemAdapter = {
    verificarAcessibilidade: vi.fn(),
    inspecionarArquivo: vi.fn(),
  };

  it('deve retornar erro estruturado quando o caminho for vazio ou somente espaços', async () => {
    const useCase = new InspectLocalFileUseCase(mockAdapter);
    const resultado = await useCase.execute({ caminhoLocal: '   ' });

    expect(resultado.sucesso).toBe(false);
    expect(resultado.erros).toContain('O caminho do arquivo local não pode ser vazio.');
    expect(mockAdapter.inspecionarArquivo).not.toHaveBeenCalled();
  });

  it('deve normalizar aspas no caminho e delegar a inspeção ao FileSystemAdapter', async () => {
    const mockResultado: ResultadoInspecaoArquivo = {
      sucesso: true,
      avisos: [],
      erros: [],
      fisico: {
        caminhoNormalizado: 'C:\\Dados\\vendas.xlsx',
        nomeArquivo: 'vendas.xlsx',
        extensao: '.xlsx',
        formato: FormatoArquivo.XLSX,
        tamanhoBytes: 5000,
        hashSha256: 'f'.repeat(64),
      },
      conteudo: {
        conteudoInspecionado: true,
        totalLinhas: 100,
        totalColunas: 5,
        worksheetAtiva: 'Aba1',
      },
    };

    vi.mocked(mockAdapter.inspecionarArquivo).mockResolvedValueOnce(mockResultado);

    const useCase = new InspectLocalFileUseCase(mockAdapter);
    const resultado = await useCase.execute({
      caminhoLocal: '"C:\\Dados\\vendas.xlsx"',
      abaAlvoXlsx: 'Aba1',
    });

    expect(resultado.sucesso).toBe(true);
    expect(mockAdapter.inspecionarArquivo).toHaveBeenCalledWith('C:\\Dados\\vendas.xlsx', {
      abaAlvoXlsx: 'Aba1',
    });
    expect(resultado.fisico?.nomeArquivo).toBe('vendas.xlsx');
  });
});
