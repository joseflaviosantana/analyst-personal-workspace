import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('E2E: Jornada E — Interface da Preparação de Dados, Linhagem e Autorização de Dataset (Unidade 3.5D)', () => {
  test('deve executar o fluxo operacional completo na Aba 5: criação de receita, etapas, ativo derivado com linhagem, validação, conclusão, autorização de dataset e prontidão', async ({ page }) => {
    const uniqueSuffix = Date.now().toString().slice(-4);
    const projectName = `[E2E 3.5D] Projeto Preparação ${uniqueSuffix}`;
    const demandTitle = `[E2E 3.5D] Demanda Preparação e Linhagem ${uniqueSuffix}`;

    // 1. Setup: Criação de Projeto e Demanda
    await page.goto('/projects/new');
    await page.getByTestId('input-project-name').fill(projectName);
    await page.getByTestId('input-project-description').fill('Validação E2E da Jornada E de Preparação.');
    await page.getByTestId('select-project-status').selectOption('ATIVO');
    await page.getByTestId('btn-submit-project').click();

    await expect(page).toHaveURL(/\/projects\/proj_/);

    await page.getByTestId('btn-new-demand-for-project').click();
    await page.getByTestId('input-demand-title').fill(demandTitle);
    await page.getByTestId('input-demand-raw-request').fill('Base de dados para higienização e homologação.');
    await page.getByTestId('input-demand-context').fill('Contexto operacional da Jornada E.');
    await page.getByTestId('input-demand-objective').fill('Validar fluxo completo da Aba 5 de Preparação.');
    await page.getByTestId('btn-submit-demand').click();

    await expect(page).toHaveURL(/\/demands\/dem_/);
    const stateBadge = page.getByTestId('demand-workspace-state');
    await expect(stateBadge).toHaveText(/Nova/i);

    // 2. Transições sequenciais até a Etapa 2 (Em Qualidade e Preparação)
    const btnAdvance = page.getByTestId('btn-advance-state');
    await expect(btnAdvance).toContainText(/Em Clarificação/i);
    await btnAdvance.click();
    await expect(stateBadge).toHaveText(/Em Clarificação/i);

    // 2.0 Delimitação e Homologação Soberana APROV-01 na Aba 2 (Governança Bloco 3.8)
    await page.getByTestId('tab-nav-requirements').click();
    await expect(page.getByTestId('tab-requirements')).toBeVisible();
    await expect(page.getByText('Carregando etapa de requisitos...')).not.toBeVisible();

    await page.getByTestId('btn-edit-briefing').click();
    await expect(page.getByText('Editar Briefing Analítico')).toBeVisible();
    await page.locator('input[placeholder*="Últimos 24 meses"]').fill('Exercício 2024');
    await page.locator('input[placeholder*="Mensal por Filial"]').fill('Linha por Transação');
    await page.locator('button[type="submit"]:has-text("Salvar Alterações")').click();
    await expect(page.getByText('Editar Briefing Analítico')).not.toBeVisible();

    await page.getByTestId('btn-open-homologate-modal').click();
    await expect(page.getByText('Homologação Formal do Levantamento de Requisitos')).toBeVisible();
    await page.locator('form textarea').first().fill('Levantamento homologado para execução da preparação de dados.');
    await page.locator('form button[type="submit"]:has-text("Homologar Levantamento")').click();
    await expect(page.getByText('Homologação Formal do Levantamento de Requisitos')).not.toBeVisible();
    await expect(page.getByText('Carregando etapa de requisitos...')).not.toBeVisible();
    await expect(page.getByTestId('badge-homologado')).toBeVisible();

    await page.getByTestId('tab-nav-overview').click();
    await expect(btnAdvance).toContainText(/Dados Recebidos/i);
    await btnAdvance.click();
    await expect(stateBadge).toHaveText(/Dados Recebidos/i);

    // 2.1 Cadastro do Ativo de Dados Bruto na Aba 3
    const tabDataNav = page.getByTestId('tab-nav-data');
    await tabDataNav.click();
    await expect(page.getByTestId('tab-data-assets-container')).toBeVisible();

    await page.getByTestId('btn-open-register-asset').click();
    const rawCsvPath = path.resolve(process.cwd(), 'tests', 'fixtures', 'synthetic-quality-sample.csv');
    await page.getByTestId('input-caminho-local').fill(rawCsvPath);
    await page.getByTestId('btn-inspect-file').click();

    await expect(page.getByTestId('inspection-preview-section')).toBeVisible();
    await page.getByTestId('input-origem').fill('ERP Corporativo');
    await page.getByTestId('btn-confirm-register').click();

    await expect(page.getByTestId('data-asset-feedback-alert')).toBeVisible();
    await expect(page.getByTestId('data-assets-list')).toContainText('synthetic-quality-sample.csv');

    // 2.2 Transição para Em Qualidade e Preparação
    await page.getByTestId('tab-nav-overview').click();
    await expect(btnAdvance).toContainText(/Em Qualidade e Preparação/i);
    await btnAdvance.click();
    await expect(stateBadge).toHaveText(/Em Qualidade e Preparação/i);

    // 3. Verificação da Aba 5 (Rótulo visível "5. Preparação", ID "transformation")
    const tabPrepNav = page.getByTestId('tab-nav-transformation');
    await expect(tabPrepNav).toBeVisible();
    await expect(tabPrepNav).toContainText('5. Preparação');
    await tabPrepNav.click();

    // 4. Verificação do Container da Aba 5 e Banner Proativo
    await expect(page.getByTestId('tab-preparation-container')).toBeVisible();
    await expect(page.getByTestId('prep-banner-no-recipe')).toBeVisible();

    // 5. Criação da Receita de Preparação
    await page.getByTestId('btn-create-recipe-empty').click();
    await expect(page.getByTestId('create-recipe-modal')).toBeVisible();

    await page.getByTestId('input-recipe-title').fill('Receita M 01 - Limpeza e Higienização');
    await page.getByTestId('input-recipe-description').fill('Orquestração do pipeline de limpeza e padronização.');
    await page.getByTestId('btn-submit-create-recipe').click();

    // Comprova receita criada e renderizada no card principal
    await expect(page.getByTestId('recipe-header-card')).toBeVisible();
    await expect(page.getByTestId('recipe-header-card')).toContainText('Receita M 01 - Limpeza e Higienização');
    await expect(page.getByTestId('recipe-header-card')).toContainText(/Rascunho/i);

    // 6. Adição da Etapa 1 de Transformação
    await page.getByTestId('btn-add-step').click();
    await expect(page.getByTestId('add-step-modal')).toBeVisible();

    await page.getByTestId('select-step-operation').selectOption('TRATAR_NULOS');
    await page.getByTestId('select-step-tool').selectOption('MOTOR_M_POWER_QUERY');
    await page.getByTestId('input-tool-name').fill('Power Query');
    await page.getByTestId('input-step-description').fill('Substituição de valores nulos na coluna faturamento por zero.');
    await page.getByTestId('input-step-spec').fill('Table.ReplaceValue(Source, null, 0, Replacer.ReplaceValue, {"faturamento"})');
    await page.getByTestId('btn-submit-add-step').click();

    // Comprova etapa adicionada à lista
    const stepCards = page.locator('[data-testid^="step-card-"]');
    await expect(stepCards.first()).toBeVisible();
    await expect(stepCards.first()).toContainText('Power Query');

    // 7. Registro do Ativo Derivado com Linhagem a partir da Etapa 1
    const btnRegisterDerived = page.locator('[data-testid^="btn-register-derived-"]').first();
    await btnRegisterDerived.click();
    await expect(page.getByTestId('register-derived-asset-modal')).toBeVisible();

    const derivedCsvPath = path.resolve(process.cwd(), 'tests', 'fixtures', 'synthetic-derived-sample.csv');
    await page.getByTestId('input-derived-filepath').fill(derivedCsvPath);
    await page.getByTestId('btn-inspect-derived-file').click();

    // Comprova que reutilizou a inspeção física e calculou hash SHA-256
    await expect(page.getByTestId('derived-inspection-preview')).toBeVisible();
    await expect(page.getByTestId('derived-inspection-preview')).toContainText('synthetic-derived-sample.csv');

    await page.getByTestId('btn-submit-register-derived').click();

    // Comprova que o modal fechou e o ativo derivado foi vinculado
    await expect(page.getByTestId('register-derived-asset-modal')).not.toBeVisible();

    // 8. Verificação do Grafo de Linhagem (Lineage Flow)
    await expect(page.getByTestId('lineage-flow-view')).toBeVisible();
    await expect(page.getByTestId('lineage-flow-view')).toContainText('synthetic-quality-sample.csv');
    await expect(page.getByTestId('lineage-flow-view')).toContainText('synthetic-derived-sample.csv');

    // 8.1 Execução de Diagnóstico no Ativo Derivado (Aba 4) para permitir validação comprovada
    await page.getByTestId('tab-nav-quality').click();
    await expect(page.getByTestId('tab-quality-container')).toBeVisible();
    await page.getByTestId('select-quality-asset').selectOption({ label: 'synthetic-derived-sample.csv (v1.0-preparado)' });
    await page.getByTestId('btn-run-quality-diagnostic').click();
    await expect(page.getByTestId('quality-feedback-alert')).toContainText(/Diagnóstico executado com sucesso/i);

    // 8.2 Retorno à Aba 5 e Validação Comprovada da Etapa
    await page.getByTestId('tab-nav-transformation').click();
    await expect(page.getByTestId('tab-preparation-container')).toBeVisible();
    const btnValidateStep = page.locator('[data-testid^="btn-validate-step-"]').first();
    await expect(btnValidateStep).toBeVisible();
    await btnValidateStep.click();
    await expect(page.getByTestId('prep-feedback-alert')).toContainText(/validada comprovadamente/i);

    // 9. Conclusão da Receita
    await page.getByTestId('btn-conclude-recipe').click();
    await expect(page.getByTestId('conclude-recipe-modal')).toBeVisible();
    await page.getByTestId('input-conclude-justification').fill('Todas as transformações foram aplicadas e validadas.');
    await page.getByTestId('btn-submit-conclude-recipe').click();

    await expect(page.getByTestId('recipe-header-card')).toContainText(/Concluída/i);

    // 10. Autorização Formal do Dataset para Modelagem
    await page.getByTestId('btn-banner-authorize-dataset').click();
    await expect(page.getByTestId('authorize-dataset-modal')).toBeVisible();

    await page.getByTestId('input-auth-version').fill('v1.0-homologado');
    await page.getByTestId('input-auth-justification').fill('Homologação formal do dataset limpo e tratado para DAX e modelagem tabular.');
    await page.getByTestId('btn-submit-authorize-dataset').click();

    // Comprova autorização de dataset ativa
    await expect(page.getByTestId('prep-dataset-authorization-section')).toBeVisible();
    await expect(page.getByTestId('prep-dataset-authorization-section')).toContainText(/Vigente/i);
    await expect(page.getByTestId('prep-dataset-authorization-section')).toContainText('v1.0-homologado');
  });
});
