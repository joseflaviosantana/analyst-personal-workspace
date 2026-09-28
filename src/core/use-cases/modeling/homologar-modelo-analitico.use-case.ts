import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { IDatasetAutorizadoRepository } from '@/core/domain/repositories/dataset-autorizado-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { VerificarProntidaoModeloUseCase } from './verificar-prontidao-modelo.use-case';
import { ModeloAnalitico } from '@/core/domain/entities/modelo-analitico';
import {
  homologarModeloSchema,
  HomologarModeloInput,
} from '@/lib/validations/modeling-schema';

export class HomologarModeloAnaliticoUseCase {
  private verificarProntidaoUseCase: VerificarProntidaoModeloUseCase;

  constructor(
    private modeloRepo: IModeloAnaliticoRepository,
    private datasetRepo: IDatasetAutorizadoRepository,
    private auditRepo?: IAuditRepository
  ) {
    this.verificarProntidaoUseCase = new VerificarProntidaoModeloUseCase(
      this.modeloRepo,
      this.datasetRepo
    );
  }

  async execute(rawInput: HomologarModeloInput): Promise<ModeloAnalitico> {
    const input = homologarModeloSchema.parse(rawInput);

    const modelo = await this.modeloRepo.findById(input.modeloId);
    if (!modelo) {
      throw new Error(`Modelo analítico com ID '${input.modeloId}' não encontrado.`);
    }

    // 1. Avaliar Prontidão e Conformidade Determinística
    const prontidao = await this.verificarProntidaoUseCase.execute({ modeloId: input.modeloId });

    // 2. BLOQUEIO: Qualquer diagnóstico de bloqueio impede formalmente a homologação
    if (!prontidao.prontoParaHomologacao || prontidao.motivosBloqueio.length > 0) {
      const motivos = prontidao.motivosBloqueio.join('; ');
      throw new Error(
        `Não é possível homologar o modelo analítico '${modelo.nome}' pois existem bloqueios impeditivos de conformidade: ${motivos}.`
      );
    }

    // 3. ALERTA_CRITICO: Exige justificativa humana explícita e auditável
    if (prontidao.alertasCriticosQueExigemJustificativa.length > 0) {
      const justAlertas = input.justificativaAlertas?.trim() ?? '';
      if (justAlertas.length < 15) {
        throw new Error(
          `Existem alertas críticos de modelagem que exigem justificativa técnica formal com no mínimo 15 caracteres. Alertas: ${prontidao.alertasCriticosQueExigemJustificativa.join('; ')}.`
        );
      }
    }

    // 4. Montar justificativa consolidada com auditoria dos alertas reconhecidos
    let justificativaConsolidada = input.justificativa.trim();
    if (input.justificativaAlertas?.trim()) {
      justificativaConsolidada += `\n\n[Reconhecimento de Alertas Críticos]: ${input.justificativaAlertas.trim()}`;
    }

    const now = new Date().toISOString();
    const homologadoPor = input.homologadoPor ?? 'HUMANO';

    // 5. Homologação Atômica Transacional (revoga homologação anterior e homologa o atual)
    const modeloHomologado = await this.modeloRepo.homologarTransacional(
      modelo.id,
      homologadoPor,
      justificativaConsolidada,
      now
    );

    // 6. Registro de Auditoria Formal
    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: modelo.demanda_id,
        entidade: 'ModeloAnalitico',
        entidade_id: modelo.id,
        tipo_evento: 'DECISAO_HUMANA',
        autor_tipo: 'HUMANO',
        dados_anteriores: JSON.stringify({
          status: modelo.status,
          homologado_em: modelo.homologado_em,
        }),
        dados_novos: JSON.stringify({
          status: modeloHomologado.status,
          homologado_em: modeloHomologado.homologado_em,
          homologado_por: modeloHomologado.homologado_por,
          dataset_autorizado_id: modeloHomologado.dataset_autorizado_id,
          total_alertas_reconhecidos: prontidao.alertasCriticosQueExigemJustificativa.length,
          total_recomendacoes: prontidao.recomendacoes.length,
        }),
        justificativa: justificativaConsolidada,
        timestamp: now,
      });
    }

    return modeloHomologado;
  }
}
