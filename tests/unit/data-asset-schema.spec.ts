import { describe, it, expect } from 'vitest';
import { 
  registerDataAssetSchema, 
  replaceDataAssetSchema,
  sugerirProximaVersao,
  normalizarCaminhoLocal 
} from '@/lib/validations/data-asset-schema';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';

describe('Validações de Ativo de Dados (data-asset-schema)', () => {
  it('normalizarCaminhoLocal deve remover aspas simples e duplas circundantes', () => {
    expect(normalizarCaminhoLocal('"C:\\Dados\\vendas.xlsx"')).toBe('C:\\Dados\\vendas.xlsx');
    expect(normalizarCaminhoLocal("'D:\\Clientes\\base.csv'")).toBe('D:\\Clientes\\base.csv');
    expect(normalizarCaminhoLocal('   "C:\\Projetos\\teste.txt"   ')).toBe('C:\\Projetos\\teste.txt');
    expect(normalizarCaminhoLocal('C:\\Normal\\arquivo.csv')).toBe('C:\\Normal\\arquivo.csv');
    expect(normalizarCaminhoLocal('')).toBe('');
  });

  it('deve validar com sucesso um payload canônico de cadastro de ativo', () => {
    const payload = {
      demanda_id: 'dem_123',
      caminho_local: '"C:\\Projetos\\vendas.xlsx"',
      nome_arquivo: 'vendas.xlsx',
      formato: FormatoArquivo.XLSX,
      tamanho_bytes: 1048576,
      total_linhas: 500,
      total_colunas: 8,
      hash_sha256: 'a'.repeat(64),
      schema_inferido: JSON.stringify({ id: 'number', nome: 'string' }),
      origem: 'Sistema SAP / Depto Financeiro',
      descricao_conteudo: 'Base transacional de vendas do ano de 2024',
      granularidade: 'Transacional',
      periodo_inicio: '2024-01-01',
      periodo_fim: '2024-12-31',
      data_recebimento: '2026-09-26',
      versao: '1.0',
    };

    const resultado = registerDataAssetSchema.parse(payload);
    expect(resultado.origem).toBe('Sistema SAP / Depto Financeiro');
    expect(resultado.caminho_local).toBe('C:\\Projetos\\vendas.xlsx'); // sem aspas
    expect(resultado.versao).toBe('1.0');
  });

  it('deve rejeitar origem com menos de 3 caracteres', () => {
    const payloadInvalido = {
      demanda_id: 'dem_123',
      caminho_local: 'C:\\vendas.csv',
      nome_arquivo: 'vendas.csv',
      formato: FormatoArquivo.CSV,
      tamanho_bytes: 100,
      total_linhas: 10,
      total_colunas: 2,
      hash_sha256: 'b'.repeat(64),
      origem: 'ab', // menos de 3 caracteres
      data_recebimento: '2026-09-26',
    };

    expect(() => registerDataAssetSchema.parse(payloadInvalido)).toThrow(
      /A origem informada deve conter no mínimo 3 caracteres/
    );
  });

  it('deve rejeitar hash SHA-256 com tamanho diferente de 64 caracteres', () => {
    const payloadInvalido = {
      demanda_id: 'dem_123',
      caminho_local: 'C:\\vendas.csv',
      nome_arquivo: 'vendas.csv',
      formato: FormatoArquivo.CSV,
      tamanho_bytes: 100,
      total_linhas: 10,
      total_colunas: 2,
      hash_sha256: 'invalido',
      origem: 'Depto Vendas',
      data_recebimento: '2026-09-26',
    };

    expect(() => registerDataAssetSchema.parse(payloadInvalido)).toThrow(
      /Hash SHA-256 deve conter exatamente 64 caracteres/
    );
  });

  it('deve atribuir versão 1.0 como padrão quando versao for nula ou omitida no cadastro', () => {
    const payloadSemVersao = {
      demanda_id: 'dem_123',
      caminho_local: 'C:\\vendas.csv',
      nome_arquivo: 'vendas.csv',
      formato: FormatoArquivo.CSV,
      tamanho_bytes: 100,
      total_linhas: 10,
      total_colunas: 2,
      hash_sha256: 'c'.repeat(64),
      origem: 'Fonte Externa',
      data_recebimento: '2026-09-26',
    };

    const resultado = registerDataAssetSchema.parse(payloadSemVersao);
    expect(resultado.versao).toBe('1.0');
  });

  describe('sugerirProximaVersao', () => {
    it('deve retornar null para ativo sem versão ou nulo', () => {
      expect(sugerirProximaVersao(null)).toBeNull();
      expect(sugerirProximaVersao(undefined)).toBeNull();
      expect(sugerirProximaVersao('')).toBeNull();
    });

    it('deve incrementar a parte Y no padrão canônico X.Y', () => {
      expect(sugerirProximaVersao('1.0')).toBe('1.1');
      expect(sugerirProximaVersao('1.1')).toBe('1.2');
      expect(sugerirProximaVersao('1.9')).toBe('1.10');
      expect(sugerirProximaVersao('2.15')).toBe('2.16');
      expect(sugerirProximaVersao('10.99')).toBe('10.100');
    });

    it('deve retornar null para formatos fora do padrão X.Y', () => {
      expect(sugerirProximaVersao('v1')).toBeNull();
      expect(sugerirProximaVersao('2024-Rev2')).toBeNull();
      expect(sugerirProximaVersao('1.0.0')).toBeNull();
      expect(sugerirProximaVersao('final')).toBeNull();
      expect(sugerirProximaVersao('1.x')).toBeNull();
    });
  });

  describe('replaceDataAssetSchema', () => {
    const baseReplacePayload = {
      demanda_id: 'dem_123',
      ativo_antigo_id: 'ast_old_1',
      caminho_local: '"C:\\Dados\\vendas_v2.csv"',
      nome_arquivo: 'vendas_v2.csv',
      formato: FormatoArquivo.CSV,
      tamanho_bytes: 2048,
      total_linhas: 20,
      total_colunas: 5,
      hash_sha256: 'd'.repeat(64),
      origem: 'Depto Financeiro',
      versao: '1.1',
      justificativa: 'Atualização mensal com novos fechamentos de vendas',
      data_recebimento: '2026-09-26',
    };

    it('deve validar com sucesso um payload válido de substituição', () => {
      const parsed = replaceDataAssetSchema.parse(baseReplacePayload);
      expect(parsed.ativo_antigo_id).toBe('ast_old_1');
      expect(parsed.versao).toBe('1.1');
      expect(parsed.justificativa).toBe('Atualização mensal com novos fechamentos de vendas');
      expect(parsed.caminho_local).toBe('C:\\Dados\\vendas_v2.csv');
    });

    it('deve rejeitar justificativa com menos de 10 caracteres', () => {
      const payloadInvalido = {
        ...baseReplacePayload,
        justificativa: 'Curto',
      };
      expect(() => replaceDataAssetSchema.parse(payloadInvalido)).toThrow(
        /A justificativa da substituição deve conter no mínimo 10 caracteres/
      );
    });

    it('deve rejeitar justificativa vazia ou com espaços em branco', () => {
      const payloadInvalido = {
        ...baseReplacePayload,
        justificativa: '         ',
      };
      expect(() => replaceDataAssetSchema.parse(payloadInvalido)).toThrow(
        /A justificativa da substituição deve conter no mínimo 10 caracteres/
      );
    });

    it('deve rejeitar quando versao estiver vazia', () => {
      const payloadInvalido = {
        ...baseReplacePayload,
        versao: '',
      };
      expect(() => replaceDataAssetSchema.parse(payloadInvalido)).toThrow(
        /A versão do novo ativo é obrigatória/
      );
    });

    it('deve rejeitar quando ativo_antigo_id for omitido', () => {
      const { ativo_antigo_id, ...resto } = baseReplacePayload;
      expect(() => replaceDataAssetSchema.parse(resto)).toThrow();
    });
  });
});
