import { describe, it, expect } from 'vitest';
import { DadosAtivoStrategy } from '@/core/domain/evidence-events/default-strategies/dados-ativo-strategy';
import { EventoAnalitico } from '@/core/domain/evidence-events/event-types';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';
import { TipoEvidenciaAnalitica } from '@/core/domain/enums/tipo-evidencia-analitica';
import { ClassificacaoExposicaoEvidencia } from '@/core/domain/enums/classificacao-exposicao-evidencia';

describe('DadosAtivoStrategy: Estratégia de Ativos de Dados (Subgate 3.5B.2)', () => {
  const strategy = new DadosAtivoStrategy();

  it('1. evento DADOS_ATIVO_REGISTRADO gera candidato com rigor epistêmico e proveniência', () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_ast_reg_100',
      demanda_id: 'dem_test_1',
      projeto_id: 'prj_test_1',
      etapa_origem: EtapaOrigemEvidencia.DADOS,
      categoria: 'DADOS',
      tipo_evento: 'DADOS_ATIVO_REGISTRADO',
      ocorrido_em: '2026-10-01T10:00:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'ATIVO_DADOS',
      artefato_origem_id: 'ast_100',
      payload: {
        ativoId: 'ast_100',
        nomeArquivo: 'vendas_2026.csv',
        caminhoLocal: '/data/vendas_2026.csv',
        formato: 'csv',
        origem: 'ERP Corporativo',
        tamanhoBytes: 1048576,
        totalLinhas: 15000,
        totalColunas: 12,
        hashSha256: 'a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef',
        versao: '1.0',
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(evento);
    expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');
    expect(decisao.requer_intervencao_humana).toBe(false);

    const candidato = strategy.transformar(evento);
    expect(candidato).not.toBeNull();
    expect(candidato?.tipo).toBe(TipoEvidenciaAnalitica.DADOS);
    expect(candidato?.etapa_origem).toBe(EtapaOrigemEvidencia.DADOS);
    expect(candidato?.artefato_origem_tipo).toBe('ATIVO_DADOS');
    expect(candidato?.artefato_origem_id).toBe('ast_100');
    expect(candidato?.titulo).toContain('vendas_2026.csv');
    expect(candidato?.fato_observado).toContain('15000 linhas');
    expect(candidato?.fato_observado).toContain('12 colunas');
    expect(candidato?.resultado_mensuravel).toContain('15000 linhas | 12 colunas');
    expect(candidato?.elegibilidade_portfolio).toBe(true);
  });

  it('2. ativo confidencial bloqueia elegibilidade para portfólio', () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_ast_reg_conf',
      demanda_id: 'dem_test_1',
      etapa_origem: EtapaOrigemEvidencia.DADOS,
      categoria: 'DADOS',
      tipo_evento: 'DADOS_ATIVO_REGISTRADO',
      ocorrido_em: '2026-10-01T10:00:00Z',
      executor: 'ANALISTA',
      payload: {
        ativoId: 'ast_conf',
        nomeArquivo: 'salarios_executivos.xlsx',
        caminhoLocal: '/data/salarios_executivos.xlsx',
        formato: 'xlsx',
        tamanhoBytes: 50000,
        totalLinhas: 120,
        totalColunas: 8,
        hashSha256: 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
        classificacaoExposicao: ClassificacaoExposicaoEvidencia.CONFIDENCIAL,
      },
      versao_contrato: '1.0',
    };

    const candidato = strategy.transformar(evento);
    expect(candidato).not.toBeNull();
    expect(candidato?.classificacao_exposicao).toBe(ClassificacaoExposicaoEvidencia.CONFIDENCIAL);
    expect(candidato?.elegibilidade_portfolio).toBe(false);
  });

  it('3. evento DADOS_ATIVO_SUBSTITUIDO calcula deltas e registra justificativa humana', () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_ast_rep_200',
      demanda_id: 'dem_test_1',
      etapa_origem: EtapaOrigemEvidencia.DADOS,
      categoria: 'DADOS',
      tipo_evento: 'DADOS_ATIVO_SUBSTITUIDO',
      ocorrido_em: '2026-10-01T10:15:00Z',
      executor: 'ANALISTA',
      payload: {
        ativoAntigoId: 'ast_100',
        novoAtivoId: 'ast_200',
        nomeArquivo: 'vendas_2026.csv',
        caminhoLocal: '/data/vendas_2026_v2.csv',
        formato: 'csv',
        versaoAntiga: '1.0',
        versaoNova: '1.1',
        hashAntigo: 'hash_anterior_1234',
        hashNovo: 'hash_novo_5678',
        linhasAntigas: 15000,
        linhasNovas: 16500,
        colunasAntigas: 12,
        colunasNovas: 14,
        justificativa: 'Atualização do fechamento fiscal mensal com acréscimo de 2 novas colunas de alíquota.',
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(evento);
    expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');

    const candidato = strategy.transformar(evento);
    expect(candidato).not.toBeNull();
    expect(candidato?.titulo).toContain('Substituição e Versionamento');
    expect(candidato?.estado_anterior).toContain('15000 linhas');
    expect(candidato?.estado_posterior).toContain('16500 linhas');
    expect(candidato?.resultado_mensuravel).toContain('Delta Linhas: +1500');
    expect(candidato?.resultado_mensuravel).toContain('Delta Colunas: +2');
    expect(candidato?.decisao_humana).toContain('Atualização do fechamento fiscal');
  });

  it('4. payload incompleto retorna IGNORAR sem inventar dados (Rigor Epistêmico)', () => {
    const eventoIncompleto: EventoAnalitico = {
      id_evento: 'evt_ast_inc',
      demanda_id: 'dem_test_1',
      etapa_origem: EtapaOrigemEvidencia.DADOS,
      categoria: 'DADOS',
      tipo_evento: 'DADOS_ATIVO_REGISTRADO',
      ocorrido_em: '2026-10-01T10:00:00Z',
      executor: 'ANALISTA',
      payload: {
        nomeArquivo: 'incompleto.csv',
        // Faltam hashSha256, totalLinhas, totalColunas, etc.
      },
      versao_contrato: '1.0',
    };

    expect(strategy.avaliar(eventoIncompleto).politica).toBe('IGNORAR');
    expect(strategy.transformar(eventoIncompleto)).toBeNull();
  });
});
