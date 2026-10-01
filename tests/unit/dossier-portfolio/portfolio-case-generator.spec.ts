import { describe, it, expect } from 'vitest';
import { PortfolioCaseGenerator } from '@/core/domain/portfolio/portfolio-case-generator';
import { Demanda } from '@/core/domain/entities/demanda';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { StatusEstudoCaso } from '@/core/domain/enums/status-estudo-caso';
import { ClassificacaoExposicaoEvidencia } from '@/core/domain/enums/classificacao-exposicao-evidencia';
import { ResultadoValidacao } from '@/core/domain/enums/resultado-validacao';

describe('PortfolioCaseGenerator', () => {
  const mockDemanda: Demanda = {
    id: 'dem-002',
    projeto_id: 'proj-002',
    titulo: 'Otimização de Faturamento Hospitalar',
    solicitacao_bruta: 'Solicitação bruta hospitalar',
    contexto: 'Glosas médicas elevadas em faturamento',
    objetivo_inicial: 'Mapear causas raízes de glosas por convênio',
    periodo_analise: '2024 a 2025',
    granularidade: 'Guia de Faturamento',
    formato_entrega: 'Power BI Executivo',
    restricoes_declaradas: 'Sem restrições',
    prazo_esperado: null,
    estado: EstadoDemanda.PRONTA_PARA_ENTREGA,
    criado_em: '2026-01-01T00:00:00Z',
    atualizado_em: '2026-02-01T00:00:00Z',
    data_conclusao: null,
  };

  it('deve gerar rascunho determinístico STAR a partir de dados reais', () => {
    const generated = PortfolioCaseGenerator.gerar({
      demanda: mockDemanda,
      ativosDados: [
        {
          id: 'dat-1',
          demanda_id: 'dem-002',
          nome_arquivo: 'guias.xlsx',
          formato: 'XLSX',
          total_linhas: 25000,
          total_colunas: 20,
        } as any,
      ],
      problemasQualidade: [
        {
          id: 'pr-1',
          demanda_id: 'dem-002',
          titulo: 'Códigos TUSS inconsistentes',
          status: 'TRATADO',
        } as any,
      ],
      medidasDax: [
        {
          id: 'dax-1',
          modelo_powerbi_id: 'm-1',
          nome: 'Taxa Glosa',
          tabela_hospedeira: 'fFaturamento',
          expressao_dax: 'DIVIDE([Glosa], [Faturamento], 0)',
          categoria_dax: 'PERCENTUAL',
        } as any,
      ],
      validacoes: [
        {
          id: 'val-1',
          demanda_id: 'dem-002',
          nome_validacao: 'Batimento Faturamento Total',
          resultado: ResultadoValidacao.APROVADO,
        } as any,
      ],
      evidencias: [
        {
          id: 'ev-1',
          demanda_id: 'dem-002',
          titulo: 'Concentração de Glosas',
          fato_observado: '82% das glosas ocorrem no Convênio Saúde Plena por falta de justificativa.',
          resultado_mensuravel: 'Redução potencial de R$ 420.000 em perdas',
          elegibilidade_portfolio: true,
          classificacao_exposicao: ClassificacaoExposicaoEvidencia.SANITIZAVEL,
        } as any,
        {
          id: 'ev-2',
          demanda_id: 'dem-002',
          titulo: 'Dado Confidencial Interno',
          fato_observado: 'Senha de acesso e log interno do diretor.',
          elegibilidade_portfolio: true,
          classificacao_exposicao: ClassificacaoExposicaoEvidencia.CONFIDENCIAL, // Não pode entrar no portfólio
        } as any,
      ],
    });

    expect(generated.status).toBe(StatusEstudoCaso.RASCUNHO);
    expect(generated.titulo).toContain('Estudo de Caso Analítico: Otimização de Faturamento Hospitalar');
    expect(generated.problema_negocio).toContain('Glosas médicas elevadas em faturamento');
    expect(generated.processo_preparacao).toContain('25.000 registros');
    expect(generated.modelagem_decisoes).toContain('`[Taxa Glosa]`');

    // Validação de resultados deve conter a evidência técnica elegível, mas IGNORAR a confidencial
    expect(generated.validacao_resultados).toContain('Concentração de Glosas');
    expect(generated.validacao_resultados).not.toContain('Senha de acesso e log interno do diretor');

    // Técnicas sugeridas e checklist inicial
    expect(generated.tecnicas_sanitizacao).toContain('ANONIMIZACAO');
    expect(generated.tecnicas_sanitizacao).toContain('INDEXACAO');
    expect(generated.checklist_sanitizacao.declaracaoHumanaAssinada).toBe(false);
  });
});
