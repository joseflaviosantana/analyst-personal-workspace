import { describe, it, expect } from "vitest";
import {
  TmdlMeasureSerializer,
  ParsedTmdlMeasure,
} from "@/core/domain/tmdl/tmdl-measure-serializer";
import { MedidaDax } from "@/core/domain/entities/medida-dax";
import { CategoriaMedidaDax } from "@/core/domain/enums/categoria-medida-dax";

describe("TmdlMeasureSerializer — Interoperabilidade PBIP/TMDL", () => {
  const medidaSimples: MedidaDax = {
    id: "m-01",
    modelo_powerbi_id: "pbi-01",
    metrica_analitica_id: "met-01",
    nome: "Total Vendas",
    tabela_hospedeira: "_Medidas",
    expressao_dax: "SUM(FatoVendas[valor_venda])",
    descricao: "Faturamento bruto total do período",
    formato_string: "R$ #,##0.00",
    categoria_dax: CategoriaMedidaDax.AGREGACAO_SIMPLES,
    ordem: 1,
    criado_em: "2026-09-30T10:00:00Z",
    atualizado_em: "2026-09-30T10:00:00Z",
  };

  const medidaMultilinha: MedidaDax = {
    id: "m-02",
    modelo_powerbi_id: "pbi-01",
    metrica_analitica_id: "met-02",
    nome: "Margem Percentual",
    tabela_hospedeira: "_Medidas",
    expressao_dax: `VAR _Receita = [Total Vendas]
VAR _Custo = [Custo Total]
RETURN
DIVIDE(_Receita - _Custo, _Receita, 0)`,
    descricao: "Margem percentual de lucro operacional",
    formato_string: "0.0%",
    categoria_dax: CategoriaMedidaDax.TAXA_DIVISAO,
    ordem: 2,
    criado_em: "2026-09-30T10:00:00Z",
    atualizado_em: "2026-09-30T10:00:00Z",
  };

  const medidaComAspas: MedidaDax = {
    id: "m-03",
    modelo_powerbi_id: "pbi-01",
    metrica_analitica_id: null,
    nome: "Vendas 'Classe A'",
    tabela_hospedeira: "_KPIs",
    expressao_dax: "CALCULATE([Total Vendas], Clientes[Classe] = \"A\")",
    descricao: "Total de vendas com filtro de 'Classe A' e aspas duplas",
    formato_string: "#,##0",
    categoria_dax: CategoriaMedidaDax.CALCULATE_MODIFICADOR,
    ordem: 3,
    criado_em: "2026-09-30T10:00:00Z",
    atualizado_em: "2026-09-30T10:00:00Z",
  };

  // =========================================================================
  // Serialização TMDL
  // =========================================================================
  describe("Serialização TMDL", () => {
    it("deve serializar uma medida simples em uma linha com propriedades indentadas", () => {
      const tmdl = TmdlMeasureSerializer.serializeMeasure(medidaSimples);

      expect(tmdl).toContain("\tmeasure 'Total Vendas' = SUM(FatoVendas[valor_venda])");
      expect(tmdl).toContain("\t\tformatString: R$ #,##0.00");
      expect(tmdl).toContain('\t\tdescription: "Faturamento bruto total do período"');
    });

    it("deve serializar medida multilinha indentando as linhas da expressão", () => {
      const tmdl = TmdlMeasureSerializer.serializeMeasure(medidaMultilinha);

      expect(tmdl).toContain("\tmeasure 'Margem Percentual' = ");
      expect(tmdl).toContain("\t\t\tVAR _Receita = [Total Vendas]");
      expect(tmdl).toContain("\t\t\tVAR _Custo = [Custo Total]");
      expect(tmdl).toContain("\t\t\tRETURN");
      expect(tmdl).toContain("\t\t\tDIVIDE(_Receita - _Custo, _Receita, 0)");
      expect(tmdl).toContain("\t\tformatString: 0.0%");
    });

    it("deve escapar aspas simples internas no nome da medida duplicando-as", () => {
      const nomeFormatado = TmdlMeasureSerializer.formatMeasureName("Vendas 'Classe A'");
      expect(nomeFormatado).toBe("'Vendas ''Classe A'''");

      const tmdl = TmdlMeasureSerializer.serializeMeasure(medidaComAspas);
      expect(tmdl).toContain("\tmeasure 'Vendas ''Classe A''' = ");
    });

    it("deve serializar uma tabela completa com cabeçalho 'table <nome>' e medidas separadas", () => {
      const tmdl = TmdlMeasureSerializer.serializeTableWithMeasures("_Medidas", [
        medidaSimples,
        medidaMultilinha,
      ]);

      expect(tmdl.startsWith("table _Medidas")).toBe(true);
      expect(tmdl).toContain("measure 'Total Vendas' = ");
      expect(tmdl).toContain("measure 'Margem Percentual' = ");
    });

    it("deve agrupar e serializar múltiplas tabelas automaticamente", () => {
      const all = [medidaSimples, medidaMultilinha, medidaComAspas];
      const tmdl = TmdlMeasureSerializer.serializeAllMeasuresGrouped(all);

      expect(tmdl).toContain("table _Medidas");
      expect(tmdl).toContain("table _KPIs");
      expect(tmdl).toContain("measure 'Total Vendas'");
      expect(tmdl).toContain("measure 'Vendas ''Classe A'''");
    });
  });

  // =========================================================================
  // Parsing TMDL
  // =========================================================================
  describe("Parsing TMDL", () => {
    it("deve parsear texto TMDL e extrair medidas com tipos e propriedades corretas", () => {
      const tmdlRaw = `
table _Medidas

\tmeasure 'Receita Total' = SUM(FatoVendas[valor_venda])
\t\tformatString: #,##0.00
\t\tdescription: "Receita realizada acumulada"

\tmeasure QtdPedidos = COUNTROWS(FatoVendas)
\t\tformatString: #,##0
`;
      const parsed = TmdlMeasureSerializer.parseTmdlMeasures(tmdlRaw);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].nome).toBe("Receita Total");
      expect(parsed[0].tabela_hospedeira).toBe("_Medidas");
      expect(parsed[0].expressao_dax).toBe("SUM(FatoVendas[valor_venda])");
      expect(parsed[0].formato_string).toBe("#,##0.00");
      expect(parsed[0].descricao).toBe("Receita realizada acumulada");

      expect(parsed[1].nome).toBe("QtdPedidos");
      expect(parsed[1].expressao_dax).toBe("COUNTROWS(FatoVendas)");
      expect(parsed[1].formato_string).toBe("#,##0");
    });

    it("deve desformatar corretamente identificadores com aspas simples escapadas", () => {
      const unformatted = TmdlMeasureSerializer.unformatMeasureName("'Vendas ''Classe A'''");
      expect(unformatted).toBe("Vendas 'Classe A'");
    });

    it("deve parsear expressões multilinhas reconstruindo a fórmula", () => {
      const tmdlRaw = `
table _Medidas

\tmeasure 'Calculo Complexo' =
\t\t\tVAR X = 1
\t\t\tVAR Y = 2
\t\t\tRETURN
\t\t\tX + Y
\t\tformatString: 0
`;
      const parsed = TmdlMeasureSerializer.parseTmdlMeasures(tmdlRaw);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].nome).toBe("Calculo Complexo");
      expect(parsed[0].expressao_dax).toContain("VAR X = 1");
      expect(parsed[0].expressao_dax).toContain("RETURN");
      expect(parsed[0].expressao_dax).toContain("X + Y");
      expect(parsed[0].formato_string).toBe("0");
    });

    it("deve ignorar com segurança propriedades não suportadas (como displayFolder)", () => {
      const tmdlRaw = `
table _Medidas

\tmeasure Lucro = [Receita] - [Custo]
\t\tdisplayFolder: "Financeiro\\Subpasta"
\t\tformatString: Currency
`;
      const parsed = TmdlMeasureSerializer.parseTmdlMeasures(tmdlRaw);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].nome).toBe("Lucro");
      expect(parsed[0].expressao_dax).toBe("[Receita] - [Custo]");
      expect(parsed[0].formato_string).toBe("Currency");
    });

    it("deve retornar lista vazia para strings em branco ou inválidas", () => {
      expect(TmdlMeasureSerializer.parseTmdlMeasures("")).toEqual([]);
      expect(TmdlMeasureSerializer.parseTmdlMeasures("   \n\n  ")).toEqual([]);
    });
  });

  // =========================================================================
  // Round-trip (Workspace -> TMDL -> Parse -> Equivalência)
  // =========================================================================
  describe("Garantia de Round-Trip", () => {
    it("deve garantir round-trip perfeito para medidas simples e multilinhas", () => {
      const medidasOriginais = [medidaSimples, medidaMultilinha, medidaComAspas];

      // 1. Serializa para TMDL
      const tmdlGerado = TmdlMeasureSerializer.serializeAllMeasuresGrouped(medidasOriginais);

      // 2. Faz o parsing do TMDL de volta
      const medidasParseadas: ParsedTmdlMeasure[] =
        TmdlMeasureSerializer.parseTmdlMeasures(tmdlGerado);

      // 3. Compara estruturalmente
      expect(medidasParseadas).toHaveLength(medidasOriginais.length);

      for (let i = 0; i < medidasOriginais.length; i++) {
        const orig = medidasOriginais[i];
        const parsed = medidasParseadas.find((p) => p.nome === orig.nome);

        expect(parsed).toBeDefined();
        expect(parsed?.nome).toBe(orig.nome);
        expect(parsed?.tabela_hospedeira).toBe(orig.tabela_hospedeira);
        expect(parsed?.formato_string).toBe(orig.formato_string);
        expect(parsed?.descricao).toBe(orig.descricao);

        // A expressão DAX normalizada por linhas
        const origExprNorm = orig.expressao_dax.replace(/\r?\n/g, "\n").trim();
        const parsedExprNorm = parsed?.expressao_dax.replace(/\r?\n/g, "\n").trim();
        expect(parsedExprNorm).toBe(origExprNorm);
      }
    });
  });
});
