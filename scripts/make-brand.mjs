/**
 * Gera os arquivos de marca: favicon, ícones e as artes de compartilhamento.
 *
 *   npm run brand
 *
 * Duas fontes: a marca em vetor (src/lib/marca.ts — o selo vetorizado do
 * logo da casa) e a lista de rotas (src/lib/routes.ts). Uma rota nova ganha a
 * sua arte de WhatsApp sem ninguém abrir um editor.
 *
 * As artes são renderizadas por um Chromium de verdade (o do Playwright), com
 * as fontes do próprio site: o título da prévia do WhatsApp sai na mesma
 * Oswald da página, sobre uma foto real de um reel da casa.
 *
 * Roda com --experimental-strip-types para importar os .ts sem build.
 */
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'
import sharp from 'sharp'
import { ANEL, BURGUER, ESTRELAS, LETREIRO, QUADRO, TOURO } from '../src/lib/marca.ts'
import { ogArquivoDe, ROTAS } from '../src/lib/routes.ts'

const RAIZ = path.resolve(import.meta.dirname, '..')
const PUBLIC = path.join(RAIZ, 'public')

const NOITE = '#0c0b0a'
const CREME = '#f5ecdc'
const OURO = '#d6a650'

const METAL = `<linearGradient id="m" x1="0" y1="0" x2="0.18" y2="1"><stop offset="0" stop-color="#f6d994"/><stop offset="0.42" stop-color="#d9a852"/><stop offset="0.7" stop-color="#b98534"/><stop offset="1" stop-color="#8e6322"/></linearGradient>`

const peca = (p, fill = 'url(#m)') =>
  `<path d="${p.d}" transform="translate(${p.x} ${p.y})" fill="${fill}" fill-rule="evenodd"/>`

