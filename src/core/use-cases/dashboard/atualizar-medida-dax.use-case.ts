/**
 * src/core/use-cases/dashboard/atualizar-medida-dax.use-case.ts
 *
 * Caso de Uso: Atualização de Medida DAX (Subgate 3.4C)
 *
 * Responsabilidade:
 * - Validar os dados de atualização via Zod (atualizarMedidaDaxSchema);
 * - Verificar a existência prévia da medida no repositório;
 * - Prevenir conflito de nomes com outras medidas do mesmo modelo Power BI;
 * - Atualizar data de modificação e persistir auditabilidade no SQLite Local-First.
 */

import { IMedidaDaxRepository } from '@/core/domain/repositories/medida-dax-repository.interface';
import { MedidaDax } from '@/core/domain/entities/medida-dax';
import {
  atualizarMedidaDaxSchema,
  AtualizarMedidaDaxInput,
} from '@/lib/validations/dashboard-schema';

export interface AtualizarMedidaDaxOutput {
  medida: MedidaDax;
}

export class AtualizarMedidaDaxUseCase {
  constructor(private medidaDaxRepo: IMedidaDaxRepository) {}

  async execute(input: AtualizarMedidaDaxInput): Promise<AtualizarMedidaDaxOutput> {
    // 1. Validação estrita via Zod
    const validated = atualizarMedidaDaxSchema.parse(input);

    // 2. Verificar existência da medida
    const existente = await this.medidaDaxRepo.findById(validated.id);
    if (!existente) {
      throw new Error(`Medida DAX com ID "${validated.id}" não encontrada.`);
    }

    // 3. Se houver alteração de nome, validar duplicidade no mesmo modelo
    if (validated.nome && validated.nome.trim().toLowerCase() !== existente.nome.toLowerCase()) {
      const outrasMedidas = await this.medidaDaxRepo.findByModeloPowerBiId(
        existente.modelo_powerbi_id
      );
      const novoNomeNorm = validated.nome.trim().toLowerCase();
      const conflito = outrasMedidas.some(
        (m) => m.id !== existente.id && m.nome.trim().toLowerCase() === novoNomeNorm
      );
      if (conflito) {
        throw new Error(
          `Já existe outra medida com o nome "${validated.nome.trim()}" neste modelo Power BI.`
        );
      }
    }

    // 4. Montar a entidade atualizada
    const agora = new Date().toISOString();

    const medidaAtualizada: MedidaDax = {
      ...existente,
      metrica_analitica_id:
        validated.metricaAnaliticaId !== undefined
          ? (validated.metricaAnaliticaId || null)
          : existente.metrica_analitica_id,
      nome: validated.nome !== undefined ? validated.nome.trim() : existente.nome,
      tabela_hospedeira:
        validated.tabelaHospedeira !== undefined
          ? validated.tabelaHospedeira.trim() || '_Medidas'
          : existente.tabela_hospedeira,
      expressao_dax:
        validated.expressaoDax !== undefined
          ? validated.expressaoDax.trim()
          : existente.expressao_dax,
      descricao:
        validated.descricao !== undefined
          ? (validated.descricao?.trim() || null)
          : existente.descricao,
      formato_string:
        validated.formatoString !== undefined
          ? (validated.formatoString?.trim() || null)
          : existente.formato_string,
      categoria_dax: validated.categoriaDax ?? existente.categoria_dax,
      ordem: validated.ordem !== undefined ? validated.ordem : existente.ordem,
      atualizado_em: agora,
    };

    // 5. Persistir no repositório
    const salva = await this.medidaDaxRepo.update(medidaAtualizada);

    return { medida: salva };
  }
}
