import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  DeterministicQualityScanner,
  canonicalizarLinha,
} from '@/infrastructure/quality/deterministic-quality-scanner';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { CategoriaProblemaQualidade } from '@/core/domain/enums/categoria-problema-qualidade';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { StatusExecucaoDiagnostico } from '@/core/domain/enums/status-execucao-diagnostico';
import { StatusVerificacaoQualidade } from '@/core/domain/enums/status-verificacao-qualidade';
import { criarXlsxSintetico } from '../../fixtures/synthetic-xlsx-builder';

describe('DeterministicQualityScanner (Subunidade 3.4A)', () => {
  const tmpDir = path.join(process.cwd(), '.workspace', 'tmp', 'test-quality-scanner');

  beforeAll(() => {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('deve identificar nulos, duplicidades exatas, números inválidos, tipos inconsistentes, datas com ano 1900 e colunas vazias em CSV sintético', async () => {
    const csvContent = [
      'id,nome,idade,data_adesao,ativo_cliente,observacoes,coluna_vazia',
      '1,Carlos,30,2023-01-15,sim,Cliente regular,',
      '2,Ana,,2023-02-20,nao,N/D,', // nulo em idade e em observacoes (literal N/D)
      '3,Beatriz,dez,1900-01-01,talvez,Ativo,', // número inválido ('dez'), data ano 1900 e tipo inconsistente booleano ('talvez')
      '1,Carlos,30,2023-01-15,sim,Cliente regular,', // linha inteira duplicada da linha 2
      '4,Daniel,45,data_invalida,true,,', // data corrompida e nulo em observacoes
      '1,Carlos,30,2023-01-15,sim,Cliente regular,', // segunda duplicação da linha 2
    ].join('\n');

    const csvPath = path.join(tmpDir, 'amostra-anomalias.csv');
    fs.writeFileSync(csvPath, csvContent, 'utf-8');

    const schemaInferido = {
      id: 'number',
      nome: 'string',
      idade: 'number',
      data_adesao: 'date',
      ativo_cliente: 'boolean',
      observacoes: 'string',
      coluna_vazia: 'string',
    };

    const resultado = await DeterministicQualityScanner.escanear({
      diagnosticoId: 'diag-test-1',
      ativoDadosId: 'ativo-test-1',
      demandaId: 'demanda-test-1',
      caminhoArquivo: csvPath,
      formato: FormatoArquivo.CSV,
      tabelaNome: 'amostra-anomalias.csv',
      schemaInferido,
    });

    expect(resultado.sucesso).toBe(true);
    expect(resultado.totalLinhas).toBe(6);
    expect(resultado.totalColunas).toBe(7);
    expect(resultado.statusExecucao).toBe(StatusExecucaoDiagnostico.CONCLUIDO);

    // 1. Verificação de Severidade Padrão: todos os problemas determinísticos devem ter severidade PENDENTE
    for (const problema of resultado.problemas) {
      expect(problema.severidade).toBe(SeveridadeProblema.PENDENTE);
      expect(problema.deliberado_por_humano).toBe(false);
      expect(problema.status).toBe('ABERTO');
      // Política de privacidade: no máximo 5 amostras
      expect(problema.amostra_evidencias.length).toBeLessThanOrEqual(5);
    }

    // 2. Coluna 100% vazia
    const problemaColunaVazia = resultado.problemas.find(
      (p) => p.categoria === CategoriaProblemaQualidade.COLUNAS_VAZIAS && p.coluna_afetada === 'coluna_vazia'
    );
    expect(problemaColunaVazia).toBeDefined();
    expect(problemaColunaVazia?.total_linhas_afetadas).toBe(6);
    expect(problemaColunaVazia?.percentual_linhas_afetadas).toBe(100);

    // 3. Linhas inteiras duplicadas (linhas 5 e 7 duplicando linha 2)
    const problemaDuplicidade = resultado.problemas.find(
      (p) => p.categoria === CategoriaProblemaQualidade.DUPLICIDADES_LINHA
    );
    expect(problemaDuplicidade).toBeDefined();
    expect(problemaDuplicidade?.total_linhas_afetadas).toBe(2);
    expect(problemaDuplicidade?.amostra_evidencias).toHaveLength(2);
    expect(problemaDuplicidade?.amostra_evidencias[0].linhaOriginal).toBe(2);
    expect(problemaDuplicidade?.amostra_evidencias[0].linhaDuplicada).toBe(5);

    // 4. Número inválido em idade ('dez') classificado especificamente como NUMEROS_INVALIDOS (sem duplicar em tipos)
    const problemaNumero = resultado.problemas.find(
      (p) => p.categoria === CategoriaProblemaQualidade.NUMEROS_INVALIDOS && p.coluna_afetada === 'idade'
    );
    expect(problemaNumero).toBeDefined();
    expect(problemaNumero?.total_linhas_afetadas).toBe(1);

    // 5. Tipo inconsistente residual em ativo_cliente ('talvez' não é booleano válido)
    const problemaTipo = resultado.problemas.find(
      (p) => p.categoria === CategoriaProblemaQualidade.TIPOS_INCONSISTENTES && p.coluna_afetada === 'ativo_cliente'
    );
    expect(problemaTipo).toBeDefined();
    expect(problemaTipo?.total_linhas_afetadas).toBe(1);

    // 6. Data com ano 1900 ou corrompida classificada especificamente como DATAS_INVALIDAS
    const problemaData = resultado.problemas.find(
      (p) => p.categoria === CategoriaProblemaQualidade.DATAS_INVALIDAS && p.coluna_afetada === 'data_adesao'
    );
    expect(problemaData).toBeDefined();
    expect(problemaData?.total_linhas_afetadas).toBe(2); // '1900-01-01' e 'data_invalida'

    // 7. Critérios epistêmicos nas verificações executadas
    expect(resultado.verificacoes).toHaveLength(7);
    const verifDuplicidades = resultado.verificacoes.find(
      (v) => v.categoria === CategoriaProblemaQualidade.DUPLICIDADES_LINHA
    );
    expect(verifDuplicidades?.status).toBe(StatusVerificacaoQualidade.EXECUTADA_COM_PROBLEMAS);
    expect(verifDuplicidades?.totalProblemas).toBe(2);
  });

  it('deve registrar EXECUTADA_SEM_PROBLEMAS quando o arquivo não possuir anomalias', async () => {
    const csvContent = [
      'id,codigo,valor',
      '1,A01,100.50',
      '2,A02,250.00',
      '3,A03,300.00',
    ].join('\n');

    const csvPath = path.join(tmpDir, 'limpo.csv');
    fs.writeFileSync(csvPath, csvContent, 'utf-8');

    const resultado = await DeterministicQualityScanner.escanear({
      diagnosticoId: 'diag-limpo',
      ativoDadosId: 'ativo-limpo',
      demandaId: 'demanda-limpo',
      caminhoArquivo: csvPath,
      formato: FormatoArquivo.CSV,
      tabelaNome: 'limpo.csv',
      schemaInferido: { id: 'number', codigo: 'string', valor: 'number' },
    });

    expect(resultado.sucesso).toBe(true);
    expect(resultado.problemas).toHaveLength(0);
    expect(resultado.statusExecucao).toBe(StatusExecucaoDiagnostico.CONCLUIDO);

    for (const v of resultado.verificacoes) {
      expect(v.status).toBe(StatusVerificacaoQualidade.EXECUTADA_SEM_PROBLEMAS);
      expect(v.totalProblemas).toBe(0);
    }
  });

  it('deve detectar cabeçalhos duplicados e problemáticos', async () => {
    const csvContent = [
      'id,nome,Nome,coluna_4',
      '1,Carlos,Carlos,abc',
      '2,Ana,Ana,def',
    ].join('\n');

    const csvPath = path.join(tmpDir, 'cabecalhos.csv');
    fs.writeFileSync(csvPath, csvContent, 'utf-8');

    const resultado = await DeterministicQualityScanner.escanear({
      diagnosticoId: 'diag-cab',
      ativoDadosId: 'ativo-cab',
      demandaId: 'demanda-cab',
      caminhoArquivo: csvPath,
      formato: FormatoArquivo.CSV,
      tabelaNome: 'cabecalhos.csv',
    });

    const probCab = resultado.problemas.find(
      (p) => p.categoria === CategoriaProblemaQualidade.CABECALHOS_PROBLEMATICOS
    );
    expect(probCab).toBeDefined();
    expect(probCab?.total_linhas_afetadas).toBe(2); // 'Nome' duplicado de 'nome' e 'coluna_4' gerada automaticamente
  });

  it('deve realizar varredura sobre planilha XLSX sintética em modo single-sheet', async () => {
    const linhasXlsx = [
      ['ID', 'Produto', 'Preco', 'DataValidade'],
      ['1', 'Teclado', '150.00', '2025-12-31'],
      ['2', 'Mouse', '', '1900-01-01'], // nulo em preco e ano 1900
      ['1', 'Teclado', '150.00', '2025-12-31'], // duplicidade exata
    ];

    const xlsxBuffer = criarXlsxSintetico([{ nome: 'Produtos', linhas: linhasXlsx }]);
    const xlsxPath = path.join(tmpDir, 'planilha-qualidade.xlsx');
    fs.writeFileSync(xlsxPath, xlsxBuffer);

    const resultado = await DeterministicQualityScanner.escanear({
      diagnosticoId: 'diag-xlsx-1',
      ativoDadosId: 'ativo-xlsx-1',
      demandaId: 'demanda-xlsx-1',
      caminhoArquivo: xlsxPath,
      formato: FormatoArquivo.XLSX,
      tabelaNome: 'planilha-qualidade.xlsx',
      schemaInferido: { ID: 'number', Produto: 'string', Preco: 'number', DataValidade: 'date' },
    });

    expect(resultado.sucesso).toBe(true);
    expect(resultado.totalLinhas).toBe(3);
    expect(resultado.totalColunas).toBe(4);

    const probDuplicidade = resultado.problemas.find(
      (p) => p.categoria === CategoriaProblemaQualidade.DUPLICIDADES_LINHA
    );
    expect(probDuplicidade).toBeDefined();
    expect(probDuplicidade?.total_linhas_afetadas).toBe(1);

    const probNulo = resultado.problemas.find(
      (p) => p.categoria === CategoriaProblemaQualidade.NULOS_BRANCOS && p.coluna_afetada === 'Preco'
    );
    expect(probNulo).toBeDefined();
    expect(probNulo?.total_linhas_afetadas).toBe(1);
  });

  it('deve acionar o guardrail de duplicidade, registrando LIMITADA_POR_GUARDRAIL e CONCLUIDO_PARCIALMENTE mantendo as demais verificações ativas', async () => {
    // Arquivo com 5 linhas de dados. Colocamos um nulo na linha 5 para provar que a verificação de nulos processou até o fim.
    const csvContent = [
      'id,nome,valor',
      '1,Carlos,100',
      '2,Ana,200',
      '3,Beatriz,300',
      '4,Daniel,400',
      '5,,500', // nulo na linha 5 (linha física 6)
    ].join('\n');

    const csvPath = path.join(tmpDir, 'guardrail-duplicidades.csv');
    fs.writeFileSync(csvPath, csvContent, 'utf-8');

    // Execução A: Limite = 3 linhas (arquivo tem 5 linhas, logo deve estourar o guardrail de duplicidade)
    const resultadoComGuardrail = await DeterministicQualityScanner.escanear({
      diagnosticoId: 'diag-guardrail-1',
      ativoDadosId: 'ativo-guardrail-1',
      demandaId: 'demanda-guardrail-1',
      caminhoArquivo: csvPath,
      formato: FormatoArquivo.CSV,
      tabelaNome: 'guardrail-duplicidades.csv',
      schemaInferido: { id: 'number', nome: 'string', valor: 'number' },
      limiteLinhasDuplicidade: 3,
    });

    // 1. Diagnóstico deve ser marcado como CONCLUIDO_PARCIALMENTE
    expect(resultadoComGuardrail.sucesso).toBe(true);
    expect(resultadoComGuardrail.statusExecucao).toBe(StatusExecucaoDiagnostico.CONCLUIDO_PARCIALMENTE);
    expect(resultadoComGuardrail.totalLinhas).toBe(5);

    // 2. Verificação de Duplicidades deve ser LIMITADA_POR_GUARDRAIL com observação explicativa
    const verifDuplicidade = resultadoComGuardrail.verificacoes.find(
      (v) => v.categoria === CategoriaProblemaQualidade.DUPLICIDADES_LINHA
    );
    expect(verifDuplicidade).toBeDefined();
    expect(verifDuplicidade?.status).toBe(StatusVerificacaoQualidade.LIMITADA_POR_GUARDRAIL);
    expect(verifDuplicidade?.observacao).toContain('guardrail operacional');

    // 3. As demais verificações continuaram normalmente e processaram o arquivo inteiro
    // Comprovação: o nulo na linha 5 foi detectado com sucesso!
    const probNulo = resultadoComGuardrail.problemas.find(
      (p) => p.categoria === CategoriaProblemaQualidade.NULOS_BRANCOS && p.coluna_afetada === 'nome'
    );
    expect(probNulo).toBeDefined();
    expect(probNulo?.total_linhas_afetadas).toBe(1);
    expect(probNulo?.amostra_evidencias[0].numeroLinha).toBe(6); // linha física 6

    const verifNulos = resultadoComGuardrail.verificacoes.find(
      (v) => v.categoria === CategoriaProblemaQualidade.NULOS_BRANCOS
    );
    expect(verifNulos?.status).toBe(StatusVerificacaoQualidade.EXECUTADA_COM_PROBLEMAS);

    // Execução B: Limite = 10 linhas (arquivo tem 5 linhas, logo executa integralmente)
    const resultadoIntegral = await DeterministicQualityScanner.escanear({
      diagnosticoId: 'diag-guardrail-2',
      ativoDadosId: 'ativo-guardrail-1',
      demandaId: 'demanda-guardrail-1',
      caminhoArquivo: csvPath,
      formato: FormatoArquivo.CSV,
      tabelaNome: 'guardrail-duplicidades.csv',
      schemaInferido: { id: 'number', nome: 'string', valor: 'number' },
      limiteLinhasDuplicidade: 10,
    });

    expect(resultadoIntegral.statusExecucao).toBe(StatusExecucaoDiagnostico.CONCLUIDO);
    const verifDuplicidadeIntegral = resultadoIntegral.verificacoes.find(
      (v) => v.categoria === CategoriaProblemaQualidade.DUPLICIDADES_LINHA
    );
    expect(verifDuplicidadeIntegral?.status).toBe(StatusVerificacaoQualidade.EXECUTADA_SEM_PROBLEMAS);
  });

  describe('Correção 1: Canonicalização determinística de linhas e SHA-256', () => {
    it('deve preservar distinção inequívoca entre null, undefined, string vazia, number, boolean e date', () => {
      // 1. null vs undefined
      expect(canonicalizarLinha([null])).not.toBe(canonicalizarLinha([undefined]));
      expect(canonicalizarLinha([null])).toBe('R:1|Z');
      expect(canonicalizarLinha([undefined])).toBe('R:1|U');

      // 2. string vazia vs null
      expect(canonicalizarLinha([''])).not.toBe(canonicalizarLinha([null]));
      expect(canonicalizarLinha([''])).toBe('R:1|S:0:');

      // 3. string vazia vs string com espaço
      expect(canonicalizarLinha([''])).not.toBe(canonicalizarLinha([' ']));
      expect(canonicalizarLinha([' '])).toBe('R:1|S:1: ');

      // 4. number vs string contendo os mesmos caracteres
      expect(canonicalizarLinha([123])).not.toBe(canonicalizarLinha(['123']));
      expect(canonicalizarLinha([123])).toBe('R:1|N:123');
      expect(canonicalizarLinha(['123'])).toBe('R:1|S:3:123');

      // 5. boolean vs string contendo "true"
      expect(canonicalizarLinha([true])).not.toBe(canonicalizarLinha(['true']));
      expect(canonicalizarLinha([true])).toBe('R:1|B:1');
      expect(canonicalizarLinha([false])).toBe('R:1|B:0');
      expect(canonicalizarLinha(['true'])).toBe('R:1|S:4:true');

      // 6. date vs string ISO
      const d = new Date('2026-01-15T12:00:00.000Z');
      expect(canonicalizarLinha([d])).not.toBe(canonicalizarLinha(['2026-01-15T12:00:00.000Z']));
      expect(canonicalizarLinha([d])).toBe('R:1|D:2026-01-15T12:00:00.000Z');
      expect(canonicalizarLinha(['2026-01-15T12:00:00.000Z'])).toBe('R:1|S:24:2026-01-15T12:00:00.000Z');
    });

    it('deve impedir colisões estruturais causadas por delimitadores presentes no conteúdo das células', () => {
      // Duas colunas ['a', 'b'] vs uma coluna ['a|b']
      const duasColunas = canonicalizarLinha(['a', 'b']);
      const umaColunaComPipe = canonicalizarLinha(['a|b']);
      expect(duasColunas).not.toBe(umaColunaComPipe);
      expect(duasColunas).toBe('R:2|S:1:a|S:1:b');
      expect(umaColunaComPipe).toBe('R:1|S:3:a|b');

      // Célula contendo o próprio prefixo do TLV
      const tentativaInjecao = canonicalizarLinha(['S:1:a']);
      const normal = canonicalizarLinha(['a']);
      expect(tentativaInjecao).not.toBe(normal);

      // Hashes SHA-256 gerados
      const hashDuas = crypto.createHash('sha256').update(duasColunas).digest('hex');
      const hashUma = crypto.createHash('sha256').update(umaColunaComPipe).digest('hex');
      expect(hashDuas).not.toBe(hashUma);
    });
  });

  describe('Correção 2: Validação numérica com suporte a formatos brasileiros e rejeição de identificadores', () => {
    it('deve reconhecer deterministicamente formatos numéricos válidos brasileiros e internacionais', () => {
      // Formatos exigidos na especificação:
      expect(DeterministicQualityScanner.isNumeroValido('1500')).toBe(true);
      expect(DeterministicQualityScanner.isNumeroValido('1500.50')).toBe(true);
      expect(DeterministicQualityScanner.isNumeroValido('1500,50')).toBe(true);
      expect(DeterministicQualityScanner.isNumeroValido('1.500,50')).toBe(true);
      expect(DeterministicQualityScanner.isNumeroValido('R$ 1.500,00')).toBe(true);
      expect(DeterministicQualityScanner.isNumeroValido('R$ 1500,50')).toBe(true);
      expect(DeterministicQualityScanner.isNumeroValido('1,500.50')).toBe(true); // Padrão internacional com milhar
      expect(DeterministicQualityScanner.isNumeroValido('12.345.678,90')).toBe(true);
      expect(DeterministicQualityScanner.isNumeroValido('-1.500,50')).toBe(true);
      expect(DeterministicQualityScanner.isNumeroValido('+350,00')).toBe(true);
    });

    it('NÃO deve converter identificadores (CPF, CNPJ, CEP, telefone, matrículas/códigos com máscara) em números', () => {
      // CPF
      expect(DeterministicQualityScanner.isNumeroValido('123.456.789-00')).toBe(false);
      // CNPJ
      expect(DeterministicQualityScanner.isNumeroValido('12.345.678/0001-90')).toBe(false);
      // CEP
      expect(DeterministicQualityScanner.isNumeroValido('01234-567')).toBe(false);
      // Telefones
      expect(DeterministicQualityScanner.isNumeroValido('(11) 98765-4321')).toBe(false);
      expect(DeterministicQualityScanner.isNumeroValido('11 98765-4321')).toBe(false);
      expect(DeterministicQualityScanner.isNumeroValido('98765-4321')).toBe(false);
      // Códigos e matrículas com máscara alfanumérica
      expect(DeterministicQualityScanner.isNumeroValido('MAT-2024')).toBe(false);
      expect(DeterministicQualityScanner.isNumeroValido('COD_12345')).toBe(false);
      expect(DeterministicQualityScanner.isNumeroValido('DOC/998')).toBe(false);
    });
  });

  describe('Correção 3: Unicidade de classificação entre V4, V5 e V6 (eliminação de dupla contagem)', () => {
    it('deve classificar número inválido estritamente em NUMEROS_INVALIDOS e data inválida em DATAS_INVALIDAS sem duplicar em TIPOS_INCONSISTENTES', async () => {
      const csvContent = [
        'id;valor_br;data_vencimento;status_ativo',
        '1;1.500,50;2025-10-30;true',
        '2;R$ 2.300,00;31/12/2025;sim',
        '3;invalido_num;2025-05-15;nao', // número inválido na linha 4
        '4;150;data_corrompida;true', // data inválida na linha 5
        '5;350,00;2025-06-01;talvez', // booleano inconsistente na linha 6
      ].join('\n');

      const csvPath = path.join(tmpDir, 'teste-unicidade-v4-v5-v6.csv');
      fs.writeFileSync(csvPath, csvContent, 'utf-8');

      const resultado = await DeterministicQualityScanner.escanear({
        diagnosticoId: 'diag-unicidade',
        ativoDadosId: 'ativo-unicidade',
        demandaId: 'demanda-unicidade',
        caminhoArquivo: csvPath,
        formato: FormatoArquivo.CSV,
        tabelaNome: 'teste-unicidade-v4-v5-v6.csv',
        schemaInferido: {
          id: 'number',
          valor_br: 'number',
          data_vencimento: 'date',
          status_ativo: 'boolean',
        },
      });

      expect(resultado.sucesso).toBe(true);

      // Deve ter exatamente 1 problema em NUMEROS_INVALIDOS (linha 4)
      const probNum = resultado.problemas.filter((p) => p.categoria === CategoriaProblemaQualidade.NUMEROS_INVALIDOS);
      expect(probNum).toHaveLength(1);
      expect(probNum[0].coluna_afetada).toBe('valor_br');
      expect(probNum[0].total_linhas_afetadas).toBe(1);

      // Deve ter exatamente 1 problema em DATAS_INVALIDAS (linha 5)
      const probData = resultado.problemas.filter((p) => p.categoria === CategoriaProblemaQualidade.DATAS_INVALIDAS);
      expect(probData).toHaveLength(1);
      expect(probData[0].coluna_afetada).toBe('data_vencimento');
      expect(probData[0].total_linhas_afetadas).toBe(1);

      // Deve ter exatamente 1 problema em TIPOS_INCONSISTENTES (linha 6, apenas para status_ativo que não é número nem data)
      const probTipo = resultado.problemas.filter((p) => p.categoria === CategoriaProblemaQualidade.TIPOS_INCONSISTENTES);
      expect(probTipo).toHaveLength(1);
      expect(probTipo[0].coluna_afetada).toBe('status_ativo');
      expect(probTipo[0].total_linhas_afetadas).toBe(1);

      // Nenhuma outra coluna teve problema registrado sob TIPOS_INCONSISTENTES
      const probTipoValor = resultado.problemas.find(
        (p) => p.categoria === CategoriaProblemaQualidade.TIPOS_INCONSISTENTES && p.coluna_afetada === 'valor_br'
      );
      expect(probTipoValor).toBeUndefined();

      const probTipoData = resultado.problemas.find(
        (p) => p.categoria === CategoriaProblemaQualidade.TIPOS_INCONSISTENTES && p.coluna_afetada === 'data_vencimento'
      );
      expect(probTipoData).toBeUndefined();

      // Total de problemas no arquivo reflete a soma exata e única
      expect(resultado.problemas).toHaveLength(3);
    });
  });

  describe('Correção 5: Política V1 de Evidências Seguras (Anti-PII)', () => {
    it('NÃO deve persistir dados pessoais brutos (CPF, nome, e-mail, telefone) nas amostras de evidências', async () => {
      const cpfSensivel = '123.456.789-00';
      const nomeSensivel = 'Carlos Eduardo de Oliveira';
      const emailSensivel = 'carlos.oliveira@empresa.com.br';
      const telSensivel = '(11) 98765-4321';

      const csvContent = [
        'id,salario,data_admissao,ativo',
        `1,${cpfSensivel},2023-01-01,true`, // CPF na coluna numérica
        `2,1500,${nomeSensivel},true`, // Nome na coluna de data
        `3,${emailSensivel},2023-02-01,true`, // E-mail na coluna numérica
        `4,${telSensivel},2023-03-01,true`, // Telefone na coluna numérica
      ].join('\n');

      const csvPath = path.join(tmpDir, 'teste-pii-seguranca.csv');
      fs.writeFileSync(csvPath, csvContent, 'utf-8');

      const resultado = await DeterministicQualityScanner.escanear({
        diagnosticoId: 'diag-pii',
        ativoDadosId: 'ativo-pii',
        demandaId: 'demanda-pii',
        caminhoArquivo: csvPath,
        formato: FormatoArquivo.CSV,
        tabelaNome: 'teste-pii-seguranca.csv',
        schemaInferido: {
          id: 'number',
          salario: 'number',
          data_admissao: 'date',
          ativo: 'boolean',
        },
      });

      expect(resultado.sucesso).toBe(true);
      expect(resultado.problemas.length).toBeGreaterThan(0);

      // Serializa todos os problemas persistíveis em formato JSON
      const jsonDump = JSON.stringify(resultado.problemas);

      // Comprova por asserção estrita que NENHUM dado literal sensível vazou
      expect(jsonDump.includes(cpfSensivel)).toBe(false);
      expect(jsonDump.includes(nomeSensivel)).toBe(false);
      expect(jsonDump.includes(emailSensivel)).toBe(false);
      expect(jsonDump.includes(telSensivel)).toBe(false);

      // Comprova que as evidências adotaram representação estrutural padronizada
      const probSalario = resultado.problemas.find((p) => p.coluna_afetada === 'salario');
      expect(probSalario).toBeDefined();
      for (const ev of probSalario!.amostra_evidencias) {
        expect(ev.valorObservado).toMatch(/^\[TEXTO_NAO_NUMERICO: \d+ caracteres\]$/);
        expect(ev.numeroLinha).toBeDefined();
        expect(ev.coluna).toBe('salario');
      }

      const probData = resultado.problemas.find((p) => p.coluna_afetada === 'data_admissao');
      expect(probData).toBeDefined();
      for (const ev of probData!.amostra_evidencias) {
        expect(ev.valorObservado).toMatch(/^\[DATA_INVALIDA: \d+ caracteres\]$/);
      }
    });
  });

  describe('Correção 6: Heurística Técnica Determinística da V1 (Prevalência ≥90%)', () => {
    it('Cenário 1 (100% numérico): não deve apontar números inválidos quando todos os valores forem numéricos', async () => {
      const linhas: string[] = ['id,valor_total'];
      for (let i = 1; i <= 20; i++) {
        linhas.push(`${i},${i * 10}.50`);
      }

      const csvPath = path.join(tmpDir, 'teste-100-pct-numerico.csv');
      fs.writeFileSync(csvPath, linhas.join('\n'), 'utf-8');

      // Coluna preliminarmente inferida como string
      const resultado = await DeterministicQualityScanner.escanear({
        diagnosticoId: 'diag-100-num',
        ativoDadosId: 'ativo-100-num',
        demandaId: 'demanda-100-num',
        caminhoArquivo: csvPath,
        formato: FormatoArquivo.CSV,
        tabelaNome: 'teste-100-pct-numerico.csv',
        schemaInferido: { id: 'number', valor_total: 'string' },
      });

      expect(resultado.sucesso).toBe(true);
      const probNum = resultado.problemas.find(
        (p) => p.categoria === CategoriaProblemaQualidade.NUMEROS_INVALIDOS && p.coluna_afetada === 'valor_total'
      );
      // Nenhum valor inválido, logo zero problemas gerados
      expect(probNum).toBeUndefined();
    });

    it('Cenário 2 (≥90% e <100% numérico): deve detectar anomalias numéricas com severidade PENDENTE', async () => {
      // 95% numérico (19 valores) e 5% anômalo (1 valor)
      const linhas: string[] = ['id,valor_faturamento'];
      for (let i = 1; i <= 19; i++) {
        linhas.push(`${i},${1000 + i}.50`);
      }
      linhas.push('20,texto_corrompido');

      const csvPath = path.join(tmpDir, 'teste-95-pct-numerico.csv');
      fs.writeFileSync(csvPath, linhas.join('\n'), 'utf-8');

      const resultado = await DeterministicQualityScanner.escanear({
        diagnosticoId: 'diag-95-num',
        ativoDadosId: 'ativo-95-num',
        demandaId: 'demanda-95-num',
        caminhoArquivo: csvPath,
        formato: FormatoArquivo.CSV,
        tabelaNome: 'teste-95-pct-numerico.csv',
        schemaInferido: { id: 'number', valor_faturamento: 'string' },
      });

      expect(resultado.sucesso).toBe(true);
      const probNumero = resultado.problemas.find(
        (p) => p.categoria === CategoriaProblemaQualidade.NUMEROS_INVALIDOS && p.coluna_afetada === 'valor_faturamento'
      );
      expect(probNumero).toBeDefined();
      expect(probNumero?.total_linhas_afetadas).toBe(1);
      // Confirmação normativa: severidade PENDENTE preservada para deliberação humana futura
      expect(probNumero?.severidade).toBe(SeveridadeProblema.PENDENTE);
      expect(probNumero?.deliberado_por_humano).toBe(false);
      expect(probNumero?.status).toBe('ABERTO');
    });

    it('Cenário 3 (Abaixo de 90% numérico): NÃO deve forçar anomalia numérica quando prevalência for <90%', async () => {
      // 15 numéricos (75%) e 5 textuais (25%) -> <90%
      const linhas: string[] = ['id,campo_hibrido'];
      for (let i = 1; i <= 15; i++) {
        linhas.push(`${i},${i * 100}`);
      }
      for (let i = 16; i <= 20; i++) {
        linhas.push(`${i},codigo_${i}`);
      }

      const csvPath = path.join(tmpDir, 'teste-75-pct-numerico.csv');
      fs.writeFileSync(csvPath, linhas.join('\n'), 'utf-8');

      const resultado = await DeterministicQualityScanner.escanear({
        diagnosticoId: 'diag-75-num',
        ativoDadosId: 'ativo-75-num',
        demandaId: 'demanda-75-num',
        caminhoArquivo: csvPath,
        formato: FormatoArquivo.CSV,
        tabelaNome: 'teste-75-pct-numerico.csv',
        schemaInferido: { id: 'number', campo_hibrido: 'string' },
      });

      expect(resultado.sucesso).toBe(true);
      const probNum = resultado.problemas.find(
        (p) => p.categoria === CategoriaProblemaQualidade.NUMEROS_INVALIDOS && p.coluna_afetada === 'campo_hibrido'
      );
      // Prevalência abaixo de 90% não caracteriza anomalia unilateral, permanece classificada como string
      expect(probNum).toBeUndefined();
    });

    it('Cenário 4 (≥90% e <100% data): deve detectar datas corrompidas com severidade PENDENTE', async () => {
      // 19 datas válidas (95%) e 1 corrompida (5%) -> >=90%
      const linhas: string[] = ['id,data_evento'];
      for (let i = 1; i <= 19; i++) {
        linhas.push(`${i},2025-01-${String(i).padStart(2, '0')}`);
      }
      linhas.push('20,data_quebrada');

      const csvPath = path.join(tmpDir, 'teste-95-pct-data.csv');
      fs.writeFileSync(csvPath, linhas.join('\n'), 'utf-8');

      const resultado = await DeterministicQualityScanner.escanear({
        diagnosticoId: 'diag-95-data',
        ativoDadosId: 'ativo-95-data',
        demandaId: 'demanda-95-data',
        caminhoArquivo: csvPath,
        formato: FormatoArquivo.CSV,
        tabelaNome: 'teste-95-pct-data.csv',
        schemaInferido: { id: 'number', data_evento: 'string' },
      });

      expect(resultado.sucesso).toBe(true);
      const probData = resultado.problemas.find(
        (p) => p.categoria === CategoriaProblemaQualidade.DATAS_INVALIDAS && p.coluna_afetada === 'data_evento'
      );
      expect(probData).toBeDefined();
      expect(probData?.total_linhas_afetadas).toBe(1);
      expect(probData?.severidade).toBe(SeveridadeProblema.PENDENTE);
      expect(probData?.deliberado_por_humano).toBe(false);
      expect(probData?.status).toBe('ABERTO');
    });

    it('Cenário 5 (Abaixo de 90% data): NÃO deve forçar anomalia de data quando prevalência for <90%', async () => {
      // 16 datas (80%) e 4 textos (20%) -> <90%
      const linhas: string[] = ['id,campo_temporal_misto'];
      for (let i = 1; i <= 16; i++) {
        linhas.push(`${i},2025-02-${String(i).padStart(2, '0')}`);
      }
      for (let i = 17; i <= 20; i++) {
        linhas.push(`${i},nao_se_aplica_${i}`);
      }

      const csvPath = path.join(tmpDir, 'teste-80-pct-data.csv');
      fs.writeFileSync(csvPath, linhas.join('\n'), 'utf-8');

      const resultado = await DeterministicQualityScanner.escanear({
        diagnosticoId: 'diag-80-data',
        ativoDadosId: 'ativo-80-data',
        demandaId: 'demanda-80-data',
        caminhoArquivo: csvPath,
        formato: FormatoArquivo.CSV,
        tabelaNome: 'teste-80-pct-data.csv',
        schemaInferido: { id: 'number', campo_temporal_misto: 'string' },
      });

      expect(resultado.sucesso).toBe(true);
      const probData = resultado.problemas.find(
        (p) => p.categoria === CategoriaProblemaQualidade.DATAS_INVALIDAS && p.coluna_afetada === 'campo_temporal_misto'
      );
      expect(probData).toBeUndefined();
    });

    it('Cenário 6 (Coluna genuinamente textual/mista): deve preservar a integridade sem falsos positivos', async () => {
      // Coluna com observações variadas contendo palavras, códigos, números esparsos
      const linhas = [
        'id,observacoes',
        '1,Cliente solicitou cancelamento em 10/05/2024',
        '2,Reclamação sobre prazo de entrega',
        '3,Pagamento confirmado via PIX',
        '4,Valor de R$ 500,00 estornado',
        '5,Atendimento presencial realizado com sucesso',
        '6,Em análise pela diretoria',
      ];

      const csvPath = path.join(tmpDir, 'teste-coluna-textual-pura.csv');
      fs.writeFileSync(csvPath, linhas.join('\n'), 'utf-8');

      const resultado = await DeterministicQualityScanner.escanear({
        diagnosticoId: 'diag-texto-puro',
        ativoDadosId: 'ativo-texto-puro',
        demandaId: 'demanda-texto-puro',
        caminhoArquivo: csvPath,
        formato: FormatoArquivo.CSV,
        tabelaNome: 'teste-coluna-textual-pura.csv',
        schemaInferido: { id: 'number', observacoes: 'string' },
      });

      expect(resultado.sucesso).toBe(true);
      // Nenhuma anomalia de número ou data deve ser imputada a coluna puramente descritiva
      const probNum = resultado.problemas.find((p) => p.categoria === CategoriaProblemaQualidade.NUMEROS_INVALIDOS);
      const probData = resultado.problemas.find((p) => p.categoria === CategoriaProblemaQualidade.DATAS_INVALIDAS);
      expect(probNum).toBeUndefined();
      expect(probData).toBeUndefined();
    });
  });
});
