import { expect, test, type Page } from '@playwright/test';

const AUTHORIZED_REMOTE_ENTRY_URL = 'http://127.0.0.1:6202/dashboard/remoteEntry.js';
const UNAUTHORIZED_REMOTE_ENTRY_URLS = [
  'http://127.0.0.1:6202/ordens/remoteEntry.js',
  'http://127.0.0.1:6202/relatorios/remoteEntry.js',
  'http://127.0.0.1:6202/admin/remoteEntry.js'
];

function collectRemoteEntryRequests(page: Page): string[] {
  const requests: string[] = [];

  page.on('request', (request) => {
    if (request.url().includes('/remoteEntry.js')) {
      requests.push(request.url());
    }
  });

  return requests;
}

test('requisita apenas o remote entry autorizado pelo catalogo do BFF', async ({ page }) => {
  const remoteEntryRequests = collectRemoteEntryRequests(page);

  await page.goto('/dashboard');

  await expect(page.getByText('Remote /dashboard carregado pelo runtime autorizado')).toBeVisible();
  await page.waitForTimeout(250);

  expect(remoteEntryRequests).toContain(AUTHORIZED_REMOTE_ENTRY_URL);
  for (const unauthorizedUrl of UNAUTHORIZED_REMOTE_ENTRY_URLS) {
    expect(remoteEntryRequests).not.toContain(unauthorizedUrl);
  }
});

test('nao requisita artefatos remotos ao navegar manualmente para rota fora do snapshot', async ({ page }) => {
  const remoteEntryRequests = collectRemoteEntryRequests(page);

  await page.goto('/admin/acessos');

  await expect(page.getByRole('heading', { name: 'A rota solicitada nao foi liberada para esta sessao' })).toBeVisible();
  await page.waitForTimeout(250);

  expect(remoteEntryRequests).toHaveLength(0);
});