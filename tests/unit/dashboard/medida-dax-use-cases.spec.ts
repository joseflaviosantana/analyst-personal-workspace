/**
 * tests/unit/dashboard/medida-dax-use-cases.spec.ts
 *
 * Suíte de Testes Unitários dos Casos de Uso de Gestão de Medidas DAX e do Analisador em Tempo Real (Subgate 3.4C)
 *
 * Cobertura:
 * 1. Criação de medida DAX simples (SUM) e avançada (CALCULATE / Time Intelligence);
 * 2. Vínculo a métrica analítica homologada do Modelo Analítico;
 * 3. Validação de modelo Power BI e modelo analítico existentes;
 * 4. Bloqueio de duplicidade de nome de medida no mesmo modelo Power BI;
 * 5. Atualização de expressão, categoria, formato e metadados;
 * 6. Bloqueio de colisão de nomes ao renomear medida;
 * 7. Exclusão física controlada de medida DAX;
 * 8. Analisador em Tempo Real (DaxRealTimeAnalyzer):
 *    - Balanceamento estático de delimitadores (parênteses, colchetes, aspas);
 *    - Calibração epistêmica da regra D-04 (operador / é apenas RECOMENDAÇÃO, nunca BLOQUEIO);
 *    - Detecção de referências de tabelas, colunas e medidas;
 *    - Geração de cartões pedagógicos 'Aprenda enquanto trabalha';
 *    - Disclaimer epistêmico obrigatório (não compilação VertiPaq).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CriarMedidaDaxUseCase } from '@/core/use-cases/dashboard/criar-medida-dax.use-case';
import { AtualizarMedidaDaxUseCase } from '@/core/use-cases/dashboard/atualizar-medida-dax.use-case';
import { ExcluirMedidaDaxUseCase } from '@/core/use-cases/dashboard/excluir-medida-dax.use-case';
import { DaxRealTimeAnalyzer } from '@/core/domain/rules/dax-real-time-analyzer';
import { IModeloPowerBiRepository } from '@/core/domain/repositories/modelo-powerbi-repository.interface';
import { IMedidaDaxRepository } from '@/core/domain/repositories/medida-dax-repository.interface';
import { IModeloAnaliticoRepository } from '@/core/domain/repositories/modelo-analitico-repository.interface';
import { ModeloPowerBi, ModeloPowerBiCompleto } from '@/core/domain/entities/modelo-powerbi';
import { MedidaDax } from '@/core/domain/entities/medida-dax';
import { ModeloAnaliticoCompleto } from '@/core/domain/entities/modelo-analitico';
import { TipoFormatoModeloPowerBi } from '@/core/domain/enums/tipo-formato-modelo-powerbi';
import { StatusModeloPowerBi } from '@/core/domain/enums/status-modelo-powerbi';
import { CategoriaMedidaDax } from '@/core/domain/enums/categoria-medida-dax';
import { StatusModeloAnalitico } from '@/core/domain/enums/status-modelo-analitico';
import { TipoAgregacaoMetrica } from '@/core/domain/enums/tipo-agregacao-metrica';

describe('Casos de Uso de Gestão de Medidas DAX (Subgate 3.4C)', () => {
  let modeloPbiStore: Map<string, ModeloPowerBi>;
  let medidaDaxStore: Map<string, MedidaDax>;
  let modeloAnaliticoStore: Map<string, ModeloAnaliticoCompleto>;

  let mockModeloPbiRepo: IModeloPowerBiRepository;
  let mockMedidaDaxRepo: IMedidaDaxRepository;
  let mockModeloAnaliticoRepo: IModeloAnaliticoRepository;

  let criarMedidaUseCase: CriarMedidaDaxUseCase;
  let atualizarMedidaUseCase: AtualizarMedidaDaxUseCase;
  let excluirMedidaUseCase: ExcluirMedidaDaxUseCase;

  const DEMANDA_ID = 'demanda-123';
  const MODELO_PBI_ID = 'pbi-mod-001';
  const MODELO_ANALITICO_ID = 'mod-ana-001';
  const METRICA_ID = 'met-receita-01';

  beforeEach(() => {
    modeloPbiStore = new Map();
    medidaDaxStore = new Map();
    modeloAnaliticoStore = new Map();

    // Mock Medida DAX Repository
    mockMedidaDaxRepo = {
      findById: async (id: string) => medidaDaxStore.get(id) || null,
      findByModeloPowerBiId: async (modeloId: string) =>
        Array.from(medidaDaxStore.values()).filter(
          (m) => m.modelo_powerbi_id === modeloId
        ),
      findByMetricaAnaliticaId: async (metricaAnaliticaId: string) =>
        Array.from(medidaDaxStore.values()).filter(
          (m) => m.metrica_analitica_id === metricaAnaliticaId
        ),
      create: async (m: MedidaDax) => {
        medidaDaxStore.set(m.id, { ...m });
        return m;
      },
      update: async (m: MedidaDax) => {
        medidaDaxStore.set(m.id, { ...m });
        return m;
      },
      delete: async (id: string) => {
        medidaDaxStore.delete(id);
      },
    };

    // Mock Modelo Power BI Repository
    mockModeloPbiRepo = {
      findById: async (id: string) => modeloPbiStore.get(id) || null,
      findByDemandaId: async (demandaId: string) =>
        Array.from(modeloPbiStore.values()).filter((m) => m.demanda_id === demandaId),
      findCompletoById: async (id: string) => {
        const m = modeloPbiStore.get(id);
        if (!m) return null;
        const medidas = Array.from(medidaDaxStore.values()).filter(
          (med) => med.modelo_powerbi_id === id
        );
        return { ...m, medidas, paginas: [] } as ModeloPowerBiCompleto;
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

    // Mock Modelo Analítico Repository
    mockModeloAnaliticoRepo = {
      findById: async (id: string) => modeloAnaliticoStore.get(id) || null,
      findByDemandaId: async (demandaId: string) =>
        Array.from(modeloAnaliticoStore.values()).filter((m) => m.demanda_id === demandaId),
      findCompletoById: async (id: string) => modeloAnaliticoStore.get(id) || null,
      create: async (m: any) => m,
      update: async (m: any) => m,
      delete: async () => {},
    } as unknown as IModeloAnaliticoRepository;

    // Instanciar Casos de Uso com a ordem correta de repositórios
    criarMedidaUseCase = new CriarMedidaDaxUseCase(
      mockMedidaDaxRepo,
      mockModeloPbiRepo,
      mockModeloAnaliticoRepo
    );

    atualizarMedidaUseCase = new AtualizarMedidaDaxUseCase(mockMedidaDaxRepo);

    excluirMedidaUseCase = new ExcluirMedidaDaxUseCase(mockMedidaDaxRepo);

    // Setup inicial de dados de apoio
    const agora = new Date().toISOString();
    const modeloPbi: ModeloPowerBi = {
      id: MODELO_PBI_ID,
      demanda_id: DEMANDA_ID,
      tipo_formato: TipoFormatoModeloPowerBi.PBIX,
      nome_arquivo: 'Vendas_Analytics.pbix',
      caminho_local: null,
      justificativa_isencao: null,
      hash_sha256: null,
      versao_powerbi: null,
      tamanho_bytes: 1024,
      status: StatusModeloPowerBi.EM_DESENVOLVIMENTO,
      modelo_analitico_id: MODELO_ANALITICO_ID,
      criado_em: agora,
      atualizado_em: agora,
    };
    modeloPbiStore.set(MODELO_PBI_ID, modeloPbi);

    const modeloAnalitico: ModeloAnaliticoCompleto = {
      id: MODELO_ANALITICO_ID,
      demanda_id: DEMANDA_ID,
      dataset_autorizado_id: 'dataset-raw-01',
      nome: 'Modelo Star Vendas',
      descricao: 'Modelo dimensional de vendas',
      tipo_arquitetura: 'ESTRELA' as any,
      status: StatusModeloAnalitico.HOMOLOGADO,
      homologado_em: agora,
      homologado_por: 'Analista QA',
      justificativa_homologacao: 'Modelo homologado',
      revogado_em: null,
      motivo_revogacao: null,
      criado_em: agora,
      atualizado_em: agora,
      entidades: [],
      relacionamentos: [],
      metricas: [
        {
          id: METRICA_ID,
          modelo_id: MODELO_ANALITICO_ID,
          entidade_id: null,
          nome: 'Receita Líquida',
          descricao: 'Soma do valor líquido das notas fiscais',
          tipo_agregacao: TipoAgregacaoMetrica.SOMA,
          tipo_aditividade: 'TOTALMENTE_ADITIVA' as any,
          formula_declarativa: 'SUM(fVendas[ValorLiquido])',
          unidade_medida: 'MOEDA' as any,
          formato_exibicao: 'R$ #,##0.00',
          status: 'HOMOLOGADA' as any,
          atributos_dependentes_ids: [],
          metricas_dependentes_ids: [],
          pergunta_negocio_associada: null,
          objetivo_negocio_associado: null,
          ordem: 1,
          criado_em: agora,
          atualizado_em: agora,
        },
      ],
    };
    modeloAnaliticoStore.set(MODELO_ANALITICO_ID, modeloAnalitico);
  });

  describe('1. Criação de Medida DAX (CriarMedidaDaxUseCase)', () => {
    it('deve criar uma medida DAX válida vinculada a um modelo Power BI com sucesso', async () => {
      const { medida: result } = await criarMedidaUseCase.execute({
        modeloPowerBiId: MODELO_PBI_ID,
        nome: 'Receita Total',
        expressaoDax: 'SUM(fVendas[ValorLiquido])',
        tabelaHospedeira: '_Medidas',
        categoriaDax: CategoriaMedidaDax.AGREGACAO_SIMPLES,
        formatoString: 'R$ #,##0.00',
        descricao: 'Faturamento bruto acumulado',
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.nome).toBe('Receita Total');
      expect(result.expressao_dax).toBe('SUM(fVendas[ValorLiquido])');
      expect(result.tabela_hospedeira).toBe('_Medidas');
      expect(result.categoria_dax).toBe(CategoriaMedidaDax.AGREGACAO_SIMPLES);
      expect(result.formato_string).toBe('R$ #,##0.00');

      // Verifica persistência no repositório
      const saved = medidaDaxStore.get(result.id);
      expect(saved).toBeDefined();
      expect(saved?.nome).toBe('Receita Total');
    });

    it('deve criar uma medida DAX vinculada a uma métrica analítica homologada', async () => {
      const { medida: result } = await criarMedidaUseCase.execute({
        modeloPowerBiId: MODELO_PBI_ID,
        metricaAnaliticaId: METRICA_ID,
        nome: 'Receita Líquida DAX',
        expressaoDax: 'SUM(fVendas[ValorLiquido])',
        categoriaDax: CategoriaMedidaDax.AGREGACAO_SIMPLES,
      });

      expect(result.metrica_analitica_id).toBe(METRICA_ID);
      expect(result.tabela_hospedeira).toBe('_Medidas'); // default aplicado
    });

    it('deve rejeitar criação se o Modelo Power BI não existir', async () => {
      await expect(
        criarMedidaUseCase.execute({
          modeloPowerBiId: 'modelo-inexistente',
          nome: 'Medida Teste',
          expressaoDax: 'SUM(fVendas[Qtd])',
        })
      ).rejects.toThrow('não encontrado');
    });

    it('deve rejeitar criação com métrica analítica não encontrada no modelo analítico vinculado', async () => {
      await expect(
        criarMedidaUseCase.execute({
          modeloPowerBiId: MODELO_PBI_ID,
          metricaAnaliticaId: 'metrica-inexistente',
          nome: 'Medida Inválida',
          expressaoDax: 'SUM(fVendas[Qtd])',
        })
      ).rejects.toThrow('não pertence ao modelo analítico vinculado');
    });

    it('deve impedir duplicação de nome de medida no mesmo modelo Power BI (VertiPaq requirement)', async () => {
      await criarMedidaUseCase.execute({
        modeloPowerBiId: MODELO_PBI_ID,
        nome: 'Ticket Médio',
        expressaoDax: 'DIVIDE([Receita Total], [Total Pedidos])',
      });

      await expect(
        criarMedidaUseCase.execute({
          modeloPowerBiId: MODELO_PBI_ID,
          nome: 'Ticket Médio', // mesmo nome
          expressaoDax: 'AVERAGE(fVendas[Valor])',
        })
      ).rejects.toThrow('Já existe uma medida com o nome "Ticket Médio"');
    });
  });

  describe('2. Atualização de Medida DAX (AtualizarMedidaDaxUseCase)', () => {
    let medidaExistente: MedidaDax;

    beforeEach(async () => {
      const { medida } = await criarMedidaUseCase.execute({
        modeloPowerBiId: MODELO_PBI_ID,
        nome: 'Margem Bruta %',
        expressaoDax: 'DIVIDE([Lucro], [Receita])',
        tabelaHospedeira: '_Medidas',
        categoriaDax: CategoriaMedidaDax.TAXA_DIVISAO,
        formatoString: '0.0%',
      });
      medidaExistente = medida;
    });

    it('deve atualizar propriedades de uma medida DAX com sucesso', async () => {
      const { medida: updated } = await atualizarMedidaUseCase.execute({
        id: medidaExistente.id,
        nome: 'Margem Bruta Percentual',
        expressaoDax: 'DIVIDE([Lucro Bruto], [Receita Liquida], 0)',
        formatoString: '0.00%',
        categoriaDax: CategoriaMedidaDax.TAXA_DIVISAO,
        descricao: 'Percentual de rentabilidade líquida',
      });

      expect(updated.nome).toBe('Margem Bruta Percentual');
      expect(updated.expressao_dax).toBe('DIVIDE([Lucro Bruto], [Receita Liquida], 0)');
      expect(updated.formato_string).toBe('0.00%');
      expect(updated.descricao).toBe('Percentual de rentabilidade líquida');
      expect(new Date(updated.atualizado_em).getTime()).toBeGreaterThanOrEqual(
        new Date(medidaExistente.criado_em).getTime()
      );
    });

    it('deve rejeitar renomear para um nome já existente em outra medida do modelo', async () => {
      await criarMedidaUseCase.execute({
        modeloPowerBiId: MODELO_PBI_ID,
        nome: 'Outra Medida',
        expressaoDax: 'COUNTROWS(fVendas)',
      });

      await expect(
        atualizarMedidaUseCase.execute({
          id: medidaExistente.id,
          nome: 'Outra Medida', // colisão
        })
      ).rejects.toThrow('Já existe outra medida com o nome "Outra Medida"');
    });

    it('deve permitir atualizar mantendo o mesmo nome sem acusar colisão consigo mesma', async () => {
      const { medida: updated } = await atualizarMedidaUseCase.execute({
        id: medidaExistente.id,
        nome: 'Margem Bruta %', // mesmo nome da própria medida
        descricao: 'Descrição atualizada',
      });

      expect(updated.nome).toBe('Margem Bruta %');
      expect(updated.descricao).toBe('Descrição atualizada');
    });

    it('deve rejeitar atualização de medida inexistente', async () => {
      await expect(
        atualizarMedidaUseCase.execute({
          id: 'medida-fantasma',
          nome: 'Novo Nome',
        })
      ).rejects.toThrow('não encontrada');
    });
  });

  describe('3. Exclusão de Medida DAX (ExcluirMedidaDaxUseCase)', () => {
    it('deve excluir uma medida existente com sucesso', async () => {
      const { medida } = await criarMedidaUseCase.execute({
        modeloPowerBiId: MODELO_PBI_ID,
        nome: 'Medida Descartavel',
        expressaoDax: 'SUM(fVendas[Valor])',
      });

      expect(medidaDaxStore.has(medida.id)).toBe(true);

      const res = await excluirMedidaUseCase.execute({ id: medida.id });

      expect(res.success).toBe(true);
      expect(medidaDaxStore.has(medida.id)).toBe(false);
    });

    it('deve rejeitar exclusão de medida inexistente', async () => {
      await expect(excluirMedidaUseCase.execute({ id: 'id-inexistente' })).rejects.toThrow(
        'não encontrada'
      );
    });
  });

  describe('4. Analisador em Tempo Real (DaxRealTimeAnalyzer)', () => {
    it('deve detectar parênteses desbalanceados e retornar BLOQUEIO', () => {
      const analise = DaxRealTimeAnalyzer.analisar({
        expressaoDax: 'CALCULATE(SUM(fVendas[ValorLiquido])',
        nomeMedida: 'Receita Incompleta',
        tabelaHospedeira: '_Medidas',
      });

      expect(analise.bloqueiosCount).toBeGreaterThan(0);
      expect(analise.diagnosticos.some((i) => i.id === 'dax-unbalanced-parens')).toBe(true);
      expect(analise.diagnosticos.find((i) => i.id === 'dax-unbalanced-parens')?.severidade).toBe('BLOQUEIO');
    });

    it('deve detectar colchetes desbalanceados e retornar BLOQUEIO', () => {
      const analise = DaxRealTimeAnalyzer.analisar({
        expressaoDax: 'SUM(fVendas[ValorLiquido)',
        nomeMedida: 'Receita Colchete Aberto',
        tabelaHospedeira: '_Medidas',
      });

      expect(analise.bloqueiosCount).toBeGreaterThan(0);
      expect(analise.diagnosticos.some((i) => i.id === 'dax-unbalanced-brackets')).toBe(true);
    });

    it('deve calibrar epistemologicamente o operador / como RECOMENDAÇÃO de boa prática e NUNCA como BLOQUEIO (Regra D-04)', () => {
      const analise = DaxRealTimeAnalyzer.analisar({
        expressaoDax: '[Faturamento] / [Total Pedidos]',
        nomeMedida: 'Ticket Médio',
        tabelaHospedeira: '_Medidas',
      });

      expect(analise.bloqueiosCount).toBe(0);

      const d04Item = analise.diagnosticos.find((i) => i.id === 'dax-divisao-barra');
      expect(d04Item).toBeDefined();
      expect(d04Item?.severidade).toBe('RECOMENDACAO');
      expect(d04Item?.titulo).toContain('Operador / vs DIVIDE()');
      expect(d04Item?.mensagem).not.toContain('inválida');
      expect(d04Item?.mensagem).not.toContain('erro de compilação');
    });

    it('não deve emitir recomendação de DIVIDE quando a função DIVIDE já for utilizada', () => {
      const analise = DaxRealTimeAnalyzer.analisar({
        expressaoDax: 'DIVIDE([Faturamento], [Total Pedidos], 0)',
        nomeMedida: 'Ticket Médio Seguro',
        tabelaHospedeira: '_Medidas',
      });

      const d04Item = analise.diagnosticos.find((i) => i.id === 'dax-divisao-barra');
      expect(d04Item).toBeUndefined();
    });

    it('deve identificar tabelas, colunas e medidas referenciadas na expressão', () => {
      const analise = DaxRealTimeAnalyzer.analisar({
        expressaoDax: 'CALCULATE(SUM(fVendas[ValorLiquido]), dCalendario[Ano] = 2026, [MedidaBase] > 100)',
        nomeMedida: 'Vendas Complexas',
        tabelaHospedeira: '_Medidas',
      });

      expect(analise.referenciasDetectadas.tabelas).toContain('fVendas');
      expect(analise.referenciasDetectadas.tabelas).toContain('dCalendario');
      expect(analise.referenciasDetectadas.colunas).toContain('ValorLiquido');
      expect(analise.referenciasDetectadas.colunas).toContain('Ano');
      expect(analise.referenciasDetectadas.medidas).toContain('MedidaBase');
    });

    it('deve gerar cartões conceituais estruturados para "Aprenda enquanto trabalha"', () => {
      const analise = DaxRealTimeAnalyzer.analisar({
        expressaoDax: 'VAR AnoAnterior = CALCULATE(SUM(fVendas[ValorLiquido]), SAMEPERIODLASTYEAR(dCalendario[Data])) RETURN DIVIDE([Receita Atual] - AnoAnterior, AnoAnterior)',
        nomeMedida: 'Crescimento YoY',
        tabelaHospedeira: '_Medidas',
      });

      expect(analise.conteudoPedagogico.length).toBeGreaterThan(0);

      const cartaoCalculate = analise.conteudoPedagogico.find((c) => c.conceito.includes('CALCULATE'));
      expect(cartaoCalculate).toBeDefined();
      expect(cartaoCalculate?.oQueE).toBeDefined();
      expect(cartaoCalculate?.porQueImporta).toBeDefined();
      expect(cartaoCalculate?.comoEstaSendoUsado).toBeDefined();
      expect(cartaoCalculate?.dicaProfissional).toBeDefined();

      const cartaoDivide = analise.conteudoPedagogico.find((c) =>
        c.conceito.includes('DIVIDE')
      );
      expect(cartaoDivide).toBeDefined();

      const cartaoVariaveis = analise.conteudoPedagogico.find((c) =>
        c.conceito.includes('Variáveis')
      );
      expect(cartaoVariaveis).toBeDefined();
    });

    it('deve incluir o aviso epistêmico que assegura que a análise é estática e não execução VertiPaq', () => {
      const analise = DaxRealTimeAnalyzer.analisar({
        expressaoDax: 'SUM(fVendas[Valor])',
        nomeMedida: 'Soma',
        tabelaHospedeira: '_Medidas',
      });
      expect(analise.avisoEpistemico).toBeDefined();
      expect(analise.avisoEpistemico).toContain('Workspace');
      expect(analise.avisoEpistemico).toContain('VertiPaq');
    });
  });
});
