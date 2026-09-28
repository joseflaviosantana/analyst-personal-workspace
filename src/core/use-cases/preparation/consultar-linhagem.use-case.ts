import { ILinhagemAtivosRepository, OrigemComPapel } from '@/core/domain/repositories/linhagem-ativos-repository.interface';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IEtapaTransformacaoRepository } from '@/core/domain/repositories/etapa-transformacao-repository.interface';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { LinhagemAtivos } from '@/core/domain/entities/linhagem-ativos';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';
import { generateId } from '@/lib/id-generator';
import { RegistrarArestaLinhagemInput, registrarArestaLinhagemSchema } from '@/lib/validations/preparation-schema';

export interface NoAncestralComProfundidade {
  ativo: AtivoDados;
  profundidade: number; // 1 = pai direto, 2 = avô...
  papel: string;
  etapa_transformacao_id: string | null;
}

export interface NoDescendenteComProfundidade {
  ativo: AtivoDados;
  profundidade: number; // 1 = filho direto, 2 = neto...
}

export interface CaminhoTransformacaoCompleto {
  nosAtivos: AtivoDados[];
  arestas: LinhagemAtivos[];
  etapas: EtapaTransformacao[];
  totalEtapas: number;
}

/**
 * Caso de Uso: Consultar e Navegar no Grafo de Linhagem (Subunidade 3.5B)
 * Oferece operações de inspeção topológica do DAG:
 * - Upstream: rastreamento de ancestrais até a raiz bruta;
 * - Downstream: análise de impacto em artefatos derivados a jusante;
 * - Reconstrução do caminho completo de transformação com etapas associadas;
 * - Registro de arestas avulsas e remoção segura de rascunhos.
 */
export class ConsultarLinhagemUseCase {
  constructor(
    private linhagemRepo: ILinhagemAtivosRepository,
    private ativoDadosRepo: IAtivoDadosRepository,
    private etapaRepo?: IEtapaTransformacaoRepository
  ) {}

  /**
   * Consulta toda a árvore ascendente (Upstream) de um ativo até suas fontes primárias
   */
  async consultarAncestrais(ativoId: string): Promise<NoAncestralComProfundidade[]> {
    if (!ativoId || ativoId.trim() === '') {
      throw new Error('ID do ativo é obrigatório.');
    }

    const resultado: NoAncestralComProfundidade[] = [];
    const visitados = new Set<string>();

    const fila: { id: string; profundidade: number }[] = [{ id: ativoId, profundidade: 0 }];
    visitados.add(ativoId);

    while (fila.length > 0) {
      const atual = fila.shift()!;
      const origens: OrigemComPapel[] = await this.linhagemRepo.obterOrigens(atual.id);

      for (const o of origens) {
        if (!visitados.has(o.ativo.id)) {
          visitados.add(o.ativo.id);
          const novaProfundidade = atual.profundidade + 1;
          resultado.push({
            ativo: o.ativo,
            profundidade: novaProfundidade,
            papel: o.papel,
            etapa_transformacao_id: o.etapa_transformacao_id,
          });
          fila.push({ id: o.ativo.id, profundidade: novaProfundidade });
        }
      }
    }

    return resultado;
  }

  /**
   * Consulta todos os artefatos dependentes a jusante (Downstream / Análise de Impacto)
   */
  async consultarDescendentes(ativoId: string): Promise<NoDescendenteComProfundidade[]> {
    if (!ativoId || ativoId.trim() === '') {
      throw new Error('ID do ativo é obrigatório.');
    }

    const resultado: NoDescendenteComProfundidade[] = [];
    const visitados = new Set<string>();

    const fila: { id: string; profundidade: number }[] = [{ id: ativoId, profundidade: 0 }];
    visitados.add(ativoId);

    while (fila.length > 0) {
      const atual = fila.shift()!;
      const destinos: AtivoDados[] = await this.linhagemRepo.obterDestinos(atual.id);

      for (const d of destinos) {
        if (!visitados.has(d.id)) {
          visitados.add(d.id);
          const novaProfundidade = atual.profundidade + 1;
          resultado.push({
            ativo: d,
            profundidade: novaProfundidade,
          });
          fila.push({ id: d.id, profundidade: novaProfundidade });
        }
      }
    }

    return resultado;
  }

