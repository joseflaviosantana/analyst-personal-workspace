import { ILinhagemAtivosRepository } from '@/core/domain/repositories/linhagem-ativos-repository.interface';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IEtapaTransformacaoRepository } from '@/core/domain/repositories/etapa-transformacao-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { LinhagemAtivos } from '@/core/domain/entities/linhagem-ativos';
import { TrilhaAuditoria } from '@/core/domain/entities/trilha-auditoria';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { CategoriaAtivoDados } from '@/core/domain/enums/categoria-ativo-dados';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { PapelEntradaLinhagem } from '@/core/domain/enums/papel-entrada-linhagem';
import { EstadoDemanda, isEstadoTerminal, ROTULOS_ESTADO_DEMANDA } from '@/core/domain/enums/estado-demanda';
import { generateId } from '@/lib/id-generator';
import { RegistrarAtivoDerivadoInput, registrarAtivoDerivadoSchema } from '@/lib/validations/preparation-schema';

export interface RegistrarAtivoDerivadoResult {
  ativo: AtivoDados;
  arestas: LinhagemAtivos[];
}

/**
 * Caso de Uso: Registrar Ativo de Dados Derivado (Subunidade 3.5B)
 * Coordena de forma estritamente ATÔMICA:
 * 1. Criação e persistência do AtivoDados derivado (categoria PREPARADO_DERIVADO);
 * 2. Criação das arestas de LinhagemAtivos conectando as origens à saída;
 * 3. Validação de DAG e aciclicidade;
 * 4. Transição da EtapaTransformacao para EXECUTADA;
 * 5. Transição da ReceitaPreparacao para EM_EXECUCAO (quando aplicável);
 * 6. Registro na Trilha de Auditoria.
 *
 * REGRA: OU TODA A OPERAÇÃO É PERSISTIDA, OU NENHUMA ALTERAÇÃO PERMANECE.
 */
export class RegistrarAtivoDerivadoUseCase {
  constructor(
    private linhagemRepo: ILinhagemAtivosRepository,
    private ativoDadosRepo: IAtivoDadosRepository,
    private receitaRepo: IReceitaPreparacaoRepository,
    private etapaRepo: IEtapaTransformacaoRepository,
    private demandRepo: IDemandRepository
  ) {}

