/**
 * src/core/domain/evidence-events/engine-factory.ts
 *
 * Fábrica Canônica para inicialização do EvidenceEventEngine com todas as estratégias padrão registradas.
 */

import { EvidenceEventEngine } from './evidence-event-engine';
import { QualidadeRegraStrategy } from './default-strategies/qualidade-regra-strategy';
import { DecisaoMetodologicaStrategy } from './default-strategies/decisao-metodologica-strategy';
import { EventoTecnicoIgnoradoStrategy } from './default-strategies/evento-tecnico-ignorado-strategy';
import { DadosAtivoStrategy } from './default-strategies/dados-ativo-strategy';
import { QualidadeDiagnosticoStrategy } from './default-strategies/qualidade-diagnostico-strategy';
import { QualidadeProblemaStrategy } from './default-strategies/qualidade-problema-strategy';
import { PreparacaoStrategy } from './default-strategies/preparacao-strategy';
import { ModelagemStrategy } from './default-strategies/modelagem-strategy';
import { DashboardStrategy } from './default-strategies/dashboard-strategy';
import { ValidacaoStrategy } from './default-strategies/validacao-strategy';

export function criarEvidenceEventEnginePadrao(): EvidenceEventEngine {
  return new EvidenceEventEngine([
    new QualidadeRegraStrategy(),
    new DecisaoMetodologicaStrategy(),
    new EventoTecnicoIgnoradoStrategy(),
    new DadosAtivoStrategy(),
    new QualidadeDiagnosticoStrategy(),
    new QualidadeProblemaStrategy(),
    new PreparacaoStrategy(),
    new ModelagemStrategy(),
    new DashboardStrategy(),
    new ValidacaoStrategy(),
  ]);
}
