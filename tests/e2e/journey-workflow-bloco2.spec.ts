import { test, expect } from '@playwright/test';

test.describe('E2E: Workflow Operacional e Governança de Estados da Demanda (Bloco 2)', () => {
  test('deve executar o ciclo completo de transições normais, suspensão, retomada, cancelamento e auditoria', async ({ page }) => {
    // 1. Setup: Criação de Projeto e Demanda para o teste de workflow
    await page.goto('/projects/new');
    const uniqueSuffix = Date.now().toString().slice(-4);
    const projectName = `[E2E WF] Projeto Workflow ${uniqueSuffix}`;
    await page.getByTestId('input-project-name').fill(projectName);
    await page.getByTestId('input-project-description').fill('Projeto para validação E2E do workflow do Bloco 2.');
    await page.getByTestId('select-project-status').selectOption('ATIVO');
    await page.getByTestId('btn-submit-project').click();

    await expect(page).toHaveURL(/\/projects\/proj_/);

    await page.getByTestId('btn-new-demand-for-project').click();
    const demandTitle = `[E2E WF] Demanda Pipeline ${uniqueSuffix}`;
    await page.getByTestId('input-demand-title').fill(demandTitle);
    await page.getByTestId('input-demand-raw-request').fill('Necessidade de pipeline de vendas com governança de estados.');
    await page.getByTestId('input-demand-context').fill('Contexto de validação de workflow.');
    await page.getByTestId('input-demand-objective').fill('Validar todas as transições de estado e auditoria.');
    await page.getByTestId('btn-submit-demand').click();

    // 2. Hub da Demanda: Estado Inicial Nova
    await expect(page).toHaveURL(/\/demands\/dem_/);
    const stateBadge = page.getByTestId('demand-workspace-state');
    await expect(stateBadge).toBeVisible();
    await expect(stateBadge).toHaveText(/Nova/i);

    // Timeline de Auditoria deve conter o evento inicial de criação
    const timeline = page.getByTestId('demand-workflow-timeline');
    await expect(timeline).toBeVisible();
    const timelineCount = page.getByTestId('timeline-count');
    await expect(timelineCount).toBeVisible();

    // 3. Transição Normal 1: Nova -> Em Clarificação
    const btnAdvance = page.getByTestId('btn-advance-state');
    await expect(btnAdvance).toBeVisible();
    await expect(btnAdvance).toContainText(/Avançar para Em Clarificação/i);
    await btnAdvance.click();

    // Aguarda atualização de estado
    await expect(stateBadge).toHaveText(/Em Clarificação/i);

    // 4. Transição Normal 2: Em Clarificação -> Dados Recebidos
    await expect(btnAdvance).toContainText(/Avançar para Dados Recebidos/i);
    await btnAdvance.click();
    await expect(stateBadge).toHaveText(/Dados Recebidos/i);

    // 5. Suspensão com Justificativa Obrigatória
    const btnSuspend = page.getByTestId('btn-suspend-demand');
    await expect(btnSuspend).toBeVisible();
    await btnSuspend.click();

    // Modal de Suspensão
    const modalSuspend = page.getByTestId('modal-suspend-demand');
    await expect(modalSuspend).toBeVisible();

    // Preenchimento de justificativa válida
    const justifSuspensao = 'Aguardando concessão de acessos pela equipe de infraestrutura';
    const inputSuspendJustif = page.getByTestId('input-suspend-justification');
    await inputSuspendJustif.fill(justifSuspensao);
    await page.getByTestId('btn-confirm-suspend').click();

    // Confirma estado Suspensa
    await expect(stateBadge).toHaveText(/Suspensa/i);
    await expect(btnAdvance).not.toBeVisible();

    const btnResume = page.getByTestId('btn-resume-demand');
    await expect(btnResume).toBeVisible();

    // Confirma justificativa na timeline
    await expect(timeline).toContainText(justifSuspensao);

    // 6. Verificação do Pipeline Kanban (/pipeline)
    await page.getByTestId('nav-pipeline').click();
    await expect(page).toHaveURL(/\/pipeline/);

    const pipelineView = page.getByTestId('pipeline-view');
    await expect(pipelineView).toBeVisible();

    // Abre gaveta de Suspensas
    const btnToggleSuspended = page.getByTestId('btn-shelf-suspensas');
    await expect(btnToggleSuspended).toBeVisible();
    await btnToggleSuspended.click();

    const drawerSuspended = page.getByTestId('shelf-suspensas-panel');
    await expect(drawerSuspended).toBeVisible();
    await expect(drawerSuspended).toContainText(demandTitle);

    // Retorna ao Workspace da Demanda
    await page.locator(`text=${demandTitle}`).first().click();
    await expect(page).toHaveURL(/\/demands\/dem_/);

    // 7. Retomada de Demanda (Suspensa -> Dados Recebidos)
    await expect(btnResume).toBeVisible();
    await btnResume.click();

    const modalResume = page.getByTestId('modal-resume-demand');
    await expect(modalResume).toBeVisible();

    const inputResumeJustif = page.getByTestId('input-resume-justification');
    const justifRetomada = 'Acessos concedidos e validados no banco';
    await inputResumeJustif.fill(justifRetomada);
    await page.getByTestId('btn-confirm-resume').click();

    // Confirma retorno ao estado anterior Dados Recebidos
    await expect(stateBadge).toHaveText(/Dados Recebidos/i);
    await expect(btnAdvance).toBeVisible();
    await expect(btnAdvance).toContainText(/Avançar para Em Qualidade e Preparação/i);

    // 8. Cancelamento de Demanda com Justificativa Obrigatória
    const btnCancel = page.getByTestId('btn-cancel-demand');
    await expect(btnCancel).toBeVisible();
    await btnCancel.click();

    const modalCancel = page.getByTestId('modal-cancel-demand');
    await expect(modalCancel).toBeVisible();

    const inputCancelJustif = page.getByTestId('input-cancel-justification');
    const justifCancelamento = 'Demanda descontinuada pela área solicitante após revisão de prioridades';
    await inputCancelJustif.fill(justifCancelamento);
    await page.getByTestId('btn-confirm-cancel').click();

    // Confirma estado terminal Cancelada
    await expect(stateBadge).toHaveText(/Cancelada/i);
    await expect(btnAdvance).not.toBeVisible();
    await expect(btnSuspend).not.toBeVisible();
    await expect(btnResume).not.toBeVisible();

    // Governança Bloco 2: Botão Editar NÃO deve estar disponível para demanda Cancelada
    const btnEdit = page.getByTestId('btn-edit-demand');
    await expect(btnEdit).not.toBeVisible();

    // Governança Bloco 2: Distinção terminológica de encerramento
    const cancellationDate = page.getByTestId('metadata-cancellation-date');
    await expect(cancellationDate).toBeVisible();
    await expect(cancellationDate).toContainText(/Cancelada em:/i);
    await expect(page.getByTestId('metadata-conclusion-date')).not.toBeVisible();

    // Governança Bloco 2: Tentativa de acesso direto à rota de edição deve ser bloqueada (redireciona para o Hub)
    const currentUrl = page.url();
    await page.goto(`${currentUrl}/edit`);
    await expect(page).toHaveURL(currentUrl);

    // 9. Preservação após Recarregamento da Página
    await page.reload();

    await expect(stateBadge).toHaveText(/Cancelada/i);
    await expect(cancellationDate).toBeVisible();
    await expect(cancellationDate).toContainText(/Cancelada em:/i);
    await expect(btnEdit).not.toBeVisible();
    await expect(timeline).toContainText(justifCancelamento);
    await expect(timeline).toContainText(justifRetomada);
    await expect(timeline).toContainText(justifSuspensao);
  });

  test('deve avançar demanda até Concluída e exibir terminologia "Conclusão: [data]"', async ({ page }) => {
    // 1. Criação de Projeto e Demanda
    await page.goto('/projects/new');
    const uniqueSuffix = Date.now().toString().slice(-4);
    const projectName = `[E2E CONCLUSAO] Projeto ${uniqueSuffix}`;
    await page.getByTestId('input-project-name').fill(projectName);
    await page.getByTestId('select-project-status').selectOption('ATIVO');
    await page.getByTestId('btn-submit-project').click();
    await expect(page).toHaveURL(/\/projects\/proj_/);

    await page.getByTestId('btn-new-demand-for-project').click();
    const demandTitle = `[E2E CONCLUSAO] Demanda ${uniqueSuffix}`;
    await page.getByTestId('input-demand-title').fill(demandTitle);
    await page.getByTestId('input-demand-raw-request').fill('Validação de encerramento normal por conclusão.');
    await page.getByTestId('btn-submit-demand').click();
    await expect(page).toHaveURL(/\/demands\/dem_/);

    // 2. Avanço sequencial pelas 7 transições até Concluída
    const etapasRestantes = [
      'Em Clarificação',
      'Dados Recebidos',
      'Em Qualidade e Preparação',
      'Em Modelagem e Análise',
      'Em Validação',
      'Pronta para Entrega',
      'Concluída',
    ];

    for (const etapa of etapasRestantes) {
      const btnAdvance = page.getByTestId('btn-advance-state');
      await expect(btnAdvance).toBeVisible();
      await expect(btnAdvance).toContainText(new RegExp(etapa, 'i'));
      await btnAdvance.click();
    }

    // 3. Validação do Estado Concluída
    const stateBadge = page.getByTestId('demand-workspace-state');
    await expect(stateBadge).toHaveText(/Concluída/i);

    // Governança Bloco 2: Terminologia de Conclusão normal
    const conclusionDate = page.getByTestId('metadata-conclusion-date');
    await expect(conclusionDate).toBeVisible();
    await expect(conclusionDate).toContainText(/Conclusão:/i);
    await expect(page.getByTestId('metadata-cancellation-date')).not.toBeVisible();

    // Governança Bloco 2: Imutabilidade operacional de demanda Concluída
    // 1. Botão Editar NÃO deve estar disponível para demanda Concluída
    const btnEdit = page.getByTestId('btn-edit-demand');
    await expect(btnEdit).not.toBeVisible();

    // 2. Tentativa de acesso direto à rota de edição /edit deve ser bloqueada e redirecionada para o Hub
    const currentUrl = page.url();
    await page.goto(`${currentUrl}/edit`);
    await expect(page).toHaveURL(currentUrl);

    // 3. Demanda concluída não oferece botões operacionais de avanço/suspensão/cancelamento
    await expect(page.getByTestId('btn-advance-state')).not.toBeVisible();
    await expect(page.getByTestId('btn-suspend-demand')).not.toBeVisible();
    await expect(page.getByTestId('btn-cancel-demand')).not.toBeVisible();

    // 4. A linha do tempo e os dados operacionais permanecem integralmente consultáveis
    const timeline = page.getByTestId('demand-workflow-timeline');
    await expect(timeline).toBeVisible();
    await expect(page.getByTestId('demand-raw-request')).toContainText('Validação de encerramento normal por conclusão.');

    // 5. Preservação após Recarregamento da Página
    await page.reload();
    await expect(stateBadge).toHaveText(/Concluída/i);
    await expect(conclusionDate).toBeVisible();
    await expect(conclusionDate).toContainText(/Conclusão:/i);
    await expect(btnEdit).not.toBeVisible();
    await expect(timeline).toBeVisible();
    await expect(page.getByTestId('demand-raw-request')).toContainText('Validação de encerramento normal por conclusão.');
  });
});
