import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsultarLinhagemUseCase } from '@/core/use-cases/preparation/consultar-linhagem.use-case';
import { ILinhagemAtivosRepository } from '@/core/domain/repositories/linhagem-ativos-repository.interface';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IEtapaTransformacaoRepository } from '@/core/domain/repositories/etapa-transformacao-repository.interface';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { LinhagemAtivos } from '@/core/domain/entities/linhagem-ativos';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';
import { PapelEntradaLinhagem } from '@/core/domain/enums/papel-entrada-linhagem';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { CategoriaAtivoDados } from '@/core/domain/enums/categoria-ativo-dados';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';
import { TipoOperacaoPreparacao } from '@/core/domain/enums/tipo-operacao-preparacao';
import { CapacidadeFerramenta } from '@/core/domain/enums/capacidade-ferramenta';

describe('Unit: ConsultarLinhagemUseCase e Operações de Grafo (Subunidade 3.5B)', () => {
  let linhagemRepo: ILinhagemAtivosRepository;
  let ativoDadosRepo: IAtivoDadosRepository;
  let etapaRepo: IEtapaTransformacaoRepository;

  const ativoA: AtivoDados = {
    id: 'ast_a_bruto',
    demanda_id: 'dem_01',
    nome_arquivo: 'a.csv',
    caminho_local: '/data/a.csv',
    formato: FormatoArquivo.CSV,
    origem: null,
    descricao_conteudo: null,
    granularidade: null,
    periodo_inicio: null,
    periodo_fim: null,
    versao: '1',
    substitui_ativo_id: null,
    tamanho_bytes: 100,
    total_linhas: 10,
    total_colunas: 2,
    hash_sha256: 'h_a',
    status: StatusAtivoDados.ATIVO,
    categoria_ativo: CategoriaAtivoDados.BRUTO_RECEBIDO,
    schema_inferido: null,
    data_recebimento: '2026-09-28T00:00:00Z',
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:00:00Z',
  };

  const ativoB: AtivoDados = {
    ...ativoA,
    id: 'ast_b_intermediario',
    nome_arquivo: 'b.csv',
    caminho_local: '/data/b.csv',
    categoria_ativo: CategoriaAtivoDados.PREPARADO_DERIVADO,
  };

  const ativoC: AtivoDados = {
    ...ativoA,
    id: 'ast_c_final',
    nome_arquivo: 'c.csv',
    caminho_local: '/data/c.csv',
    categoria_ativo: CategoriaAtivoDados.PREPARADO_DERIVADO,
  };

  const etapa1: EtapaTransformacao = {
    id: 'etp_01',
    receita_id: 'rec_01',
    ordem: 1,
    tipo_operacao: TipoOperacaoPreparacao.CONVERTER_TIPO,
    capacidade_ferramenta: CapacidadeFerramenta.MOTOR_SQL,
    ferramenta_nome: 'DuckDB',
    ferramenta_versao: null,
    descricao: 'Etapa 1',
    especificacao_tecnica: null,
    status: StatusEtapaTransformacao.EXECUTADA,
    justificativa: null,
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:00:00Z',
  };

  beforeEach(() => {
    linhagemRepo = {
      registrarVinculo: vi.fn((v) => Promise.resolve(v)),
      obterOrigens: vi.fn((destinoId) => {
        if (destinoId === 'ast_c_final') {
          return Promise.resolve([
            {
              ativo: ativoB,
              papel: PapelEntradaLinhagem.FONTE_PRINCIPAL,
              etapa_transformacao_id: 'etp_01',
            },
          ]);
        }
        if (destinoId === 'ast_b_intermediario') {
          return Promise.resolve([
            {
              ativo: ativoA,
              papel: PapelEntradaLinhagem.ORIGEM_UNICA,
              etapa_transformacao_id: 'etp_01',
            },
          ]);
        }
        return Promise.resolve([]);
      }),
      obterDestinos: vi.fn((origemId) => {
        if (origemId === 'ast_a_bruto') {
          return Promise.resolve([ativoB]);
        }
        if (origemId === 'ast_b_intermediario') {
          return Promise.resolve([ativoC]);
        }
        return Promise.resolve([]);
      }),
      obterArestasPorDemanda: vi.fn(() =>
        Promise.resolve([
          {
            id: 'edge_1',
            demanda_id: 'dem_01',
            ativo_origem_id: 'ast_a_bruto',
            ativo_destino_id: 'ast_b_intermediario',
            papel_entrada: PapelEntradaLinhagem.ORIGEM_UNICA,
            etapa_transformacao_id: 'etp_01',
            criado_em: '2026-09-28T00:00:00Z',
          },
          {
            id: 'edge_2',
            demanda_id: 'dem_01',
            ativo_origem_id: 'ast_b_intermediario',
            ativo_destino_id: 'ast_c_final',
            papel_entrada: PapelEntradaLinhagem.FONTE_PRINCIPAL,
            etapa_transformacao_id: 'etp_01',
            criado_em: '2026-09-28T00:00:00Z',
          },
        ])
      ),
      obterArestasPorEtapa: vi.fn(),
      deleteDraftEdgeOnly: vi.fn(() => Promise.resolve(true)),
      registrarDerivacaoTransacional: vi.fn(),
    };

    ativoDadosRepo = {
      create: vi.fn(),
      findById: vi.fn((id) => {
        if (id === 'ast_a_bruto') return Promise.resolve(ativoA);
        if (id === 'ast_b_intermediario') return Promise.resolve(ativoB);
        if (id === 'ast_c_final') return Promise.resolve(ativoC);
        return Promise.resolve(null);
      }),
      findByDemandId: vi.fn(),
      findByPath: vi.fn(),
      findActiveByPath: vi.fn(),
      update: vi.fn(),
      countByDemandId: vi.fn(),
      replace: vi.fn(),
    };

    etapaRepo = {
      findById: vi.fn((id) => Promise.resolve(id === 'etp_01' ? etapa1 : null)),
      findByReceitaId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      reordenar: vi.fn(),
      deleteDraftOnly: vi.fn(),
      cancelar: vi.fn(),
      vincularProblema: vi.fn(),
      desvincularProblema: vi.fn(),
      listarProblemasPorEtapa: vi.fn(),
      listarEtapasPorProblema: vi.fn(),
    };
  });

  it('deve consultar ancestrais (Upstream) calculando profundidade correta até a raiz', async () => {
    const useCase = new ConsultarLinhagemUseCase(linhagemRepo, ativoDadosRepo, etapaRepo);
    const ancestrais = await useCase.consultarAncestrais('ast_c_final');

    expect(ancestrais).toHaveLength(2);
    // B é pai direto (profundidade 1)
    expect(ancestrais[0].ativo.id).toBe('ast_b_intermediario');
    expect(ancestrais[0].profundidade).toBe(1);
    // A é avô (profundidade 2) e raiz bruta
    expect(ancestrais[1].ativo.id).toBe('ast_a_bruto');
    expect(ancestrais[1].profundidade).toBe(2);
    expect(ancestrais[1].ativo.categoria_ativo).toBe(CategoriaAtivoDados.BRUTO_RECEBIDO);
  });

  it('deve consultar descendentes (Downstream / Impacto) a partir de uma fonte', async () => {
    const useCase = new ConsultarLinhagemUseCase(linhagemRepo, ativoDadosRepo, etapaRepo);
    const descendentes = await useCase.consultarDescendentes('ast_a_bruto');

    expect(descendentes).toHaveLength(2);
    expect(descendentes[0].ativo.id).toBe('ast_b_intermediario');
    expect(descendentes[0].profundidade).toBe(1);
    expect(descendentes[1].ativo.id).toBe('ast_c_final');
    expect(descendentes[1].profundidade).toBe(2);
  });

  it('deve reconstruir o caminho de transformação com nós, arestas e etapas', async () => {
    const useCase = new ConsultarLinhagemUseCase(linhagemRepo, ativoDadosRepo, etapaRepo);
    const caminho = await useCase.reconstruirCaminhoTransformacao('ast_c_final');

    expect(caminho.nosAtivos).toHaveLength(3);
    expect(caminho.arestas).toHaveLength(2);
    expect(caminho.etapas).toHaveLength(1);
    expect(caminho.etapas[0].id).toBe('etp_01');
  });

  it('deve registrar aresta avulsa validando integridade da demanda', async () => {
    const useCase = new ConsultarLinhagemUseCase(linhagemRepo, ativoDadosRepo, etapaRepo);
    const aresta = await useCase.registrarArestaAvulsa({
      demanda_id: 'dem_01',
      ativo_origem_id: 'ast_a_bruto',
      ativo_destino_id: 'ast_b_intermediario',
      papel_entrada: PapelEntradaLinhagem.FONTE_PRINCIPAL,
    });

    expect(aresta).toBeDefined();
    expect(linhagemRepo.registrarVinculo).toHaveBeenCalledOnce();
  });
});
