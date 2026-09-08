import AxeBuilder from '@axe-core/playwright'
import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test'

const E2E_PASSWORD = 'Trilha-E2E-Segura-Impacta-2026!'
const MAILPIT_URL = process.env.MAILPIT_URL || 'http://127.0.0.1:8025'

type MailpitMessage = {
  ID: string
  Subject: string
  To: Array<{ Address: string }>
}

function uniqueEmail(label: string) {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
  return `e2e.academic.${label}.${suffix}@aluno.impacta.edu.br`
}

async function waitForVerificationCode(request: APIRequestContext, email: string) {
  let messageId = ''
  await expect.poll(async () => {
    const response = await request.get(`${MAILPIT_URL}/api/v1/messages`)
    if (!response.ok()) return ''
    const body = await response.json()
    const messages: MailpitMessage[] = body.messages || body.Messages || []
    messageId = messages.find((message) =>
      message.Subject.includes('Confirme seu e-mail')
      && message.To.some((recipient) => recipient.Address.toLowerCase() === email),
    )?.ID || ''
    return messageId
  }, { timeout: 20_000, intervals: [300, 500, 1_000] }).not.toBe('')

  const detail = await request.get(`${MAILPIT_URL}/api/v1/message/${messageId}`)
  expect(detail.ok()).toBeTruthy()
  const body = await detail.json()
  const code = String(body.Text || body.text || '').match(/\b\d{6}\b/)?.[0]
  expect(code).toBeTruthy()
  return code!
}

async function createVerifiedAccount(page: Page, request: APIRequestContext, email: string) {
  await page.goto('/cadastro')
  await page.getByLabel('Nome completo').fill('Aluno E2E Impacta')
  await page.getByLabel('E-mail institucional').fill(email)
  await page.getByLabel('Graduação e modalidade').selectOption({ index: 1 })
  await page.locator('input[name="password"]').fill(E2E_PASSWORD)
  await page.locator('input[name="confirmation"]').fill(E2E_PASSWORD)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Criar minha conta' }).click()

  await expect(page).toHaveURL(/\/verificar-email$/)
  await page.getByLabel('Código de verificação').fill(
    await waitForVerificationCode(request, email),
  )
  await page.getByRole('button', { name: 'Confirmar e continuar' }).click()
  await expect(page).toHaveURL(/\/home$/)
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL(/\/entrar$/)
}

async function signIn(page: Page, email: string) {
  await page.goto('/entrar')
  await page.getByLabel('E-mail institucional').fill(email)
  await page.locator('input[name="password"]').fill(E2E_PASSWORD)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL(/\/(home|completar-perfil)$/)
  if (page.url().includes('/completar-perfil')) {
    await page.getByLabel('Nome completo').fill('Aluno E2E Impacta')
    await page.getByLabel('Graduação e modalidade').selectOption({ index: 1 })
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Concluir perfil' }).click()
  }

  await expect(page).toHaveURL(/\/home$/)
  await expect(page.getByRole('heading', { name: /Olá,/ })).toBeVisible()
}

async function metricValue(page: Page, label: string): Promise<number> {
  const card = page.locator('article').filter({ has: page.getByText(label, { exact: true }) }).first()
  await expect(card).toBeVisible()
  const valueText = (await card.locator('p').nth(1).textContent()) || '0'
  return Number(valueText.replace(/[^\d-]/g, ''))
}

async function expectTouchTarget(locator: Locator) {
  await expect(locator).toBeVisible()
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.height).toBeGreaterThanOrEqual(44)
  expect(box!.width).toBeGreaterThanOrEqual(44)
}

async function auditPage(page: Page) {
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasHorizontalOverflow).toBeFalsy()

  const results = await new AxeBuilder({ page }).analyze()
  const critical = results.violations.filter((violation) => violation.impact === 'critical')
  expect(critical).toEqual([])

  await page.keyboard.press('Tab')
  await expect(page.locator(':focus')).toBeVisible()
}

