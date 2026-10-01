import { describe, it, expect, beforeEach } from 'vitest';
import {
  RegistrarEvidenciaUseCase,
  ConsultarEvidenciasDemandaUseCase,
  ObterEvidenciaUseCase,
  DeliberarEvidenciaUseCase,
  AlterarExposicaoEvidenciaUseCase,
} from '@/core/use-cases/evidence';
import { EvidenciaAnalitica } from '@/core/domain/entities/evidencia-analitica';
import { TipoEvidenciaAnalitica } from '@/core/domain/enums/tipo-evidencia-analitica';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';
import { MetodoCapturaEvidencia } from '@/core/domain/enums/metodo-captura-evidencia';
import { StatusValidacaoEvidencia } from '@/core/domain/enums/status-validacao-evidencia';
import { ClassificacaoExposicaoEvidencia } from '@/core/domain/enums/classificacao-exposicao-evidencia';
import {
  IEvidenciaAnaliticaRepository,
  FiltrosConsultaEvidencias,
} from '@/core/domain/repositories/evidencia-analitica-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { Demanda, DemandaComProjeto } from '@/core/domain/entities/demanda';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';

describe('Evidence Core: Casos de Uso (Subgate 3.5A)', () => {
  let evidenciaStore: Map<string, EvidenciaAnalitica>;
  let demandStore: Map<string, DemandaComProjeto>;

  let mockEvidenciaRepo: IEvidenciaAnaliticaRepository;
  let mockDemandRepo: IDemandRepository;

  let registrarUseCase: RegistrarEvidenciaUseCase;
  let consultarUseCase: ConsultarEvidenciasDemandaUseCase;
  let obterUseCase: ObterEvidenciaUseCase;
  let deliberarUseCase: DeliberarEvidenciaUseCase;
  let alterarExposicaoUseCase: AlterarExposicaoEvidenciaUseCase;

  const demandaId = 'dem-100';
  const projetoId = 'prj-50';

  beforeEach(() => {
    evidenciaStore = new Map<string, EvidenciaAnalitica>();
    demandStore = new Map<string, DemandaComProjeto>();

    // Popula demanda de teste
    demandStore.set(demandaId, {
      id: demandaId,
      projeto_id: projetoId,
      projetoNome: 'Projeto Financeiro',
      titulo: 'Demanda de Fechamento Financeiro',
      solicitacao_bruta: 'Conciliar faturamento de cartão de crédito',
      contexto: 'Setor financeiro precisa de conciliação diária',
      objetivo_inicial: 'Garantir divergência zero',
      prazo_esperado: '2026-10-15',
      restricoes_declaradas: 'Apenas dados sanitizados',
      estado: EstadoDemanda.EM_MODELAGEM_E_ANALISE,
      estado_anterior: EstadoDemanda.NOVA,
      criado_em: '2026-09-30T10:00:00Z',
      atualizado_em: '2026-09-30T10:00:00Z',
      data_conclusao: null,
    });

    mockDemandRepo = {
      findById: async (id: string) => demandStore.get(id) || null,
      findByProjectId: async (pId: string) =>
        Array.from(demandStore.values()).filter((d) => d.projeto_id === pId),
      findAll: async () => Array.from(demandStore.values()),
      findRecent: async () => Array.from(demandStore.values()),
      create: async (d: Demanda) => {
        const item: DemandaComProjeto = { ...d, projetoNome: 'Projeto Financeiro' };
        demandStore.set(d.id, item);
        return d;
      },
      update: async (id: string, data: Partial<Demanda>) => {
        const existing = demandStore.get(id);
        if (!existing) return null;
        const updated = { ...existing, ...data };
        demandStore.set(id, updated);
        return updated;
      },
      countActive: async () => demandStore.size,
      countTotal: async () => demandStore.size,
    };

    mockEvidenciaRepo = {
      findById: async (id: string) => evidenciaStore.get(id) || null,
      findByDemandaId: async (dId: string, filtros?: FiltrosConsultaEvidencias) => {
        let list = Array.from(evidenciaStore.values()).filter((e) => e.demanda_id === dId);
        if (filtros?.tipo) list = list.filter((e) => e.tipo === filtros.tipo);
        if (filtros?.etapa_origem) list = list.filter((e) => e.etapa_origem === filtros.etapa_origem);
        if (filtros?.status_validacao)
          list = list.filter((e) => e.status_validacao === filtros.status_validacao);
        if (filtros?.classificacao_exposicao)
          list = list.filter((e) => e.classificacao_exposicao === filtros.classificacao_exposicao);
        if (filtros?.elegibilidade_portfolio !== undefined)
          list = list.filter((e) => e.elegibilidade_portfolio === filtros.elegibilidade_portfolio);
        return list.sort((a, b) => (b.criado_em > a.criado_em ? 1 : -1));
      },
      findByProjetoId: async (pId: string) =>
        Array.from(evidenciaStore.values()).filter((e) => e.projeto_id === pId),
      create: async (e: EvidenciaAnalitica) => {
        evidenciaStore.set(e.id, e);
        return e;
      },
      update: async (e: EvidenciaAnalitica) => {
        evidenciaStore.set(e.id, e);
        return e;
      },
      delete: async (id: string) => {
        evidenciaStore.delete(id);
      },
    };

    registrarUseCase = new RegistrarEvidenciaUseCase(mockEvidenciaRepo, mockDemandRepo);
    consultarUseCase = new ConsultarEvidenciasDemandaUseCase(mockEvidenciaRepo, mockDemandRepo);
    obterUseCase = new ObterEvidenciaUseCase(mockEvidenciaRepo);
    deliberarUseCase = new DeliberarEvidenciaUseCase(mockEvidenciaRepo);
    alterarExposicaoUseCase = new AlterarExposicaoEvidenciaUseCase(mockEvidenciaRepo);
  });

  describe('1. RegistrarEvidenciaUseCase', () => {
    it('deve registrar com sucesso uma evidência com todos os campos e rigor epistêmico', async () => {
      const evidencia = await registrarUseCase.execute({
        demanda_id: demandaId,
        tipo: TipoEvidenciaAnalitica.QUALIDADE,
        etapa_origem: EtapaOrigemEvidencia.QUALIDADE,
        titulo: 'Detecção e Correção de Divergência de Nulos em Pagamentos',
        descricao: 'Tratamento de 320 registros sem ID de cliente na base de adquirentes',
        fato_observado: 'Coluna cliente_id apresentava 320 nulos (4.2% da tabela bruta).',
        estado_anterior: '320 registros nulos',
        acao_registrada: 'Imputação determinística via tabela de vínculo por chave primária de transação.',
        estado_posterior: '0 registros nulos',
        resultado_mensuravel: 'Taxa de conformidade de integridade referencial subiu para 100%.',
        inferencia_recomendacao: 'Recomenda-se adicionar checagem diária na ingestão do parceiro.',
        classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
        elegibilidade_portfolio: false,
        executor: 'ANALISTA',
      });

      expect(evidencia.id).toBeDefined();
      expect(evidencia.demanda_id).toBe(demandaId);
      expect(evidencia.projeto_id).toBe(projetoId); // Herdado automaticamente da demanda
      expect(evidencia.status_validacao).toBe(StatusValidacaoEvidencia.AGUARDANDO_REVISAO);
      expect(evidencia.metodo_captura).toBe(MetodoCapturaEvidencia.MANUAL);
      expect(evidencia.criado_em).toBeDefined();
      expect(evidencia.atualizado_em).toBeDefined();
    });

    it('deve rejeitar registro se a demanda não existir', async () => {
      await expect(
        registrarUseCase.execute({
          demanda_id: 'demanda-inexistente',
          tipo: TipoEvidenciaAnalitica.DADOS,
          etapa_origem: EtapaOrigemEvidencia.DADOS,
          titulo: 'Evidência Inválida',
          descricao: 'Descrição válida',
          fato_observado: 'Fato observado válido',
          acao_registrada: 'Ação registrada válida',
        })
      ).rejects.toThrow('Demanda com ID "demanda-inexistente" não encontrada.');
    });

    it('deve rejeitar se fatos e ações não forem descritos com tamanho mínimo', async () => {
      await expect(
        registrarUseCase.execute({
          demanda_id: demandaId,
          tipo: TipoEvidenciaAnalitica.DADOS,
          etapa_origem: EtapaOrigemEvidencia.DADOS,
          titulo: 'Ok',
          descricao: 'Desc',
          fato_observado: '123',
          acao_registrada: 'Acao',
        })
      ).rejects.toThrow();
    });

    it('deve aplicar regra de segurança: CONFIDENCIAL jamais pode ser elegível para portfólio', async () => {
      await expect(
        registrarUseCase.execute({
          demanda_id: demandaId,
          tipo: TipoEvidenciaAnalitica.DADOS,
          etapa_origem: EtapaOrigemEvidencia.DADOS,
          titulo: 'Evidência Confidencial Sigilosa',
          descricao: 'Dados sensíveis de salários executivos',
          fato_observado: 'Planilha contendo CPFs e remunerações reais.',
          acao_registrada: 'Segregação em cofre local isolado.',
          classificacao_exposicao: ClassificacaoExposicaoEvidencia.CONFIDENCIAL,
          elegibilidade_portfolio: true, // Proibido!
        })
      ).rejects.toThrow(
        'Evidência com classificação CONFIDENCIAL não pode ser elegível para portfólio.'
      );
    });
  });

  describe('2. ConsultarEvidenciasDemandaUseCase', () => {
    it('deve retornar a lista e o resumo quantitativo correto de métricas', async () => {
      // Cria 3 evidências com status e classificações distintas
      await registrarUseCase.execute({
        demanda_id: demandaId,
        tipo: TipoEvidenciaAnalitica.DADOS,
        etapa_origem: EtapaOrigemEvidencia.DADOS,
        titulo: 'Evidência 1 - Dados Ingeridos',
        descricao: 'Ingestão de arquivo CSV com 50k linhas',
        fato_observado: 'Arquivo recebido com hash conferido.',
        acao_registrada: 'Validação de schema e encoding UTF-8.',
        classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      });

      const ev2 = await registrarUseCase.execute({
        demanda_id: demandaId,
        tipo: TipoEvidenciaAnalitica.DAX,
        etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
        titulo: 'Evidência 2 - Medida MoM Validada',
        descricao: 'Cálculo de crescimento mensal com Time Intelligence',
        fato_observado: 'Dimensão dCalendario contínua sem lacunas.',
        acao_registrada: 'Implementada medida [Receita MoM %] via DATEADD.',
        classificacao_exposicao: ClassificacaoExposicaoEvidencia.PUBLICA,
        elegibilidade_portfolio: true,
      });

      // Homologa a segunda evidência
      await deliberarUseCase.execute({
        id: ev2.id,
        status: 'CONFIRMADA',
        decisao_humana: 'Cálculo conferido e homologado pelo Lead de BI.',
      });

      const resultado = await consultarUseCase.execute({ demanda_id: demandaId });

      expect(resultado.evidencias).toHaveLength(2);
      expect(resultado.metricas.total).toBe(2);
      expect(resultado.metricas.por_status[StatusValidacaoEvidencia.CONFIRMADA]).toBe(1);
      expect(resultado.metricas.por_status[StatusValidacaoEvidencia.AGUARDANDO_REVISAO]).toBe(1);
      expect(resultado.metricas.por_classificacao[ClassificacaoExposicaoEvidencia.PUBLICA]).toBe(1);
      expect(resultado.metricas.por_classificacao[ClassificacaoExposicaoEvidencia.INTERNA]).toBe(1);
      expect(resultado.metricas.total_elegiveis_portfolio).toBe(1);
    });

    it('deve suportar filtros estritos por tipo e status', async () => {
      await registrarUseCase.execute({
        demanda_id: demandaId,
        tipo: TipoEvidenciaAnalitica.QUALIDADE,
        etapa_origem: EtapaOrigemEvidencia.QUALIDADE,
        titulo: 'Evidência de Qualidade',
        descricao: 'Regra de unicidade validada',
        fato_observado: 'Chave primária sem duplicatas.',
        acao_registrada: 'Execução de scan determinístico.',
      });

      const resultadoFiltrado = await consultarUseCase.execute({
        demanda_id: demandaId,
        filtros: { tipo: TipoEvidenciaAnalitica.QUALIDADE },
      });

      expect(resultadoFiltrado.evidencias).toHaveLength(1);
      expect(resultadoFiltrado.evidencias[0].tipo).toBe(TipoEvidenciaAnalitica.QUALIDADE);
    });
  });

  describe('3. DeliberarEvidenciaUseCase (Homologação / Rejeição Humana)', () => {
    it('deve confirmar a evidência e anexar a decisão humana preservando a factualidade', async () => {
      const ev = await registrarUseCase.execute({
        demanda_id: demandaId,
        tipo: TipoEvidenciaAnalitica.MODELAGEM,
        etapa_origem: EtapaOrigemEvidencia.MODELAGEM,
        titulo: 'Evidência de Esquema Estrela Homologado',
        descricao: 'Validação de granularidade 1:N entre Dim e Fato',
        fato_observado: 'Todas as chaves estrangeiras possuem correspondência exata.',
        acao_registrada: 'Mapeamento dimensional verificado.',
      });

      const deliberada = await deliberarUseCase.execute({
        id: ev.id,
        status: 'CONFIRMADA',
        decisao_humana: 'Modelo aprovado para construção de relatórios no Power BI.',
        revisor: 'JOSÉ FLÁVIO',
      });

      expect(deliberada.status_validacao).toBe(StatusValidacaoEvidencia.CONFIRMADA);
      expect(deliberada.decisao_humana).toContain('JOSÉ FLÁVIO');
      expect(deliberada.decisao_humana).toContain('Modelo aprovado');
      expect(deliberada.fato_observado).toBe(ev.fato_observado); // Fato intacto!
      expect(deliberada.atualizado_em).toBeDefined();
    });

    it('deve rejeitar deliberação com justificativa vazia', async () => {
      const ev = await registrarUseCase.execute({
        demanda_id: demandaId,
        tipo: TipoEvidenciaAnalitica.MODELAGEM,
        etapa_origem: EtapaOrigemEvidencia.MODELAGEM,
        titulo: 'Evidência Teste',
        descricao: 'Descrição de teste',
        fato_observado: 'Fato de teste',
        acao_registrada: 'Ação de teste',
      });

      await expect(
        deliberarUseCase.execute({
          id: ev.id,
          status: 'REJEITADA',
          decisao_humana: '   ',
        })
      ).rejects.toThrow('Justificativa da decisão humana é obrigatória');
    });
  });

  describe('4. AlterarExposicaoEvidenciaUseCase', () => {
    it('deve permitir alterar classificação de INTERNA para SANITIZAVEL ou PUBLICA', async () => {
      const ev = await registrarUseCase.execute({
        demanda_id: demandaId,
        tipo: TipoEvidenciaAnalitica.DASHBOARD,
        etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
        titulo: 'Design de Painel Executivo',
        descricao: 'Layout com 3 visuais e 1 KPI',
        fato_observado: 'Visual cards com métrica de margem líquida.',
        acao_registrada: 'Adoção da paleta Executive Premium.',
        classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      });

      const atualizada = await alterarExposicaoUseCase.execute({
        id: ev.id,
        classificacao_exposicao: ClassificacaoExposicaoEvidencia.PUBLICA,
        elegibilidade_portfolio: true,
      });

      expect(atualizada.classificacao_exposicao).toBe(ClassificacaoExposicaoEvidencia.PUBLICA);
      expect(atualizada.elegibilidade_portfolio).toBe(true);
    });

    it('deve impedir que evidência CONFIDENCIAL seja marcada para portfólio', async () => {
      const ev = await registrarUseCase.execute({
        demanda_id: demandaId,
        tipo: TipoEvidenciaAnalitica.DADOS,
        etapa_origem: EtapaOrigemEvidencia.DADOS,
        titulo: 'Evidência Salarial',
        descricao: 'Dados sensíveis',
        fato_observado: 'Fato observado sensível',
        acao_registrada: 'Ação de proteção de dados',
        classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
      });

      await expect(
        alterarExposicaoUseCase.execute({
          id: ev.id,
          classificacao_exposicao: ClassificacaoExposicaoEvidencia.CONFIDENCIAL,
          elegibilidade_portfolio: true,
        })
      ).rejects.toThrow(
        'Evidência classificada como CONFIDENCIAL não pode ser elegível para portfólio.'
      );
    });
  });
});
