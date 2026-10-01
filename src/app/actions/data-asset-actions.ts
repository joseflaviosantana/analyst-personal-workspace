'use server';

import { revalidatePath } from 'next/cache';
import { SqliteAtivoDadosRepository } from '@/infrastructure/db/repositories/ativo-dados-repository';
import { SqliteDemandRepository } from '@/infrastructure/db/repositories/demand-repository';
import { SqliteAuditRepository } from '@/infrastructure/db/repositories/audit-repository';
import { LocalFileSystemAdapter } from '@/infrastructure/filesystem/local-file-system-adapter';
import {
  InspectLocalFileUseCase,
  RegisterDataAssetUseCase,
  ListDataAssetsUseCase,
  CheckAssetAccessibilityUseCase,
  ReplaceDataAssetUseCase,
} from '@/core/use-cases/data-assets';
import { RegisterDataAssetInput, ReplaceDataAssetInput } from '@/lib/validations/data-asset-schema';

import { SqliteEventoAnaliticoLogRepository } from '@/infrastructure/db/repositories/sqlite-evento-analitico-log-repository';
import { SqliteEvidenciaAnaliticaRepository } from '@/infrastructure/db/repositories/sqlite-evidencia-analitica-repository';
import {
  RegistrarEvidenciaUseCase,
  ProcessarEventoAnaliticoUseCase,
} from '@/core/use-cases/evidence';
import {
  criarEvidenceEventEnginePadrao,
  EventoAnalitico,
} from '@/core/domain/evidence-events';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';

const ativoDadosRepo = new SqliteAtivoDadosRepository();
const demandRepo = new SqliteDemandRepository();
const auditRepo = new SqliteAuditRepository();
const fileSystemAdapter = new LocalFileSystemAdapter();

const eventoLogRepo = new SqliteEventoAnaliticoLogRepository();
const evidenciaRepo = new SqliteEvidenciaAnaliticaRepository();
const registrarEvidenciaUseCase = new RegistrarEvidenciaUseCase(evidenciaRepo, demandRepo);
const eventEngine = criarEvidenceEventEnginePadrao();
const processarEventoUseCase = new ProcessarEventoAnaliticoUseCase(
  eventEngine,
  eventoLogRepo,
  registrarEvidenciaUseCase
);

const inspectUseCase = new InspectLocalFileUseCase(fileSystemAdapter);
const registerUseCase = new RegisterDataAssetUseCase(ativoDadosRepo, demandRepo, auditRepo);
const listUseCase = new ListDataAssetsUseCase(ativoDadosRepo);
const checkAccessibilityUseCase = new CheckAssetAccessibilityUseCase(ativoDadosRepo, fileSystemAdapter);
const replaceUseCase = new ReplaceDataAssetUseCase(ativoDadosRepo, demandRepo);

/**
 * Server Action: Inspecionar arquivo local sem persistência
 */
export async function inspectLocalFileAction(caminhoLocal: string, abaAlvoXlsx?: string | null) {
  try {
    const result = await inspectUseCase.execute({ caminhoLocal, abaAlvoXlsx });
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro inesperado ao inspecionar o arquivo local.',
    };
  }
}

/**
 * Server Action: Cadastrar e persistir Ativo de Dados após confirmação humana
 */