  /**
   * Reconstrói o caminho completo de transformação que gerou um ativo
   */
  async reconstruirCaminhoTransformacao(ativoId: string): Promise<CaminhoTransformacaoCompleto> {
    const alvo = await this.ativoDadosRepo.findById(ativoId);
    if (!alvo) {
      throw new Error(`Ativo de dados '${ativoId}' não encontrado.`);
    }

    const ancestrais = await this.consultarAncestrais(ativoId);
    const nosAtivosMap = new Map<string, AtivoDados>();
    nosAtivosMap.set(alvo.id, alvo);

    for (const a of ancestrais) {
      nosAtivosMap.set(a.ativo.id, a.ativo);
    }

    // Obter todas as arestas da demanda e filtrar as que conectam os nós deste subgrafo
    const todasArestas = await this.linhagemRepo.obterArestasPorDemanda(alvo.demanda_id);
    const nosIds = new Set(nosAtivosMap.keys());

    const arestasSubgrafo = todasArestas.filter(
      (edge) => nosIds.has(edge.ativo_origem_id) && nosIds.has(edge.ativo_destino_id)
    );

    // Carregar etapas associadas
    const etapasMap = new Map<string, EtapaTransformacao>();
    if (this.etapaRepo) {
      for (const edge of arestasSubgrafo) {
        if (edge.etapa_transformacao_id && !etapasMap.has(edge.etapa_transformacao_id)) {
          const etapa = await this.etapaRepo.findById(edge.etapa_transformacao_id);
          if (etapa) {
            etapasMap.set(etapa.id, etapa);
          }
        }
      }
    }

    return {
      nosAtivos: Array.from(nosAtivosMap.values()),
      arestas: arestasSubgrafo,
      etapas: Array.from(etapasMap.values()),
      totalEtapas: etapasMap.size,
    };
  }

  /**
   * Registra uma aresta avulsa de linhagem garantindo prevenção de ciclos
   */
  async registrarArestaAvulsa(input: RegistrarArestaLinhagemInput): Promise<LinhagemAtivos> {
    const validated = registrarArestaLinhagemSchema.parse(input);

    const origem = await this.ativoDadosRepo.findById(validated.ativo_origem_id);
    if (!origem) {
      throw new Error(`Ativo de origem '${validated.ativo_origem_id}' não encontrado.`);
    }

    const destino = await this.ativoDadosRepo.findById(validated.ativo_destino_id);
    if (!destino) {
      throw new Error(`Ativo de destino '${validated.ativo_destino_id}' não encontrado.`);
    }

    if (origem.demanda_id !== validated.demanda_id || destino.demanda_id !== validated.demanda_id) {
      throw new Error('Ambos os ativos devem pertencer à demanda especificada.');
    }

    const novaAresta: LinhagemAtivos = {
      id: generateId('lin'),
      demanda_id: validated.demanda_id,
      ativo_origem_id: validated.ativo_origem_id,
      ativo_destino_id: validated.ativo_destino_id,
      papel_entrada: validated.papel_entrada,
      etapa_transformacao_id: validated.etapa_transformacao_id ?? null,
      criado_em: new Date().toISOString(),
    };

    return this.linhagemRepo.registrarVinculo(novaAresta);
  }

  /**
   * Remove uma aresta de linhagem caso o destino ainda seja rascunho sem diagnósticos nem autorização
   */
  async removerArestaRascunho(arestaId: string): Promise<boolean> {
    if (!arestaId || arestaId.trim() === '') {
      throw new Error('ID da aresta é obrigatório.');
    }

    return this.linhagemRepo.deleteDraftEdgeOnly(arestaId);
  }
}
