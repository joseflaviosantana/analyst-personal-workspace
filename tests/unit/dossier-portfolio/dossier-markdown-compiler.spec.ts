import { describe, it, expect } from 'vitest';
import { DossierMarkdownCompiler, DossierCompilationData } from '@/core/domain/dossier/dossier-markdown-compiler';
import { Demanda } from '@/core/domain/entities/demanda';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { CategoriaRequisito } from '@/core/domain/enums/categoria-requisito';
import { StatusRequisito } from '@/core/domain/enums/status-requisito';
import { StatusPerguntaClarificacao } from '@/core/domain/enums/status-pergunta-clarificacao';
import { CategoriaMedidaDax } from '@/core/domain/enums/categoria-medida-dax';

describe('DossierMarkdownCompiler', () => {
  const mockDemanda: Demanda & { projeto_nome?: string } = {
    id: 'dem-001',
    projeto_id: 'proj-001',
    projeto_nome: 'Projeto Analítico de Teste',
    titulo: 'Análise de Churn Escolar',
    solicitacao_bruta: 'Solicitação inicial bruta',
    contexto: 'Contexto de negócio estruturado: Crescimento de evasão no 1º semestre',
    objetivo_inicial: 'Objetivo de redução de evasão: Identificar variáveis preditoras de churn',
    periodo_analise: '2025/1 a 2025/2',
    granularidade: 'Estudante / Matrícula',
    formato_entrega: 'Dashboard Power BI',
    restricoes_declaradas: 'Sem restrições impeditivas',
    prazo_esperado: '2026-03-30',
    estado: EstadoDemanda.EM_MODELAGEM_E_ANALISE,
    requisitos_homologados_em: '2026-02-15T10:00:00Z',
    requisitos_homologados_por: 'Analista Sênior',
    requisitos_justificativa_homologacao: 'Briefing validado com stakeholder.',
    requisitos_ressalvas: null,
    criado_em: '2026-02-01T00:00:00Z',
    atualizado_em: '2026-02-15T00:00:00Z',
    data_conclusao: null,
  };

  it('deve compilar o Markdown estruturado com todas as seções metodológicas', () => {
    const data: DossierCompilationData = {
      demanda: mockDemanda,
      requisitos: [
        {
          id: 'req-001',
          demanda_id: 'dem-001',
          titulo: 'Métrica de Evasão por Série',
          descricao: null,
          categoria: CategoriaRequisito.METRICA_KPI,
          prioridade: 'OBRIGATORIO',
          status: StatusRequisito.ATENDIDO,
          origem: 'MANUAL',
          criado_em: '2026-02-01T00:00:00Z',
          atualizado_em: '2026-02-01T00:00:00Z',
        },
      ],
      perguntas: [
        {
          id: 'per-001',
          demanda_id: 'dem-001',
          requisito_id: null,
          pergunta: 'Qual o critério formal de abandono?',
          motivacao: null,
          bloqueante: true,
          status: StatusPerguntaClarificacao.RESPONDIDA,
          enviada_em: '2026-02-02T10:00:00Z',
          respondido_por: 'Diretoria',
          respondida_em: '2026-02-03T10:00:00Z',
          resposta: '30 dias consecutivos sem presença.',
          impacto_decisao: null,
          criado_em: '2026-02-02T00:00:00Z',
          atualizado_em: '2026-02-03T00:00:00Z',
        },
      ],
      ativosDados: [
        {
          id: 'dat-001',
          demanda_id: 'dem-001',
          nome_arquivo: 'matriculas.xlsx',
          formato: 'XLSX',
          total_linhas: 5000,
          total_colunas: 15,
          hash_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          criado_em: '2026-02-04T00:00:00Z',
          atualizado_em: '2026-02-04T00:00:00Z',
        } as any,
      ],
      medidasDax: [
        {
          id: 'dax-001',
          modelo_powerbi_id: 'pbi-001',
          metrica_analitica_id: null,
          nome: 'Taxa Evasao',
          tabela_hospedeira: 'fMatriculas',
          expressao_dax: 'DIVIDE([Qtd Evasao], [Total Matriculas], 0)',
          descricao: null,
          categoria_dax: CategoriaMedidaDax.TAXA_DIVISAO,
          ordem: 1,
          formato_string: '0.0%',
          criado_em: '2026-02-10T00:00:00Z',
          atualizado_em: '2026-02-10T00:00:00Z',
        },
      ],
    };

    const markdown = DossierMarkdownCompiler.compilar(data);

    expect(markdown).toContain('# DOSSIÊ TÉCNICO CONCORRENTE — Análise de Churn Escolar');
    expect(markdown).toContain('**ID da Demanda:** `dem-001`');
    expect(markdown).toContain('## 1. Briefing Analítico & Requisitos de Negócio');
    expect(markdown).toContain('Métrica de Evasão por Série');
    expect(markdown).toContain('Qual o critério formal de abandono?');
    expect(markdown).toContain('## 2. Inventário de Ativos de Dados Recebidos');
    expect(markdown).toContain('matriculas.xlsx');
    expect(markdown).toContain('## 6. Catálogo de Medidas DAX & Relatório');
    expect(markdown).toContain('`[Taxa Evasao]`');
    expect(markdown).toContain('## 10. Trilha de Auditoria e Decisões Soberanas');
  });

  it('deve compilar o Markdown com elegância mesmo com coleções vazias', () => {
    const data: DossierCompilationData = {
      demanda: mockDemanda,
    };

    const markdown = DossierMarkdownCompiler.compilar(data);

    expect(markdown).toContain('# DOSSIÊ TÉCNICO CONCORRENTE — Análise de Churn Escolar');
    expect(markdown).toContain('_Nenhum requisito atômico cadastrado até o momento._');
    expect(markdown).toContain('_Nenhum ativo de dados inventariado nesta demanda._');
    expect(markdown).toContain('_Nenhuma anomalia de qualidade registrada na demanda._');
    expect(markdown).toContain('_Nenhuma medida DAX registrada até o momento._');
  });
});
