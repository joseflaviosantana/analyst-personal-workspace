import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { TrilhaAuditoria } from '@/core/domain/entities/trilha-auditoria';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { EstadoDemanda, isEstadoTerminal, ROTULOS_ESTADO_DEMANDA } from '@/core/domain/enums/estado-demanda';
import { generateId } from '@/lib/id-generator';
import { ReplaceDataAssetInput, replaceDataAssetSchema } from '@/lib/validations/data-asset-schema';

/**
 * Caso de Uso: Substituir Ativo de Dados (Unidade 3.3B — FSD CF-06 / RF-013 a RF-017)
 * Conduz a substituição e versionamento atômico (all-or-nothing):
 * 1. Atualiza o ativo anterior para SUBSTITUIDO (garantindo id e status ATIVO);
 * 2. Cria o novo ativo como ATIVO com substitui_ativo_id apontando para o anterior;
 * 3. Registra a substituição e a justificativa humana na Trilha de Auditoria;
 * 4. Aplica trava estrita para hash SHA-256 idêntico e governança de estados da demanda.
 */
export class ReplaceDataAssetUseCase {
  constructor(
    private ativoDadosRepo: IAtivoDadosRepository,
    private demandRepo: IDemandRepository
  ) {}

  async execute(input: ReplaceDataAssetInput): Promise<{ ativoSubstituido: AtivoDados; novoAtivo: AtivoDados }> {
    const validated = replaceDataAssetSchema.parse(input);

    // 1. Integridade Referencial: A demanda deve existir
    const demand = await this.demandRepo.findById(validated.demanda_id);
    if (!demand) {
      throw new Error(`Não é possível substituir o ativo: Demanda '${validated.demanda_id}' não encontrada.`);
    }

    // 2. Governança de Workflow: Bloqueio estrito para demandas suspensas ou terminais
    if (demand.estado === EstadoDemanda.SUSPENSA) {
      throw new Error('Não é permitido substituir ativos de dados em demandas suspensas.');
    }

    if (isEstadoTerminal(demand.estado)) {
      const rotulo = ROTULOS_ESTADO_DEMANDA[demand.estado as EstadoDemanda] || demand.estado;
      throw new Error(`Não é permitido substituir ativos de dados em demandas no estado terminal ${rotulo}.`);
    }

    // 3. Validação do Ativo Anterior
    const oldAsset = await this.ativoDadosRepo.findById(validated.ativo_antigo_id);
    if (!oldAsset) {
      throw new Error(`Não é possível substituir o ativo: Ativo '${validated.ativo_antigo_id}' não encontrado.`);
    }

    if (oldAsset.demanda_id !== validated.demanda_id) {
      throw new Error('O ativo a ser substituído não pertence à demanda especificada.');
    }

    if (oldAsset.status !== StatusAtivoDados.ATIVO) {
      throw new Error(
        `O ativo '${oldAsset.nome_arquivo}' não pode ser substituído pois não está no estado ATIVO (status atual: ${oldAsset.status}).`
      );
    }

    // 4. Política de Hash (Regra 2 da Deliberação Humana): Bloqueio para SHA-256 idêntico
    if (validated.hash_sha256 === oldAsset.hash_sha256) {
      throw new Error(
        'O arquivo inspecionado possui hash SHA-256 idêntico ao ativo atual. Não é permitido substituir um ativo por um arquivo de conteúdo físico idêntico.'
      );
    }

    // 5. Política de Versão (Regra 4 da Deliberação Humana): Versão nova deve ser diferente da anterior
    if (validated.versao.trim() === (oldAsset.versao?.trim() || '')) {
      throw new Error(
        `A nova versão informada ('${validated.versao}') deve ser diferente da versão do ativo anterior ('${oldAsset.versao || '1.0'}').`
      );
    }

    // 6. Checagem de colisão com outros ativos ATIVOS na mesma demanda
    const activeSamePath = await this.ativoDadosRepo.findActiveByPath(validated.demanda_id, validated.caminho_local);
    if (activeSamePath && activeSamePath.id !== oldAsset.id) {
      throw new Error(
        `Já existe outro ativo ATIVO cadastrado com o caminho '${validated.caminho_local}' nesta demanda.`
      );
    }

    const now = new Date().toISOString();
    const novoAtivoId = generateId('ast');

    const novoAtivo: AtivoDados = {
      id: novoAtivoId,
      demanda_id: validated.demanda_id,
      nome_arquivo: validated.nome_arquivo,
      caminho_local: validated.caminho_local,
      formato: validated.formato,
      origem: validated.origem,
      descricao_conteudo: validated.descricao_conteudo ?? null,
      granularidade: validated.granularidade ?? null,
      periodo_inicio: validated.periodo_inicio ?? null,
      periodo_fim: validated.periodo_fim ?? null,
      versao: validated.versao,
      substitui_ativo_id: oldAsset.id,
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

    // 7. Registro da Trilha de Auditoria com rastreabilidade completa (Regra 5 da Deliberação Humana)
    const eventoAuditoria: TrilhaAuditoria = {
      id: generateId('aud'),
      demanda_id: validated.demanda_id,
      entidade: 'AtivoDados',
      entidade_id: oldAsset.id,
      tipo_evento: 'TRANSICAO_ESTADO',
      autor_tipo: 'HUMANO',
      dados_anteriores: JSON.stringify({
        id: oldAsset.id,
        nome_arquivo: oldAsset.nome_arquivo,
        versao: oldAsset.versao,
        hash_sha256: oldAsset.hash_sha256,
        status: oldAsset.status,
        total_linhas: oldAsset.total_linhas,
        total_colunas: oldAsset.total_colunas,
      }),
      dados_novos: JSON.stringify({
        id: novoAtivoId,
        nome_arquivo: novoAtivo.nome_arquivo,
        versao: novoAtivo.versao,
        hash_sha256: novoAtivo.hash_sha256,
        status: StatusAtivoDados.ATIVO,
        substitui_ativo_id: oldAsset.id,
        status_anterior_atualizado: StatusAtivoDados.SUBSTITUIDO,
        total_linhas: novoAtivo.total_linhas,
        total_colunas: novoAtivo.total_colunas,
      }),
      justificativa: validated.justificativa,
      timestamp: now,
    };

    // 8. Execução Transacional Atômica com Rollback Integral em caso de falha
    return this.ativoDadosRepo.replace({
      antigoId: oldAsset.id,
      novoAtivo,
      eventoAuditoria,
    });
  }
}
