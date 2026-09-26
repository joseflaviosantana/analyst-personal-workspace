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

const ativoDadosRepo = new SqliteAtivoDadosRepository();
const demandRepo = new SqliteDemandRepository();
const auditRepo = new SqliteAuditRepository();
const fileSystemAdapter = new LocalFileSystemAdapter();

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
