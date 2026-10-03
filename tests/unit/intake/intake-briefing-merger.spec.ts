import { describe, it, expect } from 'vitest';
import {
  aplicarSugestoesIntakeNoBriefing,
  ValoresBriefingForm,
} from '@/core/domain/intake/intake-briefing-merger';

describe('Unit Tests: intake-briefing-merger — Precedência Humana e Mesclagem Assistida', () => {
  const mockSnapshotValido = JSON.stringify({
    fatos: {
      ativosDados: ['vendas_2024.xlsx'],
      prazo: '31/12/2026',
      periodo: 'Exercício Fiscal 2024',
      entregaveis: ['Painel Executivo Power BI', 'Documentação Metodológica'],
      indicadores: ['Receita Líquida', 'Margem EBITDA'],
    },
    descobertasDados: {
      dimensoes: ['Filial', 'Canal de Venda', 'Mês/Ano'],
      itensFaltantesDados: ['Tabela de Metas Orçamentárias'],
    },
    inferenciasCopiloto: {
      dominioNegocio: 'FINANCEIRO',
      problemaAparente: 'Acompanhamento de desvios orçamentários por centro de custo.',
      objetivoProvavel: 'Consolidar indicadores de receita e margem por filial.',
      contexto: 'Reunião mensal da diretoria executiva.',
    },
  });

  it('INVARIANTE INEGOCIÁVEL: dados humanos existentes têm precedência absoluta sobre sugestões do Intake', () => {
    // Todos os campos já preenchidos manualmente pelo usuário
    const valoresHumanos: ValoresBriefingForm = {
      contexto: 'Contexto definido estritamente pelo analista humano.',
      objetivoInicial: 'Objetivo delimitado manualmente.',
      periodoAnalise: 'Período customizado 2025-Q1',
      granularidade: 'Diária por Ponto de Venda',
      formatoEntrega: 'Relatório PDF Sintético',
      restricoesDeclaradas: 'Apenas dados auditados',
      prazoEsperado: '15/10/2026',
    };

    const resultado = aplicarSugestoesIntakeNoBriefing(valoresHumanos, mockSnapshotValido);

    // Nenhum campo deve ser sobrescrito
    expect(resultado.valores.contexto).toBe('Contexto definido estritamente pelo analista humano.');
    expect(resultado.valores.objetivoInicial).toBe('Objetivo delimitado manualmente.');
    expect(resultado.valores.periodoAnalise).toBe('Período customizado 2025-Q1');
    expect(resultado.valores.granularidade).toBe('Diária por Ponto de Venda');
    expect(resultado.valores.formatoEntrega).toBe('Relatório PDF Sintético');
    expect(resultado.valores.restricoesDeclaradas).toBe('Apenas dados auditados');
    expect(resultado.valores.prazoEsperado).toBe('15/10/2026');

    // Lista de campos preenchidos deve ser rigorosamente vazia
    expect(resultado.camposPreenchidos).toHaveLength(0);
  });

  it('deve preencher estritamente campos vazios quando houver sugestão correspondente no snapshot', () => {
    // Humano preencheu objetivo e contexto, mas deixou período, granularidade e formato vazios
    const valoresParciais: ValoresBriefingForm = {
      contexto: 'Contexto manual pré-existente.',
      objetivoInicial: 'Objetivo analítico manual.',
      periodoAnalise: '', // Vazio -> deve receber sugestão
      granularidade: '   ', // Vazio com espaços -> deve receber sugestão
      formatoEntrega: '', // Vazio -> deve receber sugestão
      restricoesDeclaradas: 'Sem restrições adicionais',
      prazoEsperado: '', // Vazio -> deve receber sugestão
    };

    const resultado = aplicarSugestoesIntakeNoBriefing(valoresParciais, mockSnapshotValido);

    // Campos previamente preenchidos devem ser preservados
    expect(resultado.valores.contexto).toBe('Contexto manual pré-existente.');
    expect(resultado.valores.objetivoInicial).toBe('Objetivo analítico manual.');
    expect(resultado.valores.restricoesDeclaradas).toBe('Sem restrições adicionais');

    // Campos vazios devem receber os dados do snapshot
    expect(resultado.valores.periodoAnalise).toBe('Exercício Fiscal 2024');
    expect(resultado.valores.granularidade).toBe('Filial, Canal de Venda, Mês/Ano');
    expect(resultado.valores.formatoEntrega).toBe('Painel Executivo Power BI, Documentação Metodológica');
    expect(resultado.valores.prazoEsperado).toBe('31/12/2026');

    expect(resultado.camposPreenchidos).toEqual([
      'Período de Análise',
      'Granularidade',
      'Formato de Entrega',
      'Prazo Esperado',
    ]);
  });

  it('deve lidar com snapshot nulo, indefinido, vazio ou malformado sem quebrar ou alterar dados existentes', () => {
    const valoresOriginais: ValoresBriefingForm = {
      contexto: 'Contexto original',
      objetivoInicial: 'Objetivo original',
      periodoAnalise: '',
      granularidade: '',
      formatoEntrega: '',
      restricoesDeclaradas: '',
      prazoEsperado: '',
    };

    // Caso 1: snapshot null
    const resNull = aplicarSugestoesIntakeNoBriefing(valoresOriginais, null);
    expect(resNull.valores).toEqual(valoresOriginais);
    expect(resNull.camposPreenchidos).toHaveLength(0);

    // Caso 2: snapshot undefined
    const resUndef = aplicarSugestoesIntakeNoBriefing(valoresOriginais, undefined);
    expect(resUndef.valores).toEqual(valoresOriginais);
    expect(resUndef.camposPreenchidos).toHaveLength(0);

    // Caso 3: string vazia
    const resVazio = aplicarSugestoesIntakeNoBriefing(valoresOriginais, '');
    expect(resVazio.valores).toEqual(valoresOriginais);
    expect(resVazio.camposPreenchidos).toHaveLength(0);

    // Caso 4: JSON inválido
    const resInvalido = aplicarSugestoesIntakeNoBriefing(valoresOriginais, '{ json invalido ...');
    expect(resInvalido.valores).toEqual(valoresOriginais);
    expect(resInvalido.camposPreenchidos).toHaveLength(0);
  });

  it('deve preencher todos os campos se o formulário estiver completamente em branco e o snapshot tiver todos os dados', () => {
    const valoresEmBranco: ValoresBriefingForm = {
      contexto: '',
      objetivoInicial: '',
      periodoAnalise: '',
      granularidade: '',
      formatoEntrega: '',
      restricoesDeclaradas: '',
      prazoEsperado: '',
    };

    const resultado = aplicarSugestoesIntakeNoBriefing(valoresEmBranco, mockSnapshotValido);

    expect(resultado.valores.periodoAnalise).toBe('Exercício Fiscal 2024');
    expect(resultado.valores.granularidade).toBe('Filial, Canal de Venda, Mês/Ano');
    expect(resultado.valores.formatoEntrega).toBe('Painel Executivo Power BI, Documentação Metodológica');
    expect(resultado.valores.prazoEsperado).toBe('31/12/2026');
    expect(resultado.valores.contexto).toBe('Reunião mensal da diretoria executiva.');
    expect(resultado.valores.objetivoInicial).toBe('Consolidar indicadores de receita e margem por filial.');
    // Restrições não existiam no snapshot, devem permanecer vazias
    expect(resultado.valores.restricoesDeclaradas).toBe('');

    expect(resultado.camposPreenchidos).toContain('Período de Análise');
    expect(resultado.camposPreenchidos).toContain('Granularidade');
    expect(resultado.camposPreenchidos).toContain('Formato de Entrega');
    expect(resultado.camposPreenchidos).toContain('Prazo Esperado');
    expect(resultado.camposPreenchidos).toContain('Contexto');
    expect(resultado.camposPreenchidos).toContain('Objetivo Inicial');
  });
});
