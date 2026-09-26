import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { EstadoDemanda, isEstadoTerminal, ROTULOS_ESTADO_DEMANDA } from '@/core/domain/enums/estado-demanda';
import { generateId } from '@/lib/id-generator';
import { RegisterDataAssetInput, registerDataAssetSchema } from '@/lib/validations/data-asset-schema';

/**
 * Caso de Uso: Cadastrar Ativo de Dados (Unidade 3.3A — FSD CF-06 / RF-013 a RF-017)
 * Registra o inventário canônico de um arquivo local inspecionado para a demanda.
 * Valida governança da demanda, unicidade e registra evento de auditoria.
 */
export class RegisterDataAssetUseCase {
  constructor(
    private ativoDadosRepo: IAtivoDadosRepository,
    private demandRepo: IDemandRepository,
    private auditRepo?: IAuditRepository
  ) {}

  async execute(input: RegisterDataAssetInput): Promise<AtivoDados> {
    const validated = registerDataAssetSchema.parse(input);

    // 1. Integridade Referencial: A demanda deve existir
    const demand = await this.demandRepo.findById(validated.demanda_id);
    if (!demand) {
      throw new Error(`Não é possível cadastrar o ativo: Demanda '${validated.demanda_id}' não encontrada.`);
    }

    // 2. Governança de Workflow: Bloqueio estrito para demandas suspensas ou terminais
    if (demand.estado === EstadoDemanda.SUSPENSA) {
      throw new Error('Não é permitido cadastrar ativos de dados em demandas suspensas.');
    }

    if (isEstadoTerminal(demand.estado)) {
      const rotulo = ROTULOS_ESTADO_DEMANDA[demand.estado as EstadoDemanda] || demand.estado;
      throw new Error(`Não é permitido cadastrar ativos de dados em demandas no estado terminal ${rotulo}.`);
    }

    // 3. Unicidade de caminho por demanda
    const existingSamePath = await this.ativoDadosRepo.findByPath(validated.caminho_local);
    if (existingSamePath && existingSamePath.demanda_id === validated.demanda_id) {
      throw new Error(`O arquivo '${validated.nome_arquivo}' (${validated.caminho_local}) já está cadastrado nesta demanda.`);
    }

    const now = new Date().toISOString();

    const novoAtivo: AtivoDados = {
      id: generateId('ast'),
      demanda_id: validated.demanda_id,
      nome_arquivo: validated.nome_arquivo,
      caminho_local: validated.caminho_local,
      formato: validated.formato,
      origem: validated.origem,
      descricao_conteudo: validated.descricao_conteudo ?? null,
      granularidade: validated.granularidade ?? null,
      periodo_inicio: validated.periodo_inicio ?? null,
      periodo_fim: validated.periodo_fim ?? null,
      versao: validated.versao ?? '1.0',
      tamanho_bytes: validated.tamanho_bytes,
      total_linhas: validated.total_linhas,
      total_colunas: validated.total_colunas,
      hash_sha256: validated.hash_sha256,
      status: StatusAtivoDados.ATIVO,
      schema_inferido: validated.schema_inferido ?? null,
      data_recebimento: validated.data_recebimento,
      criado_em: now,
      atualizado_em: now,
    };

    const created = await this.ativoDadosRepo.create(novoAtivo);

    // 4. Registro na Trilha de Auditoria (Opção 1 aprovada humanamente)
    if (this.auditRepo) {
      await this.auditRepo.record({
        demanda_id: created.demanda_id,
        entidade: 'AtivoDados',
        entidade_id: created.id,
        tipo_evento: 'CRIACAO',
        autor_tipo: 'HUMANO',
        dados_anteriores: null,
        dados_novos: JSON.stringify({
          nome_arquivo: created.nome_arquivo,
          formato: created.formato,
          total_linhas: created.total_linhas,
          total_colunas: created.total_colunas,
          hash_sha256: created.hash_sha256,
          origem: created.origem,
          versao: created.versao,
        }),
        justificativa: 'Catalogação de ativo de dados local no inventário da demanda.',
        timestamp: now,
      });
    }

    return created;
  }
}
