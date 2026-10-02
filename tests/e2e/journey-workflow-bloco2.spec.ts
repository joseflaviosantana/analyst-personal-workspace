import path from 'path';
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
    // Homologação de Requisitos (APROV-01) na Aba 2 (Governança Bloco 3.8)
    await page.getByTestId('tab-nav-requirements').click();
    await expect(page.getByTestId('tab-requirements')).toBeVisible();
    await expect(page.getByText('Carregando etapa de requisitos...')).not.toBeVisible();

    await page.getByTestId('btn-edit-briefing').click();
    await expect(page.getByText('Editar Briefing Analítico')).toBeVisible();
    await page.locator('input[placeholder*="Últimos 24 meses"]').fill('Exercício 2024');
    await page.locator('input[placeholder*="Mensal por Filial"]').fill('Item por transação');
    await page.locator('button[type="submit"]:has-text("Salvar Alterações")').click();
    await expect(page.getByText('Editar Briefing Analítico')).not.toBeVisible();

    await page.getByTestId('btn-open-homologate-modal').click();
    await expect(page.getByText('Homologação Formal do Levantamento de Requisitos')).toBeVisible();
    await page.locator('form textarea').first().fill('Levantamento homologado para validação de workflow.');
    await page.locator('form button[type="submit"]:has-text("Homologar Levantamento")').click();
    await expect(page.getByText('Homologação Formal do Levantamento de Requisitos')).not.toBeVisible();
    await expect(page.getByText('Carregando etapa de requisitos...')).not.toBeVisible();
    await expect(page.getByTestId('badge-homologado')).toBeVisible();

    await page.getByTestId('tab-nav-overview').click();
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

  test('deve avançar demanda pelas etapas normais até Em Modelagem e Análise e respeitar a trava de governança', async ({ page }) => {
    // 1. Criação de Projeto e Demanda
    await page.goto('/projects/new');
    const uniqueSuffix = Date.now().toString().slice(-4);
    const projectName = `[E2E WF] Projeto Fluxo ${uniqueSuffix}`;
    await page.getByTestId('input-project-name').fill(projectName);
    await page.getByTestId('select-project-status').selectOption('ATIVO');
    await page.getByTestId('btn-submit-project').click();
    await expect(page).toHaveURL(/\/projects\/proj_/);

    await page.getByTestId('btn-new-demand-for-project').click();
    const demandTitle = `[E2E WF] Demanda ${uniqueSuffix}`;
    await page.getByTestId('input-demand-title').fill(demandTitle);
    await page.getByTestId('input-demand-raw-request').fill('Validação de fluxo de estados até a etapa de modelagem.');
    await page.getByTestId('input-demand-objective').fill('Validar fluxo de governança até modelagem.');
    await page.getByTestId('btn-submit-demand').click();
    await expect(page).toHaveURL(/\/demands\/dem_/);

    // 2. Transições graduais respeitando os pré-requisitos de governança
    const btnAdvance = page.getByTestId('btn-advance-state');
    const stateBadge = page.getByTestId('demand-workspace-state');

    // 2.1 Nova -> Em Clarificação
    await expect(btnAdvance).toContainText(/Avançar para Em Clarificação/i);
    await btnAdvance.click();
    await expect(stateBadge).toHaveText(/Em Clarificação/i);

    // Homologação de Requisitos (APROV-01) na Aba 2 (Governança Bloco 3.8)
    await page.getByTestId('tab-nav-requirements').click();
    await expect(page.getByTestId('tab-requirements')).toBeVisible();
    await expect(page.getByText('Carregando etapa de requisitos...')).not.toBeVisible();

    await page.getByTestId('btn-edit-briefing').click();
    await expect(page.getByText('Editar Briefing Analítico')).toBeVisible();
    await page.locator('input[placeholder*="Últimos 24 meses"]').fill('Exercício 2024');
    await page.locator('input[placeholder*="Mensal por Filial"]').fill('Item por transação');
    await page.locator('button[type="submit"]:has-text("Salvar Alterações")').click();
    await expect(page.getByText('Editar Briefing Analítico')).not.toBeVisible();

    await page.getByTestId('btn-open-homologate-modal').click();
    await expect(page.getByText('Homologação Formal do Levantamento de Requisitos')).toBeVisible();
    await page.locator('form textarea').first().fill('Levantamento homologado para validação do pipeline.');
    await page.locator('form button[type="submit"]:has-text("Homologar Levantamento")').click();
    await expect(page.getByText('Homologação Formal do Levantamento de Requisitos')).not.toBeVisible();
    await expect(page.getByText('Carregando etapa de requisitos...')).not.toBeVisible();
    await expect(page.getByTestId('badge-homologado')).toBeVisible();

    // 2.2 Em Clarificação -> Dados Recebidos
    await page.getByTestId('tab-nav-overview').click();
    await expect(btnAdvance).toContainText(/Avançar para Dados Recebidos/i);
    await btnAdvance.click();
    await expect(stateBadge).toHaveText(/Dados Recebidos/i);

    // 2.3 Pré-requisito de Governança (Unidade 3.3/3.4B): Cadastro de Ativo de Dados na Aba 3
    const tabDataNav = page.getByTestId('tab-nav-data');
    await tabDataNav.click();
    await expect(page.getByTestId('tab-data-assets-container')).toBeVisible();

    await page.getByTestId('btn-open-register-asset').click();
    const sampleCsvPath = path.resolve(process.cwd(), 'tests', 'fixtures', 'synthetic-sample.csv');
    await page.getByTestId('input-caminho-local').fill(sampleCsvPath);
    await page.getByTestId('btn-inspect-file').click();

    await expect(page.getByTestId('inspection-preview-section')).toBeVisible();
    await page.getByTestId('input-origem').fill('Base Sintética Fluxo');
    await page.getByTestId('btn-confirm-register').click();

    await expect(page.getByTestId('data-asset-feedback-alert')).toBeVisible();
    await expect(page.getByTestId('data-assets-list')).toContainText('synthetic-sample.csv');

    // 2.4 Dados Recebidos -> Em Qualidade e Preparação
    await page.getByTestId('tab-nav-overview').click();
    await expect(btnAdvance).toContainText(/Avançar para Em Qualidade e Preparação/i);
    await btnAdvance.click();
    await expect(stateBadge).toHaveText(/Em Qualidade e Preparação/i);

    // 2.5 Pré-requisito de Governança (Unidade 3.4C): Avaliação do Quality Gate na Aba 4
    const tabQualityNav = page.getByTestId('tab-nav-quality');
    await tabQualityNav.click();
    await expect(page.getByTestId('tab-quality-container')).toBeVisible();

    // Executa diagnóstico da base limpa para aprovação do Quality Gate
    const btnRunDiag = page.getByTestId('btn-run-quality-diagnostic');
    await expect(btnRunDiag).toBeVisible();
    await btnRunDiag.click();

    await expect(page.getByTestId('quality-feedback-alert')).toBeVisible();
    const qualityGateBadge = page.getByTestId('badge-quality-gate-status');
    await expect(qualityGateBadge).toHaveText(/LIBERADO/i);

    // Retorna para Aba 1 (Overview) para seguir a esteira operacional
    await page.getByTestId('tab-nav-overview').click();

    // 2.6 Avanço para Em Modelagem e Análise (fronteira operacional com a Governança 3.6)
    await expect(btnAdvance).toContainText(/Avançar para Em Modelagem e Análise/i);
    await btnAdvance.click();
    await expect(stateBadge).toHaveText(/Em Modelagem e Análise/i);

    // 2.7 Governança 3.6C: Bloqueio estrito no servidor ao tentar avançar para Em Validação sem modelo homologado
    await expect(btnAdvance).toContainText(/Avançar para Em Validação/i);
    await btnAdvance.click();
    // Permanece seguramente em Em Modelagem e Análise devido à governança determinística do WorkflowEngine
    await expect(stateBadge).toHaveText(/Em Modelagem e Análise/i);

    // 3. A linha do tempo e os dados operacionais permanecem íntegros
    const timeline = page.getByTestId('demand-workflow-timeline');
    await expect(timeline).toBeVisible();
    await expect(page.getByTestId('demand-raw-request')).toContainText('Validação de fluxo de estados até a etapa de modelagem.');

    // 4. Preservação após Recarregamento da Página
    await page.reload();
    await expect(stateBadge).toHaveText(/Em Modelagem e Análise/i);
    await expect(timeline).toBeVisible();
    await expect(page.getByTestId('demand-raw-request')).toContainText('Validação de fluxo de estados até a etapa de modelagem.');
  });
});