test('fluxo completo de login, matérias, tarefa e dashboard', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-360', 'Fluxo funcional validado uma vez no mobile; a auditoria visual roda nos demais viewports.')

  const email = uniqueEmail('flow')
  await createVerifiedAccount(page, request, email)
  await signIn(page, email)
  const selectedSubjectId = await page.evaluate(async () => {
    const response = await fetch('/api/v1/curriculum')
    const curriculum = (await response.json()) as Array<{ id: string; active: boolean }>
    return curriculum.find((subject) => subject.active)?.id || ''
  })
  expect(selectedSubjectId).toBeTruthy()

  const csrfToken = await page.evaluate(() => document.cookie.match(/edutrack_csrf=([^;]+)/)?.[1] || '')
  expect(csrfToken).toBeTruthy()
  const selectionOk = await page.evaluate(
    async ({ csrfToken, selectedSubjectId, semesterPeriod }) => {
      const response = await fetch('/api/v1/student-subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          semester_period: semesterPeriod,
          subject_ids: [selectedSubjectId],
        }),
      })
      return response.ok
    },
    {
      csrfToken,
      selectedSubjectId,
      semesterPeriod: `${new Date().getFullYear()}/1`,
    },
  )
  expect(selectionOk).toBeTruthy()

  await page.goto('/home')
  const baselinePending = await metricValue(page, 'Tarefas pendentes')
  const baselineCompleted = await metricValue(page, 'Tarefas concluídas')

  await page.goto('/tarefas')
  await page.getByRole('button', { name: /Nova/ }).click()
  const taskDialog = page.getByRole('dialog', { name: 'Nova tarefa' })
  await expect(taskDialog).toBeVisible()
  await taskDialog.getByLabel('Disciplina').selectOption({ index: 1 })
  const taskTitle = `Integração E2E ${Date.now()}`
  await taskDialog.getByLabel('Título').fill(taskTitle)
  await taskDialog.getByLabel('Descrição').fill('Fluxo completo do EduTrack')
  await taskDialog.getByLabel('Prazo').fill(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
  await taskDialog.getByLabel('Minutos estimados').fill('45')
  await taskDialog.getByLabel('Minutos realizados').fill('0')
  await taskDialog.getByRole('button', { name: /Criar/ }).click()

  await expect(page.getByText(taskTitle, { exact: true })).toBeVisible()

  await page.goto('/home')
  await expect(page.getByText(taskTitle, { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Itens urgentes das próximas 48 horas/i })).toBeVisible()
  await expect(page.getByText('Menos de 48h')).toBeVisible()
  await expect(await metricValue(page, 'Tarefas pendentes')).toBe(baselinePending + 1)

  await page.goto('/tarefas')
  await page.locator(`article:has-text("${taskTitle}")`).getByRole('checkbox', { name: /Marcar tarefa concluída/i }).click()
  await expect(page.locator(`article:has-text("${taskTitle}")`).getByRole('checkbox', { name: /Desmarcar tarefa concluída/i })).toBeChecked()

  await page.goto('/home')
  await expect(page.getByText(taskTitle, { exact: true })).toBeVisible()
  await expect(await metricValue(page, 'Tarefas pendentes')).toBe(baselinePending)
  await expect(await metricValue(page, 'Tarefas concluídas')).toBe(baselineCompleted + 1)
})

test('auditoria de acessibilidade em 360 px e desktop', async ({ page, request }, testInfo) => {
  test.skip(!['mobile-360', 'desktop-1280'].includes(testInfo.project.name), 'A auditoria exige os viewports 360 px e desktop.')

  const email = uniqueEmail(`audit-${testInfo.project.name}`)
  await createVerifiedAccount(page, request, email)
  await signIn(page, email)

  await page.goto('/home')
  await expectTouchTarget(page.getByRole('link', { name: 'Home' }))
  await expectTouchTarget(page.getByRole('link', { name: 'Disciplinas' }))
  await expectTouchTarget(page.getByRole('link', { name: 'Tarefas' }))
  await expectTouchTarget(page.getByRole('button', { name: 'Sair' }))
  await auditPage(page)

  await page.goto('/disciplinas')
  await expectTouchTarget(page.getByRole('button', { name: 'Configurar semestre' }))
  await expectTouchTarget(page.getByRole('button', { name: 'Ajustar seleção' }))
  await auditPage(page)

  await page.goto('/tarefas')
  await expectTouchTarget(page.getByRole('button', { name: /Nova/ }))
  await auditPage(page)
})
