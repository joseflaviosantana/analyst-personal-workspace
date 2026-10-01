import { describe, it, expect } from 'vitest';
import { PreparacaoStrategy } from '@/core/domain/evidence-events/default-strategies/preparacao-strategy';
import { EventoAnalitico } from '@/core/domain/evidence-events/event-types';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';
import { TipoEvidenciaAnalitica } from '@/core/domain/enums/tipo-evidencia-analitica';
import { ClassificacaoExposicaoEvidencia } from '@/core/domain/enums/classificacao-exposicao-evidencia';

describe('PreparacaoStrategy: Estratégia de Preparação de Dados (Subgate 3.5B.3)', () => {
  const strategy = new PreparacaoStrategy();

  // ==========================================
  // Teste A: Captura Automática != Autoria Automática (PREPARACAO_DATASET_HOMOLOGADO)
  // ==========================================
  it('A. homologação de dataset preserva autoria humana soberana na captura automática', () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_prep_aut_100',
      demanda_id: 'dem_test_prep_1',
      projeto_id: 'prj_test_1',
      etapa_origem: EtapaOrigemEvidencia.PREPARACAO,
      categoria: 'PREPARACAO',
      tipo_evento: 'PREPARACAO_DATASET_HOMOLOGADO',
      ocorrido_em: '2026-10-01T10:00:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'DATASET_AUTORIZADO',
      artefato_origem_id: 'aut_100',
      payload: {
        autorizacaoId: 'aut_100',
        ativoDadosId: 'ast_derivado_50',
        nomeArquivo: 'vendas_tratadas_v1.parquet',
        versaoRotulo: '1.0',
        hashSha256Snapshot: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        diagnosticoId: 'diag_prep_final',
        receitaId: 'rec_prep_01',
        justificativa: 'Dataset saneado e balanceado, sem nulos em colunas-chave.',
        totalRestricoesAceitas: 0,
        autorTipo: 'HUMANO',
        autorizadoEm: '2026-10-01T10:00:00Z',
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(evento);
    expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');
    expect(decisao.requer_intervencao_humana).toBe(false);

    const candidato = strategy.transformar(evento);
    expect(candidato).not.toBeNull();
    expect(candidato.tipo).toBe(TipoEvidenciaAnalitica.PREPARACAO);
    expect(candidato.etapa_origem).toBe(EtapaOrigemEvidencia.PREPARACAO);
    expect(candidato.artefato_origem_tipo).toBe('DATASET_AUTORIZADO');
    expect(candidato.artefato_origem_id).toBe('aut_100');
    expect(candidato.titulo).toContain('vendas_tratadas_v1.parquet');
    expect(candidato.decisao_humana).toBe('Dataset saneado e balanceado, sem nulos em colunas-chave.');

    // Rigor Epistêmico: autorTipo HUMANO preservado nos metadados auditáveis
    expect(candidato.metadados_adicionais?.autor_tipo).toBe('HUMANO');
    expect(candidato.metadados_adicionais?.captura_automatica).toBe(true);
    expect(candidato.acao_registrada).toContain('Homologação humana soberana realizada pelo analista');
    expect(candidato.classificacao_exposicao).toBe(ClassificacaoExposicaoEvidencia.INTERNA);
  });

  it('ignora PREPARACAO_DATASET_HOMOLOGADO com payload incompleto', () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_prep_aut_invalid',
      demanda_id: 'dem_test_1',
      etapa_origem: EtapaOrigemEvidencia.PREPARACAO,
      categoria: 'PREPARACAO',
      tipo_evento: 'PREPARACAO_DATASET_HOMOLOGADO',
      ocorrido_em: '2026-10-01T10:00:00Z',
      executor: 'ANALISTA',
      payload: {
        autorizacaoId: '', // Inválido
        justificativa: '',
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(evento);
    expect(decisao.politica).toBe('IGNORAR');
  });

  // ==========================================
  // PREPARACAO_RECEITA_CONCLUIDA
  // ==========================================
  it('registra conclusão formal de receita de preparação com etapas validadas', () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt_prep_rec_concl',
      demanda_id: 'dem_test_1',
      etapa_origem: EtapaOrigemEvidencia.PREPARACAO,
      categoria: 'PREPARACAO',
      tipo_evento: 'PREPARACAO_RECEITA_CONCLUIDA',
      ocorrido_em: '2026-10-01T11:00:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'RECEITA_PREPARACAO',
      artefato_origem_id: 'rec_01',
      payload: {
        receitaId: 'rec_01',
        titulo: 'Saneamento e Deduplicação de Vendas',
        totalEtapasValidadas: 4,
        totalEtapasCanceladas: 0,
        justificativa: 'Todas as etapas validadas com sucesso determinístico.',
        concluidaEm: '2026-10-01T11:00:00Z',
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(evento);
    expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');

    const candidato = strategy.transformar(evento);
    expect(candidato.titulo).toContain('Saneamento e Deduplicação de Vendas');
    expect(candidato.fato_observado).toContain('4 etapa(s) validadas');
    expect(candidato.metadados_adicionais?.total_etapas_validadas).toBe(4);
  });

  // ==========================================
  // Teste D: Ativo Derivado com e sem cálculo de Antes/Depois
  // ==========================================
  it('D. materialização de ativo derivado calcula delta de linhas somente quando dados reais fornecidos', () => {
    const eventoComOrigem: EventoAnalitico = {
      id_evento: 'evt_prep_deriv_1',
      demanda_id: 'dem_test_1',
      etapa_origem: EtapaOrigemEvidencia.PREPARACAO,
      categoria: 'PREPARACAO',
      tipo_evento: 'PREPARACAO_ATIVO_DERIVADO_REGISTRADO',
      ocorrido_em: '2026-10-01T10:30:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'ATIVO_DADOS',
      artefato_origem_id: 'ast_deriv_1',
      payload: {
        ativoId: 'ast_deriv_1',
        nomeArquivo: 'vendas_deduplicadas.parquet',
        caminhoLocal: '/data/vendas_deduplicadas.parquet',
        formato: 'parquet',
        tamanhoBytes: 850000,
        totalLinhas: 12000,
        totalColunas: 10,
        hashSha256: '9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef',
        receitaId: 'rec_01',
        etapaId: 'etp_01',
        tipoOperacao: 'FILTRAR_LINHAS',
        ferramentaNome: 'DuckDB',
        linhasOrigemPrincipal: 15000, // Dados reais da fonte
      },
      versao_contrato: '1.0',
    };

    const candidato = strategy.transformar(eventoComOrigem);
    expect(candidato.resultado_mensuravel).toContain('-3.000 linhas (-20% em relação à origem)');
    expect(candidato.metadados_adicionais?.variacao_linhas).toBe(-3000);
    expect(candidato.metadados_adicionais?.variacao_percentual).toBe(-20);
  });

  it('materialização de ativo derivado sem métricas de origem não fabrica delta ou percentual artificial', () => {
    const eventoSemOrigem: EventoAnalitico = {
      id_evento: 'evt_prep_deriv_2',
      demanda_id: 'dem_test_1',
      etapa_origem: EtapaOrigemEvidencia.PREPARACAO,
      categoria: 'PREPARACAO',
      tipo_evento: 'PREPARACAO_ATIVO_DERIVADO_REGISTRADO',
      ocorrido_em: '2026-10-01T10:30:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'ATIVO_DADOS',
      artefato_origem_id: 'ast_deriv_2',
      payload: {
        ativoId: 'ast_deriv_2',
        nomeArquivo: 'clientes_normalizados.csv',
        caminhoLocal: '/data/clientes_normalizados.csv',
        formato: 'csv',
        tamanhoBytes: 50000,
        totalLinhas: 500,
        totalColunas: 6,
        hashSha256: 'abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
        receitaId: 'rec_01',
        etapaId: 'etp_02',
        tipoOperacao: 'NORMALIZAR_TEXTO',
        ferramentaNome: 'Python',
        // linhasOrigemPrincipal omitido
      },
      versao_contrato: '1.0',
    };

    const candidato = strategy.transformar(eventoSemOrigem);
    expect(candidato.resultado_mensuravel).toBe('500 linhas estruturadas no ativo derivado.');
    expect(candidato.metadados_adicionais?.variacao_linhas).toBeNull();
    expect(candidato.metadados_adicionais?.variacao_percentual).toBeNull();
  });

  // ==========================================
  // Teste B e D: Não Fabricar Deltas/Percentuais vs Delta Real em PREPARACAO_TRATAMENTO_VALIDADO
  // ==========================================
  it('B. tratamento sem métricas suficientes NÃO fabrica delta ou percentual', () => {
    const eventoSemMetricas: EventoAnalitico = {
      id_evento: 'evt_prep_trat_sem_met',
      demanda_id: 'dem_test_1',
      etapa_origem: EtapaOrigemEvidencia.PREPARACAO,
      categoria: 'PREPARACAO',
      tipo_evento: 'PREPARACAO_TRATAMENTO_VALIDADO',
      ocorrido_em: '2026-10-01T10:45:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'PROBLEMA_QUALIDADE',
      artefato_origem_id: 'prob_sem_delta',
      payload: {
        problemaId: 'prob_sem_delta',
        titulo: 'Formato de Data Heterogêneo',
        colunaAfetada: 'dt_venda',
        etapaId: 'etp_padronizar_data',
        diagnosticoId: 'diag_pos_etp_1',
        ativoDerivadoId: 'ast_deriv_data',
        motivo: 'Regra determinística de conversão ISO aplicada com sucesso.',
        // Sem linhasAfetadasAntes e linhasAfetadasDepois
      },
      versao_contrato: '1.0',
    };

    const decisao = strategy.avaliar(eventoSemMetricas);
    expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');

    const candidato = strategy.transformar(eventoSemMetricas);
    // Registro factual e conservador, sem inventar percentuais ou contagens
    expect(candidato.resultado_mensuravel).toBe(
      'Tratamento validado e aprovado segundo a regra determinística aplicável no ativo derivado.'
    );
    expect(candidato.resultado_mensuravel).not.toContain('%');
    expect(candidato.resultado_mensuravel).not.toContain('Redução');
    expect(candidato.metadados_adicionais?.linhas_afetadas_antes).toBeNull();
    expect(candidato.metadados_adicionais?.linhas_afetadas_depois).toBeNull();
  });

  it('D. tratamento com Antes/Depois comprovados gera delta somente a partir dos valores reais', () => {
    const eventoComMetricasReais: EventoAnalitico = {
      id_evento: 'evt_prep_trat_com_met',
      demanda_id: 'dem_test_1',
      etapa_origem: EtapaOrigemEvidencia.PREPARACAO,
      categoria: 'PREPARACAO',
      tipo_evento: 'PREPARACAO_TRATAMENTO_VALIDADO',
      ocorrido_em: '2026-10-01T10:50:00Z',
      executor: 'ANALISTA',
      artefato_origem_tipo: 'PROBLEMA_QUALIDADE',
      artefato_origem_id: 'prob_com_delta',
      payload: {
        problemaId: 'prob_com_delta',
        titulo: 'Nulos em CPF',
        colunaAfetada: 'cpf_cliente',
        etapaId: 'etp_remover_nulos',
        diagnosticoId: 'diag_pos_etp_2',
        ativoDerivadoId: 'ast_deriv_cpf',
        linhasAfetadasAntes: 150,
        linhasAfetadasDepois: 0,
        motivo: 'Filtro aplicado com eliminação determinística dos registros incompletos.',
      },
      versao_contrato: '1.0',
    };

    const candidato = strategy.transformar(eventoComMetricasReais);
    // 150 antes -> 0 depois = 150 reduzidos (100.0%)
    expect(candidato.resultado_mensuravel).toContain('Redução comprovada de 150 ocorrência(s) (100.0% de saneamento)');
    expect(candidato.resultado_mensuravel).toContain('restando 0 ocorrência(s)');
    expect(candidato.estado_anterior).toContain('150 linha(s) afetada(s) na coluna \'cpf_cliente\'');
    expect(candidato.metadados_adicionais?.linhas_afetadas_antes).toBe(150);
    expect(candidato.metadados_adicionais?.linhas_afetadas_depois).toBe(0);
  });
});
