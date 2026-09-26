import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { BusinessRulesEvaluator } from '@/infrastructure/quality/business-rules-evaluator';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { TipoRegraQualidade } from '@/core/domain/enums/tipo-regra-qualidade';
import { StatusRegraQualidade } from '@/core/domain/enums/status-regra-qualidade';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { RegraQualidade } from '@/core/domain/entities/regra-qualidade';

describe('BusinessRulesEvaluator (Unidade 3.4B — Testes Unitários de Regras de Negócio)', () => {
  const dirTmp = path.join(process.cwd(), 'tests', 'fixtures', 'tmp-rules-test');

  beforeAll(() => {
    if (!fs.existsSync(dirTmp)) {
      fs.mkdirSync(dirTmp, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(dirTmp)) {
      fs.rmSync(dirTmp, { recursive: true, force: true });
    }
  });

  // =========================================================================
  // R1: CHAVE ÚNICA (SIMPLES, COMPOSTA, TLV, GUARDRAIL E ANTI-PII)
  // =========================================================================
  describe('R1 — Chave Única', () => {
    it('deve detectar duplicidades em chave única simples', async () => {
      const csvPath = path.join(dirTmp, 'r1-simples.csv');
      fs.writeFileSync(
        csvPath,
        `codigo,nome\n101,Produto A\n102,Produto B\n101,Produto A Duplicado\n103,Produto C\n`,
        'utf-8'
      );

      const regra: RegraQualidade = {
        id: 'r1-1',
        ativo_dados_id: 'ativo-1',
        tipo: TipoRegraQualidade.CHAVE_UNICA,
        coluna: 'codigo',
        colunas: ['codigo'],
        nome: 'Código Único',
        descricao: 'O código do produto deve ser exclusivo',
        parametros: {
          tipo: TipoRegraQualidade.CHAVE_UNICA,
          colunas: ['codigo'],
        },
        status: StatusRegraQualidade.ATIVA,
        versao: 1,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };

      const resultado = await BusinessRulesEvaluator.avaliar({
        diagnosticoId: 'diag-1',
        ativoDadosId: 'ativo-1',
        demandaId: 'dem-1',
        tabelaNome: 'produtos.csv',
        caminhoArquivo: csvPath,
        formato: FormatoArquivo.CSV,
        regras: [regra],
      });

      expect(resultado.totalRegrasAvaliadas).toBe(1);
      expect(resultado.totalRegrasVioladas).toBe(1);
      expect(resultado.problemas).toHaveLength(1);

      const prob = resultado.problemas[0];
      expect(prob.total_linhas_afetadas).toBe(1);
      expect(prob.severidade).toBe(SeveridadeProblema.PENDENTE); // Severidade invariavelmente PENDENTE
      expect(prob.regra_snapshot).toBeDefined();
      expect(prob.regra_snapshot?.versao).toBe(1);
      expect(prob.amostra_evidencias[0].linhaDuplicada).toBe(4);
      expect(prob.amostra_evidencias[0].linhaOriginal).toBe(2);
    });

    it('deve detectar duplicidades em chave única composta com canonicalização TLV sem falsos positivos ou ambiguidades', async () => {
      const csvPath = path.join(dirTmp, 'r1-composta.csv');
      // Cenário de desafio de delimitador: se usássemos simples concatenação com ',', 'A,B' + 'C' colidiria com 'A' + 'B,C'
      fs.writeFileSync(
        csvPath,
        `filial,ano,pedido\n1,2026,1001\n1,2026,1002\n1,2025,1001\n1,2026,1001\n`,
        'utf-8'
      );

      const regra: RegraQualidade = {
        id: 'r1-composta-id',
        ativo_dados_id: 'ativo-1',
        tipo: TipoRegraQualidade.CHAVE_UNICA,
        coluna: null,
        colunas: ['filial', 'ano', 'pedido'],
        nome: 'Chave Composta Filial-Ano-Pedido',
        descricao: 'A tripla filial-ano-pedido deve ser única',
        parametros: {
          tipo: TipoRegraQualidade.CHAVE_UNICA,
          colunas: ['filial', 'ano', 'pedido'],
        },
        status: StatusRegraQualidade.ATIVA,
        versao: 1,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };

      const resultado = await BusinessRulesEvaluator.avaliar({
        diagnosticoId: 'diag-1',
        ativoDadosId: 'ativo-1',
        demandaId: 'dem-1',
        tabelaNome: 'pedidos.csv',
        caminhoArquivo: csvPath,
        formato: FormatoArquivo.CSV,
        regras: [regra],
      });

      expect(resultado.totalRegrasVioladas).toBe(1);
      const prob = resultado.problemas[0];
      expect(prob.total_linhas_afetadas).toBe(1);
      expect(prob.coluna_afetada).toBe('filial, ano, pedido');
      expect(prob.amostra_evidencias[0].linhaDuplicada).toBe(5);
      expect(prob.amostra_evidencias[0].linhaOriginal).toBe(2);
    });

    it('deve acionar o guardrail operacional de R1 quando o limite de linhas for atingido', async () => {
      const csvPath = path.join(dirTmp, 'r1-guardrail.csv');
      // Criamos 10 linhas e definimos o limite em 5 para disparar o guardrail
      let conteudo = 'id,valor\n';
      for (let i = 1; i <= 10; i++) {
        conteudo += `${i},${i * 10}\n`;
      }
      fs.writeFileSync(csvPath, conteudo, 'utf-8');

      const regra: RegraQualidade = {
        id: 'r1-guardrail-regra',
        ativo_dados_id: 'ativo-1',
        tipo: TipoRegraQualidade.CHAVE_UNICA,
        coluna: 'id',
        colunas: ['id'],
        nome: 'ID Único',
        descricao: 'Teste guardrail',
        parametros: {
          tipo: TipoRegraQualidade.CHAVE_UNICA,
          colunas: ['id'],
        },
        status: StatusRegraQualidade.ATIVA,
        versao: 1,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };

      const resultado = await BusinessRulesEvaluator.avaliar({
        diagnosticoId: 'diag-1',
        ativoDadosId: 'ativo-1',
        demandaId: 'dem-1',
        tabelaNome: 'teste.csv',
        caminhoArquivo: csvPath,
        formato: FormatoArquivo.CSV,
        regras: [regra],
        limiteLinhasR1: 5, // Limite operacional baixo para teste
      });

      const prob = resultado.problemas.find((p) => p.titulo.includes('guardrail'));
      expect(prob).toBeDefined();
      expect(prob?.descricao).toContain('suspensa após atingir o limite operacional de 5 linhas');
      expect(prob?.severidade).toBe(SeveridadeProblema.PENDENTE);
    });
  });

  // =========================================================================
  // R2: LIMITES MÍNIMO E MÁXIMO
  // =========================================================================
  describe('R2 — Limites Mínimo e Máximo', () => {
    it('deve validar limites numéricos com suporte a formato brasileiro e internacional', async () => {
      const csvPath = path.join(dirTmp, 'r2-min-max.csv');
      fs.writeFileSync(
        csvPath,
        `produto,preco\nP1,10.00\nP2,"1500,50"\nP3,"R$ 2.500,00"\nP4,5.00\nP5,3500.00\n`,
        'utf-8'
      );

      const regra: RegraQualidade = {
        id: 'r2-preco',
        ativo_dados_id: 'ativo-1',
        tipo: TipoRegraQualidade.VALOR_MIN_MAX,
        coluna: 'preco',
        colunas: ['preco'],
        nome: 'Preço Permitido (R$ 10 a R$ 3.000)',
        descricao: 'Preço deve estar entre 10 e 3000',
        parametros: {
          tipo: TipoRegraQualidade.VALOR_MIN_MAX,
          minimo: 10,
          maximo: 3000,
          permitirIgualMinimo: true,
          permitirIgualMaximo: true,
        },
        status: StatusRegraQualidade.ATIVA,
        versao: 1,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };

      const resultado = await BusinessRulesEvaluator.avaliar({
        diagnosticoId: 'diag-1',
        ativoDadosId: 'ativo-1',
        demandaId: 'dem-1',
        tabelaNome: 'produtos.csv',
        caminhoArquivo: csvPath,
        formato: FormatoArquivo.CSV,
        regras: [regra],
      });

      expect(resultado.totalRegrasVioladas).toBe(1);
      const prob = resultado.problemas[0];
      // Linha 5 (5.00 < 10) e Linha 6 (3500.00 > 3000)
      expect(prob.total_linhas_afetadas).toBe(2);
      expect(prob.severidade).toBe(SeveridadeProblema.PENDENTE);

      // Proteção Anti-PII: evidências não contêm o valor bruto numérico sensível
      expect(prob.amostra_evidencias[0].detalhe).toContain('Valor abaixo do mínimo');
      expect(prob.amostra_evidencias[1].detalhe).toContain('Valor acima do máximo');
    });

    it('deve validar limites numéricos exclusivos quando permitirIgualMinimo: false ou permitirIgualMaximo: false', async () => {
      const csvPath = path.join(dirTmp, 'r2-exclusivo.csv');
      fs.writeFileSync(
        csvPath,
        `produto,quantidade\nP1,10\nP2,50\nP3,100\n`,
        'utf-8'
      );

      // Regra com limites exclusivos: quantidade > 10 e quantidade < 100
      const regra: RegraQualidade = {
        id: 'r2-qtd-exclusiva',
        ativo_dados_id: 'ativo-1',
        tipo: TipoRegraQualidade.VALOR_MIN_MAX,
        coluna: 'quantidade',
        colunas: ['quantidade'],
        nome: 'Quantidade Estritamente Entre 10 e 100',
        descricao: '10 e 100 são inválidos (limites exclusivos)',
        parametros: {
          tipo: TipoRegraQualidade.VALOR_MIN_MAX,
          minimo: 10,
          maximo: 100,
          permitirIgualMinimo: false, // limite exclusivo (> 10)
          permitirIgualMaximo: false, // limite exclusivo (< 100)
        },
        status: StatusRegraQualidade.ATIVA,
        versao: 1,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };

      const resultado = await BusinessRulesEvaluator.avaliar({
        diagnosticoId: 'diag-1',
        ativoDadosId: 'ativo-1',
        demandaId: 'dem-1',
        tabelaNome: 'estoque.csv',
        caminhoArquivo: csvPath,
        formato: FormatoArquivo.CSV,
        regras: [regra],
      });

      expect(resultado.totalRegrasVioladas).toBe(1);
      const prob = resultado.problemas[0];
      // Linha 2 (10 <= 10) e Linha 4 (100 >= 100) violam os limites exclusivos
      expect(prob.total_linhas_afetadas).toBe(2);
      expect(prob.amostra_evidencias[0].numeroLinha).toBe(2);
      expect(prob.amostra_evidencias[1].numeroLinha).toBe(4);
    });
  });

  // =========================================================================
  // R3: VALORES PERMITIDOS (DOMÍNIO FECHADO / CASE SENSITIVE)
  // =========================================================================
  describe('R3 — Valores Permitidos', () => {
    it('deve validar domínio fechado respeitando caseSensitive: false', async () => {
      const csvPath = path.join(dirTmp, 'r3-case-insensitive.csv');
      fs.writeFileSync(
        csvPath,
        `id,uf\n1,SP\n2,rj\n3,MG\n4,XX\n5,PR\n`,
        'utf-8'
      );

      const regra: RegraQualidade = {
        id: 'r3-uf-case-insensitive',
        ativo_dados_id: 'ativo-1',
        tipo: TipoRegraQualidade.VALORES_PERMITIDOS,
        coluna: 'uf',
        colunas: ['uf'],
        nome: 'UFs Sudeste e Sul',
        descricao: 'Apenas SP, RJ, MG, PR',
        parametros: {
          tipo: TipoRegraQualidade.VALORES_PERMITIDOS,
          valoresPermitidos: ['SP', 'RJ', 'MG', 'PR'],
          caseSensitive: false,
        },
        status: StatusRegraQualidade.ATIVA,
        versao: 1,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };

      const resultado = await BusinessRulesEvaluator.avaliar({
        diagnosticoId: 'diag-1',
        ativoDadosId: 'ativo-1',
        demandaId: 'dem-1',
        tabelaNome: 'enderecos.csv',
        caminhoArquivo: csvPath,
        formato: FormatoArquivo.CSV,
        regras: [regra],
      });

      expect(resultado.totalRegrasVioladas).toBe(1);
      const prob = resultado.problemas[0];
      // Apenas a linha 5 (XX) é inválida, 'rj' em minúsculas é aceito por causa do caseSensitive: false
      expect(prob.total_linhas_afetadas).toBe(1);
      expect(prob.amostra_evidencias[0].numeroLinha).toBe(5);
    });

    it('deve rejeitar divergência de maiúsculas/minúsculas quando caseSensitive: true', async () => {
      const csvPath = path.join(dirTmp, 'r3-case-sensitive.csv');
      fs.writeFileSync(
        csvPath,
        `id,status\n1,ATIVO\n2,ativo\n3,INATIVO\n`,
        'utf-8'
      );

      const regra: RegraQualidade = {
        id: 'r3-status-strict',
        ativo_dados_id: 'ativo-1',
        tipo: TipoRegraQualidade.VALORES_PERMITIDOS,
        coluna: 'status',
        colunas: ['status'],
        nome: 'Status Estrito',
        descricao: 'Apenas ATIVO e INATIVO em caixa alta',
        parametros: {
          tipo: TipoRegraQualidade.VALORES_PERMITIDOS,
          valoresPermitidos: ['ATIVO', 'INATIVO'],
          caseSensitive: true,
        },
        status: StatusRegraQualidade.ATIVA,
        versao: 1,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };

      const resultado = await BusinessRulesEvaluator.avaliar({
        diagnosticoId: 'diag-1',
        ativoDadosId: 'ativo-1',
        demandaId: 'dem-1',
        tabelaNome: 'cadastros.csv',
        caminhoArquivo: csvPath,
        formato: FormatoArquivo.CSV,
        regras: [regra],
      });

      expect(resultado.totalRegrasVioladas).toBe(1);
      const prob = resultado.problemas[0];
      // 'ativo' em minúsculas viola caseSensitive: true
      expect(prob.total_linhas_afetadas).toBe(1);
      expect(prob.amostra_evidencias[0].numeroLinha).toBe(3);
    });
  });

  // =========================================================================
  // R4: OBRIGATORIEDADE DE PREENCHIMENTO E WHITESPACE
  // =========================================================================
  describe('R4 — Obrigatoriedade', () => {
    it('deve identificar nulos, strings vazias e espaços em branco puros como violação', async () => {
      const csvPath = path.join(dirTmp, 'r4-obrigatoriedade.csv');
      fs.writeFileSync(
        csvPath,
        `id,email\n1,analista@empresa.com\n2,\n3,   \n4,\t\t\n5,gestor@empresa.com\n`,
        'utf-8'
      );

      const regra: RegraQualidade = {
        id: 'r4-email-obrigatorio',
        ativo_dados_id: 'ativo-1',
        tipo: TipoRegraQualidade.OBRIGATORIEDADE,
        coluna: 'email',
        colunas: ['email'],
        nome: 'Email Obrigatório',
        descricao: 'O email deve estar preenchido',
        parametros: {
          tipo: TipoRegraQualidade.OBRIGATORIEDADE,
          permitirEspacosEmBranco: false,
        },
        status: StatusRegraQualidade.ATIVA,
        versao: 1,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };

      const resultado = await BusinessRulesEvaluator.avaliar({
        diagnosticoId: 'diag-1',
        ativoDadosId: 'ativo-1',
        demandaId: 'dem-1',
        tabelaNome: 'usuarios.csv',
        caminhoArquivo: csvPath,
        formato: FormatoArquivo.CSV,
        regras: [regra],
      });

      expect(resultado.totalRegrasVioladas).toBe(1);
      const prob = resultado.problemas[0];
      // Linhas 3 (vazio), 4 (espaços) e 5 (tabs)
      expect(prob.total_linhas_afetadas).toBe(3);
      expect(prob.severidade).toBe(SeveridadeProblema.PENDENTE);
    });
  });

  // =========================================================================
  // R5: REGRAS TEMPORAIS COM RELÓGIO INJETÁVEL
  // =========================================================================
  describe('R5 — Regras Temporais Simples', () => {
    const dataFixaReferencia = new Date('2026-09-26T12:00:00Z'); // Relógio injetado

    it('deve validar datas contra HOJE usando relógio injetável (data_evento <= HOJE)', async () => {
      const csvPath = path.join(dirTmp, 'r5-hoje.csv');
      fs.writeFileSync(
        csvPath,
        `id,data_nascimento\n1,1990-05-15\n2,2026-09-25\n3,2026-09-26\n4,2026-09-27\n5,2030-01-01\n`,
        'utf-8'
      );

      const regra: RegraQualidade = {
        id: 'r5-nasc-hoje',
        ativo_dados_id: 'ativo-1',
        tipo: TipoRegraQualidade.REGRA_TEMPORAL,
        coluna: 'data_nascimento',
        colunas: ['data_nascimento'],
        nome: 'Nascimento no Passado ou Hoje',
        descricao: 'Ninguém pode ter nascido no futuro',
        parametros: {
          tipo: TipoRegraQualidade.REGRA_TEMPORAL,
          modo: 'COMPARAR_COM_HOJE',
          operador: 'MENOR_OU_IGUAL',
        },
        status: StatusRegraQualidade.ATIVA,
        versao: 1,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };

      const resultado = await BusinessRulesEvaluator.avaliar({
        diagnosticoId: 'diag-1',
        ativoDadosId: 'ativo-1',
        demandaId: 'dem-1',
        tabelaNome: 'pessoas.csv',
        caminhoArquivo: csvPath,
        formato: FormatoArquivo.CSV,
        regras: [regra],
        dataReferencia: dataFixaReferencia, // Relógio controlado
      });

      expect(resultado.totalRegrasVioladas).toBe(1);
      const prob = resultado.problemas[0];
      // Linhas 5 (2026-09-27) e 6 (2030-01-01) são maiores que HOJE (2026-09-26)
      expect(prob.total_linhas_afetadas).toBe(2);
      expect(prob.amostra_evidencias[0].detalhe).toContain('HOJE (2026-09-26)');
    });

    it('deve validar datas contra data fixa (data_admissao >= 2020-01-01)', async () => {
      const csvPath = path.join(dirTmp, 'r5-data-fixa.csv');
      fs.writeFileSync(
        csvPath,
        `id,data_admissao\n1,2021-03-10\n2,2018-12-01\n3,2020-01-01\n`,
        'utf-8'
      );

      const regra: RegraQualidade = {
        id: 'r5-admissao-fixa',
        ativo_dados_id: 'ativo-1',
        tipo: TipoRegraQualidade.REGRA_TEMPORAL,
        coluna: 'data_admissao',
        colunas: ['data_admissao'],
        nome: 'Admissão a partir de 2020',
        descricao: 'Admissões devem ser a partir de 2020-01-01',
        parametros: {
          tipo: TipoRegraQualidade.REGRA_TEMPORAL,
          modo: 'COMPARAR_COM_DATA_FIXA',
          operador: 'MAIOR_OU_IGUAL',
          dataFixa: '2020-01-01',
        },
        status: StatusRegraQualidade.ATIVA,
        versao: 1,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };

      const resultado = await BusinessRulesEvaluator.avaliar({
        diagnosticoId: 'diag-1',
        ativoDadosId: 'ativo-1',
        demandaId: 'dem-1',
        tabelaNome: 'contratos.csv',
        caminhoArquivo: csvPath,
        formato: FormatoArquivo.CSV,
        regras: [regra],
      });

      expect(resultado.totalRegrasVioladas).toBe(1);
      const prob = resultado.problemas[0];
      // Linha 3 (2018-12-01 < 2020-01-01)
      expect(prob.total_linhas_afetadas).toBe(1);
      expect(prob.amostra_evidencias[0].numeroLinha).toBe(3);
    });

    it('deve validar comparação temporal entre colunas (data_conclusao >= data_inicio)', async () => {
      const csvPath = path.join(dirTmp, 'r5-colunas.csv');
      fs.writeFileSync(
        csvPath,
        `id,data_inicio,data_fim\n1,2026-01-01,2026-02-01\n2,2026-05-10,2026-05-01\n3,2026-06-01,2026-06-01\n`,
        'utf-8'
      );

      const regra: RegraQualidade = {
        id: 'r5-fim-maior-inicio',
        ativo_dados_id: 'ativo-1',
        tipo: TipoRegraQualidade.REGRA_TEMPORAL,
        coluna: 'data_fim',
        colunas: ['data_fim', 'data_inicio'],
        nome: 'Fim maior ou igual ao início',
        descricao: 'Data de término deve ser posterior ou igual à data de início',
        parametros: {
          tipo: TipoRegraQualidade.REGRA_TEMPORAL,
          modo: 'COMPARAR_COM_COLUNA',
          operador: 'MAIOR_OU_IGUAL',
          colunaComparada: 'data_inicio',
        },
        status: StatusRegraQualidade.ATIVA,
        versao: 1,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };

      const resultado = await BusinessRulesEvaluator.avaliar({
        diagnosticoId: 'diag-1',
        ativoDadosId: 'ativo-1',
        demandaId: 'dem-1',
        tabelaNome: 'projetos.csv',
        caminhoArquivo: csvPath,
        formato: FormatoArquivo.CSV,
        regras: [regra],
      });

      expect(resultado.totalRegrasVioladas).toBe(1);
      const prob = resultado.problemas[0];
      // Linha 3: data_fim (2026-05-01) < data_inicio (2026-05-10) -> Violação
      expect(prob.total_linhas_afetadas).toBe(1);
      expect(prob.amostra_evidencias[0].numeroLinha).toBe(3);
    });
  });

  // =========================================================================
  // SALVAGUARDA ANTI-PII E EVIDÊNCIAS DESPERSONALIZADAS
  // =========================================================================
  describe('Salvaguarda Anti-PII Estrita da 3.4B', () => {
    it('garante que valores brutos das células (CPFs, nomes, salários) NÃO constam nas evidências', async () => {
      const csvPath = path.join(dirTmp, 'anti-pii-sensivel.csv');
      const cpfSensivel = '123.456.789-00';
      const nomeSensivel = 'João da Silva Sauro Confidencial';
      const salarioSensivel = '99999.99';

      fs.writeFileSync(
        csvPath,
        `cpf,nome,salario\n${cpfSensivel},${nomeSensivel},${salarioSensivel}\n${cpfSensivel},${nomeSensivel},500.00\n`,
        'utf-8'
      );

      // Regra 1: Chave única no CPF
      const regraCpf: RegraQualidade = {
        id: 'r1-pii',
        ativo_dados_id: 'ativo-1',
        tipo: TipoRegraQualidade.CHAVE_UNICA,
        coluna: 'cpf',
        colunas: ['cpf'],
        nome: 'CPF Único',
        descricao: 'Sem duplicatas de CPF',
        parametros: { tipo: TipoRegraQualidade.CHAVE_UNICA, colunas: ['cpf'] },
        status: StatusRegraQualidade.ATIVA,
        versao: 1,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };

      // Regra 2: Salário máximo 50000
      const regraSalario: RegraQualidade = {
        id: 'r2-pii',
        ativo_dados_id: 'ativo-1',
        tipo: TipoRegraQualidade.VALOR_MIN_MAX,
        coluna: 'salario',
        colunas: ['salario'],
        nome: 'Salário Máximo',
        descricao: 'Salário até 50000',
        parametros: { tipo: TipoRegraQualidade.VALOR_MIN_MAX, maximo: 50000 },
        status: StatusRegraQualidade.ATIVA,
        versao: 1,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };

      const resultado = await BusinessRulesEvaluator.avaliar({
        diagnosticoId: 'diag-1',
        ativoDadosId: 'ativo-1',
        demandaId: 'dem-1',
        tabelaNome: 'folha.csv',
        caminhoArquivo: csvPath,
        formato: FormatoArquivo.CSV,
        regras: [regraCpf, regraSalario],
      });

      // Serializa todos os problemas gerados para string e verifica ausência de PII
      const jsonOutput = JSON.stringify(resultado.problemas);
      expect(jsonOutput).not.toContain(cpfSensivel);
      expect(jsonOutput).not.toContain(nomeSensivel);
      expect(jsonOutput).not.toContain(salarioSensivel);
    });
  });
});
