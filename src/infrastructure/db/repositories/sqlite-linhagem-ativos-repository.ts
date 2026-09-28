import { eq } from 'drizzle-orm';
import { db } from '../client';
import {
  linhagemAtivos,
  ativosDados,
  datasetsAutorizados,
  diagnosticosQualidade,
  etapasTransformacao,
  receitasPreparacao,
  trilhaAuditoria,
} from '../schema';
import { LinhagemAtivos } from '@/core/domain/entities/linhagem-ativos';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { PapelEntradaLinhagem } from '@/core/domain/enums/papel-entrada-linhagem';
import { StatusEtapaTransformacao } from '@/core/domain/enums/status-etapa-transformacao';
import { StatusReceitaPreparacao } from '@/core/domain/enums/status-receita-preparacao';
import { normalizarFormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { normalizarStatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';
import { normalizarCategoriaAtivoDados, CategoriaAtivoDados } from '@/core/domain/enums/categoria-ativo-dados';
import {
  ILinhagemAtivosRepository,
  OrigemComPapel,
  RegistrarDerivacaoParams,
} from '@/core/domain/repositories/linhagem-ativos-repository.interface';

export class SqliteLinhagemAtivosRepository implements ILinhagemAtivosRepository {
  private database: typeof db;

  constructor(customDb?: typeof db) {
    this.database = customDb ?? db;
  }

  private mapAssetRow(row: typeof ativosDados.$inferSelect): AtivoDados {
    return {
      id: row.id,
      demanda_id: row.demanda_id,
      nome_arquivo: row.nome_arquivo,
      caminho_local: row.caminho_local,
      formato: normalizarFormatoArquivo(row.formato),
      origem: row.origem,
      descricao_conteudo: row.descricao_conteudo,
      granularidade: row.granularidade,
      periodo_inicio: row.periodo_inicio,
      periodo_fim: row.periodo_fim,
      versao: row.versao,
      substitui_ativo_id: row.substitui_ativo_id ?? null,
      tamanho_bytes: row.tamanho_bytes,
      total_linhas: row.total_linhas,
      total_colunas: row.total_colunas,
      hash_sha256: row.hash_sha256,
      status: normalizarStatusAtivoDados(row.status),
      categoria_ativo: normalizarCategoriaAtivoDados(row.categoria_ativo),
      schema_inferido: row.schema_inferido,
      data_recebimento: row.data_recebimento,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    };
  }

  private mapEdgeRow(row: typeof linhagemAtivos.$inferSelect): LinhagemAtivos {
    return {
      id: row.id,
      demanda_id: row.demanda_id,
      ativo_origem_id: row.ativo_origem_id,
      ativo_destino_id: row.ativo_destino_id,
      papel_entrada: row.papel_entrada as PapelEntradaLinhagem,
      etapa_transformacao_id: row.etapa_transformacao_id,
      criado_em: row.criado_em,
    };
  }

  private hasPath(fromId: string, toId: string, txDatabase?: any): boolean {
    const database = txDatabase ?? this.database;
    const visited = new Set<string>();
    const queue = [fromId];
    visited.add(fromId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === toId) return true;

      const outgoing = database
        .select({ destino: linhagemAtivos.ativo_destino_id })
        .from(linhagemAtivos)
        .where(eq(linhagemAtivos.ativo_origem_id, current))
        .all();

      for (const edge of outgoing) {
        if (!visited.has(edge.destino)) {
          visited.add(edge.destino);
          queue.push(edge.destino);
        }
      }
    }

    return false;
  }

  async registrarVinculo(vinculo: LinhagemAtivos): Promise<LinhagemAtivos> {
    if (vinculo.ativo_origem_id === vinculo.ativo_destino_id) {
      throw new Error(
        `Aresta de linhagem inválida: o ativo de origem não pode ser idêntico ao ativo de destino (${vinculo.ativo_origem_id}).`
      );
    }

    // Prevenção de ciclos no DAG: verifica se já existe caminho de destino para origem
    if (this.hasPath(vinculo.ativo_destino_id, vinculo.ativo_origem_id)) {
      throw new Error(
        `Ciclo detectado no grafo de linhagem: a aresta de ${vinculo.ativo_origem_id} para ${vinculo.ativo_destino_id} geraria uma dependência circular.`
      );
    }

    const now = new Date().toISOString();
    this.database
      .insert(linhagemAtivos)
      .values({
        id: vinculo.id,
        demanda_id: vinculo.demanda_id,
        ativo_origem_id: vinculo.ativo_origem_id,
        ativo_destino_id: vinculo.ativo_destino_id,
        papel_entrada: vinculo.papel_entrada,
        etapa_transformacao_id: vinculo.etapa_transformacao_id ?? null,
        criado_em: vinculo.criado_em || now,
      })
      .run();

    return vinculo;
  }

  async obterOrigens(ativoDestinoId: string): Promise<OrigemComPapel[]> {
    const rows = this.database
      .select({
        ativo: ativosDados,
        papel_entrada: linhagemAtivos.papel_entrada,
        etapa_transformacao_id: linhagemAtivos.etapa_transformacao_id,
      })
      .from(linhagemAtivos)
      .innerJoin(ativosDados, eq(linhagemAtivos.ativo_origem_id, ativosDados.id))
      .where(eq(linhagemAtivos.ativo_destino_id, ativoDestinoId))
      .all();

    return rows.map((r) => ({
      ativo: this.mapAssetRow(r.ativo),
      papel: r.papel_entrada as PapelEntradaLinhagem,
      etapa_transformacao_id: r.etapa_transformacao_id,
    }));
  }

  async obterDestinos(ativoOrigemId: string): Promise<AtivoDados[]> {
    const rows = this.database
      .select({
        ativo: ativosDados,
      })
      .from(linhagemAtivos)
      .innerJoin(ativosDados, eq(linhagemAtivos.ativo_destino_id, ativosDados.id))
      .where(eq(linhagemAtivos.ativo_origem_id, ativoOrigemId))
      .all();

    return rows.map((r) => this.mapAssetRow(r.ativo));
  }

  async obterArestasPorDemanda(demandaId: string): Promise<LinhagemAtivos[]> {
    const rows = this.database
      .select()
      .from(linhagemAtivos)
      .where(eq(linhagemAtivos.demanda_id, demandaId))
      .all();

    return rows.map((r) => this.mapEdgeRow(r));
  }

  async obterArestasPorEtapa(etapaId: string): Promise<LinhagemAtivos[]> {
    const rows = this.database
      .select()
      .from(linhagemAtivos)
      .where(eq(linhagemAtivos.etapa_transformacao_id, etapaId))
      .all();

    return rows.map((r) => this.mapEdgeRow(r));
  }

  async deleteDraftEdgeOnly(id: string): Promise<boolean> {
    return this.database.transaction((tx) => {
      const edge = tx
        .select()
        .from(linhagemAtivos)
        .where(eq(linhagemAtivos.id, id))
        .get();

      if (!edge) return false;

      // 1. Verificar se o ativo destino está vinculado a datasets autorizados
      const datasets = tx
        .select()
        .from(datasetsAutorizados)
        .where(eq(datasetsAutorizados.ativo_dados_id, edge.ativo_destino_id))
        .all();

      if (datasets.length > 0) {
        throw new Error(
          `A aresta de linhagem não pode ser excluída: o ativo destino está vinculado a um dataset autorizado.`
        );
      }

      // 2. Verificar se o ativo destino possui diagnósticos de qualidade
      const diagnosticos = tx
        .select()
        .from(diagnosticosQualidade)
        .where(eq(diagnosticosQualidade.ativo_dados_id, edge.ativo_destino_id))
        .all();

      if (diagnosticos.length > 0) {
        throw new Error(
          `A aresta de linhagem não pode ser excluída: o ativo destino possui diagnósticos de qualidade vinculados.`
        );
      }

      // 3. Verificar se a etapa associada já foi executada ou validada
      if (edge.etapa_transformacao_id) {
        const etapa = tx
          .select()
          .from(etapasTransformacao)
          .where(eq(etapasTransformacao.id, edge.etapa_transformacao_id))
          .get();

        if (etapa && etapa.status !== StatusEtapaTransformacao.PLANEJADA) {
          throw new Error(
            `A aresta de linhagem não pode ser excluída: sua etapa de transformação já se encontra no status '${etapa.status}'.`
          );
        }
      }

      const res = tx
        .delete(linhagemAtivos)
        .where(eq(linhagemAtivos.id, id))
        .run();

      return res.changes > 0;
    });
  }

  async registrarDerivacaoTransacional(params: RegistrarDerivacaoParams): Promise<{
    ativo: AtivoDados;
    arestas: LinhagemAtivos[];
  }> {
    const now = new Date().toISOString();

    return this.database.transaction((tx) => {
      // 1. Inserir o novo AtivoDados derivado
      tx.insert(ativosDados)
        .values({
          id: params.novoAtivo.id,
          demanda_id: params.novoAtivo.demanda_id,
          nome_arquivo: params.novoAtivo.nome_arquivo,
          caminho_local: params.novoAtivo.caminho_local,
          formato: params.novoAtivo.formato,
          origem: params.novoAtivo.origem,
          descricao_conteudo: params.novoAtivo.descricao_conteudo,
          granularidade: params.novoAtivo.granularidade,
          periodo_inicio: params.novoAtivo.periodo_inicio,
          periodo_fim: params.novoAtivo.periodo_fim,
          versao: params.novoAtivo.versao,
          substitui_ativo_id: params.novoAtivo.substitui_ativo_id ?? null,
          tamanho_bytes: params.novoAtivo.tamanho_bytes,
          total_linhas: params.novoAtivo.total_linhas,
          total_colunas: params.novoAtivo.total_colunas,
          hash_sha256: params.novoAtivo.hash_sha256,
          status: params.novoAtivo.status,
          categoria_ativo: params.novoAtivo.categoria_ativo ?? CategoriaAtivoDados.PREPARADO_DERIVADO,
          schema_inferido: params.novoAtivo.schema_inferido,
          data_recebimento: params.novoAtivo.data_recebimento,
          criado_em: params.novoAtivo.criado_em || now,
          atualizado_em: params.novoAtivo.atualizado_em || now,
        })
        .run();

      // 2. Validar aciclicidade e inserir todas as arestas de linhagem
      for (const aresta of params.arestas) {
        if (aresta.ativo_origem_id === aresta.ativo_destino_id) {
          throw new Error(
            `Aresta de linhagem inválida: o ativo de origem não pode ser idêntico ao ativo de destino (${aresta.ativo_origem_id}).`
          );
        }

        if (this.hasPath(aresta.ativo_destino_id, aresta.ativo_origem_id, tx)) {
          throw new Error(
            `Ciclo detectado no grafo de linhagem: a aresta de ${aresta.ativo_origem_id} para ${aresta.ativo_destino_id} geraria uma dependência circular.`
          );
        }

        tx.insert(linhagemAtivos)
          .values({
            id: aresta.id,
            demanda_id: aresta.demanda_id,
            ativo_origem_id: aresta.ativo_origem_id,
            ativo_destino_id: aresta.ativo_destino_id,
            papel_entrada: aresta.papel_entrada,
            etapa_transformacao_id: aresta.etapa_transformacao_id ?? null,
            criado_em: aresta.criado_em || now,
          })
          .run();
      }

      // 3. Atualizar a etapa de transformação para EXECUTADA
      const updateEtapaRes = tx
        .update(etapasTransformacao)
        .set({
          status: StatusEtapaTransformacao.EXECUTADA,
          atualizado_em: now,
        })
        .where(eq(etapasTransformacao.id, params.etapaId))
        .run();

      if (updateEtapaRes.changes === 0) {
        throw new Error(`Etapa de transformação '${params.etapaId}' não encontrada para atualização de execução.`);
      }

      // 4. Atualizar a receita de preparação para EM_EXECUCAO se solicitado
      if (params.atualizarReceitaParaEmExecucao) {
        const updateReceitaRes = tx
          .update(receitasPreparacao)
          .set({
            status: StatusReceitaPreparacao.EM_EXECUCAO,
            atualizado_em: now,
          })
          .where(eq(receitasPreparacao.id, params.receitaId))
          .run();

        if (updateReceitaRes.changes === 0) {
          throw new Error(`Receita de preparação '${params.receitaId}' não encontrada para atualização de status.`);
        }
      }

      // 5. Se houver evento de auditoria, registrar na trilha de auditoria
      if (params.eventoAuditoria) {
        tx.insert(trilhaAuditoria)
          .values({
            id: params.eventoAuditoria.id,
            demanda_id: params.eventoAuditoria.demanda_id,
            entidade: params.eventoAuditoria.entidade,
            entidade_id: params.eventoAuditoria.entidade_id,
            tipo_evento: params.eventoAuditoria.tipo_evento,
            autor_tipo: params.eventoAuditoria.autor_tipo,
            dados_anteriores: params.eventoAuditoria.dados_anteriores,
            dados_novos: params.eventoAuditoria.dados_novos,
            justificativa: params.eventoAuditoria.justificativa,
            timestamp: params.eventoAuditoria.timestamp || now,
          })
          .run();
      }

      return {
        ativo: params.novoAtivo,
        arestas: params.arestas,
      };
    });
  }
}
