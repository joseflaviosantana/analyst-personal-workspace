/**
 * src/core/use-cases/dashboard/criar-medida-dax.use-case.ts
 *
 * Caso de Uso: Criação e Mapeamento de Medida DAX (Subgate 3.4C)
 *
 * Responsabilidade:
 * - Validar os dados da medida via Zod (criarMedidaDaxSchema);
 * - Garantir a existência do Modelo Power BI hospedeiro;
 * - Prevenir duplicidade nominal no nível do modelo (exigência do modelo tabular VertiPaq);
 * - Validar a existência e pertinência da Métrica Analítica quando vinculada;
 * - Atribuir identificador auditável e timestamps ISO;
 * - Persistir no repositório SQLite Local-First.
 */

import { IMedidaDaxRepository } from '@/core/domain/repositories/medida-dax-repository.interface';
import { IModeloPowerBiRepository } from '@/core/domain/repositories/modelo-powerbi-repository.interface';
import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { MedidaDax } from '@/core/domain/entities/medida-dax';
import { CategoriaMedidaDax } from '@/core/domain/enums/categoria-medida-dax';
import {
  criarMedidaDaxSchema,
  CriarMedidaDaxInput,
} from '@/lib/validations/dashboard-schema';

export interface CriarMedidaDaxOutput {
  medida: MedidaDax;
}

export class CriarMedidaDaxUseCase {
  constructor(
    private medidaDaxRepo: IMedidaDaxRepository,
    private modeloPowerBiRepo: IModeloPowerBiRepository,
    private modeloAnaliticoRepo?: IModeloAnaliticoRepository
  ) {}

  async execute(input: CriarMedidaDaxInput): Promise<CriarMedidaDaxOutput> {
    // 1. Validação estrita via Zod
    const validated = criarMedidaDaxSchema.parse(input);

    // 2. Verificar existência do Modelo Power BI
    const modeloPowerBi = await this.modeloPowerBiRepo.findById(validated.modeloPowerBiId);
    if (!modeloPowerBi) {
      throw new Error(
        `Modelo Power BI com ID "${validated.modeloPowerBiId}" não encontrado.`
      );
    }

    // 3. Verificar duplicidade de nome dentro do mesmo modelo
    const medidasExistentes = await this.medidaDaxRepo.findByModeloPowerBiId(
      validated.modeloPowerBiId
    );
    const nomeNormalizado = validated.nome.trim().toLowerCase();
    const jaExiste = medidasExistentes.some(
      (m) => m.nome.trim().toLowerCase() === nomeNormalizado
    );
    if (jaExiste) {
      throw new Error(
        `Já existe uma medida com o nome "${validated.nome.trim()}" no modelo Power BI. O modelo tabular exige nomes únicos para todas as medidas.`
      );
    }

    // 4. Se metricaAnaliticaId for fornecido, validar a métrica
    let metricaAnaliticaIdFinal: string | null = validated.metricaAnaliticaId ?? null;
    if (metricaAnaliticaIdFinal && this.modeloAnaliticoRepo) {
      // Se o modelo Power BI possui vínculo com modelo analítico, valida contra ele
      if (modeloPowerBi.modelo_analitico_id) {
        const modeloAnalitico = await this.modeloAnaliticoRepo.findCompletoById(
          modeloPowerBi.modelo_analitico_id
        );
        if (modeloAnalitico) {
          const metricaExiste = (modeloAnalitico.metricas ?? []).some(
            (m) => m.id === metricaAnaliticaIdFinal
          );
          if (!metricaExiste) {
            throw new Error(
              `A métrica analítica com ID "${metricaAnaliticaIdFinal}" não pertence ao modelo analítico vinculado.`
            );
          }
        }
      }
    }

    // 5. Montar a entidade MedidaDax
    const agora = new Date().toISOString();
    const id = validated.id || `dax_${crypto.randomUUID()}`;

    const medida: MedidaDax = {
      id,
      modelo_powerbi_id: validated.modeloPowerBiId,
      metrica_analitica_id: metricaAnaliticaIdFinal,
      nome: validated.nome.trim(),
      tabela_hospedeira: validated.tabelaHospedeira.trim() || '_Medidas',
      expressao_dax: validated.expressaoDax.trim(),
      descricao: validated.descricao?.trim() || null,
      formato_string: validated.formatoString?.trim() || null,
      categoria_dax: validated.categoriaDax ?? CategoriaMedidaDax.AGREGACAO_SIMPLES,
      ordem: validated.ordem ?? medidasExistentes.length + 1,
      criado_em: agora,
      atualizado_em: agora,
    };

    // 6. Persistir no repositório
    const criada = await this.medidaDaxRepo.create(medida);

    return { medida: criada };
  }
}
