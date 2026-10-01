/**
 * src/core/domain/rules/dax-real-time-analyzer.ts
 *
 * Analisador Léxico e Estrutural em Tempo Real para DAX (Subgate 3.4C)
 *
 * Princípios Epistêmicos Inegociáveis:
 * 1. Análise puramente determinística e local;
 * 2. Jamais afirmar que o código compilou no VertiPaq ou que foi executado pelo Power BI;
 * 3. Separação visual e categórica estrita:
 *    - BLOQUEIO: erros estruturais locais verificáveis (parênteses abertos sem fechar, campos vazios, etc.);
 *    - ALERTA CRÍTICO: problemas graves de linhagem ou referências órfãs;
 *    - RECOMENDAÇÃO: heurísticas de boas práticas (ex: D-04 para operador '/', variáveis VAR/RETURN, etc.);
 * 4. Padrão pedagógico "Aprenda enquanto trabalha" com progressive disclosure contextual.
 */

import { CategoriaMedidaDax } from '@/core/domain/enums/categoria-medida-dax';

export type SeveridadeDax = 'BLOQUEIO' | 'ALERTA_CRITICO' | 'RECOMENDACAO';

export interface DiagnosticoDaxItem {
  id: string;
  severidade: SeveridadeDax;
  titulo: string;
  mensagem: string;
  categoria: 'SINTAXE' | 'BOA_PRATICA' | 'LINHAGEM' | 'ESTRUTURA';
}

export interface ConceitoPedagogicoDax {
  id: string;
  conceito: string;
  oQueE: string;
  porQueImporta: string;
  comoEstaSendoUsado: string;
  dicaProfissional: string;
}

export interface AnaliseDaxResultado {
  diagnosticos: DiagnosticoDaxItem[];
  bloqueiosCount: number;
  alertasCount: number;
  recomendacoesCount: number;
  isSintaxeValidaLocalmente: boolean;
  padroesDetectados: string[];
  referenciasDetectadas: {
    tabelas: string[];
    colunas: string[];
    medidas: string[];
  };
  conteudoPedagogico: ConceitoPedagogicoDax[];
  avisoEpistemico: string;
}

export interface AnaliseDaxInput {
  expressaoDax: string;
  nomeMedida?: string;
  tabelaHospedeira?: string;
  categoriaDax?: CategoriaMedidaDax;
  metricaHomologadaNome?: string | null;
}

export class DaxRealTimeAnalyzer {
  public static readonly AVISO_EPISTEMICO =
    'Análise estrutural e léxica local do Workspace. Não executa nem substitui o motor VertiPaq do Power BI Desktop.';

