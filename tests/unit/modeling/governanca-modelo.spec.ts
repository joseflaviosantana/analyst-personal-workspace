import { describe, it, expect, beforeEach } from 'vitest';
import { VerificarProntidaoModeloUseCase } from '@/core/use-cases/modeling/verificar-prontidao-modelo.use-case';
import { HomologarModeloAnaliticoUseCase } from '@/core/use-cases/modeling/homologar-modelo-analitico.use-case';
import { RevogarHomologacaoModeloUseCase } from '@/core/use-cases/modeling/revogar-homologacao-modelo.use-case';
import { ObterModeloHomologadoVigenteUseCase } from '@/core/use-cases/modeling/obter-modelo-homologado-vigente.use-case';

import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { IDatasetAutorizadoRepository } from '@/core/domain/repositories/dataset-autorizado-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';

import { ModeloAnalitico, ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { EntidadeAnalitica } from '@/core/domain/entities/entidade-analitica';
import { AtributoAnalitico } from '@/core/domain/entities/atributo-analitico';
import { RelacionamentoAnalitico } from '@/core/domain/entities/relacionamento-analitico';
import { MetricaAnalitica } from '@/core/domain/entities/metrica-analitica';
import { DatasetAutorizadoAnalise } from '@/core/domain/entities/dataset-autorizado-analise';
import { TrilhaAuditoria } from '@/core/domain/entities/trilha-auditoria';

import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';
import { StatusAutorizacaoDataset } from '@/core/domain/enums/status-autorizacao-dataset';
import { TipoArquiteturaModelo } from '@/core/domain/enums/tipo-arquitetura-modelo';
import { TipoEntidadeAnalitica } from '@/core/domain/enums/tipo-entidade-analitica';
import { PapelEntidadeAnalitica } from '@/core/domain/enums/papel-entidade-analitica';
import { TipoOrigemEntidade } from '@/core/domain/enums/tipo-origem-entidade';
import { TipoDadoAnalitico } from '@/core/domain/enums/tipo-dado-analitico';
import { PapelAtributoAnalitico } from '@/core/domain/enums/papel-atributo-analitico';
import { CardinalidadeRelacionamento } from '@/core/domain/enums/cardinalidade-relacionamento';
import { DirecaoFiltroRelacionamento } from '@/core/domain/enums/direcao-filtro-relacionamento';
import { TipoAgregacaoMetrica } from '@/core/domain/enums/tipo-agregacao-metrica';
import { TipoAditividadeMetrica } from '@/core/domain/enums/tipo-aditividade-metrica';
import { UnidadeMedidaMetrica } from '@/core/domain/enums/unidade-medida-metrica';
import { StatusMetricaAnalitica } from '@/core/domain/enums/status-metrica-analitica';

describe('Governança e Homologação de Modelagem Analítica (Subunidade 3.6C)', () => {
  let modelos: Map<string, ModeloAnalitico>;
  let datasets: Map<string, DatasetAutorizadoAnalise>;
  let entidades: Map<string, EntidadeAnalitica>;
  let atributos: Map<string, AtributoAnalitico>;
  let relacionamentos: Map<string, RelacionamentoAnalitico>;
  let metricas: Map<string, MetricaAnalitica>;
  let auditoria: TrilhaAuditoria[];

  let modeloRepo: IModeloAnaliticoRepository;
  let datasetRepo: IDatasetAutorizadoRepository;
  let auditRepo: IAuditRepository;

  const baseTimestamp = '2026-09-28T18:00:00.000Z';

  beforeEach(() => {
    modelos = new Map();
    datasets = new Map();
    entidades = new Map();
    atributos = new Map();
    relacionamentos = new Map();
    metricas = new Map();
    auditoria = [];

    modeloRepo = {
      findById: async (id) => modelos.get(id) ?? null,
      findByDemandaId: async (demId) => Array.from(modelos.values()).filter((m) => m.demanda_id === demId),
      findHomologadoByDemandaId: async (demId) =>
        Array.from(modelos.values()).find(
          (m) => m.demanda_id === demId && m.status === StatusModeloAnalitico.HOMOLOGADO
        ) ?? null,
      findCompletoById: async (id): Promise<ModeloAnaliticoCompleto | null> => {
        const mod = modelos.get(id);
        if (!mod) return null;
        const ents = Array.from(entidades.values())
          .filter((e) => e.modelo_id === id)
          .map((e) => ({
            ...e,
            atributos: Array.from(atributos.values()).filter((a) => a.entidade_id === e.id),
          }));
        const rels = Array.from(relacionamentos.values()).filter((r) => r.modelo_id === id);
        const mets = Array.from(metricas.values()).filter((m) => m.modelo_id === id);
        return {
          ...mod,
          entidades: ents,
          relacionamentos: rels,
          metricas: mets,
        };
      },
      create: async (m) => {
        modelos.set(m.id, m);
        return m;
      },
      update: async (m) => {
        modelos.set(m.id, m);
        return m;
      },
      delete: async (id) => {
        modelos.delete(id);
      },
      homologarTransacional: async (id, homologadoPor, justificativa, timestamp) => {
        const mod = modelos.get(id);
        if (!mod) throw new Error('Não encontrado');
        // Revoga outros homologados da demanda
        for (const [k, v] of modelos.entries()) {
          if (v.demanda_id === mod.demanda_id && v.status === StatusModeloAnalitico.HOMOLOGADO && v.id !== id) {
            modelos.set(k, {
              ...v,
              status: StatusModeloAnalitico.REVOGADO,
              revogado_em: timestamp,
              motivo_revogacao: 'Substituído por novo modelo analítico homologado.',
              atualizado_em: timestamp,
            });
          }
        }
        const homologado: ModeloAnalitico = {
          ...mod,
          status: StatusModeloAnalitico.HOMOLOGADO,
          homologado_em: timestamp,
          homologado_por: homologadoPor,
          justificativa_homologacao: justificativa,
          atualizado_em: timestamp,
        };
        modelos.set(id, homologado);
        return homologado;
      },
      revogar: async (id, motivo, timestamp) => {
        const mod = modelos.get(id);
        if (!mod) return null;
        const revogado: ModeloAnalitico = {
          ...mod,
          status: StatusModeloAnalitico.REVOGADO,
          revogado_em: timestamp,
          motivo_revogacao: motivo,
          atualizado_em: timestamp,
        };
        modelos.set(id, revogado);
        return revogado;
      },
    };

    datasetRepo = {
      findById: async (id) => datasets.get(id) ?? null,
      findVigenteByDemandId: async (demId) =>
        Array.from(datasets.values()).find(
          (d) => d.demanda_id === demId && d.status === StatusAutorizacaoDataset.VIGENTE
        ) ?? null,
      listarHistorico: async (demId) => Array.from(datasets.values()).filter((d) => d.demanda_id === demId),
      autorizarTransacional: async (d) => {
        datasets.set(d.id, d);
        return d;
      },
      revogar: async () => null,
    };

    auditRepo = {
      record: async (evento) => {
        const saved: TrilhaAuditoria = {
          ...evento,
          id: evento.id ?? 'aud-1',
        };
        auditoria.push(saved);
        return saved;
      },
      findByDemandaId: async (demId: string) => auditoria.filter((a) => a.demanda_id === demId),
    };

    // Dataset Autorizado VIGENTE
    const dataset: DatasetAutorizadoAnalise = {
      id: 'ds-vigente',
      demanda_id: 'dem-01',
      ativo_dados_id: 'atv-01',
      diagnostico_qualidade_id: 'diag-01',
      receita_preparacao_id: null,
      versao_rotulo: '1.0',
      hash_sha256_snapshot: 'hash123',
      status: StatusAutorizacaoDataset.VIGENTE,
      justificativa_autorizacao: 'Homologação do dataset de vendas',
      autorizado_por_tipo: 'HUMANO',
      restricoes_aceitas_snapshot: '[]',
      autorizado_em: baseTimestamp,
      revogado_em: null,
      motivo_revogacao: null,
    };
    datasets.set(dataset.id, dataset);

    // Modelo Analítico Inicial Conforme
    const modelo: ModeloAnalitico = {
      id: 'mod-01',
      demanda_id: 'dem-01',
      dataset_autorizado_id: 'ds-vigente',
      nome: 'Modelo Comercial de Vendas',
      descricao: 'Grão central: Uma linha por item faturado na transação comercial.',
      tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
      status: StatusModeloAnalitico.RASCUNHO,
      homologado_em: null,
      homologado_por: null,
      justificativa_homologacao: null,
      revogado_em: null,
      motivo_revogacao: null,
      criado_em: baseTimestamp,
      atualizado_em: baseTimestamp,
    };
    modelos.set(modelo.id, modelo);

    // Entidade FATO com Chave Primária e Métrica Base
    const entidadeFato: EntidadeAnalitica = {
      id: 'ent-fato',
      modelo_id: 'mod-01',
      ativo_dados_id: 'atv-01',
      nome: 'FatoVendas',
      tipo: TipoEntidadeAnalitica.FATO,
      papel: PapelEntidadeAnalitica.FATO_TRANSACIONAL,
      origem_tipo: TipoOrigemEntidade.DATASET_AUTORIZADO,
      descricao: 'Grão de venda: uma linha por item faturado na transação.',
      ordem_apresentacao: 1,
      criado_em: baseTimestamp,
      atualizado_em: baseTimestamp,
    };
    entidades.set(entidadeFato.id, entidadeFato);

    const atrPk: AtributoAnalitico = {
      id: 'atr-pk',
      entidade_id: 'ent-fato',
      nome_original: 'id_venda',
      nome_amigavel: 'ID Venda',
      tipo_dado: TipoDadoAnalitico.INTEIRO,
      papel: PapelAtributoAnalitico.CHAVE_PRIMARIA,
      ordem: 1,
      oculto: false,
      descricao: 'Identificador primário da venda',
      formato_exibicao: null,
      criado_em: baseTimestamp,
      atualizado_em: baseTimestamp,
    };
    atributos.set(atrPk.id, atrPk);

    const atrValor: AtributoAnalitico = {
      id: 'atr-val',
      entidade_id: 'ent-fato',
      nome_original: 'valor_venda',
      nome_amigavel: 'Valor da Venda',
      tipo_dado: TipoDadoAnalitico.DECIMAL,
      papel: PapelAtributoAnalitico.METRICA_BASE,
      ordem: 2,
      oculto: false,
      descricao: 'Valor bruto da transação comercial',
      formato_exibicao: 'R$ #,##0.00',
      criado_em: baseTimestamp,
      atualizado_em: baseTimestamp,
    };
    atributos.set(atrValor.id, atrValor);

    // Métrica Analítica Conforme
    const metrica: MetricaAnalitica = {
      id: 'met-01',
      modelo_id: 'mod-01',
      entidade_id: 'ent-fato',
      nome: 'Receita Total',
      descricao: 'Soma dos valores das vendas realizadas. Reconciliação: ERP.',
      formula_declarativa: 'SUM(FatoVendas.valor_venda)',
      tipo_agregacao: TipoAgregacaoMetrica.SOMA,
      tipo_aditividade: TipoAditividadeMetrica.TOTALMENTE_ADITIVA,
      unidade_medida: UnidadeMedidaMetrica.MOEDA,
      formato_exibicao: 'R$ #,##0.00',
      status: StatusMetricaAnalitica.RASCUNHO,
      atributos_dependentes_ids: ['atr-val'],
      metricas_dependentes_ids: [],
      pergunta_negocio_associada: 'Qual o faturamento total?',
      objetivo_negocio_associado: 'Acompanhar metas de vendas',
      ordem: 1,
      criado_em: baseTimestamp,
      atualizado_em: baseTimestamp,
    };
    metricas.set(metrica.id, metrica);
  });

  describe('VerificarProntidaoModeloUseCase', () => {
    it('deve atestar prontidão positiva quando modelo não possui bloqueios', async () => {
      const useCase = new VerificarProntidaoModeloUseCase(modeloRepo, datasetRepo);
      const res = await useCase.execute({ modeloId: 'mod-01' });

      expect(res.prontoParaHomologacao).toBe(true);
      expect(res.motivosBloqueio.length).toBe(0);
      expect(res.statusModelo).toBe(StatusModeloAnalitico.RASCUNHO);
    });

    it('deve atestar bloqueio quando o modelo possui violação de BLOQUEIO (ex: sem grão)', async () => {
      const mod = modelos.get('mod-01')!;
      mod.descricao = '';
      const fato = entidades.get('ent-fato')!;
      fato.descricao = '';

      const useCase = new VerificarProntidaoModeloUseCase(modeloRepo, datasetRepo);
      const res = await useCase.execute({ modeloId: 'mod-01' });

      expect(res.prontoParaHomologacao).toBe(false);
      expect(res.motivosBloqueio.some((m) => m.includes('M-02'))).toBe(true);
    });

    it('deve apontar alertas críticos que exigem justificativa sem impedir prontidão estrutural', async () => {
      // Adicionar relacionamento N:M
      const relNM: RelacionamentoAnalitico = {
        id: 'rel-nm',
        modelo_id: 'mod-01',
        entidade_origem_id: 'ent-fato',
        atributo_origem_id: 'atr-pk',
        entidade_destino_id: 'ent-fato',
        atributo_destino_id: 'atr-pk',
        tipo_relacionamento: CardinalidadeRelacionamento.MUITOS_PARA_MUITOS,
        direcao_filtro: DirecaoFiltroRelacionamento.UNIDIRECIONAL,
        ativo: true,
        justificativa: null,
        criado_em: baseTimestamp,
        atualizado_em: baseTimestamp,
      };
      relacionamentos.set(relNM.id, relNM);

      const useCase = new VerificarProntidaoModeloUseCase(modeloRepo, datasetRepo);
      const res = await useCase.execute({ modeloId: 'mod-01' });

      expect(res.alertasCriticosQueExigemJustificativa.length).toBeGreaterThan(0);
      expect(res.alertasCriticosQueExigemJustificativa.some((a) => a.includes('M-06'))).toBe(true);
    });
  });

  describe('HomologarModeloAnaliticoUseCase', () => {
    it('deve rejeitar homologação quando o modelo possuir diagnóstico de BLOQUEIO', async () => {
      // Forçar aditividade inválida (M-04)
      const met = metricas.get('met-01')!;
      met.unidade_medida = UnidadeMedidaMetrica.PERCENTUAL;
      met.tipo_aditividade = TipoAditividadeMetrica.TOTALMENTE_ADITIVA;
      met.tipo_agregacao = TipoAgregacaoMetrica.SOMA;

      const useCase = new HomologarModeloAnaliticoUseCase(modeloRepo, datasetRepo, auditRepo);

      await expect(
        useCase.execute({
          modeloId: 'mod-01',
          justificativa: 'Tentativa de homologação com bloqueio matemático',
        })
      ).rejects.toThrow('bloqueios impeditivos de conformidade');
    });

    it('deve rejeitar homologação quando houver ALERTA_CRITICO sem justificativa formal de alertas', async () => {
      // Inserir relacionamento com filtro BIDIRECIONAL (M-07)
      const relBidi: RelacionamentoAnalitico = {
        id: 'rel-bidi',
        modelo_id: 'mod-01',
        entidade_origem_id: 'ent-fato',
        atributo_origem_id: 'atr-pk',
        entidade_destino_id: 'ent-fato',
        atributo_destino_id: 'atr-pk',
        tipo_relacionamento: CardinalidadeRelacionamento.MUITOS_PARA_UM,
        direcao_filtro: DirecaoFiltroRelacionamento.BIDIRECIONAL,
        ativo: true,
        justificativa: null,
        criado_em: baseTimestamp,
        atualizado_em: baseTimestamp,
      };
      relacionamentos.set(relBidi.id, relBidi);

      const useCase = new HomologarModeloAnaliticoUseCase(modeloRepo, datasetRepo, auditRepo);

      // Sem justificativaAlertas
      await expect(
        useCase.execute({
          modeloId: 'mod-01',
          justificativa: 'Justificativa de homologação do modelo analítico aprovada',
        })
      ).rejects.toThrow('exigem justificativa técnica formal com no mínimo 15 caracteres');

      // Com justificativaAlertas muito curta
      await expect(
        useCase.execute({
          modeloId: 'mod-01',
          justificativa: 'Justificativa de homologação do modelo analítico aprovada',
          justificativaAlertas: 'curta',
        })
      ).rejects.toThrow('exigem justificativa técnica formal com no mínimo 15 caracteres');
    });

    it('deve homologar com sucesso modelo com ALERTA_CRITICO quando justificativa técnica formal é fornecida', async () => {
      const relBidi: RelacionamentoAnalitico = {
        id: 'rel-bidi',
        modelo_id: 'mod-01',
        entidade_origem_id: 'ent-fato',
        atributo_origem_id: 'atr-pk',
        entidade_destino_id: 'ent-fato',
        atributo_destino_id: 'atr-pk',
        tipo_relacionamento: CardinalidadeRelacionamento.MUITOS_PARA_UM,
        direcao_filtro: DirecaoFiltroRelacionamento.BIDIRECIONAL,
        ativo: true,
        justificativa: 'Justificativa técnica',
        criado_em: baseTimestamp,
        atualizado_em: baseTimestamp,
      };
      relacionamentos.set(relBidi.id, relBidi);

      const useCase = new HomologarModeloAnaliticoUseCase(modeloRepo, datasetRepo, auditRepo);
      const homologado = await useCase.execute({
        modeloId: 'mod-01',
        justificativa: 'Modelo comercial de vendas auditado e aprovado para sustentação.',
        justificativaAlertas: 'Filtro bidirecional assumido tecnicamente para permitir contexto cruzado específico.',
      });

      expect(homologado.status).toBe(StatusModeloAnalitico.HOMOLOGADO);
      expect(homologado.homologado_em).toBeDefined();
      expect(homologado.homologado_por).toBe('HUMANO');
      expect(homologado.justificativa_homologacao).toContain('[Reconhecimento de Alertas Críticos]');

      // Auditoria gravada
      expect(auditoria.length).toBe(1);
      expect(auditoria[0].tipo_evento).toBe('DECISAO_HUMANA');
    });

    it('deve homologar com sucesso modelo conforme e não bloquear por simples RECOMENDAÇÃO', async () => {
      // M-08 ou M-09 geram apenas recomendação; não devem impedir homologação sem justificativa de alerta
      const useCase = new HomologarModeloAnaliticoUseCase(modeloRepo, datasetRepo, auditRepo);
      const homologado = await useCase.execute({
        modeloId: 'mod-01',
        justificativa: 'Homologação padrão do modelo de vendas sem nenhum alerta crítico.',
      });

      expect(homologado.status).toBe(StatusModeloAnalitico.HOMOLOGADO);
    });
  });

  describe('RevogarHomologacaoModeloUseCase', () => {
    it('deve revogar modelo homologado registrando motivo e auditoria', async () => {
      const homologarUseCase = new HomologarModeloAnaliticoUseCase(modeloRepo, datasetRepo, auditRepo);
      await homologarUseCase.execute({
        modeloId: 'mod-01',
        justificativa: 'Homologação prévia formal de teste para posterior revogação.',
      });

      const revogarUseCase = new RevogarHomologacaoModeloUseCase(modeloRepo, auditRepo);
      const revogado = await revogarUseCase.execute({
        modeloId: 'mod-01',
        motivo: 'Regras de negócio mudaram e novo grão transacional é necessário.',
      });

      expect(revogado.status).toBe(StatusModeloAnalitico.REVOGADO);
      expect(revogado.revogado_em).toBeDefined();
      expect(revogado.motivo_revogacao).toBe('Regras de negócio mudaram e novo grão transacional é necessário.');

      const eventoRevogacao = auditoria.find((a) => a.tipo_evento === 'DECISAO_HUMANA' && a.entidade === 'ModeloAnalitico' && a.dados_novos?.includes('REVOGADO'));
      expect(eventoRevogacao).toBeDefined();
    });

    it('deve rejeitar revogação de modelo que não está homologado', async () => {
      const revogarUseCase = new RevogarHomologacaoModeloUseCase(modeloRepo, auditRepo);
      await expect(
        revogarUseCase.execute({
          modeloId: 'mod-01', // está em RASCUNHO
          motivo: 'Tentativa de revogar rascunho com mais de 15 caracteres.',
        })
      ).rejects.toThrow('não está homologado');
    });
  });

  describe('ObterModeloHomologadoVigenteUseCase e Invalidação Determinística', () => {
    it('deve retornar modelo homologado vigente quando válido', async () => {
      const homologarUseCase = new HomologarModeloAnaliticoUseCase(modeloRepo, datasetRepo, auditRepo);
      await homologarUseCase.execute({
        modeloId: 'mod-01',
        justificativa: 'Homologação aprovada formalmente para produção.',
      });

      const useCase = new ObterModeloHomologadoVigenteUseCase(modeloRepo, datasetRepo);
      const res = await useCase.execute({ demandaId: 'dem-01' });

      expect(res.vigente).toBe(true);
      expect(res.modelo).toBeDefined();
      expect(res.modelo?.id).toBe('mod-01');
    });

    it('deve invalidar vigência se houver alteração material posterior em entidade/atributo', async () => {
      const homologarUseCase = new HomologarModeloAnaliticoUseCase(modeloRepo, datasetRepo, auditRepo);
      const homologado = await homologarUseCase.execute({
        modeloId: 'mod-01',
        justificativa: 'Homologação aprovada formalmente para produção.',
      });

      // Simular alteração posterior na entidade após homologação
      const tempoPosterior = new Date(new Date(homologado.homologado_em!).getTime() + 10000).toISOString();
      const ent = entidades.get('ent-fato')!;
      entidades.set(ent.id, {
        ...ent,
        atualizado_em: tempoPosterior,
      });

      const useCase = new ObterModeloHomologadoVigenteUseCase(modeloRepo, datasetRepo);
      const res = await useCase.execute({ demandaId: 'dem-01' });

      expect(res.vigente).toBe(false);
      expect(res.modelo).toBeNull();
      expect(res.motivoInvalidacao).toContain('alterações materiais em entidades, atributos');
    });

    it('deve invalidar vigência se o dataset autorizado vinculado for revogado', async () => {
      const homologarUseCase = new HomologarModeloAnaliticoUseCase(modeloRepo, datasetRepo, auditRepo);
      await homologarUseCase.execute({
        modeloId: 'mod-01',
        justificativa: 'Homologação aprovada formalmente para produção.',
      });

      // Revogar dataset autorizado
      const ds = datasets.get('ds-vigente')!;
      datasets.set(ds.id, {
        ...ds,
        status: StatusAutorizacaoDataset.REVOGADO,
        revogado_em: new Date().toISOString(),
      });

      const useCase = new ObterModeloHomologadoVigenteUseCase(modeloRepo, datasetRepo);
      const res = await useCase.execute({ demandaId: 'dem-01' });

      expect(res.vigente).toBe(false);
      expect(res.modelo).toBeNull();
      expect(res.motivoInvalidacao).toContain('VIGENTE');
    });
  });
});
