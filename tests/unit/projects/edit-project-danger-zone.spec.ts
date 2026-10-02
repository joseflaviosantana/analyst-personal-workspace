import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EditProjectForm } from '@/app/projects/[id]/edit/edit-form';
import { DeleteProjectModal } from '@/components/projects/DeleteProjectModal';
import { Projeto } from '@/core/domain/entities/projeto';

// Mock do next/navigation para testes unitários de componentes
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock da Server Action para testes de componente
vi.mock('@/app/actions/project-actions', () => ({
  updateProjectAction: vi.fn(),
  deleteProjectAction: vi.fn(),
}));

describe('Unit Tests: UI da Zona de Perigo e DeleteProjectModal (Subgate 2)', () => {
  const mockProjeto: Projeto = {
    id: 'proj_ui_test_1',
    nome: 'Projeto Piloto Teste UI',
    descricao: 'Contexto do projeto para teste de UI',
    status: 'ATIVO',
    data_inicio: '2026-02-01',
    data_conclusao_prevista: '2026-06-01',
    data_conclusao_real: null,
    criado_em: '2026-02-01T00:00:00.000Z',
    atualizado_em: '2026-02-01T00:00:00.000Z',
  };

  describe('1. Renderização da Zona de Perigo em EditProjectForm', () => {
    it('deve renderizar a seção "Zona de Perigo" de forma separada do formulário de edição', () => {
      const html = renderToStaticMarkup(
        React.createElement(EditProjectForm, {
          project: mockProjeto,
          totalDemandas: 0,
        })
      );

      expect(html).toContain('data-testid="project-danger-zone"');
      expect(html).toContain('Zona de Perigo');
      expect(html).toContain('Excluir projeto');
      expect(html).toContain('A exclusão é permanente e irreversível');
      expect(html).toContain('data-testid="btn-open-delete-project-modal"');
    });

    it('deve apresentar a quantidade de demandas vinculadas igual a 0 corretamente', () => {
      const html = renderToStaticMarkup(
        React.createElement(EditProjectForm, {
          project: mockProjeto,
          totalDemandas: 0,
        })
      );

      expect(html).toContain('data-testid="danger-zone-demand-count"');
      expect(html).toContain('0 demanda(s)');
      expect(html).not.toContain('data-testid="danger-zone-blocked-warning"');
    });

    it('deve apresentar aviso de bloqueio quando houver 1 ou mais demandas vinculadas', () => {
      const html = renderToStaticMarkup(
        React.createElement(EditProjectForm, {
          project: mockProjeto,
          totalDemandas: 3,
        })
      );

      expect(html).toContain('3 demanda(s)');
      expect(html).toContain('data-testid="danger-zone-blocked-warning"');
      expect(html).toContain(
        'Não é possível excluir este projeto porque existem 3 demanda(s) vinculada(s). Trate as demandas vinculadas antes de prosseguir.'
      );
    });

    it('deve preservar integralmente o formulário de edição normal e o botão "Salvar Alterações"', () => {
      const html = renderToStaticMarkup(
        React.createElement(EditProjectForm, {
          project: mockProjeto,
          totalDemandas: 0,
        })
      );

      expect(html).toContain('data-testid="form-edit-project"');
      expect(html).toContain('data-testid="input-edit-project-name"');
      expect(html).toContain('data-testid="input-edit-project-description"');
      expect(html).toContain('data-testid="select-edit-project-status"');
      expect(html).toContain('data-testid="btn-submit-edit-project"');
      expect(html).toContain('Salvar Alterações');
      expect(html).toContain('Projeto Piloto Teste UI');
    });
  });

  describe('2. Modal de Confirmação (DeleteProjectModal)', () => {
    it('deve retornar null e não renderizar quando isOpen for false', () => {
      const html = renderToStaticMarkup(
        React.createElement(DeleteProjectModal, {
          isOpen: false,
          onClose: vi.fn(),
          project: mockProjeto,
          totalDemandas: 0,
        })
      );

      expect(html).toBe('');
    });

    it('deve renderizar modal de confirmação completo para projeto com 0 demandas', () => {
      const html = renderToStaticMarkup(
        React.createElement(DeleteProjectModal, {
          isOpen: true,
          onClose: vi.fn(),
          project: mockProjeto,
          totalDemandas: 0,
        })
      );

      expect(html).toContain('data-testid="delete-project-modal"');
      expect(html).toContain('Excluir Projeto');
      expect(html).toContain('data-testid="delete-project-warning-alert"');
      expect(html).toContain('Aviso de Irreversibilidade');
      expect(html).toContain('Projeto Piloto Teste UI');
      expect(html).toContain('0 demanda(s)');
      expect(html).toContain('data-testid="btn-cancel-delete-project"');
      expect(html).toContain('data-testid="btn-confirm-delete-project"');
      expect(html).toContain('data-testid="input-delete-project-reason"');
    });

    it('deve renderizar alerta de bloqueio quando projeto possuir demandas vinculadas', () => {
      const html = renderToStaticMarkup(
        React.createElement(DeleteProjectModal, {
          isOpen: true,
          onClose: vi.fn(),
          project: mockProjeto,
          totalDemandas: 2,
        })
      );

      expect(html).toContain('data-testid="delete-project-modal"');
      expect(html).toContain('data-testid="delete-project-blocked-alert"');
      expect(html).toContain('Operação Bloqueada pela Governança');
      expect(html).toContain('2 demanda(s) vinculada(s)');
      expect(html).toContain('Entendido / Fechar');
      // Não exibe o botão destrutivo de confirmação
      expect(html).not.toContain('data-testid="btn-confirm-delete-project"');
    });
  });
});
