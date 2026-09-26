import { test, expect } from '@playwright/test';

test.describe('Bootstrap Smoke E2E: Analyst Personal Workspace', () => {
  test('deve inicializar a aplicação, carregar o Shell e exibir o Centro de Comando operacional', async ({ page }) => {
    // Navega para a raiz da aplicação local
    await page.goto('/');

    // 1. Confirma título da página
    await expect(page).toHaveTitle(/Analyst Personal Workspace/);

    // 2. Localiza elementos estáveis do Shell Global
    const sidebar = page.getByTestId('main-sidebar');
    await expect(sidebar).toBeVisible();

    const topHeader = page.getByTestId('top-header');
    await expect(topHeader).toBeVisible();

    // 3. Localiza cabeçalho do Centro de Comando (Cockpit)
    const cockpitTitle = page.getByTestId('cockpit-title');
    await expect(cockpitTitle).toBeVisible();
    await expect(cockpitTitle).toHaveText('Centro de Comando (Cockpit)');

    // 4. Confirma ausência de texto ou alerta de erro fatal
    const bodyContent = await page.textContent('body');
    expect(bodyContent).not.toContain('Application error');
    expect(bodyContent).not.toContain('Unhandled Runtime Error');
  });
});