/** O selo inteiro em SVG, com fundo preto no miolo. */
function seloSvg() {
  const e = ANEL.espessura
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${QUADRO.w} ${QUADRO.h}"><defs>${METAL}</defs><ellipse cx="${ANEL.cx}" cy="${ANEL.cy}" rx="${ANEL.rx}" ry="${ANEL.ry}" fill="${NOITE}"/><ellipse cx="${ANEL.cx}" cy="${ANEL.cy}" rx="${ANEL.rx - e / 2}" ry="${ANEL.ry - e / 2}" fill="none" stroke="url(#m)" stroke-width="${e}"/>${peca(TOURO)}${peca(LETREIRO)}${peca(BURGUER)}${peca(ESTRELAS)}</svg>`
}

/**
 * O favicon: só a cabeça do touro, dourada, num disco preto.
 *
 * O selo inteiro a 16 px é uma mancha — o letreiro some. O que sobrevive a
 * 16 px são os chifres e o focinho, que é justamente o que se reconhece do
 * avatar do Instagram. E é vetor de verdade: nada de PNG embutido.
 */
function faviconSvg() {
  const lado = Math.max(TOURO.w, TOURO.h) * 1.34
  const dx = (lado - TOURO.w) / 2
  const dy = (lado - TOURO.h) / 2 + lado * 0.02
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado.toFixed(0)} ${lado.toFixed(0)}"><defs>${METAL}</defs><circle cx="${lado / 2}" cy="${lado / 2}" r="${lado / 2}" fill="${NOITE}"/><path d="${TOURO.d}" transform="translate(${dx.toFixed(1)} ${dy.toFixed(1)})" fill="url(#m)" fill-rule="evenodd"/></svg>`
}

/**
 * O .ico que o navegador pede sozinho em /favicon.ico, mesmo com o SVG
 * declarado no <head> — sem ele, cada visita gera um 404 no log. O formato
 * ICO aceita PNG embutido: um cabeçalho de 22 bytes e o PNG de 32 px.
 */
function icoDePng(png) {
  const cabecalho = Buffer.alloc(22)
  cabecalho.writeUInt16LE(0, 0)
  cabecalho.writeUInt16LE(1, 2)
  cabecalho.writeUInt16LE(1, 4)
  cabecalho.writeUInt8(32, 6)
  cabecalho.writeUInt8(32, 7)
  cabecalho.writeUInt8(0, 8)
  cabecalho.writeUInt8(0, 9)
  cabecalho.writeUInt16LE(1, 10)
  cabecalho.writeUInt16LE(32, 12)
  cabecalho.writeUInt32LE(png.length, 14)
  cabecalho.writeUInt32LE(22, 18)
  return Buffer.concat([cabecalho, png])
}

async function icones() {
  const favicon = faviconSvg()
  await writeFile(path.join(PUBLIC, 'favicon.svg'), favicon)
  console.log('  favicon.svg')

  const png = async (nome, svg, tamanho, margem = 0) => {
    const interno = Math.round(tamanho * (1 - margem * 2))
    const imagem = await sharp(Buffer.from(svg), { density: 600 })
      .resize(interno, interno, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
    const off = Math.round((tamanho - interno) / 2)
    await sharp({
      create: {
        width: tamanho,
        height: tamanho,
        channels: 4,
        background: margem ? NOITE : { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: imagem, left: off, top: off }])
      .png({ compressionLevel: 9 })
      .toFile(path.join(PUBLIC, nome))
    console.log(`  ${nome}`)
  }
  await png('favicon-32.png', favicon, 32)
  await png('favicon-64.png', favicon, 64)
  // Tela inicial: o selo inteiro, onde o letreiro é legível, com fundo preto
  // até a borda — o sistema recorta em círculo ou squircle.
  await png('apple-touch-icon.png', seloSvg(), 180, 0.08)
  await png('icon-192.png', seloSvg(), 192, 0.12)
  await png('icon-512.png', seloSvg(), 512, 0.12)

  await writeFile(
    path.join(PUBLIC, 'favicon.ico'),
    icoDePng(await readFile(path.join(PUBLIC, 'favicon-32.png'))),
  )
  console.log('  favicon.ico')

  // O manifesto aponta os ícones com versão por conteúdo: nome fixo + cache
  // longo = ícone velho na tela inicial de quem instalou o site.
  const v = async (arquivo) =>
    createHash('sha1')
      .update(await readFile(path.join(PUBLIC, arquivo)))
      .digest('hex')
      .slice(0, 8)
  const versoes = { 192: await v('icon-192.png'), 512: await v('icon-512.png') }
  const manifesto = {
    name: 'Touro’s Burguer',
    short_name: 'Touro’s',
    description: 'Hamburgueria artesanal em Juiz de Fora.',
    lang: 'pt-BR',
    start_url: '/',
    display: 'standalone',
    background_color: NOITE,
    theme_color: NOITE,
    icons: ['any', 'maskable'].flatMap((purpose) =>
      [192, 512].map((l) => ({
        src: `/icon-${l}.png?v=${versoes[l]}`,
        sizes: `${l}x${l}`,
        type: 'image/png',
        purpose,
      })),
    ),
  }
  await writeFile(path.join(PUBLIC, 'site.webmanifest'), `${JSON.stringify(manifesto, null, 2)}\n`)
  console.log('  site.webmanifest')
}

const base64 = async (arquivo) => (await readFile(arquivo)).toString('base64')

async function artes() {
  const oswald = await base64(path.join(PUBLIC, 'fonts', 'oswald-latin.woff2'))
  const hanken = await base64(path.join(PUBLIC, 'fonts', 'hanken-latin.woff2'))
  const selo = `data:image/svg+xml;base64,${Buffer.from(seloSvg()).toString('base64')}`

  const fotoDe = async (rota) => {
    const jpg = await sharp(path.join(RAIZ, 'assets-src/fotos', `${rota.ogFoto}.jpg`))
      .resize(640, 630, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 86 })
      .toBuffer()
    return `data:image/jpeg;base64,${jpg.toString('base64')}`
  }

  const navegador = await chromium.launch()
  const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 } })
  const feitas = new Set()

  for (const rota of ROTAS) {
    const arquivo = ogArquivoDe(rota)
    if (feitas.has(arquivo) || !rota.og) continue
    feitas.add(arquivo)
    const [linha1, linha2] = rota.og
    const foto = await fotoDe(rota)

    await pagina.setContent(`<!doctype html><html><head><style>
      @font-face{font-family:O;src:url(data:font/woff2;base64,${oswald}) format('woff2');font-weight:300 700}
      @font-face{font-family:H;src:url(data:font/woff2;base64,${hanken}) format('woff2');font-weight:300 700}
      *{margin:0;box-sizing:border-box}
      body{width:1200px;height:630px;background:${NOITE};color:${CREME};font-family:H;position:relative;overflow:hidden}
      .brasa{position:absolute;left:-160px;bottom:-220px;width:760px;height:620px;border-radius:50%;background:radial-gradient(circle,rgba(226,120,43,.28),transparent 65%)}
      .foto{position:absolute;inset:0 0 0 auto;width:600px;background:url(${foto}) center/cover}
      .foto::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,${NOITE} 0%,rgba(12,11,10,.55) 28%,rgba(12,11,10,0) 60%)}
      .txt{position:absolute;left:72px;top:0;bottom:0;width:600px;display:flex;flex-direction:column;justify-content:center;gap:24px;padding-top:70px}
      h1{font-family:O;font-weight:600;text-transform:uppercase;font-size:70px;line-height:.96;letter-spacing:-.01em}
      h1 em{font-style:normal;background:linear-gradient(172deg,#f0cd86,#d6a650 45%,#9c6f26);-webkit-background-clip:text;color:transparent}
      p{font-family:H;font-size:20px;letter-spacing:.14em;text-transform:uppercase;color:${OURO};font-weight:600}
      .selo{position:absolute;left:72px;top:48px;width:96px}
    </style></head><body>
      <div class="brasa"></div>
      <div class="foto"></div>
      <img class="selo" src="${selo}">
      <div class="txt"><h1>${linha1}<br><em>${linha2}</em></h1>${rota.ogNota ? `<p>${rota.ogNota}</p>` : ''}</div>
    </body></html>`)
    await pagina.evaluate(() => document.fonts.ready)
    const png = await pagina.screenshot({ type: 'png' })
    await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(PUBLIC, arquivo))
    console.log(`  ${arquivo}`)
  }
  await navegador.close()
}

console.log('Ícones:')
await icones()
console.log('Artes de compartilhamento:')
await artes()
