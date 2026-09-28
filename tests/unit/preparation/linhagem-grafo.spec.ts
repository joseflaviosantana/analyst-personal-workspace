import { describe, it, expect } from 'vitest';
import { LinhagemAtivos } from '@/core/domain/entities/linhagem-ativos';
import { PapelEntradaLinhagem, ROTULOS_PAPEL_ENTRADA_LINHAGEM } from '@/core/domain/enums/papel-entrada-linhagem';

describe('Unit: Domínio de Preparação — Grafo de Linhagem e Proveniência (Subunidade 3.5A)', () => {
  it('deve representar arestas direcionadas sem duplicação semântica de tipo de transformação', () => {
    const aresta: LinhagemAtivos = {
      id: 'edge_01',
      demanda_id: 'dem_01',
      ativo_origem_id: 'asset_bruto_vendas',
      ativo_destino_id: 'asset_preparado_vendas',
      papel_entrada: PapelEntradaLinhagem.ORIGEM_UNICA,
      etapa_transformacao_id: 'etapa_01',
      criado_em: '2026-09-27T10:00:00.000Z',
    };

    expect(aresta.ativo_origem_id).toBe('asset_bruto_vendas');
    expect(aresta.ativo_destino_id).toBe('asset_preparado_vendas');
    expect(aresta.papel_entrada).toBe(PapelEntradaLinhagem.ORIGEM_UNICA);
    expect(ROTULOS_PAPEL_ENTRADA_LINHAGEM[aresta.papel_entrada]).toBe('Origem Única Direta');
  });

  it('deve suportar topologia de convergência Join/Lookup (N entradas -> 1 saída)', () => {
    const arestaPrincipal: LinhagemAtivos = {
      id: 'edge_join_principal',
      demanda_id: 'dem_01',
      ativo_origem_id: 'asset_fato_pedidos',
      ativo_destino_id: 'asset_pedidos_enriquecidos',
      papel_entrada: PapelEntradaLinhagem.FONTE_PRINCIPAL,
      etapa_transformacao_id: 'etapa_join',
      criado_em: '2026-09-27T10:00:00.000Z',
    };

    const arestaSecundaria: LinhagemAtivos = {
      id: 'edge_join_secundario',
      demanda_id: 'dem_01',
      ativo_origem_id: 'asset_dim_clientes',
      ativo_destino_id: 'asset_pedidos_enriquecidos',
      papel_entrada: PapelEntradaLinhagem.LOOKUP_SECUNDARIA,
      etapa_transformacao_id: 'etapa_join',
      criado_em: '2026-09-27T10:00:00.000Z',
    };

    const origens = [arestaPrincipal, arestaSecundaria];
    expect(origens.map((o) => o.ativo_origem_id)).toEqual([
      'asset_fato_pedidos',
      'asset_dim_clientes',
    ]);
    expect(new Set(origens.map((o) => o.ativo_destino_id)).size).toBe(1);
    expect(origens[0].ativo_destino_id).toBe('asset_pedidos_enriquecidos');
    expect(ROTULOS_PAPEL_ENTRADA_LINHAGEM[arestaSecundaria.papel_entrada]).toBe('Tabela Secundária / Lookup de Cruzamento');
  });

  it('deve suportar topologia de divergência Split (1 entrada -> M saídas)', () => {
    const arestaSaidaA: LinhagemAtivos = {
      id: 'edge_split_a',
      demanda_id: 'dem_01',
      ativo_origem_id: 'asset_bruto_multicanal',
      ativo_destino_id: 'asset_vendas_online',
      papel_entrada: PapelEntradaLinhagem.FONTE_PRINCIPAL,
      etapa_transformacao_id: 'etapa_split_online',
      criado_em: '2026-09-27T10:00:00.000Z',
    };

    const arestaSaidaB: LinhagemAtivos = {
      id: 'edge_split_b',
      demanda_id: 'dem_01',
      ativo_origem_id: 'asset_bruto_multicanal',
      ativo_destino_id: 'asset_vendas_loja_fisica',
      papel_entrada: PapelEntradaLinhagem.FONTE_PRINCIPAL,
      etapa_transformacao_id: 'etapa_split_fisica',
      criado_em: '2026-09-27T10:00:00.000Z',
    };

    const destinos = [arestaSaidaA, arestaSaidaB];
    expect(new Set(destinos.map((d) => d.ativo_origem_id)).size).toBe(1);
    expect(destinos.map((d) => d.ativo_destino_id)).toEqual([
      'asset_vendas_online',
      'asset_vendas_loja_fisica',
    ]);
  });

  it('deve suportar topologia Union / Append (N entradas complementares -> 1 saída)', () => {
    const arestaMes1: LinhagemAtivos = {
      id: 'edge_union_01',
      demanda_id: 'dem_01',
      ativo_origem_id: 'asset_vendas_jan',
      ativo_destino_id: 'asset_vendas_anual',
      papel_entrada: PapelEntradaLinhagem.FONTE_PRINCIPAL,
      etapa_transformacao_id: 'etapa_union',
      criado_em: '2026-09-27T10:00:00.000Z',
    };

    const arestaMes2: LinhagemAtivos = {
      id: 'edge_union_02',
      demanda_id: 'dem_01',
      ativo_origem_id: 'asset_vendas_fev',
      ativo_destino_id: 'asset_vendas_anual',
      papel_entrada: PapelEntradaLinhagem.UNION_PARTE,
      etapa_transformacao_id: 'etapa_union',
      criado_em: '2026-09-27T10:00:00.000Z',
    };

    expect(ROTULOS_PAPEL_ENTRADA_LINHAGEM[arestaMes2.papel_entrada]).toBe('Parte Integrante de União');
    expect(arestaMes1.ativo_destino_id).toBe(arestaMes2.ativo_destino_id);
  });
});