  public static analisar(input: AnaliseDaxInput): AnaliseDaxResultado {
    const {
      expressaoDax = '',
      nomeMedida = '',
      tabelaHospedeira = '',
      categoriaDax,
      metricaHomologadaNome,
    } = input;

    const diagnosticos: DiagnosticoDaxItem[] = [];
    const padroesDetectados: string[] = [];
    const conteudoPedagogico: ConceitoPedagogicoDax[] = [];

    const expr = expressaoDax.trim();

    // 1. Verificações Estruturais Básicas (Nome, Hospedeira e Expressão)
    if (!nomeMedida || nomeMedida.trim().length === 0) {
      diagnosticos.push({
        id: 'dax-empty-name',
        severidade: 'BLOQUEIO',
        titulo: 'Nome da Medida Ausente',
        mensagem: 'O nome da medida é obrigatório para identificação no modelo tabular.',
        categoria: 'ESTRUTURA',
      });
    }

    if (!tabelaHospedeira || tabelaHospedeira.trim().length === 0) {
      diagnosticos.push({
        id: 'dax-empty-table',
        severidade: 'BLOQUEIO',
        titulo: 'Tabela Hospedeira Não Informada',
        mensagem: 'Toda medida deve ser vinculada a uma tabela hospedeira (recomendado: "_Medidas").',
        categoria: 'ESTRUTURA',
      });
    } else {
      const hospedeira = tabelaHospedeira.trim();
      const isDedicada =
        hospedeira.startsWith('_') ||
        hospedeira.toLowerCase().includes('medida') ||
        hospedeira.toLowerCase().includes('kpi');

      if (!isDedicada) {
        diagnosticos.push({
          id: 'dax-host-table-convention',
          severidade: 'RECOMENDACAO',
          titulo: 'Heurística de Organização: Tabela Dedicada',
          mensagem: `A tabela "${hospedeira}" parece ser uma tabela de dados. Recomenda-se hospedar medidas em tabelas dedicadas iniciadas com sublinhado (ex: "_Medidas") para facilitar a navegação no Power BI.`,
          categoria: 'BOA_PRATICA',
        });
      }
    }

    if (expr.length === 0) {
      diagnosticos.push({
        id: 'dax-empty-expr',
        severidade: 'BLOQUEIO',
        titulo: 'Expressão DAX Vazia',
        mensagem: 'A fórmula de cálculo DAX deve ser preenchida.',
        categoria: 'ESTRUTURA',
      });

      return {
        diagnosticos,
        bloqueiosCount: diagnosticos.filter((d) => d.severidade === 'BLOQUEIO').length,
        alertasCount: diagnosticos.filter((d) => d.severidade === 'ALERTA_CRITICO').length,
        recomendacoesCount: diagnosticos.filter((d) => d.severidade === 'RECOMENDACAO').length,
        isSintaxeValidaLocalmente: false,
        padroesDetectados: [],
        referenciasDetectadas: { tabelas: [], colunas: [], medidas: [] },
        conteudoPedagogico: [],
        avisoEpistemico: this.AVISO_EPISTEMICO,
      };
    }

    // 2. Balanço de Delimitadores (Parênteses, Colchetes, Aspas)
    let openParens = 0;
    let closeParens = 0;
    let openBrackets = 0;
    let closeBrackets = 0;
    let inString = false;

    for (let i = 0; i < expr.length; i++) {
      const ch = expr[i];

      if (ch === '"') {
        if (inString && expr[i + 1] === '"') {
          i++; // Aspas escapadas
        } else {
          inString = !inString;
        }
        continue;
      }

      if (!inString) {
        if (ch === '(') openParens++;
        if (ch === ')') closeParens++;
        if (ch === '[') openBrackets++;
        if (ch === ']') closeBrackets++;
      }
    }

    if (inString) {
      diagnosticos.push({
        id: 'dax-unclosed-string',
        severidade: 'BLOQUEIO',
        titulo: 'Literal de Texto Não Fechado',
        mensagem: 'Há uma aspa dupla (") aberta que não foi devidamente fechada na expressão.',
        categoria: 'SINTAXE',
      });
    }

    if (openParens !== closeParens) {
      diagnosticos.push({
        id: 'dax-unbalanced-parens',
        severidade: 'BLOQUEIO',
        titulo: 'Parênteses Desbalanceados',
        mensagem: `A expressão possui ${openParens} parêntese(s) de abertura '(' e ${closeParens} de fechamento ')'.`,
        categoria: 'SINTAXE',
      });
    }

    if (openBrackets !== closeBrackets) {
      diagnosticos.push({
        id: 'dax-unbalanced-brackets',
        severidade: 'BLOQUEIO',
        titulo: 'Colchetes Desbalanceados',
        mensagem: `A expressão possui ${openBrackets} colchete(s) de abertura '[' e ${closeBrackets} de fechamento ']'.`,
        categoria: 'SINTAXE',
      });
    }

    // 3. Extração Léxica de Referências (Colunas e Medidas)
    const tabelasDetectadas = new Set<string>();
    const colunasDetectadas = new Set<string>();
    const medidasDetectadas = new Set<string>();

    // Padrão Tabela[Coluna] ou 'Tabela com Espaço'[Coluna]
    const refColunaRegex = /(?:'([^']+)'|([a-zA-Z0-9_]+))\[([^\]]+)\]/g;
    let match: RegExpExecArray | null;
    while ((match = refColunaRegex.exec(expr)) !== null) {
      const tabela = match[1] || match[2];
      const coluna = match[3];
      if (tabela) tabelasDetectadas.add(tabela);
      if (coluna) colunasDetectadas.add(coluna);
    }

