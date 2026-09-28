import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { IDatasetAutorizadoRepository } from '@/core/domain/repositories/dataset-autorizado-repository.interface';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IEntidadeAnaliticaRepository } from '@/core/domain/repositories/entidade-analitica-repository.interface';
import { IAtributoAnaliticoRepository } from '@/core/domain/repositories/atributo-analitico-repository.interface';
import { ModeloAnalitico } from '@/core/domain/entities/modelo-analitico';
import { EntidadeAnaliticaComAtributos } from '@/core/domain/entities/entidade-analitica';
import { AtributoAnalitico } from '@/core/domain/entities/atributo-analitico';
import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';
import { StatusAutorizacaoDataset } from '@/core/domain/enums/status-autorizacao-dataset';
import { TipoArquiteturaModelo } from '@/core/domain/enums/tipo-arquitetura-modelo';
import { TipoEntidadeAnalitica } from '@/core/domain/enums/tipo-entidade-analitica';
import { PapelEntidadeAnalitica } from '@/core/domain/enums/papel-entidade-analitica';
import { TipoOrigemEntidade } from '@/core/domain/enums/tipo-origem-entidade';
import { TipoDadoAnalitico } from '@/core/domain/enums/tipo-dado-analitico';
import { PapelAtributoAnalitico } from '@/core/domain/enums/papel-atributo-analitico';
import { criarModeloSchema } from '@/lib/validations/modeling-schema';

export interface CriarModeloAnaliticoInput {
  demandaId: string;
  datasetAutorizadoId: string;
  nome: string;
  descricao?: string;
  tipoArquitetura?: TipoArquiteturaModelo;
  proporEntidadeFato?: boolean;
}

export interface CriarModeloAnaliticoOutput {
  modelo: ModeloAnalitico;
  entidadeFatoInicial?: EntidadeAnaliticaComAtributos;
}

export class CriarModeloAnaliticoUseCase {
  constructor(
    private modeloRepo: IModeloAnaliticoRepository,
    private datasetRepo: IDatasetAutorizadoRepository,
    private ativoRepo: IAtivoDadosRepository,
    private entidadeRepo: IEntidadeAnaliticaRepository,
    private atributoRepo: IAtributoAnaliticoRepository
  ) {}

