import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegistrarAtivoDerivadoUseCase } from '@/core/use-cases/preparation/registrar-ativo-derivado.use-case';
import { ILinhagemAtivosRepository } from '@/core/domain/repositories/linhagem-ativos-repository.interface';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IReceitaPreparacaoRepository } from '@/core/domain/repositories/receita-preparacao-repository.interface';
import { IEtapaTransformacaoRepository } from '@/core/domain/repositories/etapa-transformacao-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { ReceitaPreparacao } from '@/core/domain/entities/receita-preparacao';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { CategoriaAtivoDados } from '@/core/domain/enums/categoria-ativo-dados';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { PapelEntradaLinhagem } from '@/core/domain/enums/papel-entrada-linhagem';
import { TipoOperacaoPreparacao } from '@/core/domain/enums/tipo-operacao-preparacao';
import { CapacidadeFerramenta } from '@/core/domain/enums/capacidade-ferramenta';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';

describe('Unit: Caso de Uso RegistrarAtivoDerivadoUseCase (Subunidade 3.5B)', () => {
  let linhagemRepo: ILinhagemAtivosRepository;
  let ativoDadosRepo: IAtivoDadosRepository;
  let receitaRepo: IReceitaPreparacaoRepository;
  let etapaRepo: IEtapaTransformacaoRepository;
  let demandRepo: IDemandRepository;

  const demandaValida = {
    id: 'dem_01',
    projeto_id: 'proj_01',
    projetoNome: 'Projeto Teste',
    titulo: 'Demanda Teste Derivados',
    solicitacao_bruta: 'Bruta',
    contexto: 'Contexto',
    objetivo_inicial: 'Objetivo',
    prazo_esperado: null,
    restricoes_declaradas: null,
    estado: EstadoDemanda.DADOS_RECEBIDOS,
    data_conclusao: null,
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:00:00Z',
  };

  const receitaRascunho: ReceitaPreparacao = {
    id: 'rec_01',
    demanda_id: 'dem_01',
    titulo: 'Receita em Rascunho',
    descricao: null,
    status: StatusReceitaPreparacao.RASCUNHO,
    versao: 1,
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:00:00Z',
  };

  const etapaPlanejada: EtapaTransformacao = {
    id: 'etp_01',
    receita_id: 'rec_01',
    ordem: 1,
    tipo_operacao: TipoOperacaoPreparacao.TRATAR_NULOS,
    capacidade_ferramenta: CapacidadeFerramenta.MOTOR_SQL,
    ferramenta_nome: 'DuckDB',
    ferramenta_versao: '1.0',
    descricao: 'Limpeza de Nulos',
    especificacao_tecnica: null,
    status: StatusEtapaTransformacao.PLANEJADA,
    justificativa: null,
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:00:00Z',
  };

  const ativoBrutoOrigem: AtivoDados = {
    id: 'ast_bruto_01',
    demanda_id: 'dem_01',
    nome_arquivo: 'vendas_raw.csv',
    caminho_local: '/data/vendas_raw.csv',
    formato: FormatoArquivo.CSV,
    origem: 'ERP',
    descricao_conteudo: 'Vendas brutas',
    granularidade: 'Item',
    periodo_inicio: null,
    periodo_fim: null,
    versao: '1.0',
    substitui_ativo_id: null,
    tamanho_bytes: 1024,
    total_linhas: 100,
    total_colunas: 5,
    hash_sha256: 'hash_bruto_123',
    status: StatusAtivoDados.ATIVO,
    categoria_ativo: CategoriaAtivoDados.BRUTO_RECEBIDO,
    schema_inferido: null,
    data_recebimento: '2026-09-28T00:00:00Z',
    criado_em: '2026-09-28T00:00:00Z',
    atualizado_em: '2026-09-28T00:00:00Z',
  };

  beforeEach(() => {
    linhagemRepo = {
      registrarVinculo: vi.fn(),
      obterOrigens: vi.fn(),
      obterDestinos: vi.fn(),
      obterArestasPorDemanda: vi.fn(),
      obterArestasPorEtapa: vi.fn(),
      deleteDraftEdgeOnly: vi.fn(),
      registrarDerivacaoTransacional: vi.fn((params) =>
        Promise.resolve({
          ativo: params.novoAtivo,
          arestas: params.arestas,
        })
      ),
    };

    ativoDadosRepo = {
      create: vi.fn(),
      findById: vi.fn((id) => Promise.resolve(id === 'ast_bruto_01' ? ativoBrutoOrigem : null)),
      findByDemandId: vi.fn(),
      findByPath: vi.fn(),
      findActiveByPath: vi.fn(() => Promise.resolve(null)),
      update: vi.fn(),
      countByDemandId: vi.fn(),
      replace: vi.fn(),
    };

    receitaRepo = {
      findById: vi.fn((id) => Promise.resolve(id === 'rec_01' ? receitaRascunho : null)),
      findByDemandId: vi.fn(),
      findActiveByDemandId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteDraftOnly: vi.fn(),
    };

    etapaRepo = {
      findById: vi.fn((id) => Promise.resolve(id === 'etp_01' ? etapaPlanejada : null)),
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

    demandRepo = {
      create: vi.fn(),
      findById: vi.fn((id) => Promise.resolve(id === 'dem_01' ? demandaValida : null)),
      findByProjectId: vi.fn(),
      findAll: vi.fn(),
      findRecent: vi.fn(),
      update: vi.fn(),
      countActive: vi.fn(),
      countTotal: vi.fn(),
    };
  });

  it('deve registrar ativo derivado delegando atomicidade para o repositório', async () => {
    const useCase = new RegistrarAtivoDerivadoUseCase(
      linhagemRepo,
      ativoDadosRepo,
      receitaRepo,
      etapaRepo,
      demandRepo
    );

    const resultado = await useCase.execute({
      demanda_id: 'dem_01',
      receita_id: 'rec_01',
      etapa_id: 'etp_01',
      fontes_entrada: [
        {
          ativo_origem_id: 'ast_bruto_01',
          papel: PapelEntradaLinhagem.ORIGEM_UNICA,
        },
      ],
      nome_arquivo: 'vendas_limpas.csv',
      caminho_local: '/data/vendas_limpas.csv',
      formato: FormatoArquivo.BASE_TRATADA,
      tamanho_bytes: 800,
      total_linhas: 98,
      total_colunas: 5,
      hash_sha256: 'hash_derivado_456',
    });

    expect(resultado.ativo).toBeDefined();
    expect(resultado.ativo.categoria_ativo).toBe(CategoriaAtivoDados.PREPARADO_DERIVADO);
    expect(resultado.ativo.status).toBe(StatusAtivoDados.ATIVO);
    expect(resultado.arestas).toHaveLength(1);
    expect(resultado.arestas[0].papel_entrada).toBe(PapelEntradaLinhagem.ORIGEM_UNICA);

    expect(linhagemRepo.registrarDerivacaoTransacional).toHaveBeenCalledWith(
      expect.objectContaining({
        etapaId: 'etp_01',
        receitaId: 'rec_01',
        atualizarReceitaParaEmExecucao: true,
      })
    );
  });

  it('deve rejeitar registro se caminho local já estiver cadastrado para ativo ativo', async () => {
    vi.mocked(ativoDadosRepo.findActiveByPath).mockResolvedValue(ativoBrutoOrigem);

    const useCase = new RegistrarAtivoDerivadoUseCase(
      linhagemRepo,
      ativoDadosRepo,
      receitaRepo,
      etapaRepo,
      demandRepo
    );

    await expect(
      useCase.execute({
        demanda_id: 'dem_01',
        receita_id: 'rec_01',
        etapa_id: 'etp_01',
        fontes_entrada: [
          {
            ativo_origem_id: 'ast_bruto_01',
            papel: PapelEntradaLinhagem.ORIGEM_UNICA,
          },
        ],
        nome_arquivo: 'vendas_colisao.csv',
        caminho_local: '/data/vendas_raw.csv', // colisão
        formato: FormatoArquivo.CSV,
        tamanho_bytes: 800,
        total_linhas: 98,
        total_colunas: 5,
        hash_sha256: 'hash_colisao',
      })
    ).rejects.toThrow(/já está cadastrado e ativo nesta demanda/);
  });

  it('deve rejeitar se a etapa estiver no status CANCELADA', async () => {
    vi.mocked(etapaRepo.findById).mockResolvedValue({
      ...etapaPlanejada,
      status: StatusEtapaTransformacao.CANCELADA,
    });

    const useCase = new RegistrarAtivoDerivadoUseCase(
      linhagemRepo,
      ativoDadosRepo,
      receitaRepo,
      etapaRepo,
      demandRepo
    );

    await expect(
      useCase.execute({
        demanda_id: 'dem_01',
        receita_id: 'rec_01',
        etapa_id: 'etp_01',
        fontes_entrada: [
          {
            ativo_origem_id: 'ast_bruto_01',
            papel: PapelEntradaLinhagem.ORIGEM_UNICA,
          },
        ],
        nome_arquivo: 'vendas_limpas.csv',
        caminho_local: '/data/vendas_limpas.csv',
        formato: FormatoArquivo.BASE_TRATADA,
        tamanho_bytes: 800,
        total_linhas: 98,
        total_colunas: 5,
        hash_sha256: 'hash_456',
      })
    ).rejects.toThrow(/etapas canceladas/);
  });
});
