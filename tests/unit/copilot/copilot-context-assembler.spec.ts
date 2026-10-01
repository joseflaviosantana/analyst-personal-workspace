import { describe, it, expect } from 'vitest';
import {
  DICIONARIO_CONCEITOS_MODELAGEM,
  getConceitoModelagem,
  listarTodosConceitosModelagem,
  obterConceitosRelevantesParaCenario,
  CenarioModelagemCopiloto,
  ConceitoModelagem,
} from '@/core/use-cases/copilot';

describe('CopilotContextAssembler & Dicionário Conceitual de Modelagem', () => {
  describe('Integridade do Dicionário Pedagógico de Modelagem', () => {
    const conceitosEsperados = [
      'tabela-fato',
      'dimensao',
      'grao',
      'relacionamento',
      'cardinalidade',
      'chave-primaria',
      'chave-estrangeira',
      'direcao-filtro',
      'metrica',
      'modelo-estrela',
      'dimensao-calendario',
      'homologacao',
      'conformidade',
    ];

    it('deve conter exatamente os 13 conceitos fundamentais de modelagem dimensional', () => {
      const todos = listarTodosConceitosModelagem();
      expect(todos.length).toBe(13);

      for (const idEsperado of conceitosEsperados) {
        const conceito = getConceitoModelagem(idEsperado);
        expect(conceito).toBeDefined();
        expect(conceito?.id).toBe(idEsperado);
      }
    });

    it('cada conceito deve possuir definição simples, por que importa e detalhe técnico (3 níveis)', () => {
      const todos = listarTodosConceitosModelagem();

      for (const c of todos) {
        expect(c.termo.trim().length).toBeGreaterThan(0);
        expect(c.definicaoSimples.trim().length).toBeGreaterThan(15);
        expect(c.porQueImporta.trim().length).toBeGreaterThan(15);
        expect(c.detalheTecnico.trim().length).toBeGreaterThan(15);
        expect(['ESTRUTURA', 'INTEGRIDADE', 'METRICA', 'GOVERNANCA']).toContain(c.categoria);
      }
    });

    it('getConceitoModelagem deve retornar undefined para chave inexistente', () => {
      const inexistente = getConceitoModelagem('conceito-que-nao-existe');
      expect(inexistente).toBeUndefined();
    });
  });

  describe('Mapeamento Relevante de Conceitos por Cenário', () => {
    const cenarios: CenarioModelagemCopiloto[] = [
      'SEM_DATASET_VIGENTE',
      'SEM_MODELO_CRIADO',
      'HOMOLOGACAO_REVOGADA',
      'HOMOLOGACAO_INVALIDADA',
      'BLOQUEIO_CONFORMIDADE',
      'SEM_ENTIDADE_FATO',
      'SEM_METRICAS_CADASTRADAS',
      'ALERTA_CRITICO_PENDENTE',
      'PRONTO_PARA_HOMOLOGACAO',
      'HOMOLOGADO_E_VIGENTE',
      'ESTADO_GERAL_MODELAGEM',
    ];

    it('deve retornar conceitos relevantes e não-vazios para qualquer cenário válido', () => {
      for (const cenario of cenarios) {
        const relevantes = obterConceitosRelevantesParaCenario(cenario);
        expect(relevantes.length).toBeGreaterThan(0);

        // Garante que todos os conceitos retornados são objetos válidos do dicionário
        for (const item of relevantes) {
          expect(item).toHaveProperty('termo');
          expect(item).toHaveProperty('definicaoSimples');
          expect(item).toHaveProperty('porQueImporta');
          expect(item).toHaveProperty('detalheTecnico');
        }
      }
    });

    it('no cenário SEM_MODELO_CRIADO deve incluir o conceito de modelo-estrela e tabela-fato', () => {
      const relevantes = obterConceitosRelevantesParaCenario('SEM_MODELO_CRIADO');
      const ids = relevantes.map((r: ConceitoModelagem) => r.id);
      expect(ids).toContain('modelo-estrela');
      expect(ids).toContain('tabela-fato');
    });

    it('no cenário ALERTA_CRITICO_PENDENTE deve incluir cardinalidade e direcao-filtro', () => {
      const relevantes = obterConceitosRelevantesParaCenario('ALERTA_CRITICO_PENDENTE');
      const ids = relevantes.map((r: ConceitoModelagem) => r.id);
      expect(ids).toContain('cardinalidade');
      expect(ids).toContain('direcao-filtro');
    });

    it('no cenário SEM_METRICAS_CADASTRADAS deve incluir metrica', () => {
      const relevantes = obterConceitosRelevantesParaCenario('SEM_METRICAS_CADASTRADAS');
      const ids = relevantes.map((r: ConceitoModelagem) => r.id);
      expect(ids).toContain('metrica');
    });
  });
});