  async execute(input: RegistrarAtivoDerivadoInput): Promise<RegistrarAtivoDerivadoResult> {
    const validated = registrarAtivoDerivadoSchema.parse(input);

    // 1. Integridade Referencial da Demanda
    const demand = await this.demandRepo.findById(validated.demanda_id);
    if (!demand) {
      throw new Error(`Demanda '${validated.demanda_id}' não encontrada.`);
    }

    if (demand.estado === EstadoDemanda.SUSPENSA) {
      throw new Error('Não é permitido registrar ativos derivados em demandas suspensas.');
    }

    if (isEstadoTerminal(demand.estado)) {
      const rotulo = ROTULOS_ESTADO_DEMANDA[demand.estado as EstadoDemanda] || demand.estado;
      throw new Error(`Não é permitido registrar ativos derivados em demandas no estado terminal ${rotulo}.`);
    }

    // 2. Integridade Referencial da Receita
    const receita = await this.receitaRepo.findById(validated.receita_id);
    if (!receita) {
      throw new Error(`Receita de preparação '${validated.receita_id}' não encontrada.`);
    }

    if (receita.demanda_id !== validated.demanda_id) {
      throw new Error(
        `A receita informada pertence à demanda '${receita.demanda_id}', divergente da demanda da requisição '${validated.demanda_id}'.`
      );
    }

    if (
      receita.status === StatusReceitaPreparacao.CONCLUIDA ||
      receita.status === StatusReceitaPreparacao.OBSOLETA
    ) {
      throw new Error(
        `Não é permitido registrar ativos derivados em uma receita com status '${receita.status}'.`
      );
    }

    // 3. Integridade Referencial da Etapa
    const etapa = await this.etapaRepo.findById(validated.etapa_id);
    if (!etapa) {
      throw new Error(`Etapa de transformação '${validated.etapa_id}' não encontrada.`);
    }

    if (etapa.receita_id !== validated.receita_id) {
      throw new Error(
        `A etapa informada pertence à receita '${etapa.receita_id}', divergente da receita da requisição '${validated.receita_id}'.`
      );
    }

    if (etapa.status === StatusEtapaTransformacao.CANCELADA) {
      throw new Error('Não é permitido registrar ativos derivados a partir de etapas canceladas.');
    }

    // 4. Validação das Fontes de Entrada e Papéis
    if (validated.fontes_entrada.length === 0) {
      throw new Error('Ao menos um ativo de origem deve ser fornecido para o ativo derivado.');
    }

    const origensUnicas = new Set<string>();
    let temFontePrincipal = false;

    for (const fonte of validated.fontes_entrada) {
      if (origensUnicas.has(fonte.ativo_origem_id)) {
        throw new Error(
          `Ativo de origem duplicado nas fontes de entrada: '${fonte.ativo_origem_id}'.`
        );
      }
      origensUnicas.add(fonte.ativo_origem_id);

      const ativoOrigem = await this.ativoDadosRepo.findById(fonte.ativo_origem_id);
      if (!ativoOrigem) {
        throw new Error(`Ativo de origem '${fonte.ativo_origem_id}' não encontrado.`);
      }

      if (ativoOrigem.demanda_id !== validated.demanda_id) {
        throw new Error(
          `O ativo de origem '${fonte.ativo_origem_id}' pertence a outra demanda e não pode ser utilizado nesta linhagem.`
        );
      }

      if (
        fonte.papel === PapelEntradaLinhagem.FONTE_PRINCIPAL ||
        fonte.papel === PapelEntradaLinhagem.ORIGEM_UNICA
      ) {
        temFontePrincipal = true;
      }
    }

    // Validação de papéis quando múltiplos insumos
    if (validated.fontes_entrada.length > 1 && !temFontePrincipal) {
      const todosSaoUnion = validated.fontes_entrada.every(
        (f) => f.papel === PapelEntradaLinhagem.UNION_PARTE
      );
      if (!todosSaoUnion) {
        throw new Error(
          'Para transformações com múltiplos ativos de entrada, exatamente uma fonte deve ser FONTE_PRINCIPAL (ou todas UNION_PARTE).'
        );
      }
    }

    // 5. Unicidade de Caminho Local por Demanda
    const existingActive = await this.ativoDadosRepo.findActiveByPath(
      validated.demanda_id,
      validated.caminho_local
    );
    if (existingActive) {
      throw new Error(
        `O arquivo '${validated.nome_arquivo}' (${validated.caminho_local}) já está cadastrado e ativo nesta demanda.`
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
      origem: validated.origem ?? 'Pipeline de Preparação',
      descricao_conteudo: validated.descricao_conteudo ?? null,
      granularidade: validated.granularidade ?? null,
      periodo_inicio: validated.periodo_inicio ?? null,
      periodo_fim: validated.periodo_fim ?? null,
      versao: validated.versao ?? '1.0-preparado',
      substitui_ativo_id: null,
      tamanho_bytes: validated.tamanho_bytes,
      total_linhas: validated.total_linhas,
      total_colunas: validated.total_colunas,
      hash_sha256: validated.hash_sha256,
      status: StatusAtivoDados.ATIVO,
      categoria_ativo: CategoriaAtivoDados.PREPARADO_DERIVADO,
      schema_inferido: validated.schema_inferido ?? null,
      data_recebimento: now,
      criado_em: now,
      atualizado_em: now,
    };

    const arestas: LinhagemAtivos[] = validated.fontes_entrada.map((fonte) => ({
      id: generateId('lin'),
      demanda_id: validated.demanda_id,
      ativo_origem_id: fonte.ativo_origem_id,
      ativo_destino_id: novoAtivoId,
      etapa_transformacao_id: validated.etapa_id,
      papel_entrada: fonte.papel,
      criado_em: now,
    }));

    const eventoAuditoria: TrilhaAuditoria = {
      id: generateId('aud'),
      demanda_id: validated.demanda_id,
      entidade: 'AtivoDados',
      entidade_id: novoAtivoId,
      tipo_evento: 'CRIACAO',
      autor_tipo: 'HUMANO',
      dados_anteriores: null,
      dados_novos: JSON.stringify({
        nome_arquivo: novoAtivo.nome_arquivo,
        categoria_ativo: novoAtivo.categoria_ativo,
        receita_id: validated.receita_id,
        etapa_id: validated.etapa_id,
        total_linhas: novoAtivo.total_linhas,
        total_colunas: novoAtivo.total_colunas,
        hash_sha256: novoAtivo.hash_sha256,
        fontes_origem: validated.fontes_entrada,
      }),
      justificativa:
        validated.justificativa ?? 'Registro atômico de ativo de dados preparado/derivado e linhagem.',
      timestamp: now,
    };

    // A receita somente transiciona de RASCUNHO para EM_EXECUCAO se estiver em RASCUNHO
    const atualizarReceitaParaEmExecucao = receita.status === StatusReceitaPreparacao.RASCUNHO;

    // 6. Execução Transacional Atômica com Rollback Integral em caso de falha
    return this.linhagemRepo.registrarDerivacaoTransacional({
      novoAtivo,
      arestas,
      etapaId: validated.etapa_id,
      receitaId: validated.receita_id,
      atualizarReceitaParaEmExecucao,
      eventoAuditoria,
    });
  }
}