  async execute(input: CriarModeloAnaliticoInput): Promise<CriarModeloAnaliticoOutput> {
    const validated = criarModeloSchema.parse(input);

    // 1. Validar Dataset Autorizado
    const dataset = await this.datasetRepo.findById(validated.datasetAutorizadoId);
    if (!dataset) {
      throw new Error(`Dataset autorizado com ID '${validated.datasetAutorizadoId}' não encontrado.`);
    }

    if (dataset.demanda_id !== validated.demandaId) {
      throw new Error(
        `O dataset autorizado pertence à demanda '${dataset.demanda_id}', não à demanda '${validated.demandaId}'.`
      );
    }

    if (dataset.status !== StatusAutorizacaoDataset.VIGENTE) {
      throw new Error(
        `O dataset autorizado selecionado não está VIGENTE (status atual: ${dataset.status}). Apenas datasets homologados vigentes podem originar um modelo analítico.`
      );
    }

    // 2. Criar Modelo Analítico em RASCUNHO
    const now = new Date().toISOString();
    const modeloId = `mod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const novoModelo: ModeloAnalitico = {
      id: modeloId,
      demanda_id: validated.demandaId,
      dataset_autorizado_id: validated.datasetAutorizadoId,
      nome: validated.nome,
      descricao: validated.descricao ?? null,
      tipo_arquitetura: validated.tipoArquitetura ?? TipoArquiteturaModelo.ESTRELA,
      status: StatusModeloAnalitico.RASCUNHO,
      homologado_em: null,
      homologado_por: null,
      justificativa_homologacao: null,
      revogado_em: null,
      motivo_revogacao: null,
      criado_em: now,
      atualizado_em: now,
    };

    await this.modeloRepo.create(novoModelo);

    let entidadeFatoInicial: EntidadeAnaliticaComAtributos | undefined;

    // 3. Propor Entidade Fato Inicial caso solicitado
    if (validated.proporEntidadeFato) {
      const ativo = await this.ativoRepo.findById(dataset.ativo_dados_id);
      const entidadeId = `ent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Se houver granularidade, registrar como sugestão inferida, nunca decisão final
      const sugestaoGrao = ativo?.granularidade
        ? `[Sugestão de Grão Inferida do Ativo]: ${ativo.granularidade}`
        : null;

      const entidadeFato = await this.entidadeRepo.create({
        id: entidadeId,
        modelo_id: modeloId,
        ativo_dados_id: dataset.ativo_dados_id,
        nome: `Fato ${ativo?.nome_arquivo ? ativo.nome_arquivo.replace(/\.[^/.]+$/, '') : 'Principal'}`,
        tipo: TipoEntidadeAnalitica.FATO,
        papel: PapelEntidadeAnalitica.FATO_TRANSACIONAL,
        origem_tipo: TipoOrigemEntidade.DATASET_AUTORIZADO,
        descricao: sugestaoGrao,
        ordem_apresentacao: 1,
        criado_em: now,
        atualizado_em: now,
      });

      // Mapear colunas do schema inferido como atributos conceituais iniciais
      const atributosCriados: AtributoAnalitico[] = [];
      if (ativo?.schema_inferido) {
        try {
          const colunas = JSON.parse(ativo.schema_inferido);
          if (Array.isArray(colunas)) {
            let ordem = 1;
            for (const col of colunas) {
              const colNome = typeof col === 'string' ? col : col.nome || `col_${ordem}`;
              const colTipo = typeof col === 'object' && col.tipo ? col.tipo.toUpperCase() : 'TEXTO';

              let tipoDado = TipoDadoAnalitico.TEXTO;
              if (colTipo.includes('INT') || colTipo.includes('NUM') || colTipo.includes('INTEGER')) {
                tipoDado = TipoDadoAnalitico.INTEIRO;
              } else if (colTipo.includes('DECIMAL') || colTipo.includes('FLOAT') || colTipo.includes('REAL')) {
                tipoDado = TipoDadoAnalitico.DECIMAL;
              } else if (colTipo.includes('DATE') || colTipo.includes('DATA')) {
                tipoDado = TipoDadoAnalitico.DATA;
              } else if (colTipo.includes('BOOL')) {
                tipoDado = TipoDadoAnalitico.BOOLEANO;
              }

              // Se parecer ID ou chave primária na primeira coluna
              const ehPrimeiraColunaId = ordem === 1 && (colNome.toLowerCase().includes('id') || colNome.toLowerCase().includes('pk'));
              const papel = ehPrimeiraColunaId ? PapelAtributoAnalitico.CHAVE_PRIMARIA : PapelAtributoAnalitico.ATRIBUTO_DESCRITIVO;

              const attr: AtributoAnalitico = {
                id: `attr_${Date.now()}_${ordem}_${Math.random().toString(36).substring(2, 6)}`,
                entidade_id: entidadeId,
                nome_original: colNome,
                nome_amigavel: colNome.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                tipo_dado: tipoDado,
                papel,
                ordem: ordem++,
                oculto: false,
                descricao: null,
                formato_exibicao: null,
                criado_em: now,
                atualizado_em: now,
              };

              atributosCriados.push(attr);
            }

            if (atributosCriados.length > 0) {
              await this.atributoRepo.createBatch(atributosCriados);
            }
          }
        } catch {
          // Schema inferido inválido não bloqueia criação da entidade Fato
        }
      }

      entidadeFatoInicial = {
        ...entidadeFato,
        atributos: atributosCriados,
      };
    }

    return {
      modelo: novoModelo,
      entidadeFatoInicial,
    };
  }
}
