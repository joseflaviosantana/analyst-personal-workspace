import { describe, it, expect } from 'vitest';
import { SnapshotDeltaCalculator } from '@/core/domain/evidence-events/snapshot-delta-calculator';
import { SnapshotAnalitico } from '@/core/domain/evidence-events/snapshot-delta-types';

describe('Evidence Event Engine: Snapshot & Delta Analítico (Subgate 3.5B.1)', () => {
  it('13. deve criar snapshot determinístico com métricas e metadados', () => {
    const snapshot = SnapshotDeltaCalculator.criarSnapshot(
      'ativo-123',
      'ATIVO_DADOS',
      {
        total_linhas: 10000,
        nulos_cliente_id: 184,
        duplicidades: 45,
        valido: true,
      },
      { origem: 'ETL_VENDAS' },
      '2026-09-30T10:00:00Z'
    );

    expect(snapshot.artefato_id).toBe('ativo-123');
    expect(snapshot.artefato_tipo).toBe('ATIVO_DADOS');
    expect(snapshot.timestamp).toBe('2026-09-30T10:00:00Z');
    expect(snapshot.metricas.total_linhas).toBe(10000);
    expect(snapshot.metricas.nulos_cliente_id).toBe(184);
    expect(snapshot.metadados).toEqual({ origem: 'ETL_VENDAS' });
  });

  it('14. deve calcular deltas determinísticos: aumento, redução e inalterado', () => {
    const snapshotAntes: SnapshotAnalitico = {
      timestamp: '2026-09-30T10:00:00Z',
      artefato_id: 'ativo-123',
      artefato_tipo: 'ATIVO_DADOS',
      metricas: {
        total_linhas: 10000,
        duplicidades: 184,
        taxa_conformidade: 98.16,
        status: 'EM_ANALISE',
      },
    };

    const snapshotDepois: SnapshotAnalitico = {
      timestamp: '2026-09-30T10:30:00Z',
      artefato_id: 'ativo-123',
      artefato_tipo: 'ATIVO_DADOS',
      metricas: {
        total_linhas: 9816, // Reduziu 184
        duplicidades: 0, // Reduziu 184
        taxa_conformidade: 100, // Aumentou 1.84
        status: 'HOMOLOGADO', // Modificado
      },
    };

    const deltas = SnapshotDeltaCalculator.calcularDeltas(snapshotAntes, snapshotDepois);

    expect(deltas).toHaveLength(4);

    // 1. duplicidades (Redução)
    const deltaDuplicidades = deltas.find((d) => d.campo_metrica === 'duplicidades');
    expect(deltaDuplicidades).toBeDefined();
    expect(deltaDuplicidades?.valor_anterior).toBe(184);
    expect(deltaDuplicidades?.valor_posterior).toBe(0);
    expect(deltaDuplicidades?.variacao_absoluta).toBe(-184);
    expect(deltaDuplicidades?.variacao_percentual).toBe(-100);
    expect(deltaDuplicidades?.tipo_variacao).toBe('REDUCAO');
    expect(deltaDuplicidades?.descricao_impacto).toContain('reduziu de 184 para 0');

    // 2. taxa_conformidade (Aumento)
    const deltaTaxa = deltas.find((d) => d.campo_metrica === 'taxa_conformidade');
    expect(deltaTaxa?.valor_anterior).toBe(98.16);
    expect(deltaTaxa?.valor_posterior).toBe(100);
    expect(deltaTaxa?.variacao_absoluta).toBe(1.84);
    expect(deltaTaxa?.tipo_variacao).toBe('AUMENTO');

    // 3. status (Modificado não numérico)
    const deltaStatus = deltas.find((d) => d.campo_metrica === 'status');
    expect(deltaStatus?.tipo_variacao).toBe('MODIFICADO');
    expect(deltaStatus?.descricao_impacto).toContain('alterada de "EM_ANALISE" para "HOMOLOGADO"');
  });

  it('deve identificar métricas inalteradas e tratar divisor zero com segurança', () => {
    const antes: SnapshotAnalitico = {
      timestamp: '2026-09-30T10:00:00Z',
      artefato_id: 'ativo-1',
      artefato_tipo: 'ATIVO',
      metricas: {
        falhas_iniciais: 0,
        constante: 50,
      },
    };

    const depois: SnapshotAnalitico = {
      timestamp: '2026-09-30T10:05:00Z',
      artefato_id: 'ativo-1',
      artefato_tipo: 'ATIVO',
      metricas: {
        falhas_iniciais: 5, // 0 -> 5
        constante: 50, // Inalterado
      },
    };

    const deltas = SnapshotDeltaCalculator.calcularDeltas(antes, depois);

    const deltaFalhas = deltas.find((d) => d.campo_metrica === 'falhas_iniciais');
    expect(deltaFalhas?.variacao_absoluta).toBe(5);
    expect(deltaFalhas?.variacao_percentual).toBe(100); // Divisão segura por zero
    expect(deltaFalhas?.tipo_variacao).toBe('AUMENTO');

    const deltaConstante = deltas.find((d) => d.campo_metrica === 'constante');
    expect(deltaConstante?.tipo_variacao).toBe('INALTERADO');
  });
});
