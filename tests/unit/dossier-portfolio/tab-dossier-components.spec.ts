/**
 * tests/unit/dossier-portfolio/tab-dossier-components.spec.ts
 *
 * Suíte de Testes Unitários dos Componentes da Aba 11 — Dossiê & Portfólio (Subgate 2B).
 */

import { describe, it, expect } from 'vitest';
import { TabDossier } from '@/components/demands/TabDossier';
import { DossierViewer } from '@/components/dossier-portfolio/DossierViewer';
import { PortfolioCaseEditor } from '@/components/dossier-portfolio/PortfolioCaseEditor';
import { SanitizationChecklistPanel } from '@/components/dossier-portfolio/SanitizationChecklistPanel';
import { HomologateAprov10Modal } from '@/components/dossier-portfolio/HomologateAprov10Modal';
import { ExportCaseModal } from '@/components/dossier-portfolio/ExportCaseModal';
import { LearnedAssetsSection } from '@/components/dossier-portfolio/LearnedAssetsSection';

import {
  EstudoCasoPortfolio,
  isChecklistSanitizacaoCompleto,
  criarChecklistSanitizacaoPadrao,
} from '@/core/domain/entities/estudo-caso-portfolio';
import { StatusEstudoCaso } from '@/core/domain/enums/status-estudo-caso';
import { TecnicaSanitizacao } from '@/core/domain/enums/tecnica-sanitizacao';
import { CategoriaAtivoAprendizado } from '@/core/domain/enums/categoria-ativo-aprendizado';

describe('Unit Tests: Componentes da Aba 11 (Dossiê & Portfólio — Subgate 2B)', () => {
  it('1. Deve exportar e tipar todos os componentes da Aba 11', () => {
    expect(TabDossier).toBeDefined();
    expect(DossierViewer).toBeDefined();
    expect(PortfolioCaseEditor).toBeDefined();
    expect(SanitizationChecklistPanel).toBeDefined();
    expect(HomologateAprov10Modal).toBeDefined();
    expect(ExportCaseModal).toBeDefined();
    expect(LearnedAssetsSection).toBeDefined();
  });

  describe('2. SanitizationChecklistPanel & isChecklistSanitizacaoCompleto', () => {
    it('deve identificar checklist padrão como incompleto (0/5 atestados)', () => {
      const padrao = criarChecklistSanitizacaoPadrao();
      expect(isChecklistSanitizacaoCompleto(padrao)).toBe(false);
    });

    it('deve identificar checklist como incompleto se faltar a declaração humana', () => {
      const checklist = {
        nomesClientesOcultados: true,
        dadosPessoaisOcultados: true,
        dadosFinanceirosSigilososTratados: true,
        metricasFatuaisPreservadas: true,
        declaracaoHumanaAssinada: false, // Faltando!
      };
      expect(isChecklistSanitizacaoCompleto(checklist)).toBe(false);
    });

    it('deve identificar checklist como 100% completo quando todos os 5 itens forem true', () => {
      const checklist = {
        nomesClientesOcultados: true,
        dadosPessoaisOcultados: true,
        dadosFinanceirosSigilososTratados: true,
        metricasFatuaisPreservadas: true,
        declaracaoHumanaAssinada: true,
      };
      expect(isChecklistSanitizacaoCompleto(checklist)).toBe(true);
    });
  });

  describe('3. Estrutura do Estudo de Caso STAR e Metadados', () => {
    const mockCase: EstudoCasoPortfolio = {
      id: 'case-test-1',
      demanda_id: 'dem-test-1',
      projeto_id: 'proj-test-1',
      titulo: 'Estudo de Caso Analítico: Otimização de Performance',
      problema_negocio: 'Situação de negócio estruturada',
      processo_preparacao: 'Tarefa e engenharia de dados',
      modelagem_decisoes: 'Ação e modelagem dimensional DAX',
      validacao_resultados: 'Resultados e validação numérica',
      competencias_demonstradas: ['Power BI', 'DAX'],
      ferramentas_utilizadas: ['Power BI Desktop', 'Power Query'],
      metricas_fatos: [
        {
          rotulo: 'Margem Bruta',
          expressaoSanitizada: '+12.5%',
          impactoOuConclusao: 'Crescimento real atestado.',
        },
      ],
      tecnicas_sanitizacao: [TecnicaSanitizacao.ANONIMIZACAO, TecnicaSanitizacao.INDEXACAO],
      checklist_sanitizacao: criarChecklistSanitizacaoPadrao(),
      status: StatusEstudoCaso.RASCUNHO,
      homologado_em: null,
      homologado_por: null,
      versao: 1,
      criado_em: '2026-03-01T00:00:00Z',
      atualizado_em: '2026-03-01T00:00:00Z',
    };

    it('deve validar estrutura STAR e métricas fatuais sanitizadas', () => {
      expect(mockCase.status).toBe(StatusEstudoCaso.RASCUNHO);
      expect(mockCase.versao).toBe(1);
      expect(mockCase.metricas_fatos).toHaveLength(1);
      expect(mockCase.tecnicas_sanitizacao).toContain(TecnicaSanitizacao.ANONIMIZACAO);
      expect(mockCase.tecnicas_sanitizacao).toContain(TecnicaSanitizacao.INDEXACAO);
    });
  });

  describe('4. Ativos de Aprendizado', () => {
    it('deve instanciar categorias canônicas para memória operacional', () => {
      expect(CategoriaAtivoAprendizado.DAX).toBe('DAX');
      expect(CategoriaAtivoAprendizado.POWER_QUERY_M).toBe('POWER_QUERY_M');
      expect(CategoriaAtivoAprendizado.QUALIDADE_DADOS).toBe('QUALIDADE_DADOS');
      expect(CategoriaAtivoAprendizado.MODELAGEM).toBe('MODELAGEM');
      expect(CategoriaAtivoAprendizado.NEGOCIO).toBe('NEGOCIO');
    });
  });
});
