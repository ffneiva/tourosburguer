import { SITE_URL } from './business.ts'

/**
 * As rotas do site e o `<head>` de cada uma.
 *
 * Importado dos dois lados: pelo React e pelo vite.config.ts, que gera um HTML
 * estático por rota. Por isso não toca em `window` nem importa nada de DOM.
 */
export type Rota = {
  path: string
  rotulo: string
  titulo: string
  descricao: string
  noindex?: boolean
  /** As duas linhas grandes da arte de compartilhamento. */
  og?: readonly [string, string]
  ogNota?: string
  /** Foto de fundo da arte (assets-src/fotos). */
  ogFoto?: string
}

export const ROTAS: Rota[] = [
  {
    path: '/',
    rotulo: 'Início',
    titulo: 'Touro’s Burguer · Hamburgueria artesanal em Juiz de Fora',
    descricao:
      'Hambúrgueres artesanais em Juiz de Fora, de segunda a sábado, das 18h30 às 23h: blend de 120 g, pão brioche e bacon selecionado. Peça pelo iFood ou pelo WhatsApp.',
    og: ['Hambúrgueres que viciam', 'na primeira mordida.'],
    ogNota: 'Juiz de Fora · Seg a sáb · 18h30 às 23h',
    ogFoto: 'bacon-cheddar',
  },
  {
    path: '/cardapio',
    rotulo: 'Cardápio',
    titulo: 'Cardápio e preços · Touro’s Burguer, Juiz de Fora',
    descricao:
      'O cardápio completo do Touro’s Burguer com preços: seis artesanais, o Touro’s Tudo, adicionais e bebidas. Monte o lanche do seu jeito e envie pelo WhatsApp, ou peça pelo iFood.',
    og: ['O cardápio inteiro,', 'com preço.'],
    ogNota: 'Monte o lanche e envie pelo WhatsApp',
    ogFoto: 'bacon-catupiry',
  },
  {
    path: '/politica-de-privacidade',
    rotulo: 'Privacidade',
    titulo: 'Política de privacidade · Touro’s Burguer',
    descricao:
      'Como o site do Touro’s Burguer trata dados: o que fica no seu aparelho, o que é enviado ao WhatsApp e o que não é coletado.',
  },
]

/**
 * Endereço inexistente — servido como 404 de verdade.
 * `noindex` evita o *soft 404*: uma URL errada devolvendo a home com 200.
 */
export const NAO_ENCONTRADA: Rota = {
  path: '/404',
  rotulo: 'Não encontrada',
  titulo: 'Página não encontrada · Touro’s Burguer',
  descricao: 'Este endereço não existe no site do Touro’s Burguer.',
  noindex: true,
}

function limpar(pathname: string): string {
  return pathname.replace(/\/+$/, '').toLowerCase() || '/'
}

export function rotaDe(pathname: string): Rota {
  return ROTAS.find((r) => r.path === limpar(pathname)) ?? NAO_ENCONTRADA
}

export function canonicalDe(rota: Rota): string {
  return rota.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${rota.path}`
}

/**
 * Arquivo da arte de compartilhamento — a MESMA função no gerador
 * (scripts/make-brand.mjs) e no plugin que escreve o `<head>`.
 */
export function ogArquivoDe(rota: Rota): string {
  if (!rota.og || rota.path === '/') return 'og.jpg'
  return `og-${rota.path.replace(/^\//, '').replace(/\//g, '-')}.jpg`
}

export function ogUrlDe(rota: Rota): string {
  return `${SITE_URL}/${ogArquivoDe(rota)}`
}
