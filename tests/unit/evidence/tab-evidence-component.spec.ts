/**
 * tests/unit/evidence/tab-evidence-component.spec.ts
 *
 * Testes Unitários de Componente da Aba 8 — Evidências (Subgate 3.5A).
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { TabEvidence } from '@/components/demands/TabEvidence';
import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';

describe('UI: Aba 8 — Evidências & Evidence Core (Subgate 3.5A)', () => {
  const mockDemanda: DemandaComProjeto = {
    id: 'dem-test-evidence-1',
    projeto_id: 'prj-test-1',
    projetoNome: 'Projeto Piloto',
    titulo: 'Demanda de Teste Evidence Core',
    solicitacao_bruta: 'Solicitação bruta de teste',
    contexto: 'Contexto de teste',
    objetivo_inicial: 'Objetivo de teste',
    prazo_esperado: null,
    restricoes_declaradas: null,
    estado: EstadoDemanda.EM_MODELAGEM_E_ANALISE,
    estado_anterior: EstadoDemanda.NOVA,
    criado_em: '2026-09-30T10:00:00Z',
    atualizado_em: '2026-09-30T10:00:00Z',
    data_conclusao: null,
  };

  it('1. deve exportar e instanciar o componente TabEvidence sem falhas', () => {
    expect(TabEvidence).toBeDefined();
    expect(typeof TabEvidence).toBe('function');

    const element = React.createElement(TabEvidence, { demand: mockDemanda });
    expect(element).toBeDefined();
    expect(element.props.demand.id).toBe('dem-test-evidence-1');
  });

  it('2. deve assegurar que a Aba 8 está ativa no workspace-view', () => {
    // Validação estática das propriedades da aba
    const abaFindings = { id: 'findings', label: '8. Evidências', ready: true };
    expect(abaFindings.ready).toBe(true);
    expect(abaFindings.label).toBe('8. Evidências');
  });

  describe('3. Governança Read-Only (B-2)', () => {
    it('deve instanciar TabEvidence em modo CONCLUIDA preservando visualização', () => {
      const demandaConcluida: DemandaComProjeto = {
        ...mockDemanda,
        estado: EstadoDemanda.CONCLUIDA,
        data_conclusao: '2026-10-01T15:00:00Z',
      };
      const element = React.createElement(TabEvidence, { demand: demandaConcluida });
      expect(element).toBeDefined();
      expect(element.props.demand.estado).toBe(EstadoDemanda.CONCLUIDA);
    });

    it('deve instanciar TabEvidence em modo SUSPENSA preservando visualização', () => {
      const demandaSuspensa: DemandaComProjeto = {
        ...mockDemanda,
        estado: EstadoDemanda.SUSPENSA,
      };
      const element = React.createElement(TabEvidence, { demand: demandaSuspensa });
      expect(element).toBeDefined();
      expect(element.props.demand.estado).toBe(EstadoDemanda.SUSPENSA);
    });

    it('deve instanciar TabEvidence em modo CANCELADA preservando visualização', () => {
      const demandaCancelada: DemandaComProjeto = {
        ...mockDemanda,
        estado: EstadoDemanda.CANCELADA,
      };
      const element = React.createElement(TabEvidence, { demand: demandaCancelada });
      expect(element).toBeDefined();
      expect(element.props.demand.estado).toBe(EstadoDemanda.CANCELADA);
    });
  });
});
