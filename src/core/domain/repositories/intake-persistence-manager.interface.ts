/**
 * src/core/domain/repositories/intake-persistence-manager.interface.ts
 *
 * Contrato de persistência transacional atômica para Intake Inteligente.
 * Assegura que Projeto + Demanda + Perguntas Preliminares + Trilha de Auditoria
 * sejam comitados em uma única unidade lógica no banco SQLite.
 */

export type IntakeTestFailureStep = 'PROJECT' | 'DEMAND' | 'QUESTIONS' | 'REQUIREMENTS' | 'AUDIT';

export interface IntakePersistenceHooks {
  failAtStep?: IntakeTestFailureStep;
}

export interface PersistIntakeSubmissionData {
  solicitacaoOriginal: string;
  projetoDecisao: 'NOVO' | 'EXISTENTE';
  novoProjeto?: {
    nome: string;
    descricao?: string | null;
  } | null;
  projetoIdExistente?: string | null;
  demanda: {
    titulo: string;
    contexto?: string | null;
    objetivo_inicial?: string | null;
    prazo_esperado?: string | null;
    restricoes_declaradas?: string | null;
  };
  perguntasPreliminares?: Array<{
    id?: string;
    pergunta: string;
    motivacao?: string | null;
    bloqueante?: boolean;
    aceita?: boolean;
  }>;
  requisitosPropostos?: Array<{
    id?: string;
    titulo: string;
    descricao?: string | null;
    categoria: string;
    prioridade: 'OBRIGATORIO' | 'DESEJAVEL';
  }>;
  intakeSnapshot?: string | null;
}

export interface PersistIntakeSubmissionResult {
  projeto: {
    id: string;
    nome: string;
    isNovo: boolean;
  };
  demanda: {
    id: string;
    projeto_id: string;
    titulo: string;
    solicitacao_bruta: string;
    estado: string;
    criado_em: string;
  };
  perguntasCriadasCount: number;
  requisitosCriadosCount: number;
  auditId: string;
}

export interface IIntakePersistenceManager {
  persistAtomicSubmission(
    data: PersistIntakeSubmissionData,
    hooks?: IntakePersistenceHooks
  ): Promise<PersistIntakeSubmissionResult>;
}
