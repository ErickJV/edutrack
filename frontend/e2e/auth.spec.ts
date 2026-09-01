import AxeBuilder from '@axe-core/playwright'
import { expect, test, type APIRequestContext } from '@playwright/test'

const MAILPIT_URL = process.env.MAILPIT_URL || 'http://127.0.0.1:8025'

type MailpitMessage = {
  ID: string
  Subject: string
  To: Array<{ Address: string }>
}

async function waitForMessage(
  request: APIRequestContext,
  email: string,
  subject: string,
): Promise<string> {
  let messageId = ''
  await expect.poll(async () => {
    const response = await request.get(`${MAILPIT_URL}/api/v1/messages`)
    if (!response.ok()) return ''
    const body = await response.json()
    const messages: MailpitMessage[] = body.messages || body.Messages || []
    messageId = messages.find((message) =>
      message.Subject.includes(subject)
      && message.To.some((recipient) => recipient.Address.toLowerCase() === email),
    )?.ID || ''
    return messageId
  }, { timeout: 20_000, intervals: [300, 500, 1_000] }).not.toBe('')

  const detail = await request.get(`${MAILPIT_URL}/api/v1/message/${messageId}`)
  expect(detail.ok()).toBeTruthy()
  const body = await detail.json()
  return String(body.Text || body.text || '')
}

test('cadastro, verificação, recuperação e novo login', async ({ page, request }) => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
  const email = `e2e.${suffix}@aluno.impacta.edu.br`
  const oldPassword = 'Trilha-E2E-Segura-Impacta-2026!'
  const newPassword = 'Nova-Trilha-E2E-Segura-2026!'

  await page.goto('/cadastro')
  await page.getByLabel('Nome completo').fill('Aluno E2E Impacta')
  await page.getByLabel('E-mail institucional').fill(email)
  await page.getByLabel('Graduação e modalidade').selectOption({ index: 1 })
  await page.getByLabel('Senha', { exact: true }).fill(oldPassword)
  await page.getByLabel('Confirme a senha').fill(oldPassword)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Criar minha conta' }).click()

  await expect(page).toHaveURL(/\/verificar-email$/)
  const verificationEmail = await waitForMessage(request, email, 'Confirme seu e-mail')
  const code = verificationEmail.match(/\b\d{6}\b/)?.[0]
  expect(code).toBeTruthy()
  await page.getByLabel('Código de verificação').fill(code!)
  await page.getByRole('button', { name: 'Confirmar e continuar' }).click()
  await expect(page).toHaveURL(/\/home$/)
  await expect(page.getByRole('heading', { name: /Olá, Aluno/ })).toBeVisible()

  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL(/\/entrar$/)
  await page.getByRole('link', { name: 'Esqueci minha senha' }).click()
  await page.getByLabel('E-mail institucional').fill(email)
  await page.getByRole('button', { name: 'Enviar link de recuperação' }).click()
  await expect(page.getByText(/mostramos esta mensagem mesmo/)).toBeVisible()

  const resetEmail = await waitForMessage(request, email, 'Redefinição de senha')
  const resetPath = resetEmail.match(/http:\/\/localhost:5173(\/redefinir-senha\/[^\s]+)/)?.[1]
  expect(resetPath).toBeTruthy()
  await page.goto(resetPath!)
  await page.getByLabel('Nova senha', { exact: true }).fill(newPassword)
  await page.getByLabel('Confirme a nova senha').fill(newPassword)
  await page.getByRole('button', { name: 'Salvar nova senha' }).click()
  await expect(page.getByRole('heading', { name: 'Senha atualizada' })).toBeVisible()

  await page.getByRole('link', { name: 'Entrar com a nova senha' }).click()
  await page.getByLabel('E-mail institucional').fill(email)
  await page.getByLabel('Senha').fill(newPassword)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/home$/)
})

test('login não tem overflow nem violações críticas de acessibilidade', async ({ page }) => {
  await page.goto('/entrar')
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasHorizontalOverflow).toBeFalsy()

  const results = await new AxeBuilder({ page }).analyze()
  const critical = results.violations.filter((violation) => violation.impact === 'critical')
  expect(critical).toEqual([])

  await page.keyboard.press('Tab')
  await expect(page.locator(':focus')).toBeVisible()
})
