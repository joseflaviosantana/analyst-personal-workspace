import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { LocalFileSystemAdapter } from '../../src/infrastructure/filesystem/local-file-system-adapter';
import { FormatoArquivo } from '../../src/core/domain/enums/formato-arquivo';
import { criarXlsxSintetico } from '../fixtures/synthetic-xlsx-builder';

describe('LocalFileSystemAdapter (Unidade 3.2 — Inspeção Física de Arquivos)', () => {
  let tempDir: string;
  let adapter: LocalFileSystemAdapter;

  beforeAll(() => {
    // Cria diretório temporário isolado para as fixtures de teste
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'analyst-fs-tests-'));
    adapter = new LocalFileSystemAdapter();
  });

  afterAll(() => {
    // Limpeza rigorosa do diretório temporário após os testes
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignora falhas esporádicas de lock no teardown
    }
  });

  // 1. Arquivo inexistente
  it('deve retornar sucesso false e erro estruturado para arquivo inexistente', async () => {
    const caminhoInexistente = path.join(tempDir, 'arquivo_que_nao_existe.csv');
    const res = await adapter.inspecionarArquivo(caminhoInexistente);

    expect(res.sucesso).toBe(false);
    expect(res.fisico).toBeUndefined();
    expect(res.erros.length).toBeGreaterThan(0);
    expect(res.erros[0]).toContain('Arquivo não encontrado no caminho especificado');
  });

  // 2. Diretório em vez de arquivo regular
  it('deve rejeitar caminhos que apontam para diretórios', async () => {
    const res = await adapter.inspecionarArquivo(tempDir);

    expect(res.sucesso).toBe(false);
    expect(res.erros.length).toBeGreaterThan(0);
    expect(res.erros[0]).toContain('não aponta para um arquivo regular');
  });

  // 3. Arquivo vazio (0 bytes)
  it('deve catalogar fisicamente arquivo de 0 bytes e avisar que nenhum dado foi lido', async () => {
    const caminhoVazio = path.join(tempDir, 'vazio.csv');
    fs.writeFileSync(caminhoVazio, '');

    const res = await adapter.inspecionarArquivo(caminhoVazio);

    expect(res.sucesso).toBe(true);
    expect(res.fisico).toBeDefined();
    expect(res.fisico?.tamanhoBytes).toBe(0);
    expect(res.fisico?.formato).toBe(FormatoArquivo.CSV);
    // Hash SHA-256 do vazio é determinístico
    expect(res.fisico?.hashSha256).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(res.conteudo?.conteudoInspecionado).toBe(false);
    expect(res.conteudo?.totalLinhas).toBe(0);
    expect(res.avisos[0]).toContain('completamente vazio');
  });

  // 4. SHA-256 conhecido
  it('deve calcular o hash SHA-256 idêntico ao padrão criptográfico', async () => {
    const caminhoSha = path.join(tempDir, 'hash_test.txt');
    const conteudo = 'Analyst Personal Workspace - SHA256 Test Content';
    fs.writeFileSync(caminhoSha, conteudo, 'utf-8');

    const expectedHash = crypto.createHash('sha256').update(conteudo).digest('hex');
    const res = await adapter.inspecionarArquivo(caminhoSha);

    expect(res.sucesso).toBe(true);
    expect(res.fisico?.hashSha256).toBe(expectedHash);
  });

  // 5. CSV com vírgula
  it('deve inspecionar CSV delimitado por vírgula com inferência de tipos', async () => {
    const caminhoCsv = path.join(tempDir, 'dados_virgula.csv');
    const conteudo = [
      'id,nome,ativo,valor,data_cadastro',
      '1,Alpha,true,150.50,2024-01-15',
      '2,Beta,false,299.99,2024-02-20',
      '3,Gamma,true,45.00,2024-03-10',
    ].join('\n');
    fs.writeFileSync(caminhoCsv, conteudo, 'utf-8');

    const res = await adapter.inspecionarArquivo(caminhoCsv);

    expect(res.sucesso).toBe(true);
    expect(res.fisico?.formato).toBe(FormatoArquivo.CSV);
    expect(res.conteudo?.conteudoInspecionado).toBe(true);
    expect(res.conteudo?.totalLinhas).toBe(3);
    expect(res.conteudo?.totalColunas).toBe(5);
    expect(res.conteudo?.delimitadorDetectado).toBe(',');
    expect(res.conteudo?.schemaInferido).toEqual({
      id: 'number',
      nome: 'string',
      ativo: 'boolean',
      valor: 'number',
      data_cadastro: 'date',
    });
    expect(res.conteudo?.linhasAmostra?.length).toBe(3);
  });

  // 6. CSV com ponto e vírgula (padrão Brasil/Excel)
  it('deve detectar e inspecionar CSV com delimitador ponto e vírgula', async () => {
    const caminhoCsv = path.join(tempDir, 'dados_ponto_virgula.csv');
    const conteudo = [
      'codigo;descricao;preco;data',
      '101;Produto A;123,45;15/01/2024',
      '102;Produto B;678,90;20/02/2024',
    ].join('\r\n');
    fs.writeFileSync(caminhoCsv, conteudo, 'utf-8');

    const res = await adapter.inspecionarArquivo(caminhoCsv);

    expect(res.sucesso).toBe(true);
    expect(res.conteudo?.delimitadorDetectado).toBe(';');
    expect(res.conteudo?.totalLinhas).toBe(2);
    expect(res.conteudo?.totalColunas).toBe(4);
    expect(res.conteudo?.schemaInferido?.preco).toBe('number');
    expect(res.conteudo?.schemaInferido?.data).toBe('date');
  });

  // 7. Quoted field contendo delimitador
  it('deve parsear corretamente campo entre aspas contendo o delimitador interno', async () => {
    const caminhoCsv = path.join(tempDir, 'quoted_delim.csv');
    const conteudo = [
      'id,empresa,cidade',
      '1,"Silva, Santos & Cia",São Paulo',
      '2,"Lojas Unidas, S.A.",Rio de Janeiro',
    ].join('\n');
    fs.writeFileSync(caminhoCsv, conteudo, 'utf-8');

    const res = await adapter.inspecionarArquivo(caminhoCsv);

    expect(res.sucesso).toBe(true);
    expect(res.conteudo?.totalLinhas).toBe(2);
    expect(res.conteudo?.totalColunas).toBe(3);
    expect(res.conteudo?.linhasAmostra?.[0].empresa).toBe('Silva, Santos & Cia');
  });

  // 8. Multiline quoted field (campo com quebra de linha interna)
  it('deve processar registros com campos multilinha entre aspas', async () => {
    const caminhoCsv = path.join(tempDir, 'multiline.csv');
    const conteudo = [
      'id,observacao,status',
      '1,"Linha 1 do texto\nLinha 2 do texto",OK',
      '2,"Apenas uma linha",OK',
    ].join('\n');
    fs.writeFileSync(caminhoCsv, conteudo, 'utf-8');

    const res = await adapter.inspecionarArquivo(caminhoCsv);

    expect(res.sucesso).toBe(true);
    expect(res.conteudo?.totalLinhas).toBe(2);
    expect(res.conteudo?.linhasAmostra?.[0].observacao).toContain('Linha 1 do texto');
    expect(res.conteudo?.linhasAmostra?.[0].observacao).toContain('Linha 2 do texto');
  });

  // 9. TSV (Tab-Separated Values)
  it('deve inspecionar arquivo TSV com delimitador de tabulação', async () => {
    const caminhoTsv = path.join(tempDir, 'export.tsv');
    const conteudo = [
      'colA\tcolB\tcolC',
      'valor1\t100\ttrue',
      'valor2\t200\tfalse',
    ].join('\n');
    fs.writeFileSync(caminhoTsv, conteudo, 'utf-8');

    const res = await adapter.inspecionarArquivo(caminhoTsv);

    expect(res.sucesso).toBe(true);
    expect(res.fisico?.formato).toBe(FormatoArquivo.TSV);
    expect(res.conteudo?.delimitadorDetectado).toBe('\t');
    expect(res.conteudo?.totalLinhas).toBe(2);
    expect(res.conteudo?.totalColunas).toBe(3);
  });

  // 10. TXT tabular
  it('deve inspecionar arquivo TXT com estrutura tabular delimitada por pipe', async () => {
    const caminhoTxt = path.join(tempDir, 'relatorio.txt');
    const conteudo = [
      'codigo|nome|pontos',
      'C1|Equipe Alpha|88',
      'C2|Equipe Beta|92',
    ].join('\n');
    fs.writeFileSync(caminhoTxt, conteudo, 'utf-8');

    const res = await adapter.inspecionarArquivo(caminhoTxt);

    expect(res.sucesso).toBe(true);
    expect(res.fisico?.formato).toBe(FormatoArquivo.TXT);
    expect(res.conteudo?.delimitadorDetectado).toBe('|');
    expect(res.conteudo?.totalLinhas).toBe(2);
    expect(res.conteudo?.totalColunas).toBe(3);
  });

  // 11. XLSX com uma worksheet (modo single-sheet V1)
  it('deve inspecionar XLSX com uma única worksheet no modelo single-sheet', async () => {
    const buffer = criarXlsxSintetico([
      {
        nome: 'Vendas2024',
        linhas: [
          ['Regiao', 'Vendedor', 'Total', 'MetaAtingida'],
          ['Sul', 'Carlos', 15000, true],
          ['Norte', 'Mariana', 22000, true],
          ['Leste', 'Roberto', 9500, false],
        ],
      },
    ]);
    const caminhoXlsx = path.join(tempDir, 'vendas.xlsx');
    fs.writeFileSync(caminhoXlsx, buffer);

    const res = await adapter.inspecionarArquivo(caminhoXlsx);

    expect(res.sucesso).toBe(true);
    expect(res.fisico?.formato).toBe(FormatoArquivo.XLSX);
    expect(res.conteudo?.conteudoInspecionado).toBe(true);
    expect(res.conteudo?.worksheets?.length).toBe(1);
    expect(res.conteudo?.worksheets?.[0].nome).toBe('Planilha 1');
    expect(res.conteudo?.worksheetAtiva).toBe('Planilha 1');
    expect(res.conteudo?.totalLinhas).toBe(3);
    expect(res.conteudo?.totalColunas).toBe(4);
    expect(res.conteudo?.schemaInferido).toEqual({
      Regiao: 'string',
      Vendedor: 'string',
      Total: 'number',
      MetaAtingida: 'boolean',
    });
  });

  // 12. XLSX com múltiplas worksheets (comportamento single-sheet V1)
  it('deve materializar exclusivamente uma worksheet por inspeção em pastas multi-abas', async () => {
    const buffer = criarXlsxSintetico([
      {
        nome: 'Geral',
        linhas: [
          ['ID', 'Status'],
          ['G1', 'Ativo'],
        ],
      },
      {
        nome: 'Detalhado',
        linhas: [
          ['ID', 'Produto', 'Qtd', 'Preco'],
          ['D1', 'Monitor', 2, 850],
          ['D2', 'Teclado', 5, 120],
        ],
      },
    ]);
    const caminhoXlsxMulti = path.join(tempDir, 'multi_abas.xlsx');
    fs.writeFileSync(caminhoXlsxMulti, buffer);

    // 12a. Sem abaAlvoXlsx: materializa estritamente a primeira worksheet
    const resPadrao = await adapter.inspecionarArquivo(caminhoXlsxMulti);

    expect(resPadrao.sucesso).toBe(true);
    expect(resPadrao.conteudo?.worksheets?.length).toBe(1);
    expect(resPadrao.conteudo?.worksheetAtiva).toBe('Planilha 1');
    expect(resPadrao.conteudo?.totalLinhas).toBe(1);
    expect(resPadrao.conteudo?.totalColunas).toBe(2);
    expect(resPadrao.conteudo?.colunas?.map((c) => c.nome)).toEqual(['ID', 'Status']);

    // 12b. Com abaAlvoXlsx explícita: materializa exclusivamente a worksheet solicitada
    const resDetalhado = await adapter.inspecionarArquivo(caminhoXlsxMulti, {
      abaAlvoXlsx: 'Detalhado',
    });

    expect(resDetalhado.sucesso).toBe(true);
    expect(resDetalhado.conteudo?.worksheets?.length).toBe(1);
    expect(resDetalhado.conteudo?.worksheetAtiva).toBe('Detalhado');
    expect(resDetalhado.conteudo?.totalLinhas).toBe(2);
    expect(resDetalhado.conteudo?.totalColunas).toBe(4);
    expect(resDetalhado.conteudo?.colunas?.map((c) => c.nome)).toEqual(['ID', 'Produto', 'Qtd', 'Preco']);
  });

  // 13. Erro estruturado ao solicitar aba inexistente no XLSX
  it('deve retornar erro estruturado quando a aba solicitada não existir no XLSX', async () => {
    const buffer = criarXlsxSintetico([
      {
        nome: 'UnicaAba',
        linhas: [['A', 'B'], ['1', '2']],
      },
    ]);
    const caminhoXlsx = path.join(tempDir, 'aba_inexistente.xlsx');
    fs.writeFileSync(caminhoXlsx, buffer);

    const res = await adapter.inspecionarArquivo(caminhoXlsx, {
      abaAlvoXlsx: 'AbaFantasma',
    });

    expect(res.sucesso).toBe(false);
    expect(res.erros.length).toBeGreaterThan(0);
    expect(res.erros[0]).toBe('Aba solicitada "AbaFantasma" não foi encontrada na planilha Excel.');
  });

  // 14. XLS legado (apenas catalogação física + aviso de conversão)
  it('deve realizar catalogação física de .xls e orientar conversão para XLSX/CSV', async () => {
    const caminhoXls = path.join(tempDir, 'antigo.xls');
    fs.writeFileSync(caminhoXls, 'Fake BIFF8 content', 'utf-8');

    const res = await adapter.inspecionarArquivo(caminhoXls);

    expect(res.sucesso).toBe(true);
    expect(res.fisico?.formato).toBe(FormatoArquivo.XLS);
    expect(res.conteudo?.conteudoInspecionado).toBe(false);
    expect(res.avisos.length).toBeGreaterThan(0);
    expect(res.avisos[0]).toContain('Excel legado (.xls / BIFF8)');
    expect(res.avisos[0]).toContain('conversão para formato .xlsx ou .csv');
  });

  // 15. Formato OUTRO (apenas catalogação física)
  it('deve catalogar fisicamente arquivos com formato não tabular sem tentar parsear', async () => {
    const caminhoOutro = path.join(tempDir, 'documento.pdf');
    fs.writeFileSync(caminhoOutro, '%PDF-1.4 mock content', 'utf-8');

    const res = await adapter.inspecionarArquivo(caminhoOutro);

    expect(res.sucesso).toBe(true);
    expect(res.fisico?.formato).toBe(FormatoArquivo.OUTRO);
    expect(res.conteudo?.conteudoInspecionado).toBe(false);
    expect(res.avisos[0]).toContain('não suportado para inspeção estrutural');
  });

  // 16. XLSX corrompido
  it('deve capturar falha em arquivo XLSX corrompido sem derrubar a aplicação', async () => {
    const caminhoCorrompido = path.join(tempDir, 'corrompido.xlsx');
    fs.writeFileSync(caminhoCorrompido, 'Isso nao e um arquivo zip valido', 'utf-8');

    const res = await adapter.inspecionarArquivo(caminhoCorrompido);

    expect(res.sucesso).toBe(false);
    expect(res.erros.length).toBeGreaterThan(0);
    expect(res.erros[0]).toContain('corrompido, bloqueado ou em formato inválido');
  });

  // 17. Caminho com espaços (padrão Windows / usuário comum)
  it('deve normalizar e inspecionar caminho contendo espaços e caracteres comuns de filesystem', async () => {
    const pastaComEspaco = path.join(tempDir, 'Pasta com Espacos');
    fs.mkdirSync(pastaComEspaco);
    const caminhoEspaco = path.join(pastaComEspaco, 'Meu Relatorio Financeiro 2024.csv');
    fs.writeFileSync(caminhoEspaco, 'conta,saldo\nAtivo,5000\nPassivo,2000', 'utf-8');

    const res = await adapter.inspecionarArquivo(caminhoEspaco);

    expect(res.sucesso).toBe(true);
    expect(res.fisico?.nomeArquivo).toBe('Meu Relatorio Financeiro 2024.csv');
    expect(res.conteudo?.totalLinhas).toBe(2);
  });

  // 18. Hard Cap de segurança (bloqueio de leitura de conteúdo acima do limite configurado)
  it('deve acionar o Hard Cap e bloquear a leitura de conteúdo quando o arquivo exceder o limite', async () => {
    const caminhoCsv = path.join(tempDir, 'arquivo_grande_simulado.csv');
    const conteudo = 'col1,col2\n' + 'dado1,dado2\n'.repeat(50);
    fs.writeFileSync(caminhoCsv, conteudo, 'utf-8');

    const tamanhoReal = fs.statSync(caminhoCsv).size;

    // Configura hard cap menor que o tamanho do arquivo
    const res = await adapter.inspecionarArquivo(caminhoCsv, {
      limiteMaximoBytesCsv: tamanhoReal - 10,
    });

    expect(res.sucesso).toBe(true);
    expect(res.fisico).toBeDefined();
    expect(res.conteudo?.conteudoInspecionado).toBe(false);
    expect(res.avisos.some((a) => a.includes('excede o limite máximo de segurança'))).toBe(true);
  });

  // 19. Soft Cap de segurança (aviso de arquivo volumoso com execução normal)
  it('deve acionar o Soft Cap e emitir aviso de volumetria sem bloquear a inspeção', async () => {
    const caminhoCsv = path.join(tempDir, 'arquivo_medio_simulado.csv');
    const conteudo = 'col1,col2\nval1,val2\n';
    fs.writeFileSync(caminhoCsv, conteudo, 'utf-8');

    // Configura soft cap menor que o arquivo, mas hard cap maior
    const res = await adapter.inspecionarArquivo(caminhoCsv, {
      limiteAvisoBytesCsv: 5,
      limiteMaximoBytesCsv: 10000,
    });

    expect(res.sucesso).toBe(true);
    expect(res.conteudo?.conteudoInspecionado).toBe(true);
    expect(res.avisos.some((a) => a.includes('volumoso'))).toBe(true);
  });

  // 20. Garantia de que somente a amostra configurada é retida na memória
  // Nota epistêmica: A propriedade de consumo limitado de memória decorre da estrutura streaming
  // do algoritmo (fs.createReadStream + csv-parse Transform consumido via for-await sem retenção de referências além da amostra).
  // O teste sintético abaixo comprova exclusivamente o comportamento observado perante a carga testada de 120 linhas,
  // demonstrando que apenas 50 linhas permanecem alocadas no array de amostra, não constituindo benchmark universal de carga.
  it('deve contar todas as linhas no stream mas reter apenas a amostra máxima configurada', async () => {
    const linhas = ['id,nome'];
    for (let i = 1; i <= 120; i++) {
      linhas.push(`${i},Item_${i}`);
    }
    const caminhoCsvLongo = path.join(tempDir, 'longo.csv');
    fs.writeFileSync(caminhoCsvLongo, linhas.join('\n'), 'utf-8');

    // Limite de amostra padrão = 50
    const res = await adapter.inspecionarArquivo(caminhoCsvLongo, {
      limiteAmostraLinhas: 50,
    });

    expect(res.sucesso).toBe(true);
    expect(res.conteudo?.totalLinhas).toBe(120); // contagem total precisa
    expect(res.conteudo?.linhasAmostra?.length).toBe(50); // apenas 50 na memória!
    expect(res.conteudo?.linhasAmostra?.[0].id).toBe('1');
    expect(res.conteudo?.linhasAmostra?.[49].id).toBe('50');
  });

  // 21. Detecção de bytes não-UTF8 com diagnóstico explícito
  it('deve produzir diagnóstico explícito para arquivo com bytes inválidos para UTF-8', async () => {
    const caminhoInvalido = path.join(tempDir, 'invalido_utf8.csv');
    // Cria buffer contendo sequência de bytes inválida em UTF-8 (ex: byte 0xC0 ou 0xFF isolado)
    const invalidBytes = Buffer.from([0x69, 0x64, 0x2c, 0x6e, 0x6f, 0x6d, 0x65, 0x0a, 0x31, 0x2c, 0xff, 0xfe, 0x0a]);
    fs.writeFileSync(caminhoInvalido, invalidBytes);

    const res = await adapter.inspecionarArquivo(caminhoInvalido);

    expect(res.sucesso).toBe(false);
    expect(res.erros.length).toBeGreaterThan(0);
    expect(res.erros[0]).toContain('incompatível com a codificação UTF-8');
    expect(res.erros[0]).toContain('V1, a codificação determinística é estritamente UTF-8');
  });

  // 22. Interpretação de arquivo conforme a extensão física subjacente (requisito BASE_TRATADA)
  it('deve interpretar arquivo com nomenclatura de base tratada conforme sua extensão física subjacente', async () => {
    // 22a. Base tratada com extensão .csv suportada -> inspeção estrutural completa
    const caminhoBaseTratadaCsv = path.join(tempDir, 'base_tratada_clientes_v1.csv');
    fs.writeFileSync(caminhoBaseTratadaCsv, 'cod,cliente\n10,Empresa X\n20,Empresa Y', 'utf-8');

    const resCsv = await adapter.inspecionarArquivo(caminhoBaseTratadaCsv);
    expect(resCsv.sucesso).toBe(true);
    expect(resCsv.fisico?.formato).toBe(FormatoArquivo.CSV);
    expect(resCsv.conteudo?.conteudoInspecionado).toBe(true);
    expect(resCsv.conteudo?.totalLinhas).toBe(2);

    // 22b. Base tratada com extensão não tabular (ex: .parquet ou .dat) -> somente catalogação física
    const caminhoBaseTratadaDat = path.join(tempDir, 'base_tratada_suporte.dat');
    fs.writeFileSync(caminhoBaseTratadaDat, 'binary data mock', 'utf-8');

    const resDat = await adapter.inspecionarArquivo(caminhoBaseTratadaDat);
    expect(resDat.sucesso).toBe(true);
    expect(resDat.fisico?.formato).toBe(FormatoArquivo.OUTRO);
    expect(resDat.conteudo?.conteudoInspecionado).toBe(false);
  });

  // 23. Hard Cap de segurança específico para XLSX
  it('deve acionar o Hard Cap e bloquear a leitura de XLSX quando o limite de bytes for ultrapassado', async () => {
    const buffer = criarXlsxSintetico([
      {
        nome: 'Planilha1',
        linhas: [['ColA', 'ColB'], [1, 2]],
      },
    ]);
    const caminhoXlsx = path.join(tempDir, 'xlsx_hard_cap.xlsx');
    fs.writeFileSync(caminhoXlsx, buffer);

    const tamanhoReal = fs.statSync(caminhoXlsx).size;

    const res = await adapter.inspecionarArquivo(caminhoXlsx, {
      limiteMaximoBytesXlsx: tamanhoReal - 10,
    });

    expect(res.sucesso).toBe(true);
    expect(res.fisico?.formato).toBe(FormatoArquivo.XLSX);
    expect(res.conteudo?.conteudoInspecionado).toBe(false);
    expect(res.avisos.some((a) => a.includes('excede o limite máximo de segurança'))).toBe(true);
  });
});

