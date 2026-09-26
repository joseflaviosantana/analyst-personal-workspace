import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('E2E: Jornada C — Recebimento, Inspeção Física e Inventário de Ativos de Dados (Unidade 3.3A)', () => {
  test('deve executar o fluxo completo de inspeção prévia, validação, cadastro humano, inventário, schema e trava read-only', async ({ page }) => {
    // 1. Setup: Criação de Projeto e Demanda
    await page.goto('/projects/new');
    const uniqueSuffix = Date.now().toString().slice(-4);
    const projectName = `[E2E 3.3A] Projeto Dados ${uniqueSuffix}`;
    await page.getByTestId('input-project-name').fill(projectName);
    await page.getByTestId('input-project-description').fill('Projeto para validação E2E da Unidade 3.3A.');
    await page.getByTestId('select-project-status').selectOption('ATIVO');
    await page.getByTestId('btn-submit-project').click();

    await expect(page).toHaveURL(/\/projects\/proj_/);

    await page.getByTestId('btn-new-demand-for-project').click();
    const demandTitle = `[E2E 3.3A] Demanda Ativos ${uniqueSuffix}`;
    await page.getByTestId('input-demand-title').fill(demandTitle);
    await page.getByTestId('input-demand-raw-request').fill('Necessidade de inventário de base de vendas.');
    await page.getByTestId('input-demand-context').fill('Contexto de validação da Jornada C.');
    await page.getByTestId('input-demand-objective').fill('Validar fluxo completo de ativos de dados.');
    await page.getByTestId('btn-submit-demand').click();

    await expect(page).toHaveURL(/\/demands\/dem_/);

    // 2. Navegação para a Aba 3 — Ativos de Dados
    const tabDataNav = page.getByTestId('tab-nav-data');
    await expect(tabDataNav).toBeVisible();
    await tabDataNav.click();

    const container = page.getByTestId('tab-data-assets-container');
    await expect(container).toBeVisible();

    // 3. Estado Vazio Inicial
    const emptyState = page.getByTestId('empty-data-assets');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText(/Nenhum ativo de dados catalogado/i);

    // 4. Abertura do Formulário de Catalogação
    const btnOpenForm = page.getByTestId('btn-open-register-asset');
    await expect(btnOpenForm).toBeVisible();
    await btnOpenForm.click();

    const formRegister = page.getByTestId('form-register-data-asset');
    await expect(formRegister).toBeVisible();

    // 5. FASE 1: Inspeção Física (Sem Persistência)
    const sampleCsvPath = path.resolve(process.cwd(), 'tests', 'fixtures', 'synthetic-sample.csv');
    // Fornece com aspas propositalmente para testar normalização de cópia Windows Explorer
    await page.getByTestId('input-caminho-local').fill(`"${sampleCsvPath}"`);

    const btnInspect = page.getByTestId('btn-inspect-file');
    await btnInspect.click();

    // Aguarda prévia da inspeção
    const previewSection = page.getByTestId('inspection-preview-section');
    await expect(previewSection).toBeVisible();

    const previewCard = page.getByTestId('inspection-preview-card');
    await expect(previewCard).toBeVisible();
    await expect(previewCard).toContainText(/synthetic-sample.csv/);
    await expect(previewCard).toContainText(/CSV/);

    const volumetry = page.getByTestId('preview-volumetry');
    await expect(volumetry).toContainText(/5 lin/);
    await expect(volumetry).toContainText(/5 col/);

    // 6. Validação de Regras Humanas: Origem obrigatória (mínimo 3 caracteres)
    const btnConfirm = page.getByTestId('btn-confirm-register');
    await btnConfirm.click();

    const errorOrigem = page.getByTestId('error-origem');
    await expect(errorOrigem).toBeVisible();
    await expect(errorOrigem).toContainText(/origem do arquivo é obrigatória/i);

    // Testa menos de 3 caracteres
    await page.getByTestId('input-origem').fill('AB');
    await btnConfirm.click();
    await expect(errorOrigem).toContainText(/no mínimo 3 caracteres/i);

    // 7. FASE 2: Complementação e Confirmação Deliberada
    await page.getByTestId('input-origem').fill('Depto Financeiro Matriz');
    await page.getByTestId('input-granularidade').fill('Transacional (1 linha por cliente)');
    await page.getByTestId('input-descricao-conteudo').fill('Base sintética de clientes para teste de E2E.');
    await page.getByTestId('input-periodo-inicio').fill('2024-01-01');
    await page.getByTestId('input-periodo-fim').fill('2024-12-31');

    await btnConfirm.click();

    // Confere feedback de sucesso e fechamento do formulário
    const feedback = page.getByTestId('data-asset-feedback-alert');
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText(/catalogado com sucesso/i);
    await expect(formRegister).not.toBeVisible();

    // 8. Verificação do Inventário
    const assetsList = page.getByTestId('data-assets-list');
    await expect(assetsList).toBeVisible();
    await expect(assetsList).toContainText(/synthetic-sample.csv/);
    await expect(assetsList).toContainText(/Depto Financeiro Matriz/);

    // 9. Visualização de Schema
    const btnViewSchema = page.locator('[data-testid^="btn-view-schema-"]').first();
    await expect(btnViewSchema).toBeVisible();
    await btnViewSchema.click();

    const schemaModal = page.getByTestId('data-asset-schema-modal');
    await expect(schemaModal).toBeVisible();
    await expect(schemaModal).toContainText(/synthetic-sample.csv/);

    const schemaTable = page.getByTestId('table-asset-schema');
    await expect(schemaTable).toBeVisible();
    await expect(schemaTable).toContainText(/id_cliente/);
    await expect(schemaTable).toContainText(/nome_cliente/);
    await expect(schemaTable).toContainText(/faturamento/);

    await page.getByTestId('btn-close-schema-modal').click();
    await expect(schemaModal).not.toBeVisible();

    // 10. Verificação de Acessibilidade Física em Tempo Real
    const btnCheckAccess = page.locator('[data-testid^="btn-check-accessibility-"]').first();
    await expect(btnCheckAccess).toBeVisible();
    await btnCheckAccess.click();

    const accessStatus = page.locator('[data-testid^="accessibility-status-"]').first();
    await expect(accessStatus).toBeVisible();
    await expect(accessStatus).toContainText(/Arquivo acessível e legível no disco local/i);

    // 11. Persistência após Reload
    await page.reload();
    await tabDataNav.click();
    await expect(page.getByTestId('data-assets-list')).toBeVisible();
    await expect(page.getByTestId('data-assets-list')).toContainText(/synthetic-sample.csv/);

    // 12. Governança e Trava Read-Only em Demanda Suspensa
    await page.getByTestId('tab-nav-overview').click();
    const btnSuspend = page.getByTestId('btn-suspend-demand');
    await expect(btnSuspend).toBeVisible();
    await btnSuspend.click();

    const modalSuspend = page.getByTestId('modal-suspend-demand');
    await expect(modalSuspend).toBeVisible();
    await page.getByTestId('input-suspend-justification').fill('Pausa para teste de governança read-only na Aba 3.');
    await page.getByTestId('btn-confirm-suspend').click();

    const stateBadge = page.getByTestId('demand-workspace-state');
    await expect(stateBadge).toHaveText(/Suspensa/i);

    // Retorna para a Aba 3 e verifica bloqueio
    await tabDataNav.click();
    const bannerReadOnly = page.getByTestId('banner-readonly-governance');
    await expect(bannerReadOnly).toBeVisible();
    await expect(bannerReadOnly).toContainText(/Demanda Suspensa/i);

    // Botão de novo cadastro NÃO deve estar visível
    await expect(page.getByTestId('btn-open-register-asset')).not.toBeVisible();

    // Mas botões de consulta permanecem operacionais
    await expect(page.locator('[data-testid^="btn-view-schema-"]').first()).toBeVisible();
    await expect(page.locator('[data-testid^="btn-check-accessibility-"]').first()).toBeVisible();
  });
});
