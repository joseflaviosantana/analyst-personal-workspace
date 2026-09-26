import { describe, it, expect } from 'vitest';
import { 
  FormatoArquivo, 
  ROTULOS_FORMATO_ARQUIVO, 
  normalizarFormatoArquivo 
} from '@/core/domain/enums/formato-arquivo';
import { 
  StatusAtivoDados, 
  ROTULOS_STATUS_ATIVO_DADOS, 
  normalizarStatusAtivoDados 
} from '@/core/domain/enums/status-ativo-dados';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';

describe('Unit: Ativo de Dados — Enums e Normalização (Bloco 3.1)', () => {
  describe('FormatoArquivo', () => {
    it('deve conter todos os formatos canônicos exigidos pela documentação', () => {
      expect(FormatoArquivo.XLSX).toBe('XLSX');
      expect(FormatoArquivo.XLS).toBe('XLS');
      expect(FormatoArquivo.CSV).toBe('CSV');
      expect(FormatoArquivo.TXT).toBe('TXT');
      expect(FormatoArquivo.TSV).toBe('TSV');
      expect(FormatoArquivo.BASE_TRATADA).toBe('BASE_TRATADA');
      expect(FormatoArquivo.OUTRO).toBe('OUTRO');
    });

    it('deve possuir rótulos amigáveis para todos os formatos', () => {
      expect(ROTULOS_FORMATO_ARQUIVO[FormatoArquivo.XLSX]).toContain('.xlsx');
      expect(ROTULOS_FORMATO_ARQUIVO[FormatoArquivo.CSV]).toContain('.csv');
      expect(ROTULOS_FORMATO_ARQUIVO[FormatoArquivo.TSV]).toContain('.tsv');
      expect(ROTULOS_FORMATO_ARQUIVO[FormatoArquivo.TXT]).toContain('.txt');
    });

    it('deve normalizar formatos a partir de strings com extensões e variações de caixa', () => {
      expect(normalizarFormatoArquivo('.xlsx')).toBe(FormatoArquivo.XLSX);
      expect(normalizarFormatoArquivo('excel')).toBe(FormatoArquivo.XLSX);
      expect(normalizarFormatoArquivo('CSV')).toBe(FormatoArquivo.CSV);
      expect(normalizarFormatoArquivo('.csv')).toBe(FormatoArquivo.CSV);
      expect(normalizarFormatoArquivo('.tsv')).toBe(FormatoArquivo.TSV);
      expect(normalizarFormatoArquivo('.txt')).toBe(FormatoArquivo.TXT);
      expect(normalizarFormatoArquivo('desconhecido')).toBe(FormatoArquivo.OUTRO);
      expect(normalizarFormatoArquivo('')).toBe(FormatoArquivo.OUTRO);
    });
  });

  describe('StatusAtivoDados', () => {
    it('deve conter os quatro estados do ciclo de vida do ativo', () => {
      expect(StatusAtivoDados.CADASTRADO).toBe('CADASTRADO');
      expect(StatusAtivoDados.EM_INSPECAO).toBe('EM_INSPECAO');
      expect(StatusAtivoDados.ATIVO).toBe('ATIVO');
      expect(StatusAtivoDados.SUBSTITUIDO).toBe('SUBSTITUIDO');
    });

    it('deve conter rótulos amigáveis para todos os status', () => {
      expect(ROTULOS_STATUS_ATIVO_DADOS[StatusAtivoDados.CADASTRADO]).toBe('Cadastrado');
      expect(ROTULOS_STATUS_ATIVO_DADOS[StatusAtivoDados.ATIVO]).toBe('Ativo');
      expect(ROTULOS_STATUS_ATIVO_DADOS[StatusAtivoDados.SUBSTITUIDO]).toContain('Substituído');
    });

    it('deve normalizar status com segurança', () => {
      expect(normalizarStatusAtivoDados('CADASTRADO')).toBe(StatusAtivoDados.CADASTRADO);
      expect(normalizarStatusAtivoDados('ativo')).toBe(StatusAtivoDados.ATIVO);
      expect(normalizarStatusAtivoDados('obsoleto')).toBe(StatusAtivoDados.SUBSTITUIDO);
      expect(normalizarStatusAtivoDados('')).toBe(StatusAtivoDados.CADASTRADO);
    });
  });

  describe('Entidade AtivoDados', () => {
    it('deve instanciar um ativo de dados completo com todos os campos canônicos', () => {
      const now = new Date().toISOString();
      const ativo: AtivoDados = {
        id: 'asset_test_001',
        demanda_id: 'dem_test_001',
        nome_arquivo: 'vendas_2026.xlsx',
        caminho_local: 'C:\\Clientes\\Alfa\\Dados\\vendas_2026.xlsx',
        formato: FormatoArquivo.XLSX,
        origem: 'SAP ERP - Exportação Vendas',
        descricao_conteudo: 'Base transacional de pedidos faturados',
        granularidade: 'Item de pedido faturado',
        periodo_inicio: '2026-01-01',
        periodo_fim: '2026-08-31',
        versao: 'v1.0',
        tamanho_bytes: 2048500,
        total_linhas: 15420,
        total_colunas: 18,
        hash_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        status: StatusAtivoDados.CADASTRADO,
        schema_inferido: JSON.stringify([
          { nome: 'ID_Pedido', tipoAparente: 'NUMERO' },
          { nome: 'Data_Venda', tipoAparente: 'DATA' },
          { nome: 'Valor_Liquido', tipoAparente: 'NUMERO' },
        ]),
        data_recebimento: now,
        criado_em: now,
        atualizado_em: now,
      };

      expect(ativo.id).toBe('asset_test_001');
      expect(ativo.formato).toBe(FormatoArquivo.XLSX);
      expect(ativo.total_linhas).toBe(15420);
      expect(ativo.hash_sha256).toHaveLength(64);
    });
  });
});
