import { expect, type Page, test } from '@playwright/test'

/** A sacola do cardápio: soma, adicionais, validação, mensagem e persistência. */

/** Troca o window.open por um registro, para ler o link que abriria. */
async function capturarAberturas(page: Page) {
  await page.addInitScript(() => {
    ;(window as unknown as { abriu: string[] }).abriu = []
    window.open = ((url: string) => {
      ;(window as unknown as { abriu: string[] }).abriu.push(url)
      return null
    }) as typeof window.open
  })
}

const aberturas = (page: Page) =>
  page.evaluate(() => (window as unknown as { abriu: string[] }).abriu)

test('sem nome e endereço o pedido não sai, e a tela diz o que falta', async ({ page }) => {
  await capturarAberturas(page)
  await page.goto('/cardapio')
  await page.getByRole('button', { name: 'Adicionar Touro’s Tudo' }).click()
  const sacola = page.locator('#sacola')
  await expect(sacola).toContainText('R$ 18,00')
  await sacola.getByRole('button', { name: /Enviar pelo WhatsApp/ }).click()
  await expect(page.getByRole('alert')).toContainText('nome')
  expect(await aberturas(page)).toEqual([])
})

test('lanche do meu jeito: adicionais e "sem" viram a mensagem somada', async ({ page }) => {
  await capturarAberturas(page)
  await page.goto('/cardapio')
  await page.getByRole('button', { name: 'Montar do meu jeito: Touro’s Bacon Cheddar' }).click()
  const painel = page.getByRole('dialog')
  await painel.getByRole('button', { name: 'Adicionar: Bacon' }).click()
  await painel.getByRole('button', { name: 'Adicionar: Ovo' }).click()
  await painel.getByRole('button', { name: 'sem cebola roxa' }).click()
  await painel.getByRole('button', { name: 'Um lanche a mais' }).click()
  // (34,90 + 6,00 + 2,00) × 2
  await painel.getByRole('button', { name: /Adicionar · R\$ 85,80/ }).click()
  await expect(painel).toHaveCount(0)

  await page.getByRole('button', { name: 'Adicionar Guaraná Antarctica lata 350 ml' }).click()
  const sacola = page.locator('#sacola')
  await expect(sacola).toContainText('+ bacon, + ovo · sem cebola roxa')
  await expect(sacola).toContainText('R$ 92,30')
  await sacola.getByLabel('Seu nome').fill('Ana')
  await sacola.getByLabel('Endereço de entrega').fill('Rua Halfeld, 120, Centro')
  await sacola.getByRole('button', { name: 'Dinheiro' }).click()
  await sacola.getByLabel(/Troco/).fill('R$ 100')
  await sacola.getByRole('button', { name: /Enviar pelo WhatsApp/ }).click()

  const abriu = await aberturas(page)
  expect(abriu).toHaveLength(1)
  expect(abriu[0]).toMatch(/^https:\/\/wa\.me\/5532991486422\?text=/)
  const texto = decodeURIComponent(abriu[0].split('text=')[1])
  expect(texto).toContain('2x Touro’s Bacon Cheddar — R$ 85,80')
  expect(texto).toContain('   + 1x Bacon (R$ 6,00 cada)')
  expect(texto).toContain('   sem cebola roxa')
  expect(texto).toContain('1x Guaraná Antarctica lata 350 ml — R$ 6,50')
  expect(texto).toContain('Subtotal: R$ 92,30')
  expect(texto).toContain('Pagamento: Dinheiro (troco para R$ 100)')
})

test('a sacola sobrevive a recarregar a página, e o "−" tira o item', async ({ page }) => {
  await page.goto('/cardapio')
  await page.getByRole('button', { name: 'Adicionar T’ Chicken Catupiry' }).click()
  await page.reload()
  const sacola = page.locator('#sacola')
  await expect(sacola).toContainText('T’ Chicken Catupiry')
  await page.getByRole('button', { name: 'Um a menos: T’ Chicken Catupiry' }).click()
  await expect(sacola).toContainText('Vazia por enquanto')
})

test('"Montar" na home abre o cardápio com o painel do lanche', async ({ page }) => {
  await page.goto('/')
  await page.locator('#artesanais').scrollIntoViewIfNeeded()
  await page.getByRole('tab', { name: /Bacon Catupiry/ }).click()
  await page.locator('a[href="/cardapio?montar=touros-bacon-catupiry"]').click()
  await expect(page.getByRole('dialog')).toContainText('Touro’s Bacon Catupiry')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).toHaveURL(/\/cardapio$/)
})
