import { IFileSystemAdapter, ResultadoInspecaoArquivo } from '@/core/domain/adapters/file-system-adapter.interface';
import { normalizarCaminhoLocal } from '@/lib/validations/data-asset-schema';

export interface InspectLocalFileInputDto {
  caminhoLocal: string;
  abaAlvoXlsx?: string | null;
}

/**
 * Caso de Uso: Inspecionar Arquivo Local (Unidade 3.3A — FSD CF-06 / RF-013 a RF-017)
 * Realiza a leitura e extração física/estrutural do arquivo local sem persistência.
 * Opera sob o princípio Local-First em modo estritamente read-only.
 */
export class InspectLocalFileUseCase {
  constructor(private fileSystemAdapter: IFileSystemAdapter) {}

  async execute(input: InspectLocalFileInputDto): Promise<ResultadoInspecaoArquivo> {
    const caminhoNormalizado = normalizarCaminhoLocal(input.caminhoLocal);

    if (!caminhoNormalizado) {
      return {
        sucesso: false,
        avisos: [],
        erros: ['O caminho do arquivo local não pode ser vazio.'],
      };
    }

    return this.fileSystemAdapter.inspecionarArquivo(caminhoNormalizado, {
      abaAlvoXlsx: input.abaAlvoXlsx || undefined,
    });
  }
}
