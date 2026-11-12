import { test, expect } from '@playwright/test';

// Credenciais do gerente de TESTE, vindas do ambiente (nunca fixas no repositório).
const LOGIN = process.env.E2E_LOGIN;
const SENHA = process.env.E2E_SENHA;
const COOKIE = process.env.E2E_COOKIE || '__session';
// Produção/homologação (HTTPS): cookie Secure. Perfil "dev" local em HTTP: E2E_COOKIE_SEGURO=false.
const COOKIE_SEGURO = process.env.E2E_COOKIE_SEGURO !== 'false';

/** Erros de console, exceções e violações de CSP durante o teste. */
function vigiarErros(page) {
  const erros = [];
  page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  page.on('pageerror', (e) => erros.push(String(e)));
  return erros;
}

/** Liga a árvore de acessibilidade do Flutter Web para os campos virarem elementos acessíveis. */
async function habilitarSemantica(page) {
  const ph = page.locator('flt-semantics-placeholder');
  await ph.waitFor({ state: 'attached' });
  await ph.evaluate((e) => e.click());
}

/** Digita como um usuário: o Flutter Web só lê o texto pelo próprio editor, que nasce no foco. */
async function digitar(page, rotulo, valor) {
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    await page.getByRole('textbox', { name: rotulo }).click();
    // Espera o editor do Flutter assumir o foco antes de digitar.
    await page.waitForFunction(
      (r) => document.activeElement?.tagName === 'INPUT' && document.activeElement.getAttribute('aria-label') === r,
      rotulo,
    );
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(valor, { delay: 25 });
    // Confere o que o campo realmente recebeu (a automação de teclado às vezes perde caracteres).
    if ((await page.evaluate(() => document.activeElement.value)) === valor) return;
  }
  throw new Error(`não foi possível digitar no campo ${rotulo}`);
}

/** O 401 de /api/auth/me sem sessão é esperado (restauração de sessão); o Chrome o registra no console. */
const esperado = (t) => /status of 401/.test(t);

async function entrar(page) {
  await page.goto('/login');
  await habilitarSemantica(page);
  await digitar(page, 'Login', LOGIN);
  await digitar(page, 'Senha', SENHA);
  const resposta = page.waitForResponse((r) => r.url().endsWith('/api/auth/login'));
  await page.getByRole('button', { name: 'Entrar' }).click();
  return resposta;
}

test.beforeAll(() => {
  if (!LOGIN || !SENHA) throw new Error('Defina E2E_LOGIN e E2E_SENHA (gerente de teste).');
});

test('carrega sem erros de console nem violações de CSP', async ({ page }) => {
  const erros = vigiarErros(page);
  const r = await page.goto('/login');
  expect(r.status()).toBe(200);
  expect(r.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  await habilitarSemantica(page);
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  const inesperados = erros.filter((t) => !esperado(t));
  expect(inesperados, inesperados.join('\n')).toEqual([]);
  expect(erros.some((t) => /Content Security Policy/i.test(t))).toBe(false);
});

test('rota interna sem sessão leva ao login sem guardar a tela anterior', async ({ page }) => {
  await page.goto('/clientes');
  await expect(page).toHaveURL(/\/login$/);
});

test('login cria sessão segura; atualizar rota interna mantém a sessão', async ({ page, context }) => {
  const erros = vigiarErros(page);
  const login = await entrar(page);
  expect(login.status()).toBe(200);
  await expect(page).not.toHaveURL(/\/login/);

  const sessao = (await context.cookies()).find((c) => c.name === COOKIE);
  expect(sessao, `cookie ${COOKIE}`).toBeTruthy();
  expect(sessao.httpOnly).toBe(true);
  expect(sessao.secure).toBe(COOKIE_SEGURO);
  expect(sessao.sameSite).toBe('Lax');
  // HttpOnly: o JavaScript da página não enxerga o cookie.
  expect(await page.evaluate(() => document.cookie)).not.toContain(COOKIE);

  // Atualização direta de rota interna (fallback SPA + sessão no servidor).
  const me = page.waitForResponse((r) => r.url().endsWith('/api/auth/me'));
  const lista = page.waitForResponse((r) => r.url().includes('/api/clientes?'));
  await page.goto('/clientes');
  expect((await me).status()).toBe(200);
  await expect(page).toHaveURL(/\/clientes$/);
  // Os dados chegam (listas paginadas da API lidas por completo), sem a mensagem de falha.
  expect((await lista).status()).toBe(200);
  await expect(page.getByText('Não foi possível carregar', { exact: false })).toHaveCount(0);
  const inesperados = erros.filter((t) => !esperado(t));
  expect(inesperados, inesperados.join('\n')).toEqual([]);
});

test('senha errada não autentica e não revela se a conta existe', async ({ page }) => {
  await page.goto('/login');
  await habilitarSemantica(page);
  // Login único por rodada: o limite de tentativas (5 falhas/15 min) bloquearia execuções repetidas.
  await digitar(page, 'Login', `inexistente.e2e.${Date.now()}`);
  await digitar(page, 'Senha', 'senha-errada-123');
  const r = page.waitForResponse((x) => x.url().endsWith('/api/auth/login'));
  await page.getByRole('button', { name: 'Entrar' }).click();
  const resp = await r;
  expect(resp.status()).toBe(401);
  // Mesma mensagem para conta inexistente e senha errada.
  await expect(page.getByText('Login ou senha inválidos', { exact: false })).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});
