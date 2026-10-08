import { describe, expect, it } from 'vitest'
import { ADICIONAIS, CARDAPIO, CASA, FAQ, SITE_URL } from '@/lib/business'
import { canonicalDe, NAO_ENCONTRADA, ogArquivoDe, ogUrlDe, ROTAS, rotaDe } from '@/lib/routes'
import { gerarJsonLd, gerarLlmsTxt } from '@/lib/seo'
import { cn, prefersReducedMotion } from '@/lib/utils'

type No = Record<string, unknown> & { '@type': string }
const grafo = (path: string) => gerarJsonLd(path)['@graph'] as No[]
const doTipo = (path: string, tipo: string) => grafo(path).filter((n) => n['@type'] === tipo)

describe('rotas', () => {
  it('encontra a rota ignorando barra final e caixa; o resto é 404', () => {
    expect(rotaDe('/Cardapio/').path).toBe('/cardapio')
    expect(rotaDe('/').path).toBe('/')
    expect(rotaDe('/nao-existe')).toBe(NAO_ENCONTRADA)
  })

  it('títulos e descrições únicos, e dentro do que o Google mostra', () => {
    expect(new Set(ROTAS.map((r) => r.titulo)).size).toBe(ROTAS.length)
    for (const r of ROTAS) {
      expect(r.titulo.length, r.path).toBeLessThanOrEqual(70)
      expect(r.descricao.length, r.path).toBeGreaterThan(80)
      expect(r.descricao.length, r.path).toBeLessThanOrEqual(200)
      expect(r.titulo, r.path).toContain('Touro’s')
    }
  })

  it('canonical absoluta e arte de compartilhamento por rota', () => {
    expect(canonicalDe(ROTAS[0])).toBe(`${SITE_URL}/`)
    expect(ogArquivoDe(ROTAS[0])).toBe('og.jpg')
    expect(ogArquivoDe(rotaDe('/cardapio'))).toBe('og-cardapio.jpg')
    expect(ogArquivoDe(rotaDe('/politica-de-privacidade'))).toBe('og.jpg')
    expect(ogUrlDe(rotaDe('/cardapio'))).toBe(`${SITE_URL}/og-cardapio.jpg`)
  })
})

describe('JSON-LD', () => {
  it('um Restaurant de delivery, com cidade, telefone e horário — sem rua inventada', () => {
    const [r] = doTipo('/', 'Restaurant')
    expect(r.telephone).toBe('+5532991486422')
    expect(r.address).toMatchObject({ addressLocality: 'Juiz de Fora', addressRegion: 'MG' })
    if (!CASA.endereco) expect(r.address).not.toHaveProperty('streetAddress')
    // Seis dias com um turno cada; domingo não entra (ausência = fechado).
    const horario = r.openingHoursSpecification as { dayOfWeek: string; opens: string }[]
    expect(horario).toHaveLength(6)
    expect(horario.every((h) => h.opens === '18:30')).toBe(true)
    expect(horario.some((h) => h.dayOfWeek.endsWith('Sunday'))).toBe(false)
  })

  it('nenhuma nota autodeclarada', () => {
    for (const r of ROTAS)
      expect(JSON.stringify(gerarJsonLd(r.path))).not.toContain('aggregateRating')
  })

  it('FAQPage só na home; Menu só no cardápio, com todos os itens e adicionais', () => {
    expect(doTipo('/', 'FAQPage')).toHaveLength(1)
    expect(doTipo('/cardapio', 'FAQPage')).toHaveLength(0)
    expect(doTipo('/', 'Menu')).toHaveLength(0)
    const [menu] = doTipo('/cardapio', 'Menu')
    const secoes = menu.hasMenuSection as {
      name: string
      hasMenuItem: { name: string; offers: { price: string } }[]
    }[]
    const itens = secoes.flatMap((s) => s.hasMenuItem)
    expect(itens).toHaveLength(CARDAPIO.length + ADICIONAIS.length)
    expect(itens.every((i) => Number(i.offers.price) > 0)).toBe(true)
    // O nome com estrelas vai por extenso para quem lê texto.
    expect(itens.map((i) => i.name)).toContain('Touro’s 5 Estrelas')
    const [faq] = doTipo('/', 'FAQPage')
    expect(faq.mainEntity).toHaveLength(FAQ.length)
  })

  it('trilha de navegação só nas páginas internas', () => {
    expect(doTipo('/', 'BreadcrumbList')).toHaveLength(0)
    const [t] = doTipo('/cardapio', 'BreadcrumbList')
    expect((t.itemListElement as { name: string }[]).map((i) => i.name)).toEqual([
      'Início',
      'Cardápio',
    ])
  })
})

describe('llms.txt', () => {
  const texto = gerarLlmsTxt()
  it('traz horário, os dois caminhos de pedido e cada item com preço', () => {
    expect(texto).toContain('- Seg a sáb: 18h30–23h')
    expect(texto).toContain('- Dom: Fechado')
    expect(texto).toContain(CASA.ifood)
    expect(texto).toContain('(32) 99148-6422')
    expect(texto).toContain('- Touro’s Tudo: R$ 18,00')
    expect(texto).toContain('- Mussarela: R$ 2,90')
  })
  it('não tem valor indefinido', () => {
    expect(texto).not.toMatch(/undefined|NaN|\[object/)
  })
})

describe('utilidades', () => {
  it('cn e movimento reduzido fora do navegador', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
    expect(prefersReducedMotion()).toBe(false)
  })
})