export async function registerDataAssetAction(input: RegisterDataAssetInput) {
  try {
    const created = await registerUseCase.execute(input);

    // Emissão Determinística de Evento Analítico (Subgate 3.5B.2)
    try {
      const demand = await demandRepo.findById(created.demanda_id);
      const evento: EventoAnalitico = {
        id_evento: `evt_ast_reg_${created.id}`,
        demanda_id: created.demanda_id,
        projeto_id: demand?.projeto_id ?? null,
        etapa_origem: EtapaOrigemEvidencia.DADOS,
        categoria: 'DADOS',
        tipo_evento: 'DADOS_ATIVO_REGISTRADO',
        ocorrido_em: created.criado_em,
        executor: 'ANALISTA',
        artefato_origem_tipo: 'ATIVO_DADOS',
        artefato_origem_id: created.id,
        payload: {
          ativoId: created.id,
          nomeArquivo: created.nome_arquivo,
          caminhoLocal: created.caminho_local,
          formato: created.formato,
          origem: created.origem,
          tamanhoBytes: created.tamanho_bytes,
          totalLinhas: created.total_linhas,
          totalColunas: created.total_colunas,
          hashSha256: created.hash_sha256,
          versao: created.versao,
        },
        versao_contrato: '1.0',
      };
      await processarEventoUseCase.execute(evento);
    } catch {
      // Falha no motor de evidências é auditada internamente pelo Event Engine
    }

    revalidatePath(`/demands/${input.demanda_id}`);
    revalidatePath('/cockpit');
    return { success: true, data: created };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro inesperado ao cadastrar o ativo de dados.',
    };
  }
}

/**
 * Server Action: Listar ativos de dados de uma demanda
 */
export async function listDataAssetsAction(demandaId: string) {
  try {
    const assets = await listUseCase.execute(demandaId);
    return { success: true, data: assets };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao listar ativos de dados da demanda.',
    };
  }
}

/**
 * Server Action: Verificar acessibilidade física de um ativo no disco
 */
export async function checkAssetAccessibilityAction(assetId: string) {
  try {
    const result = await checkAccessibilityUseCase.execute(assetId);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro ao verificar acessibilidade física do arquivo.',
    };
  }
}

/**
 * Server Action: Substituir ativo de dados com versionamento e auditoria atômica (Unidade 3.3B)
 */
export async function replaceDataAssetAction(input: ReplaceDataAssetInput) {
  try {
    const result = await replaceUseCase.execute(input);

    // Emissão Determinística de Evento Analítico (Subgate 3.5B.2)
    try {
      const demand = await demandRepo.findById(result.novoAtivo.demanda_id);
      const evento: EventoAnalitico = {
        id_evento: `evt_ast_rep_${result.novoAtivo.id}`,
        demanda_id: result.novoAtivo.demanda_id,
        projeto_id: demand?.projeto_id ?? null,
        etapa_origem: EtapaOrigemEvidencia.DADOS,
        categoria: 'DADOS',
        tipo_evento: 'DADOS_ATIVO_SUBSTITUIDO',
        ocorrido_em: result.novoAtivo.criado_em,
        executor: 'ANALISTA',
        artefato_origem_tipo: 'ATIVO_DADOS',
        artefato_origem_id: result.novoAtivo.id,
        payload: {
          ativoAntigoId: result.ativoSubstituido.id,
          novoAtivoId: result.novoAtivo.id,
          nomeArquivo: result.novoAtivo.nome_arquivo,
          caminhoLocal: result.novoAtivo.caminho_local,
          formato: result.novoAtivo.formato,
          versaoAntiga: result.ativoSubstituido.versao || '1.0',
          versaoNova: result.novoAtivo.versao || '1.1',
          hashAntigo: result.ativoSubstituido.hash_sha256,
          hashNovo: result.novoAtivo.hash_sha256,
          linhasAntigas: result.ativoSubstituido.total_linhas,
          linhasNovas: result.novoAtivo.total_linhas,
          colunasAntigas: result.ativoSubstituido.total_colunas,
          colunasNovas: result.novoAtivo.total_colunas,
          justificativa: input.justificativa,
        },
        versao_contrato: '1.0',
      };
      await processarEventoUseCase.execute(evento);
    } catch {
      // Falha no motor de evidências é auditada internamente pelo Event Engine
    }

    revalidatePath(`/demands/${input.demanda_id}`);
    revalidatePath('/cockpit');
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Erro inesperado ao substituir o ativo de dados.',
    };
  }
}
