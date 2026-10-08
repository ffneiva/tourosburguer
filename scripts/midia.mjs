/**
 * Fotos e vídeos do site, tirados dos reels da casa.
 *
 *   FFMPEG=/caminho/ffmpeg npm run midia
 *
 * O Touro's não tem ensaio fotográfico: tem reels no Instagram, filmados em
 * 1080p na própria cozinha. É o melhor material que existe — comida real, da
 * chapa deles — e é daqui que saem as fotos do cardápio e os vídeos da seção
 * "Na chapa". Cada saída declara de qual reel, em que segundo e com que
 * recorte, para que trocar uma foto seja trocar uma linha.
 *
 * Os reels brutos (~50 MB) ficam FORA do repositório, em
 * ../_midia-tourosburguer/reels (ver o indice.json de lá, com a URL de cada
 * um). O que entra no repositório é só o resultado: os quadros recortados em
 * assets-src/fotos (que `npm run assets` converte) e os vídeos curtos em
 * public/videos.
 *
 * Precisa de um ffmpeg: no PATH ou em FFMPEG.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const RAIZ = path.resolve(import.meta.dirname, '..')
const REELS = process.env.REELS ?? path.resolve(RAIZ, '../_midia-tourosburguer/reels')
const FOTOS = path.join(RAIZ, 'assets-src/fotos')
const VIDEOS = path.join(RAIZ, 'public/videos')
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg'

/**
 * Quadros para foto. `recorte` é [largura, altura, x, y] no quadro original.
 * Os reels têm 1080 × 1920 (alguns 720 × 1280, um 1440 × 2560).
 */
const FOTOS_DOS_REELS = [
  { saida: 'cheese-burguer', reel: 'cheese-giro', t: 12.3, recorte: [1080, 1350, 0, 260] },
  { saida: 'bacon-cheddar', reel: 'cheddar-e-bacon', t: 10.0, recorte: [1080, 1350, 0, 500] },
  {
    saida: 'bacon-catupiry',
    reel: 'montando-bacon-catupiry',
    t: 21.6,
    recorte: [880, 1100, 20, 260],
  },
  { saida: 't-chicken', reel: 'montagem-t-chicken', t: 24.0, recorte: [720, 900, 0, 0] },
  { saida: 'touros-tudo', reel: 'touros-tudo-18', t: 9.6, recorte: [1040, 1040, 300, 1220] },
  { saida: 'na-mao', reel: 'deu-vontade', t: 10.5, recorte: [720, 900, 0, 200] },
  { saida: 'prato', reel: 'melhor-de-jf', t: 11.0, recorte: [1080, 1350, 0, 470] },
]

/**
 * Trechos para a seção "Na chapa": verticais, curtos, sem som. `velocidade`
 * acelera a montagem inteira do Bacon Catupiry (19 s) para caber em 8.
 */
const TRECHOS = [
  { saida: 'cheddar', reel: 'cheddar-e-bacon', de: 0.0, ate: 3.3 },
  { saida: 'montagem', reel: 'montando-bacon-catupiry', de: 4.4, ate: 23.3, velocidade: 2.4 },
  { saida: 'giro', reel: 'cheese-giro', de: 5.6, ate: 9.6 },
  { saida: 'chapa', reel: 'montagem-t-chicken', de: 12.7, ate: 19.0 },
  { saida: 'embalando', reel: 'embalando', de: 2.6, ate: 8.6 },
]

/** 432 × 768: nítido num cartão de ~300 px em tela 1,5×, e ~0,5 MB por trecho. */
const LARGURA_VIDEO = 432

function ff(args) {
  execFileSync(FFMPEG, ['-v', 'error', '-y', ...args], { stdio: 'inherit' })
}

function reel(nome) {
  const arquivo = path.join(REELS, `${nome}.mp4`)
  if (!existsSync(arquivo)) throw new Error(`Reel não encontrado: ${arquivo}`)
  return arquivo
}

mkdirSync(FOTOS, { recursive: true })
mkdirSync(VIDEOS, { recursive: true })

console.log('Fotos:')
for (const f of FOTOS_DOS_REELS) {
  const [w, h, x, y] = f.recorte
  ff([
    '-ss',
    String(f.t),
    '-i',
    reel(f.reel),
    '-frames:v',
    '1',
    '-vf',
    `crop=${w}:${h}:${x}:${y}`,
    '-q:v',
    '2',
    path.join(FOTOS, `${f.saida}.jpg`),
  ])
  console.log(`  ${f.saida}.jpg  ← ${f.reel} @ ${f.t}s`)
}

console.log('Vídeos:')
for (const v of TRECHOS) {
  const velocidade = v.velocidade ?? 1
  const filtros = [
    `setpts=PTS/${velocidade}`,
    `scale=${LARGURA_VIDEO}:-2:flags=lanczos`,
    'fps=30',
    'format=yuv420p',
  ].join(',')
  ff([
    '-ss',
    String(v.de),
    '-to',
    String(v.ate),
    '-i',
    reel(v.reel),
    '-an',
    '-vf',
    filtros,
    '-c:v',
    'libx264',
    '-profile:v',
    'high',
    '-preset',
    'slow',
    '-crf',
    '29',
    '-movflags',
    '+faststart',
    path.join(VIDEOS, `${v.saida}.mp4`),
  ])
  // O pôster é o primeiro quadro do trecho: é o que aparece antes de o vídeo
  // tocar, e o que fica para quem pediu movimento reduzido.
  ff([
    '-ss',
    String(v.de + 0.05),
    '-i',
    reel(v.reel),
    '-frames:v',
    '1',
    '-vf',
    `scale=${LARGURA_VIDEO * 2}:-2:flags=lanczos`,
    '-q:v',
    '2',
    path.join(FOTOS, `video-${v.saida}.jpg`),
  ])
  console.log(
    `  ${v.saida}.mp4  ← ${v.reel} ${v.de}–${v.ate}s${velocidade > 1 ? ` (${velocidade}×)` : ''}`,
  )
}
