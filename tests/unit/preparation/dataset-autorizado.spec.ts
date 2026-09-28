import { describe, it, expect } from 'vitest';
import { DatasetAutorizadoAnalise } from '@/core/domain/entities/dataset-autorizado-analise';
import { StatusAutorizacaoDataset, ROTULOS_STATUS_AUTORIZACAO_DATASET } from '@/core/domain/enums/status-autorizacao-dataset';
import { CategoriaAtivoDados, ROTULOS_CATEGORIA_ATIVO_DADOS, normalizarCategoriaAtivoDados } from '@/core/domain/enums/categoria-ativo-dados';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';

describe('Unit: Domínio de Preparação — Homologação de Dataset Autorizado (Subunidade 3.5A)', () => {
  it('deve criar uma entidade DatasetAutorizadoAnalise completa com snapshots imutáveis', () => {
    const dataset: DatasetAutorizadoAnalise = {
      id: 'ds_auth_01',
      demanda_id: 'dem_01',
      ativo_dados_id: 'asset_preparado_vendas_v1',
      diagnostico_qualidade_id: 'diag_qual_01',
      receita_preparacao_id: 'rec_01',
      versao_rotulo: '1.0-preparado',
      hash_sha256_snapshot: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      status: StatusAutorizacaoDataset.VIGENTE,
      justificativa_autorizacao: 'Dados de vendas 2026 devidamente limpos, tipados e com 0 falhas críticas no Quality Gate.',
      autorizado_por_tipo: 'HUMANO',
      restricoes_aceitas_snapshot: JSON.stringify([{ problema_id: 'p1', motivo: 'Outlier aceito pelo negócio' }]),
      autorizado_em: '2026-09-27T10:00:00.000Z',
      revogado_em: null,
      motivo_revogacao: null,
    };

    expect(dataset.status).toBe(StatusAutorizacaoDataset.VIGENTE);
    expect(ROTULOS_STATUS_AUTORIZACAO_DATASET[dataset.status]).toBe('Vigente / Autorizado');
    expect(dataset.justificativa_autorizacao.length).toBeGreaterThanOrEqual(15);
    expect(dataset.hash_sha256_snapshot).toBeDefined();
    expect(dataset.restricoes_aceitas_snapshot).toBeDefined();
  });

  it('deve distinguir semanticamente Ativo Bruto de Ativo Preparado mantendo retrocompatibilidade', () => {
    const ativoBruto: AtivoDados = {
      id: 'asset_raw_01',
      demanda_id: 'dem_01',
      nome_arquivo: 'raw_vendas.csv',
      caminho_local: '/data/raw_vendas.csv',
      formato: FormatoArquivo.CSV,
      origem: 'Portal de Vendas',
      descricao_conteudo: 'Arquivo bruto recebido do cliente',
      granularidade: 'Transacional',
      periodo_inicio: null,
      periodo_fim: null,
      versao: '1',
      substitui_ativo_id: null,
      tamanho_bytes: 10240,
      total_linhas: 100,
      total_colunas: 5,
      hash_sha256: 'abc123hash',
      status: StatusAtivoDados.ATIVO,
      categoria_ativo: CategoriaAtivoDados.BRUTO_RECEBIDO,
      schema_inferido: null,
      data_recebimento: '2026-09-27T09:00:00.000Z',
      criado_em: '2026-09-27T09:00:00.000Z',
      atualizado_em: '2026-09-27T09:00:00.000Z',
    };

    const ativoPreparado: AtivoDados = {
      ...ativoBruto,
      id: 'asset_clean_01',
      nome_arquivo: 'clean_vendas.csv',
      caminho_local: '/data/clean_vendas.csv',
      formato: FormatoArquivo.BASE_TRATADA,
      descricao_conteudo: 'Arquivo preparado e tipado',
      categoria_ativo: CategoriaAtivoDados.PREPARADO_DERIVADO,
    };

    expect(ativoBruto.categoria_ativo).toBe(CategoriaAtivoDados.BRUTO_RECEBIDO);
    expect(ativoPreparado.categoria_ativo).toBe(CategoriaAtivoDados.PREPARADO_DERIVADO);
    expect(ROTULOS_CATEGORIA_ATIVO_DADOS[ativoBruto.categoria_ativo!]).toBe('Insumo Bruto Recebido');
    expect(ROTULOS_CATEGORIA_ATIVO_DADOS[ativoPreparado.categoria_ativo!]).toBe('Ativo Preparado / Derivado');

    // Normalização padrão retrocompatível para registros antigos sem categoria
    expect(normalizarCategoriaAtivoDados(undefined)).toBe(CategoriaAtivoDados.BRUTO_RECEBIDO);
    expect(normalizarCategoriaAtivoDados(null)).toBe(CategoriaAtivoDados.BRUTO_RECEBIDO);
    expect(normalizarCategoriaAtivoDados('PREPARADO_DERIVADO')).toBe(CategoriaAtivoDados.PREPARADO_DERIVADO);
  });

  it('deve conter rótulos corretos para todos os estados de autorização', () => {
    expect(ROTULOS_STATUS_AUTORIZACAO_DATASET[StatusAutorizacaoDataset.VIGENTE]).toBe('Vigente / Autorizado');
    expect(ROTULOS_STATUS_AUTORIZACAO_DATASET[StatusAutorizacaoDataset.REVOGADO]).toBe('Revogado pelo Analista');
    expect(ROTULOS_STATUS_AUTORIZACAO_DATASET[StatusAutorizacaoDataset.SUBSTITUIDO]).toBe('Substituído por Nova Versão');
  });
});
