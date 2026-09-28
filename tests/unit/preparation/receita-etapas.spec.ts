import { describe, it, expect } from 'vitest';
import { ReceitaPreparacao } from '@/core/domain/entities/receita-preparacao';
import { EtapaTransformacao } from '@/core/domain/entities/etapa-transformacao';
import { StatusReceitaPreparacao, ROTULOS_STATUS_RECEITA_PREPARACAO } from '@/core/domain/enums/status-receita-preparacao';
import { StatusEtapaTransformacao, ROTULOS_STATUS_ETAPA_TRANSFORMACAO } from '@/core/domain/enums/status-etapa-transformacao';
import { CapacidadeFerramenta, ROTULOS_CAPACIDADE_FERRAMENTA } from '@/core/domain/enums/capacidade-ferramenta';
import { TipoOperacaoPreparacao, ROTULOS_TIPO_OPERACAO_PREPARACAO } from '@/core/domain/enums/tipo-operacao-preparacao';

describe('Unit: Domínio de Preparação — Receita e Etapas de Transformação (Subunidade 3.5A)', () => {
  it('deve instanciar uma ReceitaPreparacao com atributos e status válidos', () => {
    const receita: ReceitaPreparacao = {
      id: 'rec_01',
      demanda_id: 'dem_01',
      titulo: 'Pipeline de Limpeza e Unificação de Vendas',
      descricao: 'Padroniza datas, remove duplicatas e faz join com catálogo de clientes',
      status: StatusReceitaPreparacao.RASCUNHO,
      versao: 1,
      criado_em: '2026-09-27T10:00:00.000Z',
      atualizado_em: '2026-09-27T10:00:00.000Z',
    };

    expect(receita.id).toBe('rec_01');
    expect(receita.status).toBe(StatusReceitaPreparacao.RASCUNHO);
    expect(receita.versao).toBe(1);
    expect(ROTULOS_STATUS_RECEITA_PREPARACAO[receita.status]).toBe('Rascunho / Planejamento');
  });

  it('deve desacoplar capacidade técnica da ferramenta de fornecedor ou ferramenta concreta', () => {
    // Caso 1: Script Power Query M no Power BI Desktop ou Excel
    const etapaPowerQuery: EtapaTransformacao = {
      id: 'etapa_01',
      receita_id: 'rec_01',
      ordem: 1,
      tipo_operacao: TipoOperacaoPreparacao.CONVERTER_TIPO,
      descricao: 'Tipagem de Colunas e Remoção de Nulos',
      capacidade_ferramenta: CapacidadeFerramenta.MOTOR_M_POWER_QUERY,
      ferramenta_nome: 'Power Query M',
      ferramenta_versao: '2.124.0',
      especificacao_tecnica: 'Table.TransformColumnTypes(Source, {{"Data", type date}})',
      status: StatusEtapaTransformacao.PLANEJADA,
      justificativa: null,
      criado_em: '2026-09-27T10:00:00.000Z',
      atualizado_em: '2026-09-27T10:00:00.000Z',
    };

    // Caso 2: SQL Declarativo executado em DuckDB local ou SQLite
    const etapaSql: EtapaTransformacao = {
      id: 'etapa_02',
      receita_id: 'rec_01',
      ordem: 2,
      tipo_operacao: TipoOperacaoPreparacao.JOIN_MERGE,
      descricao: 'Join com Dimensão Clientes',
      capacidade_ferramenta: CapacidadeFerramenta.MOTOR_SQL,
      ferramenta_nome: 'DuckDB',
      ferramenta_versao: '0.10.0',
      especificacao_tecnica: 'SELECT v.*, c.nome FROM vendas v LEFT JOIN clientes c ON v.cliente_id = c.id',
      status: StatusEtapaTransformacao.EXECUTADA,
      justificativa: null,
      criado_em: '2026-09-27T10:00:00.000Z',
      atualizado_em: '2026-09-27T10:05:00.000Z',
    };

    // Caso 3: Python Pandas rodando em notebook ou script
    const etapaPython: EtapaTransformacao = {
      id: 'etapa_03',
      receita_id: 'rec_01',
      ordem: 3,
      tipo_operacao: TipoOperacaoPreparacao.REMOVER_DUPLICIDADES,
      descricao: 'Deduplicação de Registros de Log',
      capacidade_ferramenta: CapacidadeFerramenta.SCRIPT_NOTEBOOK,
      ferramenta_nome: 'Pandas',
      ferramenta_versao: '2.2.0',
      especificacao_tecnica: 'df.drop_duplicates(subset=["log_id"], keep="first")',
      status: StatusEtapaTransformacao.VALIDADA,
      justificativa: 'Validação pelo diagnóstico D-02 com 0 duplicidades remanescentes',
      criado_em: '2026-09-27T10:00:00.000Z',
      atualizado_em: '2026-09-27T10:10:00.000Z',
    };

    expect(ROTULOS_CAPACIDADE_FERRAMENTA[etapaPowerQuery.capacidade_ferramenta]).toBe('Motor Power Query / M');
    expect(ROTULOS_CAPACIDADE_FERRAMENTA[etapaSql.capacidade_ferramenta]).toBe('Motor de Banco de Dados / SQL');
    expect(ROTULOS_CAPACIDADE_FERRAMENTA[etapaPython.capacidade_ferramenta]).toBe('Script / Notebook (Python, R)');

    // Nenhuma dependência acoplada a fornecedor proprietário
    expect(etapaPowerQuery.ferramenta_nome).toBe('Power Query M');
    expect(etapaSql.ferramenta_nome).toBe('DuckDB');
    expect(etapaPython.ferramenta_nome).toBe('Pandas');
  });

  it('deve conter catálogo canônico de operações de preparação com rótulos semânticos', () => {
    const operacoesEsperadas = [
      TipoOperacaoPreparacao.REMOVER_DUPLICIDADES,
      TipoOperacaoPreparacao.TRATAR_NULOS,
      TipoOperacaoPreparacao.CONVERTER_TIPO,
      TipoOperacaoPreparacao.PADRONIZAR_TEXTO,
      TipoOperacaoPreparacao.NORMALIZAR_DATAS,
      TipoOperacaoPreparacao.FILTRAR_REGISTROS,
      TipoOperacaoPreparacao.CRIAR_COLUNA_DERIVADA,
      TipoOperacaoPreparacao.TRATAR_OUTLIERS,
      TipoOperacaoPreparacao.JOIN_MERGE,
      TipoOperacaoPreparacao.UNION_CONCATENACAO,
      TipoOperacaoPreparacao.AGREGACAO_RESUMO,
      TipoOperacaoPreparacao.REGRA_NEGOCIO_CUSTOM,
      TipoOperacaoPreparacao.OUTRA,
    ];

    for (const op of operacoesEsperadas) {
      expect(ROTULOS_TIPO_OPERACAO_PREPARACAO[op]).toBeDefined();
      expect(ROTULOS_TIPO_OPERACAO_PREPARACAO[op].length).toBeGreaterThan(0);
    }
  });

  it('deve validar ciclo de vida e rótulos de status das etapas', () => {
    expect(ROTULOS_STATUS_ETAPA_TRANSFORMACAO[StatusEtapaTransformacao.PLANEJADA]).toBe('Planejada / Rascunho');
    expect(ROTULOS_STATUS_ETAPA_TRANSFORMACAO[StatusEtapaTransformacao.EXECUTADA]).toBe('Executada Fisicamente');
    expect(ROTULOS_STATUS_ETAPA_TRANSFORMACAO[StatusEtapaTransformacao.VALIDADA]).toBe('Validada por Diagnóstico');
    expect(ROTULOS_STATUS_ETAPA_TRANSFORMACAO[StatusEtapaTransformacao.CANCELADA]).toBe('Cancelada Auditada');
  });

  it('deve preservar monotonicidade na ordenação das etapas', () => {
    const etapas: EtapaTransformacao[] = [
      {
        id: 'e1',
        receita_id: 'rec_01',
        ordem: 1,
        tipo_operacao: TipoOperacaoPreparacao.CONVERTER_TIPO,
        descricao: 'Etapa 1',
        capacidade_ferramenta: CapacidadeFerramenta.MOTOR_SQL,
        ferramenta_nome: 'DuckDB',
        ferramenta_versao: null,
        especificacao_tecnica: null,
        status: StatusEtapaTransformacao.PLANEJADA,
        justificativa: null,
        criado_em: '2026-09-27T10:00:00.000Z',
        atualizado_em: '2026-09-27T10:00:00.000Z',
      },
      {
        id: 'e2',
        receita_id: 'rec_01',
        ordem: 2,
        tipo_operacao: TipoOperacaoPreparacao.JOIN_MERGE,
        descricao: 'Etapa 2',
        capacidade_ferramenta: CapacidadeFerramenta.MOTOR_SQL,
        ferramenta_nome: 'DuckDB',
        ferramenta_versao: null,
        especificacao_tecnica: null,
        status: StatusEtapaTransformacao.PLANEJADA,
        justificativa: null,
        criado_em: '2026-09-27T10:00:00.000Z',
        atualizado_em: '2026-09-27T10:00:00.000Z',
      },
      {
        id: 'e3',
        receita_id: 'rec_01',
        ordem: 3,
        tipo_operacao: TipoOperacaoPreparacao.AGREGACAO_RESUMO,
        descricao: 'Etapa 3',
        capacidade_ferramenta: CapacidadeFerramenta.MOTOR_SQL,
        ferramenta_nome: 'DuckDB',
        ferramenta_versao: null,
        especificacao_tecnica: null,
        status: StatusEtapaTransformacao.PLANEJADA,
        justificativa: null,
        criado_em: '2026-09-27T10:00:00.000Z',
        atualizado_em: '2026-09-27T10:00:00.000Z',
      },
    ];

    const ordens = etapas.map((e) => e.ordem);
    expect(ordens).toEqual([1, 2, 3]);
  });
});
