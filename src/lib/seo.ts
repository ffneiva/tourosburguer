import {
  ADICIONAIS,
  CARDAPIO,
  CASA,
  CATEGORIAS,
  type Categoria,
  FAQ,
  nomeFalado,
  SITE_URL,
} from './business.ts'
import { especificacaoDeHorario, resumoDaSemana } from './hours.ts'
import { canonicalDe, ROTAS } from './routes.ts'

/**
 * Dados estruturados (JSON-LD) e llms.txt — ambos derivados de business.ts.
 *
 * A casa é um `Restaurant` de delivery: `areaServed` diz onde entrega, e o
 * endereço traz só cidade e estado enquanto a rua não for confirmada (ver
 * `CASA.endereco`). Um endereço errado no dado estruturado é pior que um
 * endereço ausente: o Google o mostra no mapa.
 *
 * Nenhum `aggregateRating`: nota autodeclarada o Google não mostra e pode
 * punir, e a nota do iFood é do iFood.
 */
const ID_CASA = `${SITE_URL}/#restaurante`
const ID_MENU = `${SITE_URL}/cardapio#menu`

function noDaCasa() {
  return {
    '@type': 'Restaurant',
    '@id': ID_CASA,
    name: CASA.nome,
    slogan: CASA.lema,
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/icon-512.png`,
    image: `${SITE_URL}/og.jpg`,
    telephone: `+${CASA.whatsapp}`,
    servesCuisine: ['Hambúrguer', 'Lanches'],
    priceRange: 'R$ 18–45',
    acceptsReservations: false,
    address: {
      '@type': 'PostalAddress',
      addressLocality: CASA.cidade,
      addressRegion: CASA.uf,
      addressCountry: 'BR',
      ...(CASA.endereco ? { streetAddress: CASA.endereco } : {}),
    },
    areaServed: { '@type': 'City', name: `${CASA.cidade} - ${CASA.uf}` },
    openingHoursSpecification: especificacaoDeHorario(CASA.semana),
    hasMenu: `${SITE_URL}/cardapio`,
    potentialAction: { '@type': 'OrderAction', target: CASA.ifood },
    sameAs: [`https://www.instagram.com/${CASA.instagram}/`, CASA.ifood],
  }
}

function noDoMenu() {
  const categorias = Object.entries(CATEGORIAS) as Array<[Categoria, { nome: string }]>
  return {
    '@type': 'Menu',
    '@id': ID_MENU,
    name: `Cardápio ${CASA.nome}`,
    inLanguage: 'pt-BR',
    hasMenuSection: [
      ...categorias.map(([categoria, { nome }]) => ({
        '@type': 'MenuSection',
        name: nome,
        hasMenuItem: CARDAPIO.filter((i) => i.categoria === categoria).map((i) => ({
          '@type': 'MenuItem',
          name: nomeFalado(i),
          description: i.descricao,
          ...(i.foto ? { image: `${SITE_URL}/images/fotos/${i.foto.arquivo}-720.webp` } : {}),
          offers: { '@type': 'Offer', price: i.preco.toFixed(2), priceCurrency: 'BRL' },
        })),
      })),
      {
        '@type': 'MenuSection',
        name: 'Adicionais',
        hasMenuItem: ADICIONAIS.map((a) => ({
          '@type': 'MenuItem',
          name: a.nome,
          offers: { '@type': 'Offer', price: a.preco.toFixed(2), priceCurrency: 'BRL' },
        })),
      },
    ],
  }
}

function noDoFaq() {
  return {
    '@type': 'FAQPage',
    mainEntity: FAQ.map((p) => ({
      '@type': 'Question',
      name: p.pergunta,
      acceptedAnswer: { '@type': 'Answer', text: p.resposta },
    })),
  }
}

function trilha(path: string) {
  const rota = ROTAS.find((r) => r.path === path)
  if (!rota || path === '/') return null
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: rota.rotulo, item: canonicalDe(rota) },
    ],
  }
}

/**
 * O grafo de uma rota. Cada página só declara o que mostra: FAQ na home,
 * Menu no cardápio (que é onde ele aparece inteiro).
 */
export function gerarJsonLd(path = '/') {
  const grafo: Record<string, unknown>[] = [noDaCasa()]
  if (path === '/') grafo.push(noDoFaq())
  if (path === '/cardapio') grafo.push(noDoMenu())
  const b = trilha(path)
  if (b) grafo.push(b)
  return { '@context': 'https://schema.org', '@graph': grafo }
}

const reais = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

/** llms.txt — o site resumido para assistentes de IA, com os dados da página. */
export function gerarLlmsTxt(): string {
  const l: string[] = [
    `# ${CASA.nome}`,
    '',
    `> Hamburgueria artesanal em ${CASA.cidade} (${CASA.uf}). ${CASA.lema}`,
    '',
    '## Funcionamento',
    '',
    ...resumoDaSemana(CASA.semana).map((x) => `- ${x.dias}: ${x.horario}`),
    `- Pedidos: iFood (${CASA.ifood}) ou WhatsApp ${CASA.telefone}`,
    `- Instagram: @${CASA.instagram}`,
    '',
    '## Cardápio',
    '',
  ]
  for (const [categoria, { nome }] of Object.entries(CATEGORIAS)) {
    l.push(`### ${nome}`, '')
    for (const i of CARDAPIO.filter((x) => x.categoria === categoria)) {
      const desc = i.categoria === 'bebidas' ? '' : ` — ${i.descricao}`
      l.push(`- ${nomeFalado(i)}: ${reais(i.preco)}${desc}`)
    }
    l.push('')
  }
  l.push('### Adicionais (em qualquer lanche)', '')
  for (const a of ADICIONAIS) l.push(`- ${a.nome}: ${reais(a.preco)}`)
  l.push('', '## Perguntas frequentes', '')
  for (const p of FAQ) l.push(`**${p.pergunta}**`, p.resposta, '')
  return `${l.join('\n').trim()}\n`
}
