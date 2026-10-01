/**
 * Serializador e Parser de Medidas DAX em formato TMDL (Tabular Model Definition Language)
 * (V1 — Subunidade 3.7 / Bloco 7)
 *
 * Suporte a interoperabilidade PBIP/TMDL:
 * - Serialização determinística de medidas DAX em sintaxe TMDL.
 * - Parsing e importação do subconjunto formalmente suportado (medidas, expressões, formatString e description).
 * - Garantia de round-trip: MedidaDax -> TMDL -> ParsedTmdlMeasure -> equivalência estrutural.
 *
 * Limitações deliberadas:
 * - Não manipula arquivos binários .pbix.
 * - Não interpreta calculation groups, partições M nem anotações complexas de modelo.
 */

import { MedidaDax } from "@/core/domain/entities/medida-dax";

export interface ParsedTmdlMeasure {
  nome: string;
  tabela_hospedeira: string;
  expressao_dax: string;
  formato_string?: string;
  descricao?: string;
}

export interface TmdlSerializationOptions {
  indent?: string; // padrão: '\t'
}

export class TmdlMeasureSerializer {
  private static readonly DEFAULT_INDENT = "\t";

  /**
   * Escapa e formata o identificador do nome da medida para TMDL.
   * Se contiver espaços, aspas ou caracteres especiais, envolve em aspas simples e duplica aspas internas.
   */
  public static formatMeasureName(nome: string): string {
    const trimmed = nome.trim();
    const precisaAspas = /[\s'"`!@#$%^&*()+\-=[\]{};:,.<>?/\\]/.test(trimmed) || trimmed.length === 0;
    if (precisaAspas) {
      const escapado = trimmed.replace(/'/g, "''");
      return `'${escapado}'`;
    }
    return trimmed;
  }

  /**
   * Desfaz o escape de um identificador TMDL (ex: "'Total ''Vendas'''" -> "Total 'Vendas'").
   */
  public static unformatMeasureName(raw: string): string {
    const trimmed = raw.trim();
    if (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2) {
      const semAspas = trimmed.slice(1, -1);
      return semAspas.replace(/''/g, "'");
    }
    return trimmed;
  }

  /**
   * Serializa uma única medida DAX para o bloco TMDL correspondente.
   */
  public static serializeMeasure(
    medida: MedidaDax,
    options?: TmdlSerializationOptions
  ): string {
    const indent = options?.indent ?? this.DEFAULT_INDENT;
    const measureIndent = indent;
    const propIndent = `${indent}${indent}`;
    const exprIndent = `${indent}${indent}${indent}`;

    const nomeFormatado = this.formatMeasureName(medida.nome);
    const expressao = (medida.expressao_dax ?? "").trim();
    const isMultiline = expressao.includes("\n");

    const lines: string[] = [];

    if (isMultiline) {
      lines.push(`${measureIndent}measure ${nomeFormatado} = `);
      const exprLines = expressao.split(/\r?\n/);
      for (const line of exprLines) {
        lines.push(`${exprIndent}${line.trim()}`);
      }
    } else {
      lines.push(`${measureIndent}measure ${nomeFormatado} = ${expressao}`);
    }

    // formatString
    if (medida.formato_string && medida.formato_string.trim().length > 0) {
      lines.push(`${propIndent}formatString: ${medida.formato_string.trim()}`);
    }

    // description
    if (medida.descricao && medida.descricao.trim().length > 0) {
      const descEscapada = JSON.stringify(medida.descricao.trim());
      lines.push(`${propIndent}description: ${descEscapada}`);
    }

    return lines.join("\n");
  }

  /**
   * Serializa uma tabela completa com suas respectivas medidas no formato TMDL.
   */
  public static serializeTableWithMeasures(
    tableName: string,
    measures: MedidaDax[],
    options?: TmdlSerializationOptions
  ): string {
    const lines: string[] = [];
    lines.push(`table ${tableName.trim()}`);
    lines.push("");

    for (let i = 0; i < measures.length; i++) {
      const m = measures[i];
      lines.push(this.serializeMeasure(m, options));
      if (i < measures.length - 1) {
        lines.push("");
      }
    }

    return lines.join("\n");
  }

  /**
   * Serializa múltiplas tabelas agrupadas por sua 'tabela_hospedeira'.
   */
  public static serializeAllMeasuresGrouped(
    measures: MedidaDax[],
    options?: TmdlSerializationOptions
  ): string {
    const grouped = new Map<string, MedidaDax[]>();
    for (const m of measures) {
      const table = m.tabela_hospedeira?.trim() || "_Medidas";
      if (!grouped.has(table)) {
        grouped.set(table, []);
      }
      grouped.get(table)!.push(m);
    }

    const blocks: string[] = [];
    for (const [tableName, tableMeasures] of grouped.entries()) {
      blocks.push(this.serializeTableWithMeasures(tableName, tableMeasures, options));
    }

    return blocks.join("\n\n");
  }

  /**
   * Realiza o parsing de texto TMDL e extrai as medidas declaradas com suas propriedades.
   */
  public static parseTmdlMeasures(
    tmdlContent: string,
    defaultTableName: string = "_Medidas"
  ): ParsedTmdlMeasure[] {
    const results: ParsedTmdlMeasure[] = [];
    if (!tmdlContent || tmdlContent.trim().length === 0) {
      return results;
    }

    const lines = tmdlContent.split(/\r?\n/);
    let currentTable = defaultTableName;

    let currentMeasureName: string | null = null;
    let currentExpressionLines: string[] = [];
    let currentFormatString: string | undefined = undefined;
    let currentDescription: string | undefined = undefined;

    const commitCurrentMeasure = () => {
      if (currentMeasureName !== null) {
        results.push({
          nome: currentMeasureName,
          tabela_hospedeira: currentTable,
          expressao_dax: currentExpressionLines.join("\n").trim(),
          formato_string: currentFormatString,
          descricao: currentDescription,
        });
      }
      currentMeasureName = null;
      currentExpressionLines = [];
      currentFormatString = undefined;
      currentDescription = undefined;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.length === 0) {
        continue;
      }

      // 1. Detectar declaração de tabela: "table <Nome>"
      if (trimmed.startsWith("table ") && !trimmed.includes("=")) {
        commitCurrentMeasure();
        currentTable = trimmed.slice(6).trim();
        continue;
      }

      // 2. Detectar declaração de medida: "measure <Identificador> = [Expressao]"
      if (trimmed.startsWith("measure ")) {
        commitCurrentMeasure();

        const rest = trimmed.slice(8).trim();
        // Separar nome do "="
        const eqIdx = rest.indexOf("=");
        if (eqIdx !== -1) {
          const rawName = rest.slice(0, eqIdx).trim();
          currentMeasureName = this.unformatMeasureName(rawName);

          const afterEq = rest.slice(eqIdx + 1).trim();
          if (afterEq.length > 0) {
            currentExpressionLines.push(afterEq);
          }
        } else {
          // Linha malformada sem "="
          currentMeasureName = this.unformatMeasureName(rest);
        }
        continue;
      }

      // Se estamos dentro de uma medida
      if (currentMeasureName !== null) {
        // Propriedade formatString: <valor>
        if (trimmed.startsWith("formatString:")) {
          currentFormatString = trimmed.slice(13).trim();
          continue;
        }

        // Propriedade description: "<valor>"
        if (trimmed.startsWith("description:")) {
          const rawDesc = trimmed.slice(12).trim();
          if (rawDesc.startsWith('"') && rawDesc.endsWith('"')) {
            try {
              currentDescription = JSON.parse(rawDesc);
            } catch {
              currentDescription = rawDesc.slice(1, -1);
            }
          } else {
            currentDescription = rawDesc;
          }
          continue;
        }

        // Outras propriedades filhas conhecidas de TMDL ignoradas com segurança (ex: displayFolder:)
        if (/^[a-zA-Z0-9_]+:/.test(trimmed)) {
          continue;
        }

        // Linha de continuação da expressão DAX
        currentExpressionLines.push(trimmed);
      }
    }

    commitCurrentMeasure();
    return results;
  }
}
