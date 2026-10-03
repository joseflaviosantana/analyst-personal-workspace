import { eq } from 'drizzle-orm';
import { db } from '../client';
import { projetos, demandas, perguntasClarificacao, requisitosDemanda, trilhaAuditoria } from '../schema';
import {
  IIntakePersistenceManager,
  IntakePersistenceHooks,
  PersistIntakeSubmissionData,
  PersistIntakeSubmissionResult,
} from '@/core/domain/repositories/intake-persistence-manager.interface';
import { generateId } from '@/lib/id-generator';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { StatusPerguntaClarificacao } from '@/core/domain/enums/status-pergunta-clarificacao';
import { StatusRequisito } from '@/core/domain/enums/status-requisito';

/**
 * Implementação SQLite transacional atômica para Intake Inteligente.
 *
 * Garante que Projeto (novo ou verificação de existente) + Demanda + Perguntas Preliminares + Trilha de Auditoria
 * sejam persistidos como uma única unidade lógica e indivisível.
 *
 * Se qualquer operação falhar (inclusive auditoria), o SQLite desfaz 100% das mutações via ROLLBACK.
 */
export class SqliteIntakePersistenceManager implements IIntakePersistenceManager {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  async persistAtomicSubmission(
    data: PersistIntakeSubmissionData,
    hooks?: IntakePersistenceHooks
  ): Promise<PersistIntakeSubmissionResult> {
    // Execução síncrona dentro de db.transaction para compatibilidade estrita com better-sqlite3
    const result = this.database.transaction((tx) => {
      const nowIso = new Date().toISOString();

      // 1. Resolução do Projeto (Novo vs Existente)
      let projetoId: string;
      let projetoNome: string;
      let isNovo = false;

      if (data.projetoDecisao === 'NOVO') {
        if (hooks?.failAtStep === 'PROJECT') {
          throw new Error('[SIMULATED_FAILURE] Falha induzida na criação do Projeto durante Intake.');
        }

        if (!data.novoProjeto || !data.novoProjeto.nome || data.novoProjeto.nome.trim().length < 3) {
          throw new Error('Para criar um novo projeto, o nome deve conter no mínimo 3 caracteres.');
        }

        projetoId = generateId('proj');
        projetoNome = data.novoProjeto.nome.trim();

        tx.insert(projetos)
          .values({
            id: projetoId,
            nome: projetoNome,
            descricao: data.novoProjeto.descricao?.trim() || null,
            status: 'ATIVO',
            data_inicio: null,
            data_conclusao_prevista: null,
            data_conclusao_real: null,
            criado_em: nowIso,
            atualizado_em: nowIso,
          })
          .run();

        isNovo = true;
      } else {
        // Opção B: Vincular a Projeto existente
        if (!data.projetoIdExistente || data.projetoIdExistente.trim().length === 0) {
          throw new Error('ID do projeto existente não informado.');
        }

        const projId = data.projetoIdExistente.trim();
        const projetoExistente = tx
          .select()
          .from(projetos)
          .where(eq(projetos.id, projId))
          .get();

        if (!projetoExistente) {
          throw new Error(`Projeto com ID '${projId}' não foi encontrado.`);
        }

        projetoId = projetoExistente.id;
        projetoNome = projetoExistente.nome;
      }

      // 2. Criação da Demanda
      if (hooks?.failAtStep === 'DEMAND') {
        throw new Error('[SIMULATED_FAILURE] Falha induzida na criação da Demanda durante Intake.');
      }

      const demandaId = generateId('dem');

      // Preservação epistêmica: solicitacaoOriginal é inserida estritamente verbatim, sem trim ou alteração
      tx.insert(demandas)
        .values({
          id: demandaId,
          projeto_id: projetoId,
          titulo: data.demanda.titulo.trim(),
          solicitacao_bruta: data.solicitacaoOriginal,
          contexto: data.demanda.contexto?.trim() || null,
          objetivo_inicial: data.demanda.objetivo_inicial?.trim() || null,
          prazo_esperado: data.demanda.prazo_esperado || null,
          restricoes_declaradas: data.demanda.restricoes_declaradas?.trim() || null,
          estado: EstadoDemanda.NOVA,
          estado_anterior: null,
          intake_snapshot: data.intakeSnapshot || null,
          criado_em: nowIso,
          atualizado_em: nowIso,
          data_conclusao: null,
        })
        .run();

      // 3. Perguntas Preliminares (Apenas aceitas/selecionadas entram como RASCUNHO)
      if (hooks?.failAtStep === 'QUESTIONS') {
        throw new Error('[SIMULATED_FAILURE] Falha induzida na criação das Perguntas durante Intake.');
      }

      const perguntasAceitas = (data.perguntasPreliminares || []).filter(
        (p) => p.aceita !== false
      );

      for (const p of perguntasAceitas) {
        const perguntaId = p.id || generateId('perg');
        tx.insert(perguntasClarificacao)
          .values({
            id: perguntaId,
            demanda_id: demandaId,
            requisito_id: null,
            pergunta: p.pergunta.trim(),
            motivacao: p.motivacao?.trim() || null,
            bloqueante: Boolean(p.bloqueante),
            status: StatusPerguntaClarificacao.RASCUNHO,
            enviada_em: null,
            resposta: null,
            respondido_por: null,
            respondida_em: null,
            impacto_decisao: null,
            criado_em: nowIso,
            atualizado_em: nowIso,
          })
          .run();
      }

      // 3.5. Requisitos Propostos Identificados no Intake (status: IDENTIFICADO, origem: INTAKE)
      if (hooks?.failAtStep === 'REQUIREMENTS') {
        throw new Error('[SIMULATED_FAILURE] Falha induzida na criação dos Requisitos durante Intake.');
      }

      const requisitosPropostos = data.requisitosPropostos || [];
      for (const req of requisitosPropostos) {
        const reqId = req.id || generateId('req');
        tx.insert(requisitosDemanda)
          .values({
            id: reqId,
            demanda_id: demandaId,
            titulo: req.titulo.trim(),
            descricao: req.descricao?.trim() || null,
            categoria: req.categoria || 'METRICA_KPI',
            prioridade: req.prioridade || 'OBRIGATORIO',
            status: StatusRequisito.IDENTIFICADO,
            origem: 'INTAKE',
            criado_em: nowIso,
            atualizado_em: nowIso,
          })
          .run();
      }

      // 4. Registro Compulsório na Trilha de Auditoria com Proveniência INTAKE
      if (hooks?.failAtStep === 'AUDIT') {
        throw new Error('[SIMULATED_FAILURE] Falha induzida no registro de Auditoria durante Intake.');
      }

      // Auditoria da Demanda
      const auditDemandaId = generateId('aud');
      tx.insert(trilhaAuditoria)
        .values({
          id: auditDemandaId,
          demanda_id: demandaId,
          entidade: 'Demanda',
          entidade_id: demandaId,
          tipo_evento: 'CRIACAO',
          autor_tipo: 'HUMANO',
          dados_anteriores: null,
          dados_novos: JSON.stringify({
            estado: EstadoDemanda.NOVA,
            titulo: data.demanda.titulo.trim(),
            origem: 'INTAKE',
            motor_analise: 'TIER_1_LOCAL',
            decisao_projeto: data.projetoDecisao,
            projeto_id: projetoId,
            projeto_nome: projetoNome,
            projeto_novo: isNovo,
            perguntas_rascunho_count: perguntasAceitas.length,
            requisitos_propostos_count: requisitosPropostos.length,
            tem_intake_snapshot: Boolean(data.intakeSnapshot),
            solicitacao_bruta_bytes: Buffer.byteLength(data.solicitacaoOriginal, 'utf8'),
          }),
          justificativa:
            'Criação e materialização da demanda originada via Intake Inteligente com revisão e confirmação humana.',
          timestamp: nowIso,
        })
        .run();

      // Auditoria adicional se um Novo Projeto foi materializado nesta transação
      if (isNovo) {
        const auditProjetoId = generateId('aud');
        tx.insert(trilhaAuditoria)
          .values({
            id: auditProjetoId,
            demanda_id: demandaId,
            entidade: 'Projeto',
            entidade_id: projetoId,
            tipo_evento: 'CRIACAO',
            autor_tipo: 'HUMANO',
            dados_anteriores: null,
            dados_novos: JSON.stringify({
              nome: projetoNome,
              origem: 'INTAKE',
              motor_analise: 'TIER_1_LOCAL',
              demanda_inicial_id: demandaId,
            }),
            justificativa:
              'Criação de novo projeto originado via Intake Inteligente com revisão e confirmação humana.',
            timestamp: nowIso,
          })
          .run();
      }

      return {
        projeto: {
          id: projetoId,
          nome: projetoNome,
          isNovo,
        },
        demanda: {
          id: demandaId,
          projeto_id: projetoId,
          titulo: data.demanda.titulo.trim(),
          solicitacao_bruta: data.solicitacaoOriginal,
          estado: EstadoDemanda.NOVA,
          criado_em: nowIso,
        },
        perguntasCriadasCount: perguntasAceitas.length,
        requisitosCriadosCount: requisitosPropostos.length,
        auditId: auditDemandaId,
      };
    });

    return result;
  }
}
