/**
 * src/core/domain/evidence-events/index.ts
 *
 * Exportação centralizada dos contratos e componentes do Evidence Event Engine (Subgate 3.5B.1).
 */

export * from './event-types';
export * from './snapshot-delta-types';
export * from './snapshot-delta-calculator';
export * from './event-strategy.interface';
export * from './evidence-event-engine';
export * from './default-strategies/qualidade-regra-strategy';
export * from './default-strategies/decisao-metodologica-strategy';
export * from './default-strategies/evento-tecnico-ignorado-strategy';
export * from './default-strategies/dados-ativo-strategy';
export * from './default-strategies/qualidade-diagnostico-strategy';
export * from './default-strategies/qualidade-problema-strategy';
export * from './default-strategies/preparacao-strategy';
export * from './default-strategies/modelagem-strategy';
export * from './engine-factory';
