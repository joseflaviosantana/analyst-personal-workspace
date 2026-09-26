import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IFileSystemAdapter, ResultadoAcessibilidade } from '@/core/domain/adapters/file-system-adapter.interface';

/**
 * Caso de Uso: Checar Acessibilidade Física do Ativo no Disco (RF-017)
 * Verifica se o arquivo referenciado continua legível e presente no caminho original.
 */
export class CheckAssetAccessibilityUseCase {
  constructor(
    private ativoDadosRepo: IAtivoDadosRepository,
    private fileSystemAdapter: IFileSystemAdapter
  ) {}

  async execute(assetId: string): Promise<ResultadoAcessibilidade> {
    const asset = await this.ativoDadosRepo.findById(assetId);
    if (!asset) {
      return {
        existe: false,
        legivel: false,
        eArquivoRegular: false,
        erro: `Ativo de dados '${assetId}' não encontrado no inventário.`,
      };
    }

    return this.fileSystemAdapter.verificarAcessibilidade(asset.caminho_local);
  }
}
