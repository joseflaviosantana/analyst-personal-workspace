import crypto from 'node:crypto';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IDiagnosticosQualidadeRepository } from '@/core/domain/repositories/diagnosticos-qualidade-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { DiagnosticoQualidade } from '@/core/domain/entities/diagnostico-qualidade';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { StatusExecucaoDiagnostico } from '@/core/domain/enums/status-execucao-diagnostico';
import { DeterministicQualityScanner } from '@/infrastructure/quality/deterministic-quality-scanner';

export interface ExecutarDiagnosticoInput {
  ativoDadosId: string;
  abaAlvoXlsx?: string;
}

export interface ExecutarDiagnosticoOutput {
  diagnostico: DiagnosticoQualidade;
  problemas: ProblemaQualidade[];
}

export class ExecutarDiagnosticoQualidadeUseCase {
  constructor(
    private ativoDadosRepo: IAtivoDadosRepository,
    private diagnosticosRepo: IDiagnosticosQualidadeRepository,
    private problemasRepo: IProblemasQualidadeRepository
  ) {}

  async execute(input: ExecutarDiagnosticoInput): Promise<ExecutarDiagnosticoOutput> {
    const ativo = await this.ativoDadosRepo.findById(input.ativoDadosId);
    if (!ativo) {
      throw new Error(`Ativo de dados com ID "${input.ativoDadosId}" não encontrado.`);
    }

    const agora = new Date().toISOString();
    const diagnosticoId = crypto.randomUUID();
    const inicioMs = Date.now();

    // 1. Cria o registro inicial com status EM_ANDAMENTO
    let diagnostico: DiagnosticoQualidade = {
      id: diagnosticoId,
      ativo_dados_id: ativo.id,
      demanda_id: ativo.demanda_id,
      iniciado_em: agora,
      concluido_em: null,
      duracao_ms: 0,
      total_linhas_avaliadas: 0,
      total_colunas_avaliadas: 0,
      verificacoes_executadas: [],
      total_problemas_detectados: 0,
      status_execucao: StatusExecucaoDiagnostico.EM_ANDAMENTO,
      erro_mensagem: null,
      resumo_metricas: null,
      criado_em: agora,
      atualizado_em: agora,
    };

    await this.diagnosticosRepo.create(diagnostico);

    let schemaInferido: Record<string, string> | null = null;
    if (ativo.schema_inferido) {
      try {
        schemaInferido = JSON.parse(ativo.schema_inferido) as Record<string, string>;
      } catch {
        schemaInferido = null;
      }
    }

    // 2. Executa a varredura determinística
    try {
      const resultadoScanner = await DeterministicQualityScanner.escanear({
        diagnosticoId,
        ativoDadosId: ativo.id,
        demandaId: ativo.demanda_id,
        caminhoArquivo: ativo.caminho_local,
        formato: ativo.formato,
        tabelaNome: ativo.nome_arquivo,
        schemaInferido,
        abaAlvoXlsx: input.abaAlvoXlsx,
      });

      const duracaoMs = Date.now() - inicioMs;
      const concluidoEm = new Date().toISOString();

      if (!resultadoScanner.sucesso) {
        diagnostico = (await this.diagnosticosRepo.update(diagnosticoId, {
          concluido_em: concluidoEm,
          duracao_ms: duracaoMs,
          status_execucao: StatusExecucaoDiagnostico.FALHA,
          erro_mensagem: resultadoScanner.erroMensagem ?? 'Falha desconhecida no scanner',
        }))!;
        return { diagnostico, problemas: [] };
      }

      // 3 e 4. Persiste problemas e conclui diagnóstico atomicamente sob transação SQLite
      const conclusaoTransacional = await this.diagnosticosRepo.salvarConclusaoTransacional(
        diagnosticoId,
        {
          concluido_em: concluidoEm,
          duracao_ms: duracaoMs,
          total_linhas_avaliadas: resultadoScanner.totalLinhas,
          total_colunas_avaliadas: resultadoScanner.totalColunas,
          verificacoes_executadas: resultadoScanner.verificacoes,
          total_problemas_detectados: resultadoScanner.problemas.length,
          status_execucao: resultadoScanner.statusExecucao,
          resumo_metricas: resultadoScanner.resumoMetricas,
          erro_mensagem: null,
        },
        resultadoScanner.problemas
      );

      return conclusaoTransacional;
    } catch (err) {
      const duracaoMs = Date.now() - inicioMs;
      const concluidoEm = new Date().toISOString();
      const erroMsg = err instanceof Error ? err.message : String(err);

      diagnostico = (await this.diagnosticosRepo.update(diagnosticoId, {
        concluido_em: concluidoEm,
        duracao_ms: duracaoMs,
        status_execucao: StatusExecucaoDiagnostico.FALHA,
        erro_mensagem: erroMsg,
      }))!;

      return {
        diagnostico,
        problemas: [],
      };
    }
  }
}