    // Medidas isoladas: [NomeMedida] (quando não precedido imediatamente por nome de tabela)
    const refMedidaRegex = /(?:^|[^\w'\]])\[([^\]]+)\]/g;
    while ((match = refMedidaRegex.exec(expr)) !== null) {
      const possivelMedida = match[1];
      if (!colunasDetectadas.has(possivelMedida)) {
        medidasDetectadas.add(possivelMedida);
      }
    }

    // 4. Detecção de Padrões e Heurísticas de DAX
    const exprUpper = expr.toUpperCase();

    // 4.1 Operador de Divisão '/' vs DIVIDE() — Calibração Epistêmica D-04
    const temDivideFunc = /\bDIVIDE\s*\(/i.test(expr);
    const temBarraDivisao = !inString && /[^\w/]\s*\/\s*[^\w/]/.test(` ${expr} `);

    if (temBarraDivisao && !temDivideFunc) {
      diagnosticos.push({
        id: 'dax-divisao-barra',
        severidade: 'RECOMENDACAO',
        titulo: 'Heurística de Boa Prática: Operador / vs DIVIDE()',
        mensagem:
          'O operador "/" é perfeitamente válido em DAX. Considere utilizar a função DIVIDE() caso deseje tratamento explícito e seguro para divisão por zero ou denominadores BLANK.',
        categoria: 'BOA_PRATICA',
      });
      padroesDetectados.push('Divisão com Operador /');
    }

    if (temDivideFunc) {
      padroesDetectados.push('DIVIDE()');
      conteudoPedagogico.push({
        id: 'ped-divide',
        conceito: 'Função DIVIDE vs Operador /',
        oQueE:
          'Função nativa de DAX projetada para realizar divisões com tratamento gracioso de valores nulos e denominadores zero.',
        porQueImporta:
          'Diferente do operador aritmético "/", DIVIDE() retorna BLANK por padrão ao invés de Infinity, prevenindo erros visuais em matrizes e cartões.',
        comoEstaSendoUsado:
          'Sua fórmula emprega DIVIDE(), garantindo estabilidade no cálculo de taxas ou proporções.',
        dicaProfissional:
          'O terceiro argumento de DIVIDE(numerador, denominador, [alternativa]) é opcional; omiti-lo retorna BLANK(), que é a melhor prática para omitir linhas sem dados no visual.',
      });
    }

    // 4.2 CALCULATE e Modificadores de Filtro
    if (/\bCALCULATE\s*\(/i.test(expr)) {
      padroesDetectados.push('CALCULATE()');
      conteudoPedagogico.push({
        id: 'ped-calculate',
        conceito: 'Modificação de Contexto com CALCULATE',
        oQueE:
          'CALCULATE é a função mais poderosa do DAX. Ela avalia uma expressão em um contexto de filtro modificado.',
        porQueImporta:
          'É a única função que realiza "Transição de Contexto" (converte contexto de linha em contexto de filtro) e permite sobreescrever ou adicionar filtros a uma métrica.',
        comoEstaSendoUsado:
          'Sua fórmula utiliza CALCULATE para ajustar os filtros sob os quais o cálculo base é computado.',
        dicaProfissional:
          'Ao filtrar colunas específicas dentro de CALCULATE, utilize KEEPFILTERS() quando quiser interseccionar filtros ao invés de sobrescrever filtros externos existentes no visual.',
      });
    }

    // 4.3 Variáveis VAR ... RETURN
    if (/\bVAR\b/i.test(expr) && /\bRETURN\b/i.test(expr)) {
      padroesDetectados.push('Variáveis (VAR / RETURN)');
      conteudoPedagogico.push({
        id: 'ped-var-return',
        conceito: 'Variáveis em DAX (VAR ... RETURN)',
        oQueE:
          'Mecanismo para armazenar o resultado de uma expressão avaliada com um nome descritivo dentro do escopo da medida.',
        porQueImporta:
          'Variáveis são calculadas uma única vez no momento de sua definição (armazenamento estático). Isso evita recomputações dispendiosas e torna o código limpo e fácil de depurar.',
        comoEstaSendoUsado:
          'Sua medida utiliza blocos VAR/RETURN, demonstrando maturidade analítica e separação de etapas de cálculo.',
        dicaProfissional:
          'Lembre-se que variáveis congelam o contexto de filtro no ponto onde são declaradas. Se precisar que uma expressão seja reavaliada dentro de um iterador, declare a variável dentro do iterador.',
      });
    } else if (expr.length > 120 && !/\bVAR\b/i.test(expr)) {
      diagnosticos.push({
        id: 'dax-var-sugestao',
        severidade: 'RECOMENDACAO',
        titulo: 'Recomendação de Legibilidade: Modularizar com VAR/RETURN',
        mensagem:
          'Expressões DAX com mais de uma operação ganham legibilidade e desempenho quando fatiadas com blocos VAR e RETURN.',
        categoria: 'BOA_PRATICA',
      });
    }

    // 4.4 Agregações Simples (SUM, AVERAGE, COUNT, DISTINCTCOUNT)
    if (/\b(SUM|AVERAGE|COUNT|DISTINCTCOUNT|MIN|MAX)\s*\(/i.test(expr)) {
      const matched = expr.match(/\b(SUM|AVERAGE|COUNT|DISTINCTCOUNT|MIN|MAX)\b/i)?.[0]?.toUpperCase();
      if (matched) {
        padroesDetectados.push(`Agregação (${matched})`);
      }
      conteudoPedagogico.push({
        id: 'ped-agregacao',
        conceito: 'Medidas Explícitas vs Cálculos Implícitos',
        oQueE:
          'Medidas explícitas são fórmulas DAX declaradas formalmente pelo analista, em oposição a arrastar uma coluna bruta para o visual.',
        porQueImporta:
          'Garantem consistência em todo o relatório, facilitam a reutilização em outras medidas compostas e permitem controle auditável do formato numérico.',
        comoEstaSendoUsado:
          'Você está criando uma agregação explícita padronizada para este indicador.',
        dicaProfissional:
          'Prefira referenciar a coluna explicitamente com sua tabela: Tabela[Coluna], e nunca apenas [Coluna], para distinguir colunas de medidas.',
      });
    }

    // 4.5 Time Intelligence
    if (
      /\b(SAMEPERIODLASTYEAR|DATEADD|DATESYTD|TOTALYTD|PARALLELPERIOD|DATESMTD|DATESQTD)\s*\(/i.test(
        expr
      )
    ) {
      padroesDetectados.push('Time Intelligence');
      conteudoPedagogico.push({
        id: 'ped-time-intelligence',
        conceito: 'Inteligência Temporal (Time Intelligence)',
        oQueE:
          'Conjunto de funções DAX para cálculos comparativos sobre o tempo (YoY, MoM, YTD, MTD, etc.).',
        porQueImporta:
          'Permitem comparações imediatas de tendência e crescimento temporal sem necessidade de subconsultas complexas.',
        comoEstaSendoUsado:
          'Sua fórmula aplica padrões de inteligência temporal para comparar períodos.',
        dicaProfissional:
          'Funções de Time Intelligence exigem obrigatoriamente uma Tabela Calendário dedicada, com datas contínuas sem lacunas e marcada formalmente como Tabela de Data.',
      });
    }

    // 5. Linhagem com Métrica Homologada da Aba 6
    if (metricaHomologadaNome) {
      conteudoPedagogico.push({
        id: 'ped-linhagem-metrica',
        conceito: 'Rastreabilidade Semântica (Métrica -> DAX)',
        oQueE:
          'Conexão formal entre a métrica de negócio aprovada na modelagem analítica e a implementação técnica em DAX.',
        porQueImporta:
          'Atende às regras D-02 e D-03 de governança, assegurando que nenhum KPI acordado com o cliente fique sem implementação.',
        comoEstaSendoUsado:
          `Esta medida está vinculada à métrica homologada "${metricaHomologadaNome}".`,
        dicaProfissional:
          'Mantenha a descrição funcional da medida alinhada à regra de negócio estipulada no dicionário da modelagem dimensional.',
      });
    }

    const bloqueiosCount = diagnosticos.filter((d) => d.severidade === 'BLOQUEIO').length;
    const alertasCount = diagnosticos.filter((d) => d.severidade === 'ALERTA_CRITICO').length;
    const recomendacoesCount = diagnosticos.filter((d) => d.severidade === 'RECOMENDACAO').length;

    return {
      diagnosticos,
      bloqueiosCount,
      alertasCount,
      recomendacoesCount,
      isSintaxeValidaLocalmente: bloqueiosCount === 0,
      padroesDetectados,
      referenciasDetectadas: {
        tabelas: Array.from(tabelasDetectadas),
        colunas: Array.from(colunasDetectadas),
        medidas: Array.from(medidasDetectadas),
      },
      conteudoPedagogico,
      avisoEpistemico: this.AVISO_EPISTEMICO,
    };
  }
}
