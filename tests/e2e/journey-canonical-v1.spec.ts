import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('E2E: Jornada Canônica Integral Pré-V1 (Ciclo Completo 11 Abas + Governança) [@golden-flow]', () => {
  test('deve percorrer o ciclo profissional completo da Demanda: Nova Demanda -> Requisitos -> Dados -> Qualidade -> Preparação -> Modelagem -> Dashboard/DAX -> Evidências -> Validação -> Entregáveis/Aceite -> Encerramento -> Dossiê -> STAR -> APROV-10 -> Invalidação -> Re-homologação -> Exportação -> Memória Operacional', async ({ page }) => {
    test.setTimeout(180000); // 3 minutos para jornada completa

    const uniqueSuffix = Date.now().toString().slice(-4);
    const projectName = `[E2E V1] Programa Escolas Conectadas ${uniqueSuffix}`;
    const demandTitle = `[E2E V1] Análise de Evasão Escolar e Desempenho Acadêmico ${uniqueSuffix}`;

    // =========================================================================
    // 1. SETUP: CRIAÇÃO DE PROJETO E DEMANDA
    // =========================================================================
    await page.goto('/projects/new');
    await page.getByTestId('input-project-name').fill(projectName);
    await page.getByTestId('input-project-description').fill('Iniciativa analítica e pedagógica para redução da evasão escolar.');
    await page.getByTestId('select-project-status').selectOption('ATIVO');
    await page.getByTestId('btn-submit-project').click();

    await expect(page).toHaveURL(/\/projects\/proj_/);

    await page.getByTestId('btn-new-demand-for-project').click();
    await page.getByTestId('input-demand-title').fill(demandTitle);
    await page.getByTestId('input-demand-raw-request').fill('Identificar fatores associados à evasão escolar e desenhar painel de monitoramento preventivo para gestores pedagógicos.');
    await page.getByTestId('input-demand-context').fill('Secretaria de Educação buscando redução da evasão no ciclo final do ensino fundamental.');
    await page.getByTestId('input-demand-objective').fill('Modelar indicadores de frequência e notas por série e turno para intervenção precoce.');
    await page.getByTestId('btn-submit-demand').click();

    await expect(page).toHaveURL(/\/demands\/dem_/);
    const stateBadge = page.getByTestId('demand-workspace-state');
    await expect(stateBadge).toHaveText(/Nova/i);

    // =========================================================================
    // 2. TRANSIÇÃO PARA EM CLARIFICAÇÃO E GESTÃO DE REQUISITOS (ABA 2)
    // =========================================================================
    const btnAdvance = page.getByTestId('btn-advance-state');
    await expect(btnAdvance).toContainText(/Em Clarificação/i);
    await btnAdvance.click();
    await expect(stateBadge).toHaveText(/Em Clarificação/i);

    // Navega para a Aba 2: Requisitos
    const tabReqNav = page.getByTestId('tab-nav-requirements');
    await tabReqNav.click();
    await expect(page.getByTestId('tab-requirements')).toBeVisible();
    await expect(page.getByText('Carregando etapa de requisitos...')).not.toBeVisible();

    // 2.1 Cadastra Requisito de Negócio
    await page.getByTestId('btn-add-requirement').click();
    await expect(page.getByText('Novo Requisito Analítico')).toBeVisible();
    await page.locator('form input[type="text"]').first().fill('Taxa de Evasão por Série e Turno');
    await page.locator('form textarea').first().fill('Calcular a taxa de abandono discriminada por turno matutino/vespertino.');
    await page.locator('form select').first().selectOption('METRICA_KPI');
    await page.locator('form button[type="submit"]:has-text("Salvar Requisito")').click();
    await expect(page.getByText('Novo Requisito Analítico')).not.toBeVisible();
    await expect(page.getByText('Carregando etapa de requisitos...')).not.toBeVisible();
    await expect(page.getByTestId('requirements-cards-grid')).toContainText('Taxa de Evasão por Série e Turno');

    // 2.2 Delimitação Estruturada de Período e Granularidade no Briefing
    await page.getByTestId('btn-edit-briefing').click();
    await expect(page.getByText('Editar Briefing Analítico')).toBeVisible();
    await page.locator('input[placeholder*="Últimos 24 meses"]').fill('Ano Letivo 2024');
    await page.locator('input[placeholder*="Mensal por Filial"]').fill('Aluno por Turma e Bimestre');
    await page.locator('button[type="submit"]:has-text("Salvar Alterações")').click();
    await expect(page.getByText('Editar Briefing Analítico')).not.toBeVisible();
    await expect(page.getByTestId('briefing-periodo')).toContainText('Ano Letivo 2024');

    // 2.3 Cadastra Pergunta de Clarificação
    await page.getByTestId('btn-add-question').click();
    await expect(page.getByText('Nova Pergunta de Clarificação')).toBeVisible();
    await page.locator('form textarea').first().fill('Como são classificados os alunos transferidos durante o ano letivo?');
    await page.locator('form input[type="text"]').first().fill('Definição de regra no pipeline para filtrar matrículas');
    await page.locator('form button[type="submit"]:has-text("Salvar Pergunta")').click();
    await expect(page.getByText('Nova Pergunta de Clarificação')).not.toBeVisible();
    await expect(page.getByText('Carregando etapa de requisitos...')).not.toBeVisible();
    await expect(page.getByTestId('questions-list')).toContainText('Como são classificados os alunos transferidos durante o ano letivo?');

    // 2.3 Despacha Pergunta e Registra Resposta
    await page.locator('button:has-text("Enviar")').first().click();
    await expect(page.getByText('Carregando etapa de requisitos...')).not.toBeVisible();
    await expect(page.locator('button:has-text("Enviar")')).not.toBeVisible();

    await page.locator('button:has-text("Registrar Resposta")').first().click();
    await expect(page.getByText('Registrar Resposta do Contratante')).toBeVisible();
    await page.locator('form textarea').first().fill('Alunos transferidos não contam como evasão, mas devem ser sinalizados separadamente.');
    await page.locator('form input[placeholder*="Mariana Silva"]').fill('Coordenadoria de Matrículas');
    await page.locator('form button[type="submit"]:has-text("Registrar Resposta")').click();
    await expect(page.getByText('Registrar Resposta do Contratante')).not.toBeVisible();
    await expect(page.getByText('Carregando etapa de requisitos...')).not.toBeVisible();

    // 2.4 Homologação Formal dos Requisitos (APROV-01)
    await page.getByTestId('btn-open-homologate-modal').click();
    await expect(page.getByText('Homologação Formal do Levantamento de Requisitos')).toBeVisible();
    await page.locator('form textarea').first().fill('Levantamento analítico concluído com sucesso e alinhado com a diretoria pedagógica.');
    await page.locator('form button[type="submit"]:has-text("Homologar Levantamento")').click();
    await expect(page.getByText('Homologação Formal do Levantamento de Requisitos')).not.toBeVisible();
    await expect(page.getByText('Carregando etapa de requisitos...')).not.toBeVisible();
    await expect(page.getByTestId('badge-homologado')).toBeVisible();

    // 2.5 Avanço para Dados Recebidos
    await page.getByTestId('tab-nav-overview').click();
    await expect(btnAdvance).toContainText(/Dados Recebidos/i);
    await btnAdvance.click();
    await expect(stateBadge).toHaveText(/Dados Recebidos/i);

    // =========================================================================
    // 3. ATIVOS DE DADOS (ABA 3) COM SHA-256 E PROFILING
    // =========================================================================
    const tabDataNav = page.getByTestId('tab-nav-data');
    await tabDataNav.click();
    await expect(page.getByTestId('tab-data-assets-container')).toBeVisible();

    await page.getByTestId('btn-open-register-asset').click();
    const fixturePath = path.resolve(process.cwd(), 'tests', 'fixtures', 'synthetic-evasao-escolar.csv');
    await page.getByTestId('input-caminho-local').fill(fixturePath);
    await page.getByTestId('btn-inspect-file').click();

    await expect(page.getByTestId('inspection-preview-section')).toBeVisible();
    await page.getByTestId('input-origem').fill('Secretaria Municipal de Educação');
    await page.getByTestId('input-granularidade').fill('Um registro por aluno matriculado no ano letivo');
    await page.getByTestId('btn-confirm-register').click();

    await expect(page.getByTestId('data-asset-feedback-alert')).toBeVisible();
    await expect(page.getByTestId('data-assets-list')).toContainText('synthetic-evasao-escolar.csv');

    // Avanço para Em Qualidade e Preparação
    await page.getByTestId('tab-nav-overview').click();
    await expect(btnAdvance).toContainText(/Em Qualidade e Preparação/i);
    await btnAdvance.click();
    await expect(stateBadge).toHaveText(/Em Qualidade e Preparação/i);

    // =========================================================================
    // 4. QUALIDADE DE DADOS & QUALITY GATE (ABA 4)
    // =========================================================================
    await page.getByTestId('tab-nav-quality').click();
    await expect(page.getByTestId('tab-quality-container')).toBeVisible();
    await page.getByTestId('btn-run-quality-diagnostic').click();
    await expect(page.getByTestId('quality-feedback-alert')).toContainText(/Diagnóstico executado com sucesso/i);

    // =========================================================================
    // 5. PREPARAÇÃO & DATASET AUTORIZADO (ABA 5)
    // =========================================================================
    const tabPrepNav = page.getByTestId('tab-nav-transformation');
    await tabPrepNav.click();
    await expect(page.getByTestId('tab-preparation-container')).toBeVisible();

    await page.getByTestId('btn-open-authorize-modal').click();
    await expect(page.getByTestId('authorize-dataset-modal')).toBeVisible();
    await page.getByTestId('input-auth-version').fill('v1.0-academico');
    await page.getByTestId('input-auth-justification').fill('Dataset escolar auditado e autorizado formalmente para modelagem dimensional de evasão.');
    await page.getByTestId('btn-submit-authorize-dataset').click();

    await expect(page.getByTestId('authorize-dataset-modal')).not.toBeVisible();
    await expect(page.getByTestId('prep-dataset-authorization-section')).toContainText(/Vigente/i);

    // Avanço para Em Modelagem e Análise
    await page.getByTestId('tab-nav-overview').click();
    await expect(btnAdvance).toContainText(/Em Modelagem e Análise/i);
    await btnAdvance.click();
    await expect(stateBadge).toHaveText(/Em Modelagem e Análise/i);

    // =========================================================================
    // 6. MODELAGEM ANALÍTICA DIMENSIONAL & APROV-05 (ABA 6)
    // =========================================================================
    const tabModelingNav = page.getByTestId('tab-nav-planning');
    await tabModelingNav.click();
    await expect(page.getByTestId('tab-modeling-container')).toBeVisible();

    // Cria modelo estrela
    await page.getByTestId('btn-banner-create-model').click();
    await expect(page.getByTestId('create-model-modal')).toBeVisible();
    await page.getByTestId('input-model-name').fill('Modelo Evasão Star');
    await page.getByTestId('input-model-description').fill('Modelo dimensional de matrículas e frequência escolar.');
    await page.getByTestId('select-model-architecture').selectOption('ESTRELA');
    await page.getByTestId('btn-submit-create-model').click();
    await expect(page.getByTestId('create-model-modal')).not.toBeVisible();

    // Define chave primária na entidade fato
    const btnConfigureFactAttrs = page.locator('[data-testid^="btn-configure-attributes-"]').first();
    await btnConfigureFactAttrs.click();
    await expect(page.getByTestId('configure-attributes-modal')).toBeVisible();
    const selectFirstAttrRole = page.locator('[data-testid^="select-attr-role-"]').first();
    await selectFirstAttrRole.selectOption('CHAVE_PRIMARIA');
    await page.getByTestId('btn-submit-configure-attributes').click();
    await expect(page.getByTestId('configure-attributes-modal')).not.toBeVisible();

    // Cria métrica analítica
    await page.getByTestId('btn-open-create-metric').click();
    await expect(page.getByTestId('create-metric-modal')).toBeVisible();
    await page.getByTestId('input-metric-name').fill('Taxa de Evasão');
    await page.getByTestId('input-metric-formula').fill('DIVIDE(COUNTROWS(FILTER(fMatriculas, fMatriculas[status] = "EVADIDO")), COUNTROWS(fMatriculas), 0)');
    await page.getByTestId('select-metric-aggregation').selectOption('MEDIA');
    await page.getByTestId('select-metric-additivity').selectOption('NAO_ADITIVA');
    await page.getByTestId('select-metric-unit').selectOption('PERCENTUAL');
    await page.getByTestId('input-metric-description').fill('Proporção de evasão de alunos matriculados.');
    await page.getByTestId('btn-submit-create-metric').click();
    await expect(page.getByTestId('create-metric-modal')).not.toBeVisible();

    // Homologa o Modelo (APROV-05)
    await page.getByTestId('btn-reevaluate-compliance').click();
    await expect(page.getByTestId('badge-count-blocks')).toHaveText(/0 Bloqueio/i);
    await expect(page.getByTestId('btn-open-homologate-model')).toBeEnabled();

    await page.getByTestId('btn-open-homologate-model').click();
    await expect(page.getByTestId('homologate-model-modal')).toBeVisible();
    await page.getByTestId('input-homologation-justification').fill('Modelo analítico de evasão escolar verificado e normalizado em estrela.');
    await page.getByTestId('btn-submit-homologate-model').click();
    await expect(page.getByTestId('homologate-model-modal')).not.toBeVisible();
    await expect(page.getByTestId('badge-model-homologated-vigente')).toBeVisible();

    // Avanço para Em Validação
    await page.getByTestId('tab-nav-overview').click();
    await expect(btnAdvance).toContainText(/Em Validação/i);
    await btnAdvance.click();
    await expect(stateBadge).toHaveText(/Em Validação/i);

    // =========================================================================
    // 7. POWER BI & DAX — GOVERNANÇA E ISENÇÃO EXCEL-ONLY D-08 (ABA 7)
    // =========================================================================
    const tabPbiNav = page.getByTestId('tab-nav-powerbi');
    await tabPbiNav.click();
    await expect(page.getByTestId('tab-dashboard-container')).toBeVisible();

    // Formaliza isenção D-08 (Excel-Only / Entrega Tabular)
    await page.getByTestId('btn-open-declare-exemption').click();
    await page.getByTestId('textarea-justificativa-isencao').fill('Demanda com consumo direto em planilha e painel analítico compartilhado, sem necessidade de relatório Power BI publicado.');
    await page.getByTestId('btn-submit-declare-exemption').click();
    await expect(page.getByTestId('tab-dashboard-container')).toContainText(/Regra D-08 Homologada/i);

    // =========================================================================
    // 8. EVIDÊNCIAS ANALÍTICAS (ABA 8)
    // =========================================================================
    const tabEvidenceNav = page.getByTestId('tab-nav-findings');
    await tabEvidenceNav.click();
    await expect(page.getByTestId('tab-evidence-container')).toBeVisible();

    // Registra evidência de governança
    await page.getByTestId('btn-nova-evidencia').click();
    await expect(page.getByTestId('modal-nova-evidencia')).toBeVisible();
    await page.getByTestId('input-titulo-evidencia').fill('Validação Metodológica de Evasão Escolar');
    await page.getByTestId('select-tipo-evidencia').selectOption('REQUISITOS');
    await page.getByTestId('textarea-descricao-evidencia').fill('Definição consensual da exclusão de transferidos da taxa de evasão.');
    await page.getByTestId('textarea-fato-observado').fill('Critério acordado em ata com a Coordenadoria Pedagógica.');
    await page.getByTestId('textarea-acao-registrada').fill('Configuração da regra analítica na camada de requisitos e modelagem.');
    await page.getByTestId('btn-salvar-evidencia').click();
    await expect(page.getByTestId('modal-nova-evidencia')).not.toBeVisible();
    await expect(page.getByTestId('evidence-list')).toContainText('Validação Metodológica de Evasão Escolar');

    // =========================================================================
    // 9. VALIDAÇÃO & CONCILIAÇÃO NUMÉRICA V-01/V-02 (ABA 9)
    // =========================================================================
    const tabValNav = page.getByTestId('tab-nav-validation');
    await tabValNav.click();
    await expect(page.getByTestId('tab-validation-container')).toBeVisible();

    await page.getByTestId('btn-open-create-validation').click();
    await expect(page.getByTestId('create-validation-modal')).toBeVisible();

    // Check com tolerância zero e valores exatos -> APROVADO
    const valModal = page.getByTestId('create-validation-modal');
    await valModal.locator('input[type="text"]').first().fill('Batimento da Taxa de Evasão Geral');
    await valModal.locator('input[type="number"]').nth(0).fill('6.5');
    await valModal.locator('input[type="number"]').nth(1).fill('6.5');
    await valModal.locator('button[type="submit"]').click();
    await expect(page.getByTestId('create-validation-modal')).not.toBeVisible();

    // =========================================================================
    // 10. ENTREGÁVEIS & ACEITE FORMAL (ABA 10)
    // =========================================================================
    const tabDelivNav = page.getByTestId('tab-nav-deliverables');
    await tabDelivNav.click();
    await expect(page.getByTestId('tab-deliverables')).toBeVisible();

    // Cria entregável disponível (cumprindo V-03)
    await page.getByTestId('btn-novo-entregavel').click();
    await expect(page.getByTestId('modal-create-edit-deliverable')).toBeVisible();
    const modalDeliv = page.getByTestId('modal-create-edit-deliverable');
    await modalDeliv.locator('input[type="text"]').nth(0).fill('Painel Executivo de Evasão Escolar');
    await modalDeliv.locator('input[type="text"]').nth(2).fill('https://educacao.gov.br/paineis/evasao-escolar');
    await page.getByTestId('btn-salvar-entregavel').click();
    await expect(page.getByTestId('modal-create-edit-deliverable')).not.toBeVisible();

    // Com validações aprovadas e entregável disponível, avança para Pronta para Entrega
    await page.getByTestId('tab-nav-overview').click();
    await expect(btnAdvance).toContainText(/Pronta para Entrega/i);
    await btnAdvance.click();
    await expect(stateBadge).toHaveText(/Pronta para Entrega/i);

    // Volta à Aba 10 para colher aceite formal do contratante (APROV-09)
    await tabDelivNav.click();
    const btnOpenAcceptance = page.locator('[data-testid^="btn-aceite-"]').first();
    await btnOpenAcceptance.click();
    await expect(page.getByTestId('modal-record-acceptance')).toBeVisible();
    const modalAccept = page.getByTestId('modal-record-acceptance');
    await modalAccept.locator('input[placeholder*="Carlos Mendes"]').fill('Profa. Maria Helena (Secretária Adjunta)');
    await modalAccept.locator('textarea').fill('Atesto o recebimento formal do painel executivo com todas as metas atendidas.');
    await page.getByTestId('btn-confirmar-aceite').click();
    await expect(page.getByTestId('modal-record-acceptance')).not.toBeVisible();

    // =========================================================================
    // 11. ENCERRAMENTO FORMAL DA DEMANDA -> CONCLUIDA
    // =========================================================================
    await page.getByTestId('tab-nav-overview').click();
    await expect(btnAdvance).toContainText(/Concluída/i);
    await btnAdvance.click();

    // Modal de encerramento
    await expect(page.getByTestId('modal-confirm-encerramento')).toBeVisible();
    await page.getByTestId('modal-confirm-encerramento').locator('textarea').fill('Demanda concluída formalmente com validação integral e aceite do contratante.');
    await page.getByTestId('btn-confirmar-encerramento').click();
    await expect(page.getByTestId('modal-confirm-encerramento')).not.toBeVisible();

    // Comprova estado Concluída
    await expect(stateBadge).toHaveText(/Concluída/i);

    // Comprova governança read-only na Aba 2
    await tabReqNav.click();
    await expect(page.getByTestId('requirements-readonly-banner')).toBeVisible();

    // =========================================================================
    // 12. ABA 11: DOSSIÊ, PORTFÓLIO STAR, APROV-10 E MEMÓRIA OPERACIONAL
    // =========================================================================
    const tabDossierNav = page.getByTestId('tab-nav-dossier');
    await tabDossierNav.click();
    await expect(page.getByTestId('tab-dossier')).toBeVisible();

    // 12.1 Dossiê Técnico Vivo
    await page.getByTestId('subtab-dossier').click();
    await expect(page.getByTestId('dossier-viewer-container')).toBeVisible();

    // 12.2 Estudo de Caso STAR
    await page.getByTestId('subtab-case').click();
    await expect(page.getByTestId('portfolio-case-section')).toBeVisible();

    // Gera rascunho determinístico
    await page.getByTestId('btn-generate-draft').click();
    await expect(page.getByTestId('case-status-badge')).toHaveText(/RASCUNHO — v1/i);

    // Comprova trava pré-APROV-10: botão de exportação pública desabilitado
    await expect(page.getByTestId('btn-export-case')).toBeDisabled();

    // Preenche checklist de sanitização de 5 itens obrigatórios
    await page.getByTestId('checkbox-nomesClientesOcultados').check();
    await page.getByTestId('checkbox-dadosPessoaisOcultados').check();
    await page.getByTestId('checkbox-dadosFinanceirosSigilososTratados').check();
    await page.getByTestId('checkbox-metricasFatuaisPreservadas').check();
    await page.getByTestId('checkbox-declaracaoHumanaAssinada').check();

    // Homologação Soberana APROV-10
    await page.getByTestId('btn-open-aprov10-modal').click();
    await expect(page.getByTestId('modal-homologate-aprov10')).toBeVisible();
    await page.getByTestId('input-aprov10-autor').fill('José Flávio Santana (Analista Responsável)');
    await page.getByTestId('textarea-aprov10-justificativa').fill('Estudo de caso sanitizado em alto padrão, sem exposição de nomes reais ou PII escolar.');
    await page.getByTestId('btn-confirm-aprov10').click();
    await expect(page.getByTestId('modal-homologate-aprov10')).not.toBeVisible();

    // Comprova status HOMOLOGADO (APROV-10) — v1
    await expect(page.getByTestId('case-status-badge')).toHaveText(/HOMOLOGADO \(APROV-10\) — v1/i);

    // 12.3 Salvaguarda de Invalidação: Edição material retorna para RASCUNHO
    const caseTitleInput = page.getByTestId('input-case-title');
    await caseTitleInput.fill('Estudo de Caso STAR: Redução de Evasão Escolar (Versão Revisada)');
    await page.getByTestId('btn-save-case').click();

    // Comprova que o status reverteu deterministicamente para RASCUNHO v2
    await expect(page.getByTestId('case-status-badge')).toHaveText(/RASCUNHO — v2/i);
    await expect(page.getByTestId('btn-export-case')).toBeDisabled();

    // Re-homologa APROV-10 na v2
    const checkBoxesToRecheck = [
      'checkbox-nomesClientesOcultados',
      'checkbox-dadosPessoaisOcultados',
      'checkbox-dadosFinanceirosSigilososTratados',
      'checkbox-metricasFatuaisPreservadas',
      'checkbox-declaracaoHumanaAssinada',
    ];
    for (const testId of checkBoxesToRecheck) {
      const cb = page.getByTestId(testId);
      if (!(await cb.isChecked())) {
        await cb.check();
      }
    }
    await page.getByTestId('btn-open-aprov10-modal').click();
    await expect(page.getByTestId('modal-homologate-aprov10')).toBeVisible();
    await page.getByTestId('input-aprov10-autor').fill('José Flávio Santana (Analista Responsável)');
    await page.getByTestId('textarea-aprov10-justificativa').fill('Re-homologação formal da versão 2 com refinamento do título do case.');
    await page.getByTestId('btn-confirm-aprov10').click();
    await expect(page.getByTestId('modal-homologate-aprov10')).not.toBeVisible();

    await expect(page.getByTestId('case-status-badge')).toHaveText(/HOMOLOGADO \(APROV-10\) — v2/i);

    // 12.4 Exportação Autorizada pós-APROV-10
    await expect(page.getByTestId('btn-export-case')).toBeEnabled();
    await page.getByTestId('btn-export-case').click();
    await expect(page.getByTestId('modal-export-case')).toBeVisible();
    await expect(page.getByTestId('export-case-markdown')).toBeVisible();
    await page.locator('[data-testid="modal-export-case"] button').first().click();
    await expect(page.getByTestId('modal-export-case')).not.toBeVisible();

    // 12.5 Memória Operacional e Curadoria de Ativo de Aprendizado
    await page.getByTestId('subtab-assets').click();
    await expect(page.getByTestId('learned-assets-section')).toBeVisible();

    await page.getByTestId('btn-open-curar-ativo').click();
    await expect(page.getByTestId('form-curar-ativo')).toBeVisible();
    await page.getByTestId('input-ativo-titulo').fill('Cálculo de Evasão Escolar Ponderada');
    await page.getByTestId('select-ativo-categoria').selectOption('DAX');
    await page.getByTestId('textarea-ativo-codigo').fill('TaxaEvasaoPonderada = DIVIDE([TotalEvadidos], [TotalMatriculados], 0)');
    await page.getByTestId('btn-submit-curar-ativo').click();

    await expect(page.getByTestId('learned-assets-section')).toContainText('Cálculo de Evasão Escolar Ponderada');
  });
});
