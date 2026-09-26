import * as fflate from 'fflate';

export interface PlanilhaDef {
  nome: string;
  linhas: Array<Array<string | number | boolean | Date>>;
}

/**
 * Converte índice de coluna 0-based em letra Excel (0 -> A, 1 -> B, 26 -> AA, etc.)
 */
function colunaParaLetra(indice: number): string {
  let temp = indice;
  let letra = '';
  while (temp >= 0) {
    letra = String.fromCharCode((temp % 26) + 65) + letra;
    temp = Math.floor(temp / 26) - 1;
  }
  return letra;
}

/**
 * Constrói um arquivo .xlsx sintético válido em memória usando fflate.
 */
export function criarXlsxSintetico(planilhas: PlanilhaDef[]): Buffer {
  const zipFiles: Record<string, Uint8Array> = {};

  // 1. [Content_Types].xml
  let sheetOverrides = '';
  for (let i = 0; i < planilhas.length; i++) {
    sheetOverrides += `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
  }
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${sheetOverrides}
</Types>`;
  zipFiles['[Content_Types].xml'] = fflate.strToU8(contentTypesXml);

  // 2. _rels/.rels
  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
  zipFiles['_rels/.rels'] = fflate.strToU8(relsXml);

  // 3. xl/workbook.xml & xl/_rels/workbook.xml.rels
  let sheetsXml = '';
  let wbRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`;

  for (let i = 0; i < planilhas.length; i++) {
    const id = `rId${i + 1}`;
    sheetsXml += `<sheet name="${planilhas[i].nome}" sheetId="${i + 1}" r:id="${id}"/>`;
    wbRelsXml += `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`;
  }
  wbRelsXml += '</Relationships>';

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${sheetsXml}
  </sheets>
</workbook>`;

  zipFiles['xl/workbook.xml'] = fflate.strToU8(workbookXml);
  zipFiles['xl/_rels/workbook.xml.rels'] = fflate.strToU8(wbRelsXml);

  // 4. xl/worksheets/sheetN.xml
  for (let p = 0; p < planilhas.length; p++) {
    const planilha = planilhas[p];
    let rowsXml = '';

    for (let r = 0; r < planilha.linhas.length; r++) {
      const rowData = planilha.linhas[r];
      let cellsXml = '';

      for (let c = 0; c < rowData.length; c++) {
        const ref = `${colunaParaLetra(c)}${r + 1}`;
        const val = rowData[c];

        if (typeof val === 'number') {
          cellsXml += `<c r="${ref}"><v>${val}</v></c>`;
        } else if (typeof val === 'boolean') {
          cellsXml += `<c r="${ref}" t="b"><v>${val ? 1 : 0}</v></c>`;
        } else if (val instanceof Date) {
          cellsXml += `<c r="${ref}" t="inlineStr"><is><t>${val.toISOString().split('T')[0]}</t></is></c>`;
        } else {
          // String
          const safeStr = String(val ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          cellsXml += `<c r="${ref}" t="inlineStr"><is><t>${safeStr}</t></is></c>`;
        }
      }

      rowsXml += `<row r="${r + 1}">${cellsXml}</row>`;
    }

    const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${rowsXml}
  </sheetData>
</worksheet>`;

    zipFiles[`xl/worksheets/sheet${p + 1}.xml`] = fflate.strToU8(sheetXml);
  }

  const zipped = fflate.zipSync(zipFiles);
  return Buffer.from(zipped);
}
