/**
 * tests/unit/dashboard/modelo-powerbi-use-cases.spec.ts
 *
 * Suíte de Testes Unitários dos Casos de Uso de Criação, Edição e Vinculação de Modelo Power BI (Subgate 3.4B)
 *
 * Validações:
 * 1. Criação de modelo .pbix padrão;
 * 2. Criação de modelo .pbip (Power BI Project);
 * 3. Vínculo automático de Modelo Analítico homologado da demanda;
 * 4. Erro controlado se demanda não existir;
 * 5. Erro se modelo analítico informado pertencer a outra demanda;
 * 6. Criação de ISENTO_EXCEL_ONLY com justificativa válida (>= 15 chars);
 * 7. Bloqueio de ISENTO_EXCEL_ONLY com justificativa ausente ou insuficiente (< 15 chars);
 * 8. Atualização de metadados (nome, caminho, versão);
 * 9. Transição de status (EM_DESENVOLVIMENTO -> CONCLUIDO -> HOMOLOGADO);
 * 10. Atualização de justificativa de isenção com validação;
 * 11. Erro controlado ao tentar atualizar modelo inexistente;
 * 12. Auditabilidade e atualização de timestamp atualizado_em.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CriarModeloPowerBiUseCase } from '@/core/use-cases/dashboard/criar-modelo-powerbi.use-case';
import { AtualizarModeloPowerBiUseCase } from '@/core/use-cases/dashboard/atualizar-modelo-powerbi.use-case';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';
import { IModeloPowerBiRepository } from '@/core/domain/repositories/modelo-powerbi-repository.interface';
import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { Demanda, DemandaComProjeto } from '@/core/domain/entities/demanda';
import { ModeloPowerBi, ModeloPowerBiCompleto } from '@/core/domain/entities/modelo-powerbi';
import { ModeloAnalitico, ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { TipoFormatoModeloPowerBi } from '@/core/domain/enums/tipo-formato-modelo-powerbi';
import { StatusModeloPowerBi } from '@/core/domain/enums/status-modelo-powerbi';
import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';
import { TipoArquiteturaModelo } from '@/core/domain/enums/tipo-arquitetura-modelo';

describe('Casos de Uso de Modelo Power BI (Subgate 3.4B)', () => {
  let demandStore: Map<string, DemandaComProjeto>;
  let modeloPbiStore: Map<string, ModeloPowerBi>;
  let modeloAnaliticoStore: Map<string, ModeloAnaliticoCompleto>;

  let mockDemandRepo: IDemandRepository;
  let mockModeloPbiRepo: IModeloPowerBiRepository;
  let mockModeloAnaliticoRepo: IModeloAnaliticoRepository;

  beforeEach(() => {
    demandStore = new Map();
    modeloPbiStore = new Map();
    modeloAnaliticoStore = new Map();

    mockDemandRepo = {
      findById: async (id: string) => demandStore.get(id) || null,
      findAll: async () => Array.from(demandStore.values()),
      create: async (d: Demanda) => {
        const full: DemandaComProjeto = { ...d, projetoNome: 'Proj A' };
        demandStore.set(d.id, full);
        return full;
      },
      update: async (d: Demanda) => {
        const full: DemandaComProjeto = { ...d, projetoNome: 'Proj A' };
        demandStore.set(d.id, full);
        return full;
      },
      delete: async (id: string) => {
        demandStore.delete(id);
      },
    } as unknown as IDemandRepository;

    mockModeloPbiRepo = {
      findById: async (id: string) => modeloPbiStore.get(id) || null,
      findByDemandaId: async (demandaId: string) =>
        Array.from(modeloPbiStore.values()).filter((m) => m.demanda_id === demandaId),
      findCompletoById: async (id: string) => {
        const m = modeloPbiStore.get(id);
        if (!m) return null;
        return { ...m, medidas: [], paginas: [] } as ModeloPowerBiCompleto;
      },
      create: async (m: ModeloPowerBi) => {
        modeloPbiStore.set(m.id, { ...m });
        return m;
      },
      update: async (m: ModeloPowerBi) => {
        modeloPbiStore.set(m.id, { ...m });
        return m;
      },
      delete: async (id: string) => {
        modeloPbiStore.delete(id);
      },
    };

    mockModeloAnaliticoRepo = {
      findById: async (id: string) => modeloAnaliticoStore.get(id) || null,
      findByDemandaId: async (demandaId: string) =>
        Array.from(modeloAnaliticoStore.values()).filter((m) => m.demanda_id === demandaId),
      findCompletoById: async (id: string) => modeloAnaliticoStore.get(id) || null,
      create: async (m: ModeloAnalitico) => m,
      update: async (m: ModeloAnalitico) => m,
      delete: async () => {},
    } as unknown as IModeloAnaliticoRepository;

    // Fixture de Demanda autorizada
    demandStore.set('dem-100', {
      id: 'dem-100',
      projeto_id: 'proj-1',
      projetoNome: 'Vendas Varejo',
      titulo: 'Dashboard Executivo de Vendas',
      solicitacao_bruta: 'Painel com visão consolidada e detalhada de vendas',
      contexto: null,
      objetivo_inicial: null,
      prazo_esperado: null,
      restricoes_declaradas: null,
      estado: EstadoDemanda.EM_MODELAGEM_E_ANALISE,
      data_conclusao: null,
      criado_em: '2026-09-01T10:00:00.000Z',
      atualizado_em: '2026-09-01T10:00:00.000Z',
    });
  });

  describe('CriarModeloPowerBiUseCase', () => {
    it('deve registrar com sucesso um arquivo .pbix padrão', async () => {
      const useCase = new CriarModeloPowerBiUseCase(mockDemandRepo, mockModeloPbiRepo);

      const result = await useCase.execute({
        demandaId: 'dem-100',
        nomeArquivo: 'vendas_executivo.pbix',
        caminhoLocal: 'C:\\Analytics\\vendas_executivo.pbix',
        tipoFormato: TipoFormatoModeloPowerBi.PBIX,
        versaoPowerBi: '2.138.1004.0',
        tamanhoBytes: 5242880,
      });

      expect(result.modelo).toBeDefined();
      expect(result.modelo.id).toMatch(/^pbi_/);
      expect(result.modelo.demanda_id).toBe('dem-100');
      expect(result.modelo.nome_arquivo).toBe('vendas_executivo.pbix');
      expect(result.modelo.tipo_formato).toBe(TipoFormatoModeloPowerBi.PBIX);
      expect(result.modelo.status).toBe(StatusModeloPowerBi.EM_DESENVOLVIMENTO);
      expect(result.modelo.justificativa_isencao).toBeNull();
      expect(result.modelo.tamanho_bytes).toBe(5242880);

      // Persistência no repositório verificada
      const salvo = await mockModeloPbiRepo.findById(result.modelo.id);
      expect(salvo).toEqual(result.modelo);
    });

    it('deve registrar com sucesso um projeto .pbip (Power BI Project / TMDL)', async () => {
      const useCase = new CriarModeloPowerBiUseCase(mockDemandRepo, mockModeloPbiRepo);

      const result = await useCase.execute({
        demandaId: 'dem-100',
        nomeArquivo: 'vendas_tmdl.pbip',
        tipoFormato: TipoFormatoModeloPowerBi.PBIP,
        versaoPowerBi: '2.138.1004.0',
      });

      expect(result.modelo.tipo_formato).toBe(TipoFormatoModeloPowerBi.PBIP);
      expect(result.modelo.nome_arquivo).toBe('vendas_tmdl.pbip');
    });

    it('deve vincular automaticamente o modelo analítico homologado da demanda', async () => {
      modeloAnaliticoStore.set('mod-ana-1', {
        id: 'mod-ana-1',
        demanda_id: 'dem-100',
        dataset_autorizado_id: 'ds-1',
        nome: 'Modelo Dimensional de Vendas',
        descricao: null,
        tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
        status: StatusModeloAnalitico.HOMOLOGADO,
        homologado_em: '2026-09-10T10:00:00.000Z',
        homologado_por: 'analista@empresa.com',
        justificativa_homologacao: 'Modelo validado com métricas consistentes',
        revogado_em: null,
        motivo_revogacao: null,
        criado_em: '2026-09-02T10:00:00.000Z',
        atualizado_em: '2026-09-10T10:00:00.000Z',
        entidades: [],
        relacionamentos: [],
        metricas: [],
      });

      const useCase = new CriarModeloPowerBiUseCase(
        mockDemandRepo,
        mockModeloPbiRepo,
        mockModeloAnaliticoRepo
      );

      const result = await useCase.execute({
        demandaId: 'dem-100',
        nomeArquivo: 'vendas.pbix',
        tipoFormato: TipoFormatoModeloPowerBi.PBIX,
      });

      expect(result.modelo.modelo_analitico_id).toBe('mod-ana-1');
    });

    it('deve rejeitar modelo se a demanda não existir', async () => {
      const useCase = new CriarModeloPowerBiUseCase(mockDemandRepo, mockModeloPbiRepo);

      await expect(
        useCase.execute({
          demandaId: 'dem-inexistente',
          nomeArquivo: 'teste.pbix',
        })
      ).rejects.toThrow('Demanda com ID "dem-inexistente" não encontrada.');
    });

    it('deve rejeitar modelo se o modelo analítico pertencer a outra demanda', async () => {
      modeloAnaliticoStore.set('mod-ana-outra', {
        id: 'mod-ana-outra',
        demanda_id: 'dem-outra',
        dataset_autorizado_id: 'ds-2',
        nome: 'Modelo Outra Demanda',
        descricao: null,
        tipo_arquitetura: TipoArquiteturaModelo.ESTRELA,
        status: StatusModeloAnalitico.HOMOLOGADO,
        homologado_em: '2026-09-10T10:00:00.000Z',
        homologado_por: 'analista@empresa.com',
        justificativa_homologacao: 'Homologado',
        revogado_em: null,
        motivo_revogacao: null,
        criado_em: '2026-09-02T10:00:00.000Z',
        atualizado_em: '2026-09-10T10:00:00.000Z',
        entidades: [],
        relacionamentos: [],
        metricas: [],
      });

      const useCase = new CriarModeloPowerBiUseCase(
        mockDemandRepo,
        mockModeloPbiRepo,
        mockModeloAnaliticoRepo
      );

      await expect(
        useCase.execute({
          demandaId: 'dem-100',
          modeloAnaliticoId: 'mod-ana-outra',
          nomeArquivo: 'teste.pbix',
        })
      ).rejects.toThrow('pertence a outra demanda e não pode ser vinculado');
    });

    it('deve registrar com sucesso formalização de ISENTO_EXCEL_ONLY com justificativa >= 15 chars', async () => {
      const useCase = new CriarModeloPowerBiUseCase(mockDemandRepo, mockModeloPbiRepo);

      const result = await useCase.execute({
        demandaId: 'dem-100',
        nomeArquivo: 'Entrega-Tabular-Excel.xlsx',
        tipoFormato: TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY,
        status: StatusModeloPowerBi.HOMOLOGADO,
        justificativaIsencao: 'Consumo exclusivo via planilha dinâmica pelo comitê executivo.',
      });

      expect(result.modelo.tipo_formato).toBe(TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY);
      expect(result.modelo.justificativa_isencao).toBe(
        'Consumo exclusivo via planilha dinâmica pelo comitê executivo.'
      );
      expect(result.modelo.status).toBe(StatusModeloPowerBi.HOMOLOGADO);
    });

    it('deve bloquear ISENTO_EXCEL_ONLY se a justificativa for menor que 15 caracteres', async () => {
      const useCase = new CriarModeloPowerBiUseCase(mockDemandRepo, mockModeloPbiRepo);

      await expect(
        useCase.execute({
          demandaId: 'dem-100',
          nomeArquivo: 'Planilha.xlsx',
          tipoFormato: TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY,
          justificativaIsencao: 'Muito curta',
        })
      ).rejects.toThrow('no mínimo 15 caracteres');
    });

    it('deve bloquear ISENTO_EXCEL_ONLY se a justificativa for nula ou vazia', async () => {
      const useCase = new CriarModeloPowerBiUseCase(mockDemandRepo, mockModeloPbiRepo);

      await expect(
        useCase.execute({
          demandaId: 'dem-100',
          nomeArquivo: 'Planilha.xlsx',
          tipoFormato: TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY,
          justificativaIsencao: '',
        })
      ).rejects.toThrow('no mínimo 15 caracteres');
    });
  });

  describe('AtualizarModeloPowerBiUseCase', () => {
    beforeEach(async () => {
      // Cria modelo base para testes de atualização
      const base: ModeloPowerBi = {
        id: 'pbi-existente-1',
        demanda_id: 'dem-100',
        modelo_analitico_id: null,
        nome_arquivo: 'modelo_original.pbix',
        caminho_local: 'C:\\Original\\modelo.pbix',
        tipo_formato: TipoFormatoModeloPowerBi.PBIX,
        status: StatusModeloPowerBi.EM_DESENVOLVIMENTO,
        justificativa_isencao: null,
        hash_sha256: null,
        versao_powerbi: '2.130.0.0',
        tamanho_bytes: 1048576,
        criado_em: '2026-09-15T10:00:00.000Z',
        atualizado_em: '2026-09-15T10:00:00.000Z',
      };
      await mockModeloPbiRepo.create(base);
    });

    it('deve atualizar metadados técnicos (nome, caminho e versão)', async () => {
      const useCase = new AtualizarModeloPowerBiUseCase(mockModeloPbiRepo);

      const result = await useCase.execute({
        id: 'pbi-existente-1',
        nomeArquivo: 'modelo_atualizado.pbix',
        caminhoLocal: 'D:\\BI\\modelo_atualizado.pbix',
        versaoPowerBi: '2.138.1004.0',
        tamanhoBytes: 2097152,
      });

      expect(result.modelo.nome_arquivo).toBe('modelo_atualizado.pbix');
      expect(result.modelo.caminho_local).toBe('D:\\BI\\modelo_atualizado.pbix');
      expect(result.modelo.versao_powerbi).toBe('2.138.1004.0');
      expect(result.modelo.tamanho_bytes).toBe(2097152);
      expect(new Date(result.modelo.atualizado_em).getTime()).toBeGreaterThan(
        new Date('2026-09-15T10:00:00.000Z').getTime()
      );
    });

    it('deve permitir avanço de status no ciclo de vida (EM_DESENVOLVIMENTO -> HOMOLOGADO)', async () => {
      const useCase = new AtualizarModeloPowerBiUseCase(mockModeloPbiRepo);

      const result = await useCase.execute({
        id: 'pbi-existente-1',
        status: StatusModeloPowerBi.HOMOLOGADO,
      });

      expect(result.modelo.status).toBe(StatusModeloPowerBi.HOMOLOGADO);
    });

    it('deve validar justificativa ao alterar o formato para ISENTO_EXCEL_ONLY', async () => {
      const useCase = new AtualizarModeloPowerBiUseCase(mockModeloPbiRepo);

      // Justificativa válida
      const resValido = await useCase.execute({
        id: 'pbi-existente-1',
        tipoFormato: TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY,
        justificativaIsencao: 'Justificativa formal com mais de quinze caracteres para homologar.',
      });

      expect(resValido.modelo.tipo_formato).toBe(TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY);
      expect(resValido.modelo.justificativa_isencao).toBe(
        'Justificativa formal com mais de quinze caracteres para homologar.'
      );

      // Tentativa inválida (< 15 chars)
      await expect(
        useCase.execute({
          id: 'pbi-existente-1',
          tipoFormato: TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY,
          justificativaIsencao: 'Curta',
        })
      ).rejects.toThrow('no mínimo 15 caracteres');
    });

    it('deve limpar a justificativa se o formato for alterado de ISENTO_EXCEL_ONLY para PBIX', async () => {
      const isentoBase: ModeloPowerBi = {
        id: 'pbi-isento-1',
        demanda_id: 'dem-100',
        modelo_analitico_id: null,
        nome_arquivo: 'relatorio.xlsx',
        caminho_local: null,
        tipo_formato: TipoFormatoModeloPowerBi.ISENTO_EXCEL_ONLY,
        status: StatusModeloPowerBi.HOMOLOGADO,
        justificativa_isencao: 'Justificativa prévia existente com mais de quinze caracteres.',
        hash_sha256: null,
        versao_powerbi: null,
        tamanho_bytes: 0,
        criado_em: '2026-09-15T10:00:00.000Z',
        atualizado_em: '2026-09-15T10:00:00.000Z',
      };
      await mockModeloPbiRepo.create(isentoBase);

      const useCase = new AtualizarModeloPowerBiUseCase(mockModeloPbiRepo);

      const result = await useCase.execute({
        id: 'pbi-isento-1',
        tipoFormato: TipoFormatoModeloPowerBi.PBIX,
        nomeArquivo: 'migrado_para_powerbi.pbix',
      });

      expect(result.modelo.tipo_formato).toBe(TipoFormatoModeloPowerBi.PBIX);
      expect(result.modelo.justificativa_isencao).toBeNull();
    });

    it('deve lançar erro se tentar atualizar modelo inexistente', async () => {
      const useCase = new AtualizarModeloPowerBiUseCase(mockModeloPbiRepo);

      await expect(
        useCase.execute({
          id: 'pbi-nao-existe',
          nomeArquivo: 'novo.pbix',
        })
      ).rejects.toThrow('Modelo Power BI com ID "pbi-nao-existe" não encontrado.');
    });
  });
});
