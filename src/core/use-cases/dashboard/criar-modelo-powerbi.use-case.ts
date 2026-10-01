/**
 * src/core/use-cases/dashboard/criar-modelo-powerbi.use-case.ts
 *
 * Caso de Uso: Criação e Vinculação de Modelo Power BI (Subgate 3.4B)
 *
 * Responsabilidade:
 * - Validar os dados de entrada via schema Zod (criarModeloPowerBiSchema);
 * - Assegurar a existência da demanda autorizada via IDemandRepository;
 * - Associar o modelo analítico homologado/vigente quando existente na demanda;
 * - Suportar formatos .pbix, .pbip e formalização de ISENTO_EXCEL_ONLY;
 * - Garantir preenchimento estrito da justificativa (>= 15 caracteres) para isenções;
 * - Persistir o modelo no SQLite de forma auditável e determinística;
 * - Custo zero: 100% local-first, sem chamadas externas ou LLMs.
 */

import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IModeloPowerBiRepository } from '@/core/domain/repositories/modelo-powerbi-repository.interface';
import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { ModeloPowerBi } from '@/core/domain/entities/modelo-powerbi';
import { TipoFormatoModeloPowerBi } from '@/core/domain/enums/tipo-formato-modelo-powerbi';
import { StatusModeloPowerBi } from '@/core/domain/enums/status-modelo-powerbi';
import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';
import {
  criarModeloPowerBiSchema,
  CriarModeloPowerBiInput,
} from '@/lib/validations/dashboard-schema';

export interface CriarModeloPowerBiOutput {
  modelo: ModeloPowerBi;
}

export class CriarModeloPowerBiUseCase {
  constructor(
    private demandRepo: IDemandRepository,
    private modeloPowerBiRepo: IModeloPowerBiRepository,
    private modeloAnaliticoRepo?: IModeloAnaliticoRepository
  ) {}

  async execute(input: CriarModeloPowerBiInput): Promise<CriarModeloPowerBiOutput> {
    // 1. Validação estrita via Zod
    const validated = criarModeloPowerBiSchema.parse(input);

    // 2. Verificar existência da Demanda
    const demanda = await this.demandRepo.findById(validated.demandaId);
    if (!demanda) {
      throw new Error(`Demanda com ID "${validated.demandaId}" não encontrada.`);
    }

    // 3. Resolver vínculo do Modelo Analítico
    let modeloAnaliticoIdFinal: string | null = validated.modeloAnaliticoId ?? null;

    if (modeloAnaliticoIdFinal && this.modeloAnaliticoRepo) {
      const modeloAnalitico = await this.modeloAnaliticoRepo.findById(modeloAnaliticoIdFinal);
      if (!modeloAnalitico) {
        throw new Error(
          `Modelo analítico com ID "${modeloAnaliticoIdFinal}" não encontrado.`
        );
      }
      if (modeloAnalitico.demanda_id !== validated.demandaId) {
        throw new Error(
          `O modelo analítico "${modeloAnaliticoIdFinal}" pertence a outra demanda e não pode ser vinculado.`
        );
      }
    } else if (!modeloAnaliticoIdFinal && this.modeloAnaliticoRepo) {
      // Tenta localizar automaticamente o modelo analítico homologado da demanda
      const modelosDemanda = await this.modeloAnaliticoRepo.findByDemandaId(validated.demandaId);
      const homologado = modelosDemanda.find(
        (m) => m.status === StatusModeloAnalitico.HOMOLOGADO
      );
      if (homologado) {
        modeloAnaliticoIdFinal = homologado.id;
      }
    }

    // 4. Montar a entidade de domínio
    const agora = new Date().toISOString();
    const id = validated.id || `pbi_${crypto.randomUUID()}`;

    const isIsento = validated.tipoFormato === TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY;

    const modelo: ModeloPowerBi = {
      id,
      demanda_id: validated.demandaId,
      modelo_analitico_id: modeloAnaliticoIdFinal,
      nome_arquivo: validated.nomeArquivo.trim(),
      caminho_local: validated.caminhoLocal ? validated.caminhoLocal.trim() : null,
      tipo_formato: validated.tipoFormato,
      status: validated.status ?? StatusModeloPowerBi.EM_DESENVOLVIMENTO,
      justificativa_isencao: isIsento ? (validated.justificativaIsencao?.trim() ?? null) : null,
      hash_sha256: validated.hashSha256 ? validated.hashSha256.trim() : null,
      versao_powerbi: validated.versaoPowerBi ? validated.versaoPowerBi.trim() : null,
      tamanho_bytes: validated.tamanhoBytes ?? 0,
      criado_em: agora,
      atualizado_em: agora,
    };

    // 5. Persistir no repositório
    const criado = await this.modeloPowerBiRepo.create(modelo);

    return { modelo: criado };
  }
}
