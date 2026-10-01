/**
 * src/core/domain/dashboard-design/design-tokens.ts
 *
 * Fundação do Premium Dashboard Design System (Subgate 3.4D)
 *
 * Tokens e contratos de design desacoplados de qualquer ferramenta proprietária.
 *
 * Princípio Fundamental:
 * DASHBOARD BONITO != DASHBOARD BOM.
 * O design system prioriza legibilidade, precisão analítica, hierarquia de informação,
 * contraste acessível e redução de ruído visual.
 */

export interface GridTokens {
  aspectRatio: '16:9' | '4:3' | 'custom';
  baseWidth: number;
  baseHeight: number;
  columns: number;
  margin: number;
  gutter: number;
}

export interface SpacingTokens {
  xs: number; // 4px
  sm: number; // 8px
  md: number; // 12px
  lg: number; // 16px
  xl: number; // 24px
  xxl: number; // 32px
}

export interface TypographyTokens {
  fontFamilySans: string;
  fontFamilyMono: string;
  displayKpi: { fontSize: number; lineHeight: number; fontWeight: string };
  headingPage: { fontSize: number; lineHeight: number; fontWeight: string };
  headingSection: { fontSize: number; lineHeight: number; fontWeight: string };
  titleVisual: { fontSize: number; lineHeight: number; fontWeight: string };
  bodyRegular: { fontSize: number; lineHeight: number; fontWeight: string };
  captionSecondary: { fontSize: number; lineHeight: number; fontWeight: string };
}

export interface SurfaceTokens {
  cardRadius: number; // 8px
  cardPadding: number; // 16px
  cardElevation: string;
  borderSubtle: string;
  backgroundCanvas: string;
  backgroundCard: string;
  backgroundHeader: string;
}

export interface ColorPaletteTokens {
  neutral: {
    canvas: string;
    card: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
  };
  accent: {
    primary: string;
    secondary: string;
    positive: string;
    negative: string;
    warning: string;
    neutralMetric: string;
  };
  dataSeries: string[];
}

export interface DashboardDesignSystemTokens {
  grid: GridTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  surface: SurfaceTokens;
  palette: ColorPaletteTokens;
}

/**
 * Tema Padrão: Professional Dark Analytics (16:9 Widescreen)
 */
export const DEFAULT_PREMIUM_DESIGN_TOKENS: DashboardDesignSystemTokens = {
  grid: {
    aspectRatio: '16:9',
    baseWidth: 1280,
    baseHeight: 720,
    columns: 12,
    margin: 24,
    gutter: 16,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  typography: {
    fontFamilySans: 'Inter, system-ui, -apple-system, sans-serif',
    fontFamilyMono: 'JetBrains Mono, Menlo, monospace',
    displayKpi: { fontSize: 32, lineHeight: 36, fontWeight: '700' },
    headingPage: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
    headingSection: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
    titleVisual: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
    bodyRegular: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
    captionSecondary: { fontSize: 10, lineHeight: 14, fontWeight: '400' },
  },
  surface: {
    cardRadius: 8,
    cardPadding: 16,
    cardElevation: '0 2px 4px rgba(0, 0, 0, 0.25)',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    backgroundCanvas: '#0b0f19',
    backgroundCard: '#111827',
    backgroundHeader: '#0f172a',
  },
  palette: {
    neutral: {
      canvas: '#0b0f19',
      card: '#111827',
      border: 'rgba(255, 255, 255, 0.08)',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
    },
    accent: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      positive: '#10b981',
      negative: '#ef4444',
      warning: '#f59e0b',
      neutralMetric: '#6366f1',
    },
    dataSeries: [
      '#3b82f6', // Azul analítico
      '#10b981', // Verde esmeralda
      '#8b5cf6', // Roxo moderno
      '#f59e0b', // Âmbar / Alerta
      '#06b6d4', // Ciano
      '#ec4899', // Rosa
    ],
  },
};
