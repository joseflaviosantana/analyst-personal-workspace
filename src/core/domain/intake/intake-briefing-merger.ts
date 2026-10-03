/**
 * src/core/domain/intake/intake-briefing-merger.ts
 *
 * Função pura para mesclagem assistida entre sugestões do Intake Snapshot e o Briefing Analítico.
 *
 * INVARIANTE INEGOCIÁVEL DE GOVERNANÇA:
 * 1. Dados humanos existentes têm precedência absoluta sobre sugestões do Intake.
 * 2. Nunca sobrescreve campos já preenchidos manualmente (valores não-vazios).
 * 3. Preenche estritamente campos vazios para os quais exista sugestão correspondente no snapshot.
 * 4. Operação pura, sem sincronização automática ou efeitos colaterais.
 */

export interface ValoresBriefingForm {
  contexto: string;
  objetivoInicial: string;
  periodoAnalise: string;
  granularidade: string;
  formatoEntrega: string;
  restricoesDeclaradas: string;
  prazoEsperado: string;
}

export interface ResultadoMesclagemBriefing {
  valores: ValoresBriefingForm;
  camposPreenchidos: string[];
}

interface IntakeSnapshotParseado {
  fatos?: {
    ativosDados?: string[];
    prazo?: string | null;
    periodo?: string | null;
    entregaveis?: string[];
    indicadores?: string[];
  };
  descobertasDados?: {
    dimensoes?: string[];
    itensFaltantesDados?: string[];
  };
  inferenciasCopiloto?: {
    dominioNegocio?: string;
    problemaAparente?: string;
    objetivoProvavel?: string;
    contexto?: string;
    indicadoresSugeridos?: Array<{ nome: string; descricao: string }>;
  };
}

/**
 * Mescla sugestões do Intake Snapshot em um formulário de Briefing, preservando
 * incondicionalmente todos os dados preenchidos manualmente pelo usuário.
 */
export function aplicarSugestoesIntakeNoBriefing(
  valoresAtuais: ValoresBriefingForm,
  intakeSnapshotRaw?: string | null
): ResultadoMesclagemBriefing {
  const valores: ValoresBriefingForm = { ...valoresAtuais };
  const camposPreenchidos: string[] = [];

  if (!intakeSnapshotRaw || typeof intakeSnapshotRaw !== 'string') {
    return { valores, camposPreenchidos };
  }

  let snapshot: IntakeSnapshotParseado;
  try {
    snapshot = JSON.parse(intakeSnapshotRaw) as IntakeSnapshotParseado;
    if (!snapshot || typeof snapshot !== 'object') {
      return { valores, camposPreenchidos };
    }
  } catch {
    return { valores, camposPreenchidos };
  }

  // 1. Período de Análise (Preenche apenas se vazio)
  if (
    (!valores.periodoAnalise || valores.periodoAnalise.trim().length === 0) &&
    snapshot.fatos?.periodo &&
    snapshot.fatos.periodo.trim().length > 0
  ) {
    valores.periodoAnalise = snapshot.fatos.periodo.trim();
    camposPreenchidos.push('Período de Análise');
  }

  // 2. Granularidade / Dimensões (Preenche apenas se vazio)
  if (
    (!valores.granularidade || valores.granularidade.trim().length === 0) &&
    Array.isArray(snapshot.descobertasDados?.dimensoes) &&
    snapshot.descobertasDados.dimensoes.length > 0
  ) {
    valores.granularidade = snapshot.descobertasDados.dimensoes
      .filter((d): d is string => typeof d === 'string' && d.trim().length > 0)
      .join(', ');
    if (valores.granularidade.length > 0) {
      camposPreenchidos.push('Granularidade');
    }
  }

  // 3. Formato de Entrega (Preenche apenas se vazio)
  if (
    (!valores.formatoEntrega || valores.formatoEntrega.trim().length === 0) &&
    Array.isArray(snapshot.fatos?.entregaveis) &&
    snapshot.fatos.entregaveis.length > 0
  ) {
    valores.formatoEntrega = snapshot.fatos.entregaveis
      .filter((e): e is string => typeof e === 'string' && e.trim().length > 0)
      .join(', ');
    if (valores.formatoEntrega.length > 0) {
      camposPreenchidos.push('Formato de Entrega');
    }
  }

  // 4. Prazo Esperado (Preenche apenas se vazio)
  if (
    (!valores.prazoEsperado || valores.prazoEsperado.trim().length === 0) &&
    snapshot.fatos?.prazo &&
    snapshot.fatos.prazo.trim().length > 0
  ) {
    valores.prazoEsperado = snapshot.fatos.prazo.trim();
    camposPreenchidos.push('Prazo Esperado');
  }

  // 5. Contexto (Preenche apenas se vazio)
  if (!valores.contexto || valores.contexto.trim().length === 0) {
    const contextoSugerido =
      snapshot.inferenciasCopiloto?.contexto?.trim() ||
      snapshot.inferenciasCopiloto?.problemaAparente?.trim();
    if (contextoSugerido && contextoSugerido.length > 0) {
      valores.contexto = contextoSugerido;
      camposPreenchidos.push('Contexto');
    }
  }

  // 6. Objetivo Inicial (Preenche apenas se vazio)
  if (
    (!valores.objetivoInicial || valores.objetivoInicial.trim().length === 0) &&
    snapshot.inferenciasCopiloto?.objetivoProvavel &&
    snapshot.inferenciasCopiloto.objetivoProvavel.trim().length > 0
  ) {
    valores.objetivoInicial = snapshot.inferenciasCopiloto.objetivoProvavel.trim();
    camposPreenchidos.push('Objetivo Inicial');
  }

  return { valores, camposPreenchidos };
}
