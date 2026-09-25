import { test, expect } from '@playwright/test';

test.describe('Bootstrap Smoke E2E: Analyst Personal Workspace', () => {
  test('deve inicializar a aplicação, carregar a página inicial e exibir a fundação operacional', async ({ page }) => {
    // Navega para a raiz da aplicação local
    await page.goto('/');

    // 1. Confirma título da página
    await expect(page).toHaveTitle(/Analyst Personal Workspace/);

    // 2. Localiza elemento estável do título da aplicação
    const appTitle = page.getByTestId('app-title');
    await expect(appTitle).toBeVisible();
    await expect(appTitle).toHaveText('Analyst Personal Workspace');

    // 3. Localiza badge de versão V1
    const versionBadge = page.getByTestId('app-version-badge');
    await expect(versionBadge).toBeVisible();
    await expect(versionBadge).toContainText('V1 — Bootstrap Técnico');

    // 4. Confirma indicador estável de status operacional da fundação
    const statusIndicator = page.getByTestId('bootstrap-status');
    await expect(statusIndicator).toBeVisible();
    await expect(statusIndicator).toContainText('OPERACIONAL');

    // 5. Confirma ausência de texto ou alerta de erro fatal
    const bodyContent = await page.textContent('body');
    expect(bodyContent).not.toContain('Application error');
    expect(bodyContent).not.toContain('Unhandled Runtime Error');
  });
});
