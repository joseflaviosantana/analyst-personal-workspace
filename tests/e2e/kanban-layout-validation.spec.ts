import { test, expect } from '@playwright/test';
import { ESTADOS_ORDENADOS_SEQUENCIAIS } from '../../src/core/domain/enums/estado-demanda';

test.describe('E2E: Validação de Layout, Larguras e Ausência de Sobreposição no Pipeline Kanban', () => {
  test('deve garantir colunas sem sobreposição horizontal, cards contidos e botões clicáveis sem bloqueio', async ({ page }) => {
    // 1. Acesso à página do Pipeline Kanban
    await page.goto('/pipeline');
    await expect(page.getByTestId('pipeline-view')).toBeVisible();

    const kanbanGrid = page.getByTestId('kanban-grid');
    await expect(kanbanGrid).toBeVisible();

    // 2. Validação geométrica das 8 colunas (ausência total de sobreposição horizontal)
    const columnLocators = ESTADOS_ORDENADOS_SEQUENCIAIS.map((estado) =>
      page.getByTestId(`kanban-column-${estado}`)
    );

    // Garante que todas as 8 colunas estão renderizadas no DOM
    for (const colLoc of columnLocators) {
      await expect(colLoc).toBeAttached();
    }

    // Obtenção dos bounding boxes de todas as colunas
    const boxes = [];
    for (let i = 0; i < columnLocators.length; i++) {
      const box = await columnLocators[i].boundingBox();
      expect(box).not.toBeNull();
      boxes.push(box!);
    }

    // Cada coluna deve ter largura de pelo menos 280px
    for (let i = 0; i < boxes.length; i++) {
      expect(boxes[i].width).toBeGreaterThanOrEqual(280);
    }

    // Nenhuma coluna subsequente pode invadir o espaço da coluna anterior
    // col_{i+1}.x DEVE ser >= col_{i}.x + col_{i}.width (mais o gap entre elas)
    for (let i = 0; i < boxes.length - 1; i++) {
      const current = boxes[i];
      const next = boxes[i + 1];
      const gap = next.x - (current.x + current.width);
      // O gap deve ser positivo (aproximadamente 16px devido ao gap-4)
      expect(gap).toBeGreaterThanOrEqual(10);
    }

    // 3. Validação de contenção dos cards dentro de suas respectivas colunas
    const allCards = page.locator('[data-testid^="demand-card-"]');
    const cardCount = await allCards.count();

    if (cardCount > 0) {
      for (let i = 0; i < cardCount; i++) {
        const card = allCards.nth(i);
        const cardBox = await card.boundingBox();
        if (!cardBox) continue;

        // Identifica a coluna ancestral
        const parentColumn = card.locator('xpath=ancestor::div[starts-with(@data-testid, "kanban-column-")][1]');
        const colBox = await parentColumn.boundingBox();
        expect(colBox).not.toBeNull();

        // O card deve estar estritamente contido horizontalmente nos limites da sua coluna (com tolerância de 2px de subpixel rendering)
        expect(cardBox.x).toBeGreaterThanOrEqual(colBox!.x - 2);
        expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(colBox!.x + colBox!.width + 2);
      }
    }

    // 4. Se não houver demandas ativas nas colunas iniciais, cria uma demanda sintética rápida para testar os botões
    const advanceButtons = page.locator('[data-testid^="btn-advance-card-"]');
    if ((await advanceButtons.count()) === 0) {
      await page.goto('/projects/new');
      const uniqueSuffix = Date.now().toString().slice(-4);
      await page.getByTestId('input-project-name').fill(`[KB FIX] Projeto ${uniqueSuffix}`);
      await page.getByTestId('input-project-description').fill('Validação de hitboxes do Kanban.');
      await page.getByTestId('select-project-status').selectOption('ATIVO');
      await page.getByTestId('btn-submit-project').click();
      await expect(page).toHaveURL(/\/projects\/proj_/);

      await page.getByTestId('btn-new-demand-for-project').click();
      await page.getByTestId('input-demand-title').fill(`[KB FIX] Demanda ${uniqueSuffix}`);
      await page.getByTestId('input-demand-raw-request').fill('Validação de botões e ausência de sobreposição.');
      await page.getByTestId('btn-submit-demand').click();
      await expect(page).toHaveURL(/\/demands\/dem_/);

      // Retorna ao Pipeline Kanban
      await page.goto('/pipeline');
    }

    // 5. Validação de Interatividade e Hitbox do Botão "Suspender"
    const firstSuspendBtn = page.locator('[data-testid^="btn-suspend-card-"]').first();
    await expect(firstSuspendBtn).toBeVisible();

    // Clica no botão Suspender no card (se houvesse sobreposição de coluna, o clique seria interceptado ou falharia)
    await firstSuspendBtn.click();

    // O modal de suspensão DEVE abrir normalmente
    const modalSuspend = page.getByTestId('modal-suspend-demand');
    await expect(modalSuspend).toBeVisible();

    // Fecha o modal pelo botão X ou Cancelar
    await page.getByTestId('btn-close-suspend-modal').click();
    await expect(modalSuspend).not.toBeVisible();

    // 6. Validação de Interatividade e Hitbox do Botão "Cancelar"
    const firstCancelBtn = page.locator('[data-testid^="btn-cancel-card-"]').first();
    await expect(firstCancelBtn).toBeVisible();
    await firstCancelBtn.click();

    // O modal de cancelamento DEVE abrir normalmente
    const modalCancel = page.getByTestId('modal-cancel-demand');
    await expect(modalCancel).toBeVisible();

    // Fecha o modal de cancelamento
    await page.getByTestId('btn-close-cancel-modal').click();
    await expect(modalCancel).not.toBeVisible();

    // 7. Validação de Interatividade do Botão "Avançar"
    const firstAdvanceBtn = page.locator('[data-testid^="btn-advance-card-"]').first();
    await expect(firstAdvanceBtn).toBeVisible();
    await firstAdvanceBtn.click();

    // Alerta de feedback de sucesso deve ser exibido
    const feedbackAlert = page.getByTestId('pipeline-feedback-alert');
    await expect(feedbackAlert).toBeVisible();
    await expect(feedbackAlert).toContainText(/avançada com sucesso/i);

    // 8. Validação de Acessibilidade Horizontal da 8ª coluna (Concluída) via scroll
    const colConcluida = page.getByTestId('kanban-column-CONCLUIDA');
    await colConcluida.scrollIntoViewIfNeeded();
    await expect(colConcluida).toBeVisible();
    await expect(colConcluida).toContainText(/Concluída/i);
  });
});
