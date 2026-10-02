import { test, expect } from '@playwright/test';

test.describe('E2E: Jornada Funcional Completa do Bloco 1 (Projetos + Demandas + Cockpit + Persistência)', () => {
  test('deve executar o fluxo completo de criação, validação negativa, navegação e persistência', async ({ page }) => {
    // 1. Abertura do Workspace e Verificação do Shell
    await page.goto('/cockpit');
    await expect(page).toHaveTitle(/Analyst Personal Workspace/);

    const sidebar = page.getByTestId('main-sidebar');
    await expect(sidebar).toBeVisible();

    const topHeader = page.getByTestId('top-header');
    await expect(topHeader).toBeVisible();

    const cockpitTitle = page.getByTestId('cockpit-title');
    await expect(cockpitTitle).toBeVisible();

    // 2. Cenário Negativo de Formulário (Validação de Projeto)
    await page.getByTestId('btn-quick-new-project').click();
    await expect(page).toHaveURL(/\/projects\/new/);
    await expect(page.getByTestId('new-project-title')).toBeVisible();

    // Tenta submeter com nome curto (< 3 caracteres)
    const inputProjectName = page.getByTestId('input-project-name');
    await inputProjectName.fill('AB');
    await page.getByTestId('btn-submit-project').click();

    // Confirma mensagem de erro amigável ao usuário
    const formError = page.getByTestId('form-error');
    await expect(formError).toBeVisible();
    await expect(formError).toContainText(/no mínimo 3 caracteres/i);

    // 3. Criação de Projeto Sintético Válido
    const uniqueSuffix = Date.now().toString().slice(-4);
    const projectName = `[TESTE SINTÉTICO] Projeto V1 BI ${uniqueSuffix}`;
    const projectDesc = 'Iniciativa de teste sintético automatizado do Bloco 1.';

    await inputProjectName.fill(projectName);
    await page.getByTestId('input-project-description').fill(projectDesc);
    await page.getByTestId('select-project-status').selectOption('ATIVO');
    await page.getByTestId('btn-submit-project').click();

    // 4. Visualização dos Detalhes do Projeto
    await expect(page).toHaveURL(/\/projects\/proj_/);
    const detailsTitle = page.getByTestId('project-details-title');
    await expect(detailsTitle).toBeVisible();
    await expect(detailsTitle).toHaveText(projectName);

    // Verifica estado vazio inicial de demandas no projeto
    const emptyDemands = page.getByTestId('project-empty-demands');
    await expect(emptyDemands).toBeVisible();
    await expect(emptyDemands).toContainText('Este projeto ainda não possui demandas.');

    // 5. Criação de Demanda Sintética Vinculada ao Projeto
    await page.getByTestId('btn-new-demand-for-project').click();
    await expect(page).toHaveURL(/\/demands\/new\?projectId=/);
    await expect(page.getByTestId('new-demand-title')).toBeVisible();

    const demandTitle = `[TESTE SINTÉTICO] Demanda Conciliação ${uniqueSuffix}`;
    const rawRequest = 'Solicitação bruta sintética recebida do cliente para fins de validação auditável de ponta a ponta.';
    const contextText = 'Ambiente de teste automatizado de reconciliação de dados.';
    const objectiveText = 'Testar a renderização do workspace e das abas contextuais.';

    await page.getByTestId('input-demand-title').fill(demandTitle);
    await page.getByTestId('input-demand-raw-request').fill(rawRequest);
    await page.getByTestId('input-demand-context').fill(contextText);
    await page.getByTestId('input-demand-objective').fill(objectiveText);
    await page.getByTestId('btn-submit-demand').click();

    // 6. Visualização do Workspace da Demanda (Hub Analítico)
    await expect(page).toHaveURL(/\/demands\/dem_/);
    const workspaceTitle = page.getByTestId('demand-workspace-title');
    await expect(workspaceTitle).toBeVisible();
    await expect(workspaceTitle).toHaveText(demandTitle);

    // Confirma estado inicial Nova (Normativo do Bloco 2)
    const workspaceState = page.getByTestId('demand-workspace-state');
    await expect(workspaceState).toBeVisible();
    await expect(workspaceState).toHaveText(/Nova|NOVA/i);

    // Confirma solicitação bruta preservada na aba Visão Geral
    const rawRequestDisplay = page.getByTestId('demand-raw-request');
    await expect(rawRequestDisplay).toBeVisible();
    await expect(rawRequestDisplay).toHaveText(rawRequest);

    // Confirma presença da barra de 11 abas da UX
    const tabsNav = page.getByTestId('demand-workspace-tabs');
    await expect(tabsNav).toBeVisible();

    // Testa navegação para a aba de Requisitos (Aba 2 implementada no Bloco 3.8)
    await page.getByTestId('tab-nav-requirements').click();
    const requirementsContent = page.getByTestId('tab-requirements');
    await expect(requirementsContent).toBeVisible();

    // Retorna para Visão Geral
    await page.getByTestId('tab-nav-overview').click();
    await expect(page.getByTestId('tab-content-overview')).toBeVisible();

    // 7. Retorno ao Cockpit e Verificação dos Contadores
    await page.getByTestId('nav-cockpit').click();
    await expect(page).toHaveURL(/\/cockpit/);

    // Confirma que os contadores refletem o projeto e a demanda criados
    await expect(page.getByTestId('stat-total-projects')).toBeVisible();
    await expect(page.getByTestId('stat-total-demands')).toBeVisible();

    const countProjects = await page.getByTestId('count-total-projects').textContent();
    expect(Number(countProjects)).toBeGreaterThanOrEqual(1);

    const countDemands = await page.getByTestId('count-total-demands').textContent();
    expect(Number(countDemands)).toBeGreaterThanOrEqual(1);

    // Confirma que a nova demanda aparece na lista de recentes
    const tableRecent = page.getByTestId('table-recent-demands');
    await expect(tableRecent).toBeVisible();
    await expect(tableRecent).toContainText(demandTitle);

    // 8. Recarregamento da Aplicação e Confirmação de Persistência no SQLite
    await page.reload();

    const countProjectsAfterReload = await page.getByTestId('count-total-projects').textContent();
    expect(Number(countProjectsAfterReload)).toBe(Number(countProjects));

    const countDemandsAfterReload = await page.getByTestId('count-total-demands').textContent();
    expect(Number(countDemandsAfterReload)).toBe(Number(countDemands));

    await expect(page.getByTestId('table-recent-demands')).toContainText(demandTitle);
  });
});
