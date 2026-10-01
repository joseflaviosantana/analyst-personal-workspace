/**
 * src/core/use-cases/dashboard/atualizar-modelo-powerbi.use-case.ts
 *
 * Caso de Uso: Atualização de Metadados e Status do Modelo Power BI (Subgate 3.4B)
 *
 * Responsabilidade:
 * - Validar os dados de atualização via schema Zod (atualizarModeloPowerBiSchema);
 * - Verificar a existência do modelo existente no repositório;
 * - Suportar transição de status (EM_DESENVOLVIMENTO -> CONCLUIDO -> HOMOLOGADO);
 * - Suportar atualização de formato, caminho, versão e justificativa de isenção;
 * - Garantir preenchimento estrito da justificativa (>= 15 caracteres) caso ISENTO_EXCEL_ONLY;
 * - Atualizar data de modificação e persistir auditabilidade no SQLite local;
 * - Custo zero: 100% determinístico e local.
 */

import { IModeloPowerBiRepository } from '@/core/domain/repositories/modelo-powerbi-repository.interface';
import { ModeloPowerBi } from '@/core/domain/entities/modelo-powerbi';
import { TipoFormatoModeloPowerBi } from '@/core/domain/enums/tipo-formato-modelo-powerbi';
import {
  atualizarModeloPowerBiSchema,
  AtualizarModeloPowerBiInput,
} from '@/lib/validations/dashboard-schema';

export interface AtualizarModeloPowerBiOutput {
  modelo: ModeloPowerBi;
}

export class AtualizarModeloPowerBiUseCase {
  constructor(private modeloPowerBiRepo: IModeloPowerBiRepository) {}

  async execute(input: AtualizarModeloPowerBiInput): Promise<AtualizarModeloPowerBiOutput> {
    // 1. Validação estrita via Zod
    const validated = atualizarModeloPowerBiSchema.parse(input);

    // 2. Localizar modelo existente
    const existente = await this.modeloPowerBiRepo.findById(validated.id);
    if (!existente) {
      throw new Error(`Modelo Power BI com ID "${validated.id}" não encontrado.`);
    }

    // 3. Resolver formato e justificativa
    const tipoFormatoFinal = validated.tipoFormato ?? existente.tipo_formato;
    let justificativaFinal =
      validated.justificativaIsencao !== undefined
        ? validated.justificativaIsencao
        : existente.justificativa_isencao;

    if (tipoFormatoFinal === TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY) {
      if (!justificativaFinal || justificativaFinal.trim().length < 15) {
        throw new Error(
          'A declaração de isenção de Power BI exige justificativa formal com no mínimo 15 caracteres.'
        );
      }
      justificativaFinal = justificativaFinal.trim();
    } else {
      // Se não for isento, limpa justificativa
      justificativaFinal = null;
    }

    // 4. Montar modelo atualizado
    const agora = new Date().toISOString();

    const modeloAtualizado: ModeloPowerBi = {
      ...existente,
      nome_arquivo:
        validated.nomeArquivo !== undefined
          ? validated.nomeArquivo.trim()
          : existente.nome_arquivo,
      caminho_local:
        validated.caminhoLocal !== undefined
          ? (validated.caminhoLocal ? validated.caminhoLocal.trim() : null)
          : existente.caminho_local,
      tipo_formato: tipoFormatoFinal,
      status: validated.status ?? existente.status,
      justificativa_isencao: justificativaFinal,
      hash_sha256:
        validated.hashSha256 !== undefined
          ? (validated.hashSha256 ? validated.hashSha256.trim() : null)
          : existente.hash_sha256,
      versao_powerbi:
        validated.versaoPowerBi !== undefined
          ? (validated.versaoPowerBi ? validated.versaoPowerBi.trim() : null)
          : existente.versao_powerbi,
      tamanho_bytes:
        validated.tamanhoBytes !== undefined
          ? validated.tamanhoBytes
          : existente.tamanho_bytes,
      atualizado_em: agora,
    };

    // 5. Persistir no repositório
    const salvo = await this.modeloPowerBiRepo.update(modeloAtualizado);

    return { modelo: salvo };
  }
}
