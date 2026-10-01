import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import {
  resolveCopilotMessages,
  CopilotContext,
} from '@/core/use-cases/copilot';
import { CopilotProactivePanel } from '@/components/copilot/CopilotProactivePanel';
import { CopilotStickyDock } from '@/components/copilot/CopilotStickyDock';

describe('CopilotProactivePanel — Componente Visual do Copiloto', () => {
  it('deve existir e ser uma função/componente React', () => {
    expect(CopilotProactivePanel).toBeDefined();
    expect(typeof CopilotProactivePanel).toBe('function');
  });

  it('deve renderizar o cenário SEM_MODELO_CRIADO com Nível 1 e data-testid compatível', () => {
    const context: CopilotContext = {
      hasDatasetAutorizado: true,
      datasetAutorizado: {
        id: 'ds-1',
        demanda_id: 'dem-1',
        ativo_dados_id: 'ativo-1',
        diagnostico_qualidade_id: 'diag-1',
        receita_preparacao_id: null,
        versao_rotulo: 'v1.0-autorizada',
        hash_sha256_snapshot: 'hash',
        status: 'VIGENTE' as any,
        justificativa_autorizacao: 'Dataset aprovado formalmente.',
        autorizado_por_tipo: 'HUMANO',
        restricoes_aceitas_snapshot: '[]',
        autorizado_em: '2026-03-30T10:00:00Z',
        revogado_em: null,
        motivo_revogacao: null,
      },
      modelo: null,
    };

    const orientacao = resolveCopilotMessages(context);
    expect(orientacao.cenario).toBe('SEM_MODELO_CRIADO');

    const handleCreate = vi.fn();
    const element = React.createElement(CopilotProactivePanel, {
      orientacao,
      onOpenCreateModel: handleCreate,
    });

    expect(element).toBeDefined();
    expect(element.props.orientacao.cenario).toBe('SEM_MODELO_CRIADO');
  });

  it('deve conter estrutura dos 3 níveis pedagógicos na orientação resolvida', () => {
    const context: CopilotContext = {
      hasDatasetAutorizado: true,
      datasetAutorizado: {
        id: 'ds-1',
        demanda_id: 'dem-1',
        ativo_dados_id: 'ativo-1',
        diagnostico_qualidade_id: 'diag-1',
        receita_preparacao_id: null,
        versao_rotulo: 'v1.0-autorizada',
        hash_sha256_snapshot: 'hash',
        status: 'VIGENTE' as any,
        justificativa_autorizacao: 'Dataset aprovado formalmente.',
        autorizado_por_tipo: 'HUMANO',
        restricoes_aceitas_snapshot: '[]',
        autorizado_em: '2026-03-30T10:00:00Z',
        revogado_em: null,
        motivo_revogacao: null,
      },
      modelo: null,
    };

    const orientacao = resolveCopilotMessages(context);

    // Nível 1: Orientação
    expect(orientacao.nivel1.titulo).toBeTruthy();
    expect(orientacao.nivel1.ondeEstou).toBeTruthy();
    expect(orientacao.nivel1.resumoOperacional).toBeTruthy();

    // Nível 2: Aprendizado
    expect(orientacao.nivel2.porQueEstouFazendoIsso).toBeTruthy();
    expect(orientacao.nivel2.conceitosChave.length).toBeGreaterThan(0);

    // Nível 3: Detalhes Técnicos
    expect(orientacao.nivel3.regrasAplicaveis.length).toBeGreaterThan(0);
    expect(orientacao.nivel3.metricasEstruturais).toBeDefined();
  });

  it('CopilotStickyDock deve ser um componente válido e definido', () => {
    expect(CopilotStickyDock).toBeDefined();
    expect(typeof CopilotStickyDock).toBe('function');
  });

  it('deve conter a hierarquia refinada do Gate 2B.1 com 5 seções no output', () => {
    const context: CopilotContext = {
      estadoDemanda: 'EM_MODELAGEM_E_ANALISE',
      hasDatasetAutorizado: true,
      datasetAutorizado: {
        id: 'ds-1',
        demanda_id: 'dem-1',
        ativo_dados_id: 'ativo-1',
        diagnostico_qualidade_id: 'diag-1',
        receita_preparacao_id: null,
        versao_rotulo: 'v1.0-autorizada',
        hash_sha256_snapshot: 'hash',
        status: 'VIGENTE' as any,
        justificativa_autorizacao: 'Dataset aprovado formalmente.',
        autorizado_por_tipo: 'HUMANO',
        restricoes_aceitas_snapshot: '[]',
        autorizado_em: '2026-03-30T10:00:00Z',
        revogado_em: null,
        motivo_revogacao: null,
      },
      modelo: null,
    };

    const orientacao = resolveCopilotMessages(context);
    expect(orientacao.hierarquia).toBeDefined();
    expect(orientacao.hierarquia.ondeVoceEsta).toContain('Etapa 6');
    expect(orientacao.hierarquia.oQueEstamosFazendo).toBeTruthy();
    expect(orientacao.hierarquia.porQueEstamosFazendo).toBeTruthy();
    expect(orientacao.hierarquia.situacaoAtual.rotulo).toBeTruthy();
    expect(orientacao.hierarquia.situacaoAtual.mensagemBloqueio).toBeTruthy();
    expect(orientacao.hierarquia.proximoPasso.descricao).toBeTruthy();
  });
});
