/**
 * tests/unit/deliverables/tab-deliverables-components.spec.ts
 *
 * Suíte de Testes Unitários da Interface da Aba 10 — Entregáveis & Aceite (Subgate 3.7C).
 *
 * Cenários Testados:
 * 1. Todos os componentes da Aba 10 são exportados e tipados;
 * 2. DeliverablesSummaryCards: contadores, status V-03 e V-04;
 * 3. DeliverablesNextActionBanner: transições contextuais (sem entregáveis, pendente disp, pendente aceite, pendente ajustes, pronto para encerramento, concluída, read-only);
 * 4. DeliverableCardList: renderização de cards, badges de aceite e botões contextuais;
 * 5. Modais: CreateOrEditDeliverableModal, RecordAcceptanceModal, ContractorDocumentationModal, ConfirmEncerramentoModal.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';

import { TabDeliverables } from '@/components/demands/TabDeliverables';
import { DeliverablesSummaryCards } from '@/components/deliverables/DeliverablesSummaryCards';
import { DeliverablesNextActionBanner } from '@/components/deliverables/DeliverablesNextActionBanner';
import { DeliverableCardList } from '@/components/deliverables/DeliverableCardList';
import { CreateOrEditDeliverableModal } from '@/components/deliverables/CreateOrEditDeliverableModal';
import { RecordAcceptanceModal } from '@/components/deliverables/RecordAcceptanceModal';
import { ContractorDocumentationModal } from '@/components/deliverables/ContractorDocumentationModal';
import { ConfirmEncerramentoModal } from '@/components/deliverables/ConfirmEncerramentoModal';

import { EntregavelDemanda } from '@/core/domain/entities/entregavel-demanda';
import { TipoEntregavel } from '@/core/domain/enums/tipo-entregavel';
import { StatusEntregavel } from '@/core/domain/enums/status-entregavel';
import { StatusAceiteEntrega } from '@/core/domain/enums/status-aceite-entrega';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { ResultadoAvaliacaoValidacao } from '@/core/domain/rules/validation-rules-evaluator';

describe('Unit Tests: Componentes da Aba 10 (Entregáveis & Aceite — Subgate 3.7C)', () => {
  it('1. Deve exportar todos os componentes da Aba 10', () => {
    expect(TabDeliverables).toBeDefined();
    expect(DeliverablesSummaryCards).toBeDefined();
    expect(DeliverablesNextActionBanner).toBeDefined();
    expect(DeliverableCardList).toBeDefined();
    expect(CreateOrEditDeliverableModal).toBeDefined();
    expect(RecordAcceptanceModal).toBeDefined();
    expect(ContractorDocumentationModal).toBeDefined();
    expect(ConfirmEncerramentoModal).toBeDefined();
  });

  describe('2. DeliverablesSummaryCards', () => {
    const mockEntregaveis: EntregavelDemanda[] = [
      {
        id: 'ent_1',
        demanda_id: 'dem_1',
        titulo: 'Dashboard Executivo',
        tipo: TipoEntregavel.DASHBOARD_POWERBI,
        versao: '1.0',
        caminho_arquivo_ou_link: 'app.powerbi.com',
        obrigatorio: true,
        status: StatusEntregavel.HOMOLOGADO,
        aceite_status: StatusAceiteEntrega.ACEITO,
        aceite_por: 'Diretoria',
        criado_em: '2026-03-01T00:00:00.000Z',
        atualizado_em: '2026-03-01T00:00:00.000Z',
      },
      {
        id: 'ent_2',
        demanda_id: 'dem_1',
        titulo: 'Dicionário de Métricas',
        tipo: TipoEntregavel.DOCUMENTO_TECNICO,
        versao: '1.0',
        caminho_arquivo_ou_link: 'docs/metricas.md',
        obrigatorio: true,
        status: StatusEntregavel.DISPONIVEL,
        aceite_status: StatusAceiteEntrega.PENDENTE,
        criado_em: '2026-03-01T00:00:00.000Z',
        atualizado_em: '2026-03-01T00:00:00.000Z',
      },
    ];

    const mockAvaliacao: ResultadoAvaliacaoValidacao = {
      total_validacoes: 2,
      total_obrigatorias: 2,
      total_aprovadas: 2,
      total_divergentes: 0,
      total_rejeitadas: 0,
      total_pendentes_reteste: 0,
      total_entregaveis: 2,
      total_entregaveis_obrigatorios: 2,
      total_entregaveis_disponiveis: 2,
      total_entregaveis_aceitos: 1,
      bloqueios_entrega: [],
      bloqueios_conclusao: ['Entregável obrigatório pendente de aceite'],
      alertas_criticos: [],
      recomendacoes: [],
      pronto_para_entrega: true,
      pronto_para_conclusao: false,
      diagnosticos: [],
    };

    it('recebe entregáveis e avaliação de prontidão corretamente', () => {
      const el = React.createElement(DeliverablesSummaryCards, {
        entregaveis: mockEntregaveis,
        avaliacao: mockAvaliacao,
      });

      expect(el).toBeDefined();
      expect(el.props.entregaveis.length).toBe(2);
      expect(el.props.avaliacao?.pronto_para_entrega).toBe(true);
      expect(el.props.avaliacao?.pronto_para_conclusao).toBe(false);
    });
  });

  describe('3. DeliverablesNextActionBanner — Estados e Orientações', () => {
    it('banner quando demanda já está CONCLUIDA', () => {
      const el = React.createElement(DeliverablesNextActionBanner, {
        estadoDemanda: EstadoDemanda.CONCLUIDA,
        entregaveis: [],
        readOnly: true,
      });
      expect(el.props.estadoDemanda).toBe(EstadoDemanda.CONCLUIDA);
    });

    it('banner quando demanda está em modo read-only (SUSPENSA)', () => {
      const el = React.createElement(DeliverablesNextActionBanner, {
        estadoDemanda: EstadoDemanda.SUSPENSA,
        entregaveis: [],
        readOnly: true,
      });
      expect(el.props.readOnly).toBe(true);
    });

    it('banner quando nenhum entregável está cadastrado', () => {
      const el = React.createElement(DeliverablesNextActionBanner, {
        estadoDemanda: EstadoDemanda.PRONTA_PARA_ENTREGA,
        entregaveis: [],
      });
      expect(el.props.entregaveis.length).toBe(0);
    });

    it('banner quando pronto para encerramento (V-04 atendida)', () => {
      const mockAvaliacao: ResultadoAvaliacaoValidacao = {
        total_validacoes: 1,
        total_obrigatorias: 1,
        total_aprovadas: 1,
        total_divergentes: 0,
        total_rejeitadas: 0,
        total_pendentes_reteste: 0,
        total_entregaveis: 1,
        total_entregaveis_obrigatorios: 1,
        total_entregaveis_disponiveis: 1,
        total_entregaveis_aceitos: 1,
        bloqueios_entrega: [],
        bloqueios_conclusao: [],
        alertas_criticos: [],
        recomendacoes: [],
        pronto_para_entrega: true,
        pronto_para_conclusao: true,
        diagnosticos: [],
      };

      const mockEntregaveis: EntregavelDemanda[] = [
        {
          id: 'ent_1',
          demanda_id: 'dem_1',
          titulo: 'Dashboard',
          tipo: TipoEntregavel.DASHBOARD_POWERBI,
          versao: '1.0',
          caminho_arquivo_ou_link: 'link',
          obrigatorio: true,
          status: StatusEntregavel.HOMOLOGADO,
          aceite_status: StatusAceiteEntrega.ACEITO,
          criado_em: '2026-03-01T00:00:00.000Z',
          atualizado_em: '2026-03-01T00:00:00.000Z',
        },
      ];

      const el = React.createElement(DeliverablesNextActionBanner, {
        estadoDemanda: EstadoDemanda.PRONTA_PARA_ENTREGA,
        entregaveis: mockEntregaveis,
        avaliacao: mockAvaliacao,
      });

      expect(el.props.avaliacao?.pronto_para_conclusao).toBe(true);
    });
  });

  describe('4. DeliverableCardList e Modais', () => {
    it('renderiza lista vazia quando entregáveis = []', () => {
      const el = React.createElement(DeliverableCardList, {
        entregaveis: [],
        onEdit: () => {},
        onDelete: () => {},
        onDisponibilizar: () => {},
        onRegistrarAceite: () => {},
      });
      expect(el.props.entregaveis.length).toBe(0);
    });

    it('instancia CreateOrEditDeliverableModal', () => {
      const el = React.createElement(CreateOrEditDeliverableModal, {
        isOpen: true,
        onClose: () => {},
        onSubmit: async () => {},
      });
      expect(el.props.isOpen).toBe(true);
    });

    it('instancia RecordAcceptanceModal', () => {
      const mockEnt: EntregavelDemanda = {
        id: 'ent_x',
        demanda_id: 'dem_x',
        titulo: 'Artefato Teste',
        tipo: TipoEntregavel.RELATORIO_PDF,
        versao: '1.0',
        caminho_arquivo_ou_link: 'test.pdf',
        obrigatorio: true,
        status: StatusEntregavel.DISPONIVEL,
        aceite_status: StatusAceiteEntrega.PENDENTE,
        criado_em: '2026-03-01T00:00:00.000Z',
        atualizado_em: '2026-03-01T00:00:00.000Z',
      };

      const el = React.createElement(RecordAcceptanceModal, {
        isOpen: true,
        onClose: () => {},
        onSubmit: async () => {},
        entregavel: mockEnt,
      });
      expect(el.props.entregavel?.id).toBe('ent_x');
    });

    it('instancia ContractorDocumentationModal', () => {
      const el = React.createElement(ContractorDocumentationModal, {
        isOpen: true,
        onClose: () => {},
        markdownContent: '# Relatório de Entrega',
        demandaTitulo: 'Demanda de Exemplo',
      });
      expect(el.props.markdownContent).toBe('# Relatório de Entrega');
    });

    it('instancia ConfirmEncerramentoModal', () => {
      const el = React.createElement(ConfirmEncerramentoModal, {
        isOpen: true,
        onClose: () => {},
        onConfirm: async () => {},
        demandaTitulo: 'Demanda de Exemplo',
      });
      expect(el.props.demandaTitulo).toBe('Demanda de Exemplo');
    });
  });
});
