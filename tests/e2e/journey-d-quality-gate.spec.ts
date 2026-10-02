import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('E2E: Jornada D — Governança de Qualidade, Regras R1–R5 e Quality Gate (Unidade 3.4C.4)', () => {
  test('deve executar o ciclo completo de qualidade: diagnóstico, regras, anomalia manual, deliberação, tratamento, liberação do gate e avanço para modelagem', async ({ page }) => {
    const uniqueSuffix = Date.now().toString().slice(-4);
    const projectName = `[E2E 3.4C.4] Projeto Qualidade ${uniqueSuffix}`;
    const demandTitle = `[E2E 3.4C.4] Demanda Quality Gate ${uniqueSuffix}`;

    // 1. Setup: Criação de Projeto e Demanda
    await page.goto('/projects/new');
    await page.getByTestId('input-project-name').fill(projectName);
    await page.getByTestId('input-project-description').fill('Validação E2E da Jornada D de Qualidade.');
    await page.getByTestId('select-project-status').selectOption('ATIVO');
    await page.getByTestId('btn-submit-project').click();

    await expect(page).toHaveURL(/\/projects\/proj_/);

    await page.getByTestId('btn-new-demand-for-project').click();
    await page.getByTestId('input-demand-title').fill(demandTitle);
    await page.getByTestId('input-demand-raw-request').fill('Base de vendas corporativas para validação de quality gate e deliberações.');
    await page.getByTestId('input-demand-context').fill('Contexto operacional da Jornada D.');
    await page.getByTestId('input-demand-objective').fill('Validar fluxo completo de qualidade, auditoria e Quality Gate.');
    await page.getByTestId('btn-submit-demand').click();

    await expect(page).toHaveURL(/\/demands\/dem_/);
    const stateBadge = page.getByTestId('demand-workspace-state');
    await expect(stateBadge).toHaveText(/Nova/i);

    // 2. Transições sequenciais até a Etapa 2 (Em Qualidade e Preparação)
    // 2.1 Nova -> Em Clarificação
    const btnAdvance = page.getByTestId('btn-advance-state');
    await expect(btnAdvance).toContainText(/Em Clarificação/i);
    await btnAdvance.click();
    await expect(stateBadge).toHaveText(/Em Clarificação/i);

    // 2.2 Delimitação e Homologação Soberana APROV-01 na Aba 2 (Governança Bloco 3.8)
    await page.getByTestId('tab-nav-requirements').click();
    await expect(page.getByTestId('tab-requirements')).toBeVisible();
    await expect(page.getByText('Carregando etapa de requisitos...')).not.toBeVisible();

    await page.getByTestId('btn-edit-briefing').click();
    await expect(page.getByText('Editar Briefing Analítico')).toBeVisible();
    await page.locator('input[placeholder*="Últimos 24 meses"]').fill('Exercício 2024');
    await page.locator('input[placeholder*="Mensal por Filial"]').fill('Transação por Filial');
    await page.locator('button[type="submit"]:has-text("Salvar Alterações")').click();
    await expect(page.getByText('Editar Briefing Analítico')).not.toBeVisible();

    await page.getByTestId('btn-open-homologate-modal').click();
    await expect(page.getByText('Homologação Formal do Levantamento de Requisitos')).toBeVisible();
    await page.locator('form textarea').first().fill('Levantamento homologado para prosseguir com auditoria de qualidade.');
    await page.locator('form button[type="submit"]:has-text("Homologar Levantamento")').click();
    await expect(page.getByText('Homologação Formal do Levantamento de Requisitos')).not.toBeVisible();
    await expect(page.getByText('Carregando etapa de requisitos...')).not.toBeVisible();
    await expect(page.getByTestId('badge-homologado')).toBeVisible();

    // 2.3 Em Clarificação -> Dados Recebidos
    await page.getByTestId('tab-nav-overview').click();
    await expect(btnAdvance).toContainText(/Dados Recebidos/i);
    await btnAdvance.click();
    await expect(stateBadge).toHaveText(/Dados Recebidos/i);

    // 2.3 Cadastro de Ativo de Dados na Aba 3 (obrigatório para avançar para Etapa 2)
    const tabDataNav = page.getByTestId('tab-nav-data');
    await tabDataNav.click();
    await expect(page.getByTestId('tab-data-assets-container')).toBeVisible();

    await page.getByTestId('btn-open-register-asset').click();
    const sampleCsvPath = path.resolve(process.cwd(), 'tests', 'fixtures', 'synthetic-quality-sample.csv');
    await page.getByTestId('input-caminho-local').fill(sampleCsvPath);
    await page.getByTestId('btn-inspect-file').click();

    await expect(page.getByTestId('inspection-preview-section')).toBeVisible();
    await page.getByTestId('input-origem').fill('Controladoria e Vendas');
    await page.getByTestId('btn-confirm-register').click();

    await expect(page.getByTestId('data-asset-feedback-alert')).toBeVisible();
    await expect(page.getByTestId('data-assets-list')).toContainText('synthetic-quality-sample.csv');

    // 2.4 Dados Recebidos -> Em Qualidade e Preparação
    await page.getByTestId('tab-nav-overview').click();
    await expect(btnAdvance).toContainText(/Em Qualidade e Preparação/i);
    await btnAdvance.click();
    await expect(stateBadge).toHaveText(/Em Qualidade e Preparação/i);

    // 3. Entrada na Aba 4 — Qualidade / Anomalias
    const tabQualityNav = page.getByTestId('tab-nav-quality');
    await tabQualityNav.click();
    await expect(page.getByTestId('tab-quality-container')).toBeVisible();

    // 4. Verificação Pré-Diagnóstico
    const qualityGateBadge = page.getByTestId('badge-quality-gate-status');
    await expect(qualityGateBadge).toHaveText(/BLOQUEADO/i);

    const gateReason = page.getByTestId('quality-gate-reason');
    await expect(gateReason).toContainText(/não possui diagnóstico de qualidade executado/i);

    const needDiagBanner = page.getByTestId('next-action-banner-need-diagnostic');
    await expect(needDiagBanner).toBeVisible();
    await expect(needDiagBanner).toContainText(/Executar Primeiro Diagnóstico/i);

    // Confirma que não há botão de avanço com o Gate bloqueado
    await expect(page.getByTestId('btn-banner-advance-demand')).not.toBeVisible();

    // 5. Execução do Primeiro Diagnóstico Determinístico
    const btnRunDiag = page.getByTestId('btn-run-quality-diagnostic');
    await expect(btnRunDiag).toBeVisible();
    await btnRunDiag.click();

    // Aguarda conclusão do diagnóstico
    const qualityFeedback = page.getByTestId('quality-feedback-alert');
    await expect(qualityFeedback).toBeVisible();
    await expect(qualityFeedback).toContainText(/Diagnóstico executado com sucesso/i);

    // Botão muda para Reexecutar
    await expect(btnRunDiag).toContainText(/Reexecutar Diagnóstico/i);

    // O arquivo possui uma linha com nome_cliente vazio, gerando anomalia com severidade PENDENTE
    const pendingKpi = page.getByTestId('kpi-pending-count');
    await expect(pendingKpi).toHaveText(/[1-9]/);

    // O Gate permanece BLOQUEADO devido a anomalias PENDENTES (invariante de proteção humana)
    await expect(qualityGateBadge).toHaveText(/BLOQUEADO/i);
    await expect(gateReason).toContainText(/pendente\(s\) de deliberação humana/i);

    // Banner muda para orientação de pendências
    const pendingBanner = page.getByTestId('next-action-banner-pending');
    await expect(pendingBanner).toBeVisible();
    await expect(pendingBanner).toContainText(/aguardando sua deliberação/i);

    // 6. Inspeção de Verificações V1–V7 no Accordion
    const btnToggleAccordion = page.getByTestId('btn-toggle-diagnostic-details');
    await expect(btnToggleAccordion).toBeVisible();
    await btnToggleAccordion.click();
    await expect(page.getByTestId('diagnostic-verifications-grid')).toBeVisible();

    // 7. Configuração e Avaliação de Regra de Negócio Humana (R2 — Limites Mín/Máx)
    const btnToggleRules = page.getByTestId('btn-toggle-rules-accordion');
    await btnToggleRules.click();

    await page.getByTestId('btn-add-quality-rule').click();
    const ruleModal = page.getByTestId('quality-rule-modal');
    await expect(ruleModal).toBeVisible();

    await page.getByTestId('input-rule-name').fill('R2 - Faturamento Não Negativo');
    await page.getByTestId('input-rule-description').fill('Valida que transações comerciais não possuam faturamento negativo');
    await page.getByTestId('select-rule-type').selectOption('VALOR_MIN_MAX');

    // Preenche campos de R2
    const r2Section = page.getByTestId('rule-fields-r2');
    await expect(r2Section).toBeVisible();
    await r2Section.locator('select').selectOption('faturamento');
    await r2Section.locator('input[type="number"]').first().fill('0');

    await page.getByTestId('btn-confirm-rule-save').click();
    await expect(ruleModal).not.toBeVisible();
    await expect(qualityFeedback).toContainText(/salva com sucesso/i);

    // Confirma que a regra está na lista como ATIVA
    const rulesList = page.getByTestId('quality-rules-list');
    await expect(rulesList).toBeVisible();
    await expect(rulesList).toContainText('R2 - Faturamento Não Negativo');
    await expect(rulesList).toContainText('ATIVA');
    await expect(rulesList).toContainText('v1');

    // 8. Reexecução do Diagnóstico para Avaliar a Regra R2
    await btnRunDiag.click();
    await expect(qualityFeedback).toContainText(/Diagnóstico executado com sucesso/i);

    // 9. Registro de Problema Manual
    await page.getByTestId('btn-open-manual-problem-modal').click();
    const manualModal = page.getByTestId('manual-problem-modal');
    await expect(manualModal).toBeVisible();

    await page.getByTestId('input-manual-problem-title').fill('Inconsistência Cadastral no Cliente 1004');
    await page.getByTestId('select-manual-problem-category').selectOption('ANOMALIA_MANUAL_DECLARADA');
    await page.getByTestId('textarea-manual-problem-description').fill('Razão social registrada como Empresa Delta, mas certidão corporativa indica Delta Logística S.A.');

    await page.getByTestId('btn-confirm-manual-problem').click();
    await expect(manualModal).not.toBeVisible();
    await expect(qualityFeedback).toContainText(/registrada com sucesso/i);

    // Confirma presença da anomalia manual na fila com badge manual
    const queue = page.getByTestId('problem-queue-container');
    await expect(queue).toContainText('Inconsistência Cadastral no Cliente 1004');
    await expect(queue).toContainText('Declarado Manualmente');

    // 10. Deliberação Humana Soberana de Severidade e Ação
    const deliberateModal = page.getByTestId('deliberate-problem-modal');

    // 10.1 Delibera o 1º problema como CRÍTICA
    const btnDelib1 = page.locator('[data-testid^="btn-deliberate-problem-"]').first();
    const testId1 = await btnDelib1.getAttribute('data-testid');
    const probId1 = testId1!.replace('btn-deliberate-problem-', '');

    await btnDelib1.click();
    await expect(deliberateModal).toBeVisible();

    // Testa validação de justificativa curta (< 15 caracteres)
    const textareaJust = page.getByTestId('textarea-justificativa-deliberacao');
    await textareaJust.fill('Curta');
    await expect(page.getByTestId('btn-confirm-deliberation')).toBeDisabled();
    await expect(page.getByTestId('justificativa-char-count')).toContainText('5 / 15');

    // Preenche com valores válidos para problema CRÍTICO
    await page.getByTestId('radio-severity-CRITICA').click();
    await page.getByTestId('select-deliberated-action').selectOption('TRATAR_NO_PIPELINE');
    await textareaJust.fill('Obrigatório tratar registros com ausência de nome no pipeline de transformação.');
    await expect(page.getByTestId('btn-confirm-deliberation')).toBeEnabled();
    await page.getByTestId('btn-confirm-deliberation').click();

    await expect(deliberateModal).not.toBeVisible();
    await expect(page.locator(`[data-testid="btn-update-status-${probId1}"]`)).toBeVisible();

    // 10.2 Delibera o 2º problema como ALTA
    const btnDelib2 = page.locator('[data-testid^="btn-deliberate-problem-"]').first();
    const testId2 = await btnDelib2.getAttribute('data-testid');
    const probId2 = testId2!.replace('btn-deliberate-problem-', '');

    await btnDelib2.click();
    await expect(deliberateModal).toBeVisible();

    await page.getByTestId('radio-severity-ALTA').click();
    await page.getByTestId('select-deliberated-action').selectOption('ACEITAR_COMO_RESTRICAO');
    await page.getByTestId('textarea-justificativa-deliberacao').fill('Valor negativo decorre de estorno contábil auditado e aceito formalmente.');
    await page.getByTestId('btn-confirm-deliberation').click();

    await expect(deliberateModal).not.toBeVisible();
    await expect(page.locator(`[data-testid="btn-update-status-${probId2}"]`)).toBeVisible();

    // 10.3 Delibera os problemas restantes como MÉDIA de forma determinística
    while (await page.locator('[data-testid^="btn-deliberate-problem-"]').count() > 0) {
      const btnDelib = page.locator('[data-testid^="btn-deliberate-problem-"]').first();
      const testId = await btnDelib.getAttribute('data-testid');
      const probId = testId!.replace('btn-deliberate-problem-', '');

      await btnDelib.click();
      await expect(deliberateModal).toBeVisible();

      await page.getByTestId('radio-severity-MEDIA').click();
      await page.getByTestId('select-deliberated-action').selectOption('SOLICITAR_ESCLARECIMENTO');
      await page.getByTestId('textarea-justificativa-deliberacao').fill('Discrepância não afeta as métricas numéricas principais do modelo de BI.');
      await page.getByTestId('btn-confirm-deliberation').click();

      await expect(deliberateModal).not.toBeVisible();
      await expect(page.locator(`[data-testid="btn-update-status-${probId}"]`)).toBeVisible();
    }

    // 11. Validação de Bloqueio por Problemas CRÍTICOS e ALTOS em Aberto
    // Nenhuma pendência de deliberação resta, mas existem problemas Críticos/Altos em status ABERTO
    await expect(pendingKpi).toHaveText('0');
    await expect(qualityGateBadge).toHaveText(/BLOQUEADO/i);
    await expect(gateReason).toContainText(/em aberto\/investigação sem tratamento ou aceite formal/i);

    const criticalBanner = page.getByTestId('next-action-banner-critical');
    await expect(criticalBanner).toBeVisible();
    await expect(criticalBanner).toContainText(/anomalia\(s\) de alto risco em aberto/i);
    await expect(page.getByTestId('btn-banner-advance-demand')).not.toBeVisible();

    // 12. Tratamento Operacional e Aceite como Restrição
    const statusModal = page.getByTestId('update-problem-status-modal');

    // 12.1 Trata o problema crítico (probId1)
    await page.locator(`[data-testid="btn-update-status-${probId1}"]`).click();
    await expect(statusModal).toBeVisible();

    await page.getByTestId('select-new-problem-status').selectOption('TRATADO');
    await page.getByTestId('textarea-status-justificativa').fill('Problema mitigado na etapa de preparação M através de preenchimento padrão.');
    await page.getByTestId('btn-confirm-status-update').click();
    await expect(statusModal).not.toBeVisible();
    await expect(page.locator(`[data-testid="badge-status-${probId1}"]`)).toHaveText(/Tratado/i);

    // 12.2 Atualiza o problema ALTO (probId2) para ACEITO_COMO_RESTRICAO
    await page.locator(`[data-testid="btn-update-status-${probId2}"]`).click();
    await expect(statusModal).toBeVisible();

    await page.getByTestId('select-new-problem-status').selectOption('ACEITO_COMO_RESTRICAO');
    await page.getByTestId('textarea-status-justificativa').fill('Restrição aceita formalmente com a gerência para prosseguimento do projeto.');
    await page.getByTestId('btn-confirm-status-update').click();
    await expect(statusModal).not.toBeVisible();
    await expect(page.locator(`[data-testid="badge-status-${probId2}"]`)).toHaveText(/Aceito como Restrição/i);

    // 13. Verificação de Liberação do Quality Gate
    await expect(qualityGateBadge).toHaveText(/LIBERADO/i);
    await expect(gateReason).toContainText(/foram formalmente aceitos como restrição|foram devidamente deliberados e tratados/i);

    const clearedBanner = page.getByTestId('next-action-banner-cleared');
    await expect(clearedBanner).toBeVisible();
    await expect(clearedBanner).toContainText(/Qualidade Liberada para Modelagem e Análise/i);

    const btnAdvanceFromQuality = page.getByTestId('btn-banner-advance-demand');
    await expect(btnAdvanceFromQuality).toBeVisible();

    // 14. Persistência de Dados após Recarregamento da Página (Reload)
    await page.reload();
    await tabQualityNav.click();

    await expect(page.getByTestId('tab-quality-container')).toBeVisible();
    await expect(qualityGateBadge).toHaveText(/LIBERADO/i);
    await expect(page.getByTestId('next-action-banner-cleared')).toBeVisible();
    await expect(page.getByTestId('btn-banner-advance-demand')).toBeVisible();

    // 15. Avanço da Demanda para Em Modelagem e Análise
    await btnAdvanceFromQuality.click();

    // Valida que a demanda avançou para o próximo estado sequencial do workflow
    await expect(stateBadge).toHaveText(/Em Modelagem e Análise/i);
  });

  test('deve impedir bypass do Quality Gate no servidor se o diagnóstico não estiver liberado', async ({ page }) => {
    const uniqueSuffix = Date.now().toString().slice(-4);
    const projectName = `[E2E BYPASS] Projeto ${uniqueSuffix}`;
    const demandTitle = `[E2E BYPASS] Demanda ${uniqueSuffix}`;

    // 1. Setup: Criação de Projeto e Demanda
    await page.goto('/projects/new');
    await page.getByTestId('input-project-name').fill(projectName);
    await page.getByTestId('select-project-status').selectOption('ATIVO');
    await page.getByTestId('btn-submit-project').click();
    await expect(page).toHaveURL(/\/projects\/proj_/);

    await page.getByTestId('btn-new-demand-for-project').click();
    await page.getByTestId('input-demand-title').fill(demandTitle);
    await page.getByTestId('input-demand-raw-request').fill('Teste de integridade do Quality Gate contra bypass.');
    await page.getByTestId('input-demand-objective').fill('Validar integridade de segurança contra bypass do Quality Gate.');
    await page.getByTestId('btn-submit-demand').click();
    await expect(page).toHaveURL(/\/demands\/dem_/);

    // 2. Avanço até Dados Recebidos e Cadastro de Ativo
    const btnAdvance = page.getByTestId('btn-advance-state');
    await btnAdvance.click(); // -> Em Clarificação
    await expect(page.getByTestId('demand-workspace-state')).toHaveText(/Em Clarificação/i);

    // Homologação de Requisitos (APROV-01)
    await page.getByTestId('tab-nav-requirements').click();
    await expect(page.getByTestId('tab-requirements')).toBeVisible();
    await expect(page.getByText('Carregando etapa de requisitos...')).not.toBeVisible();

    await page.getByTestId('btn-edit-briefing').click();
    await expect(page.getByText('Editar Briefing Analítico')).toBeVisible();
    await page.locator('input[placeholder*="Últimos 24 meses"]').fill('Exercício 2024');
    await page.locator('input[placeholder*="Mensal por Filial"]').fill('Transação por Filial');
    await page.locator('button[type="submit"]:has-text("Salvar Alterações")').click();
    await expect(page.getByText('Editar Briefing Analítico')).not.toBeVisible();

    await page.getByTestId('btn-open-homologate-modal').click();
    await expect(page.getByText('Homologação Formal do Levantamento de Requisitos')).toBeVisible();
    await page.locator('form textarea').first().fill('Homologação de requisitos para teste de integridade contra bypass.');
    await page.locator('form button[type="submit"]:has-text("Homologar Levantamento")').click();
    await expect(page.getByText('Homologação Formal do Levantamento de Requisitos')).not.toBeVisible();
    await expect(page.getByText('Carregando etapa de requisitos...')).not.toBeVisible();
    await expect(page.getByTestId('badge-homologado')).toBeVisible();

    await page.getByTestId('tab-nav-overview').click();
    await btnAdvance.click(); // -> Dados Recebidos
    await expect(page.getByTestId('demand-workspace-state')).toHaveText(/Dados Recebidos/i);

    // Cadastra ativo
    await page.getByTestId('tab-nav-data').click();
    await page.getByTestId('btn-open-register-asset').click();
    const sampleCsvPath = path.resolve(process.cwd(), 'tests', 'fixtures', 'synthetic-quality-sample.csv');
    await page.getByTestId('input-caminho-local').fill(sampleCsvPath);
    await page.getByTestId('btn-inspect-file').click();
    await page.getByTestId('input-origem').fill('TI Sistemas');
    await page.getByTestId('btn-confirm-register').click();
    await expect(page.getByTestId('data-asset-feedback-alert')).toBeVisible();

    // Avança para Em Qualidade e Preparação
    await page.getByTestId('tab-nav-overview').click();
    await btnAdvance.click();
    await expect(page.getByTestId('demand-workspace-state')).toHaveText(/Em Qualidade e Preparação/i);

    // 3. Tenta avançar diretamente pelo header sem executar diagnóstico
    // O próximo estado sequencial no header seria "Avançar para Em Modelagem e Análise"
    await expect(btnAdvance).toContainText(/Em Modelagem e Análise/i);
    await btnAdvance.click();

    // O servidor bloqueia a transição e exibe feedback de erro
    const feedbackAlert = page.getByTestId('workspace-feedback-alert');
    await expect(feedbackAlert).toBeVisible();
    await expect(feedbackAlert).toContainText(/Quality Gate bloqueado|não possui diagnóstico/i);

    // A demanda permanece estritamente em Em Qualidade e Preparação
    await expect(page.getByTestId('demand-workspace-state')).toHaveText(/Em Qualidade e Preparação/i);
  });

  test('deve permitir desativação, reativação e edição com versionamento de regras de negócio', async ({ page }) => {
    const uniqueSuffix = Date.now().toString().slice(-4);
    const projectName = `[E2E REGRAS] Projeto ${uniqueSuffix}`;
    const demandTitle = `[E2E REGRAS] Demanda ${uniqueSuffix}`;

    await page.goto('/projects/new');
    await page.getByTestId('input-project-name').fill(projectName);
    await page.getByTestId('select-project-status').selectOption('ATIVO');
    await page.getByTestId('btn-submit-project').click();

    await page.getByTestId('btn-new-demand-for-project').click();
    await page.getByTestId('input-demand-title').fill(demandTitle);
    await page.getByTestId('input-demand-raw-request').fill('Teste de regras humanas R1–R5.');
    await page.getByTestId('btn-submit-demand').click();

    // Cadastra ativo
    await page.getByTestId('tab-nav-data').click();
    await page.getByTestId('btn-open-register-asset').click();
    const sampleCsvPath = path.resolve(process.cwd(), 'tests', 'fixtures', 'synthetic-quality-sample.csv');
    await page.getByTestId('input-caminho-local').fill(sampleCsvPath);
    await page.getByTestId('btn-inspect-file').click();
    await page.getByTestId('input-origem').fill('Equipe BI');
    await page.getByTestId('btn-confirm-register').click();
    await expect(page.getByTestId('data-asset-feedback-alert')).toBeVisible();

    // Acessa Aba 4
    await page.getByTestId('tab-nav-quality').click();
    await expect(page.getByTestId('tab-quality-container')).toBeVisible();

    // Cria regra R3 (Valores Permitidos)
    await page.getByTestId('btn-toggle-rules-accordion').click();
    await page.getByTestId('btn-add-quality-rule').click();

    const ruleModal = page.getByTestId('quality-rule-modal');
    await expect(ruleModal).toBeVisible();

    await page.getByTestId('input-rule-name').fill('R3 - Segmentos Permitidos');
    await page.getByTestId('select-rule-type').selectOption('VALORES_PERMITIDOS');

    const r3Section = page.getByTestId('rule-fields-r3');
    await expect(r3Section).toBeVisible();
    await r3Section.locator('select').selectOption('segmento');
    await r3Section.locator('input[type="text"]').fill('Varejo, Industria, Servicos');

    await page.getByTestId('btn-confirm-rule-save').click();
    await expect(ruleModal).not.toBeVisible();

    const rulesList = page.getByTestId('quality-rules-list');
    await expect(rulesList).toContainText('R3 - Segmentos Permitidos');
    await expect(rulesList).toContainText('ATIVA');
    await expect(rulesList).toContainText('v1');

    // Desativa a regra (toggle)
    const btnToggleStatus = page.locator('[data-testid^="btn-toggle-rule-status-"]').first();
    await btnToggleStatus.click();
    await expect(rulesList).toContainText('INATIVA');

    // Reativa a regra (toggle)
    await btnToggleStatus.click();
    await expect(rulesList).toContainText('ATIVA');

    // Edita a regra com alteração semântica de parâmetros (adicionando valor permitido) -> bump para v2
    const btnEditRule = page.locator('[data-testid^="btn-edit-rule-"]').first();
    await btnEditRule.click();
    await expect(ruleModal).toBeVisible();

    await r3Section.locator('input[type="text"]').fill('Varejo, Industria, Servicos, E-commerce');
    await page.getByTestId('input-rule-description').fill('Descrição atualizada com novo segmento permitido.');
    await page.getByTestId('btn-confirm-rule-save').click();
    await expect(ruleModal).not.toBeVisible();

    // Verifica que o bump para v2 foi registrado com sucesso
    await expect(rulesList).toContainText('v2');
  });
});
