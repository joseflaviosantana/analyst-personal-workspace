import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('E2E: Jornada F — Interface Operacional da Modelagem Analítica, Copiloto Proativo e Governança (Subunidade 3.6D)', () => {
  test('deve executar o fluxo completo da Aba 6: dataset autorizado, criação de modelo estrela, estruturação, diagnósticos determinísticos, resolução de bloqueios, homologação humana, revogação e avanço no Workflow', async ({ page }) => {
    test.setTimeout(120000); // 2 minutos para fluxo E2E completo

    const uniqueSuffix = Date.now().toString().slice(-4);
    const projectName = `[E2E 3.6D] Projeto Modelagem ${uniqueSuffix}`;
    const demandTitle = `[E2E 3.6D] Demanda Modelagem Dimensional ${uniqueSuffix}`;

    // 1. Setup: Criação de Projeto e Demanda
    await page.goto('/projects/new');
    await page.getByTestId('input-project-name').fill(projectName);
    await page.getByTestId('input-project-description').fill('Validação E2E da Jornada F de Modelagem e Governança.');
    await page.getByTestId('select-project-status').selectOption('ATIVO');
    await page.getByTestId('btn-submit-project').click();

    await expect(page).toHaveURL(/\/projects\/proj_/);

    await page.getByTestId('btn-new-demand-for-project').click();
    await page.getByTestId('input-demand-title').fill(demandTitle);
    await page.getByTestId('input-demand-raw-request').fill('Base de dados para estruturação de modelo estrela e governança.');
    await page.getByTestId('input-demand-context').fill('Contexto operacional da Jornada F de Modelagem.');
    await page.getByTestId('input-demand-objective').fill('Validar fluxo operacional e governança da Aba 6.');
    await page.getByTestId('btn-submit-demand').click();

    await expect(page).toHaveURL(/\/demands\/dem_/);
    const stateBadge = page.getByTestId('demand-workspace-state');
    await expect(stateBadge).toHaveText(/Nova/i);

    // 2. Transições sequenciais até a Etapa 2 (Em Qualidade e Preparação)
    const btnAdvance = page.getByTestId('btn-advance-state');
    await expect(btnAdvance).toContainText(/Em Clarificação/i);
    await btnAdvance.click();
    await expect(stateBadge).toHaveText(/Em Clarificação/i);

    await expect(btnAdvance).toContainText(/Dados Recebidos/i);
    await btnAdvance.click();
    await expect(stateBadge).toHaveText(/Dados Recebidos/i);

    // 2.1 Cadastro do Ativo de Dados Bruto na Aba 3
    const tabDataNav = page.getByTestId('tab-nav-data');
    await tabDataNav.click();
    await expect(page.getByTestId('tab-data-assets-container')).toBeVisible();

    await page.getByTestId('btn-open-register-asset').click();
    const rawCsvPath = path.resolve(process.cwd(), 'tests', 'fixtures', 'synthetic-derived-sample.csv');
    await page.getByTestId('input-caminho-local').fill(rawCsvPath);
    await page.getByTestId('btn-inspect-file').click();

    await expect(page.getByTestId('inspection-preview-section')).toBeVisible();
    await page.getByTestId('input-origem').fill('ERP Corporativo');
    await page.getByTestId('input-granularidade').fill('Item por transação de venda corporativa');
    await page.getByTestId('btn-confirm-register').click();

    await expect(page.getByTestId('data-asset-feedback-alert')).toBeVisible();
    await expect(page.getByTestId('data-assets-list')).toContainText('synthetic-derived-sample.csv');

    // 2.2 Transição para Em Qualidade e Preparação
    await page.getByTestId('tab-nav-overview').click();
    await expect(btnAdvance).toContainText(/Em Qualidade e Preparação/i);
    await btnAdvance.click();
    await expect(stateBadge).toHaveText(/Em Qualidade e Preparação/i);

    // 2.3 Executar Diagnóstico de Qualidade na Aba 4
    await page.getByTestId('tab-nav-quality').click();
    await expect(page.getByTestId('tab-quality-container')).toBeVisible();
    await page.getByTestId('btn-run-quality-diagnostic').click();
    await expect(page.getByTestId('quality-feedback-alert')).toContainText(/Diagnóstico executado com sucesso/i);

    // 2.4 Autorizar Dataset na Aba 5 (Preparação)
    const tabPrepNav = page.getByTestId('tab-nav-transformation');
    await tabPrepNav.click();
    await expect(page.getByTestId('tab-preparation-container')).toBeVisible();

    // Autoriza Dataset Formalmente direto do ativo limpo com diagnóstico
    await page.getByTestId('btn-open-authorize-modal').click();
    await expect(page.getByTestId('authorize-dataset-modal')).toBeVisible();
    await page.getByTestId('input-auth-version').fill('v1.0-modelagem');
    await page.getByTestId('input-auth-justification').fill('Homologação formal do dataset para modelagem dimensional estrela.');
    await page.getByTestId('btn-submit-authorize-dataset').click();

    await expect(page.getByTestId('authorize-dataset-modal')).not.toBeVisible();
    await expect(page.getByTestId('prep-dataset-authorization-section')).toBeVisible();
    await expect(page.getByTestId('prep-dataset-authorization-section')).toContainText(/Vigente/i);

    // 2.5 Avanço para EM_MODELAGEM_E_ANALISE
    await page.getByTestId('tab-nav-overview').click();
    await expect(btnAdvance).toContainText(/Em Modelagem e Análise/i);
    await btnAdvance.click();
    await expect(stateBadge).toHaveText(/Em Modelagem e Análise/i);

    // 3. Entrada na Aba 6 — Modelagem
    const tabModelingNav = page.getByTestId('tab-nav-planning');
    await expect(tabModelingNav).toBeVisible();
    await expect(tabModelingNav).toContainText('6. Modelagem');
    await tabModelingNav.click();

    // 4. Verificação do Container da Aba 6 e Copiloto Proativo no Estado Inicial
    await expect(page.getByTestId('tab-modeling-container')).toBeVisible();
    await expect(page.getByTestId('modeling-banner-no-model')).toBeVisible();
    await expect(page.getByTestId('modeling-banner-no-model')).toContainText(/Próxima Ação: Criar Modelo Analítico/i);

    // 4.1 Teste de Bloqueio no WorkflowEngine: Tentar avançar sem homologação deve ser barrado
    await page.getByTestId('tab-nav-overview').click();
    await expect(btnAdvance).toContainText(/Em Validação/i);
    await btnAdvance.click();
    // Mensagem de erro do WorkflowEngine
    await expect(page.getByTestId('workspace-feedback-alert')).toBeVisible();
    await expect(page.getByTestId('workspace-feedback-alert')).toContainText(/homologado|modelo/i);
    await expect(stateBadge).toHaveText(/Em Modelagem e Análise/i);

    // Retorna para a Aba 6
    await tabModelingNav.click();

    // 5. Criação do Modelo Analítico com Fato Inicial a partir do Dataset Autorizado
    await page.getByTestId('btn-banner-create-model').click();
    await expect(page.getByTestId('create-model-modal')).toBeVisible();

    await page.getByTestId('input-model-name').fill('Modelo Vendas Star');
    await page.getByTestId('input-model-description').fill('Modelo dimensional de vendas no grão item/transação corporativo.');
    await page.getByTestId('select-model-architecture').selectOption('ESTRELA');
    await page.getByTestId('btn-submit-create-model').click();

    await expect(page.getByTestId('create-model-modal')).not.toBeVisible();

    // Comprova modelo criado e renderizado no Header Card
    await expect(page.getByTestId('model-header-card')).toBeVisible();
    await expect(page.getByTestId('model-title')).toHaveText('Modelo Vendas Star');
    await expect(page.getByTestId('badge-model-rascunho')).toBeVisible();
    await expect(page.getByTestId('stat-total-facts')).toHaveText('1');

    // 6. Verificação do Diagnóstico Determinístico e Cenário com BLOQUEIO
    // Inicialmente, a entidade Fato não tem chave primária (M-03) e não há métricas (M-05)
    await expect(page.getByTestId('compliance-evaluation-section')).toBeVisible();
    await expect(page.getByTestId('badge-count-blocks')).toContainText(/[1-9]/);

    // Painel de governança deve indicar que homologação está bloqueada
    await expect(page.getByTestId('homologation-governance-panel')).toBeVisible();
    await expect(page.getByTestId('btn-open-homologate-model')).toBeDisabled();

    // 7. Resolução de Bloqueios Determinísticos
    // 7.1 Configurar Atributos da Entidade Fato (Definir Chave Primária)
    const btnConfigureFactAttrs = page.locator('[data-testid^="btn-configure-attributes-"]').first();
    await btnConfigureFactAttrs.click();
    await expect(page.getByTestId('configure-attributes-modal')).toBeVisible();

    // Define o primeiro atributo como CHAVE_PRIMARIA
    const selectFirstAttrRole = page.locator('[data-testid^="select-attr-role-"]').first();
    await selectFirstAttrRole.selectOption('CHAVE_PRIMARIA');
    await page.getByTestId('btn-submit-configure-attributes').click();

    await expect(page.getByTestId('configure-attributes-modal')).not.toBeVisible();
    await expect(page.getByTestId('modeling-feedback-alert')).toBeVisible();

    // 7.2 Cadastrar Métrica Analítica Declarativa (M-05)
    await page.getByTestId('btn-open-create-metric').click();
    await expect(page.getByTestId('create-metric-modal')).toBeVisible();

    await page.getByTestId('input-metric-name').fill('Faturamento Bruto');
    await page.getByTestId('input-metric-formula').fill('SUM(Fato[valor])');
    await page.getByTestId('select-metric-aggregation').selectOption('SOMA');
    await page.getByTestId('select-metric-additivity').selectOption('TOTALMENTE_ADITIVA');
    await page.getByTestId('select-metric-unit').selectOption('MOEDA');
    await page.getByTestId('input-metric-description').fill('Faturamento consolidado bruto. Base de reconciliação: ERP Financeiro.');
    await page.getByTestId('btn-submit-create-metric').click();

    await expect(page.getByTestId('create-metric-modal')).not.toBeVisible();
    await expect(page.getByTestId('stat-total-metrics')).toHaveText('1');

    // 7.3 Especificar Dimensão Calendário
    await page.getByTestId('btn-open-specify-calendar').click();
    await expect(page.getByTestId('specify-calendar-modal')).toBeVisible();
    await page.getByTestId('input-calendar-name').fill('DimCalendario');
    await page.getByTestId('btn-submit-specify-calendar').click();

    await expect(page.getByTestId('specify-calendar-modal')).not.toBeVisible();
    await expect(page.getByTestId('stat-total-dimensions')).toHaveText('1');

    // 7.4 Verificação da Regra M-11: Dimensão criada sem relacionamento gera ALERTA_CRITICO determinístico
    await page.getByTestId('btn-reevaluate-compliance').click();
    await expect(page.getByTestId('badge-count-critical-alerts')).toContainText(/1 Alerta/i);
    await expect(page.getByTestId('diagnostic-card-M-11')).toBeVisible();
    await expect(page.getByTestId('diagnostic-card-M-11')).toContainText(/DimCalendario/i);

    // 7.5 Estabelecer Relacionamento Analítico via UI: Fato Vendas -> DimCalendario
    await page.getByTestId('btn-open-add-relationship').click();
    await expect(page.getByTestId('add-relationship-modal')).toBeVisible();

    const sourceEntitySelect = page.getByTestId('select-rel-source-entity');
    const sourceEntOptions = await sourceEntitySelect.locator('option').allInnerTexts();
    const factEntOpt = sourceEntOptions.find((o) => /Fato/i.test(o)) ?? sourceEntOptions[0];
    await sourceEntitySelect.selectOption({ label: factEntOpt });

    const targetEntitySelect = page.getByTestId('select-rel-target-entity');
    const targetEntOptions = await targetEntitySelect.locator('option').allInnerTexts();
    const calEntOpt = targetEntOptions.find((o) => /DimCalendario/i.test(o)) ?? targetEntOptions[0];
    await targetEntitySelect.selectOption({ label: calEntOpt });

    const sourceAttrSelect = page.getByTestId('select-rel-source-attr');
    const sourceOptions = await sourceAttrSelect.locator('option').allInnerTexts();
    const dateOption = sourceOptions.find((opt) => /data/i.test(opt));
    if (dateOption) {
      await sourceAttrSelect.selectOption({ label: dateOption });
    }

    const targetAttrSelect = page.getByTestId('select-rel-target-attr');
    const targetOptions = await targetAttrSelect.locator('option').allInnerTexts();
    const targetDateOption = targetOptions.find((opt) => /data/i.test(opt));
    if (targetDateOption) {
      await targetAttrSelect.selectOption({ label: targetDateOption });
    }

    await page.getByTestId('btn-submit-add-relationship').click();
    await expect(page.getByTestId('add-relationship-modal')).not.toBeVisible();
    await expect(page.getByTestId('stat-total-relationships')).toHaveText('1');

    // 8. Reavaliação de Conformidade & Prontidão
    await page.getByTestId('btn-reevaluate-compliance').click();

    // Comprova que tanto os bloqueios impeditivos quanto os alertas críticos de conectividade foram eliminados
    await expect(page.getByTestId('badge-count-blocks')).toHaveText(/0 Bloqueio/i);
    await expect(page.getByTestId('badge-count-critical-alerts')).toHaveText(/0 Alerta/i);
    await expect(page.getByTestId('btn-open-homologate-model')).toBeEnabled();

    // 9. Homologação Humana Formal (Gate de Governança 3.6C / 3.6D)
    await page.getByTestId('btn-open-homologate-model').click();
    await expect(page.getByTestId('homologate-model-modal')).toBeVisible();

    // Preenche justificativa humana com mais de 15 caracteres
    await page.getByTestId('input-homologation-justification').fill('Modelo analítico devidamente verificado, normalizado em estrela e pronto para a esteira de validação.');
    await page.getByTestId('btn-submit-homologate-model').click();

    await expect(page.getByTestId('homologate-model-modal')).not.toBeVisible();

    // Comprova homologação vigente no Header Card e Governança
    await expect(page.getByTestId('badge-model-homologated-vigente')).toBeVisible();
    await expect(page.getByTestId('modeling-banner-homologated')).toBeVisible();
    await expect(page.getByTestId('panel-evidence-homologated')).toBeVisible();

    // 10. Teste de Revogação Formal e Invalidação da Homologação
    await page.getByTestId('btn-open-revoke-homologation').click();
    await expect(page.getByTestId('revoke-homologation-modal')).toBeVisible();

    await page.getByTestId('input-revoke-justification').fill('Revogação temporária para acréscimo de atributos dimensionais solicitados pelo cliente.');
    await page.getByTestId('btn-submit-revoke-homologation').click();

    await expect(page.getByTestId('revoke-homologation-modal')).not.toBeVisible();

    // Comprova status revogado
    await expect(page.getByTestId('badge-model-revoked')).toBeVisible();

    // 10.1 WorkflowEngine deve barrar avanço novamente enquanto revogado
    await page.getByTestId('tab-nav-overview').click();
    await btnAdvance.click();
    await expect(page.getByTestId('workspace-feedback-alert')).toContainText(/homologado|modelo/i);

    // Retorna para a Aba 6 e Re-homologa o Modelo
    await tabModelingNav.click();
    await page.getByTestId('btn-open-homologate-model').click();
    await expect(page.getByTestId('homologate-model-modal')).toBeVisible();
    await page.getByTestId('input-homologation-justification').fill('Modelo analítico re-homologado formalmente com todas as especificações atendidas.');
    await page.getByTestId('btn-submit-homologate-model').click();

    await expect(page.getByTestId('homologate-model-modal')).not.toBeVisible();
    await expect(page.getByTestId('badge-model-homologated-vigente')).toBeVisible();

    // 11. Avanço Autorizado no Workflow: Modelagem -> Em Validação
    await page.getByTestId('tab-nav-overview').click();
    await expect(btnAdvance).toContainText(/Em Validação/i);
    await btnAdvance.click();

    // Comprova transição factualmente aceita e consumada pelo WorkflowEngine
    await expect(stateBadge).toHaveText(/Em Validação/i);

    // 12. Validação Gate 2B.2: Ao retornar para a Modelagem já em "Em Validação", o CTA de avanço NÃO deve ser reexibido
    await tabModelingNav.click();
    await expect(page.getByTestId('badge-model-homologated-vigente')).toBeVisible();
    await expect(page.getByTestId('btn-advance-from-panel')).not.toBeVisible();
    await expect(page.getByTestId('btn-open-revoke-homologation')).toBeVisible();

    // 13. Validação Gate 2B.2: Dicionário Pedagógico no Copiloto exibe dica específica do conceito ativo
    const btnConceptCalendar = page.getByTestId('btn-concept-dimensao-calendario');
    if (await btnConceptCalendar.isVisible()) {
      await btnConceptCalendar.click();
      await expect(page.getByTestId('copilot-concept-tip')).toContainText(/ordenação de nomes de meses/i);
    }
  });
});
