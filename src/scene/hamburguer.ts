import * as THREE from 'three'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import type { Camada } from '@/lib/camadas'

/**
 * O Touro's Bacon Cheddar em 3D — inteiro em código.
 *
 * Nenhum `.glb`, nenhum HDRI, nenhuma textura em arquivo: o chunk é o
 * three.js e estas linhas. Cada camada é geometria gerada com ruído
 * determinístico (a mesma peça em toda visita), e a cena faz duas coisas:
 *
 * 1. **No herói, gira.** O lanche montado, à direita do título (embaixo, no
 *    celular), sob uma luz quente de chapa, com brasas subindo.
 *
 * 2. **Na anatomia, abre.** Conforme a rolagem, ele vai para o centro e as
 *    camadas se separam, de baixo para cima, até ficarem uma sobre a outra
 *    com ar entre elas — e a cena informa onde cada uma está na tela, para os
 *    rótulos em HTML acompanharem (`aoQuadro`). Texto em HTML e não em 3D:
 *    nítido, traduzível, legível por leitor de tela.
 *
 * O pão é o da casa — amarelo mesmo, espelhado de gema, sem gergelim.
 */

export type OpcoesCena = {
  /** Celular: menos segmentos, sem antisserrilhado, resolução reduzida. */
  compacto: boolean
}

export type PosicaoNaTela = {
  camada: Camada
  x: number
  y: number
  lado: 1 | -1
  /** Quanto esta camada já se abriu, de 0 a 1 — o rótulo acende junto. */
  aberta: number
}

/** A montagem da anatomia, de baixo para cima. */
const MONTAGEM: Camada[] = [
  'pao-base',
  'alface',
  'tomate',
  'blend',
  'cheddar',
  'bacon',
  'cebola',
  'pao-topo',
]

/** Espessura de cada camada em unidades da cena (o pão tem raio ~1). */
const ESPESSURA: Partial<Record<Camada, number>> = {
  'pao-base': 0.3,
  alface: 0.05,
  tomate: 0.1,
  blend: 0.3,
  cheddar: 0.03,
  bacon: 0.07,
  cebola: 0.05,
  'pao-topo': 0.66,
}

/** Distância entre camadas com o lanche totalmente aberto. */
const VAO = 0.52

// ─────────────────────────────────────────────────────────────────────────────
// Ruído determinístico
// ─────────────────────────────────────────────────────────────────────────────

function aleatorio(semente: number) {
  let s = semente >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Ruído periódico em ângulo: soma de senos com fases sorteadas. */
function ruidoAngular(semente: number, harmonicas = 5) {
  const r = aleatorio(semente)
  const termos = Array.from({ length: harmonicas }, (_, i) => ({
    f: i + 2 + Math.floor(r() * 3),
    fase: r() * Math.PI * 2,
    a: 1 / (i + 1.5),
  }))
  const norma = termos.reduce((s, t) => s + t.a, 0)
  return (angulo: number) =>
    termos.reduce((s, t) => s + Math.sin(angulo * t.f + t.fase) * t.a, 0) / norma
}

const suave = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// ─────────────────────────────────────────────────────────────────────────────
// Estúdio: a luz da chapa
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Luz de balcão de hamburgueria: uma key quente e larga por cima, um rim
 * dourado atrás para recortar o pão contra o fundo preto e um preenchimento
 * baixo e fraco. O brilho do pão (clearcoat) só existe se houver o que
 * refletir — é para isso que o ambiente é cozido.
 */
const SOFTBOXES = [
  { pos: [0, 6, 2.5], escala: [9, 3], intensidade: 6.5, cor: '#fff0d6' },
  { pos: [-5, 2.5, -4], escala: [5, 6], intensidade: 5, cor: '#ffc56b' },
  { pos: [5.5, 1.5, 3], escala: [4, 6], intensidade: 2.6, cor: '#ffe2c0' },
  { pos: [0, 1, 7], escala: [12, 4], intensidade: 1.3, cor: '#f6e2c8' },
  { pos: [0, -4, 0], escala: [12, 12], intensidade: 0.35, cor: '#4a2e18' },
] as const

function montarAmbiente(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer)
  const estudio = new THREE.Scene()
  estudio.background = new THREE.Color('#0e0b08')
  const descartar: Array<{ dispose(): void }> = []
  for (const box of SOFTBOXES) {
    const geo = new THREE.PlaneGeometry(box.escala[0], box.escala[1])
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(box.cor).multiplyScalar(box.intensidade),
      side: THREE.DoubleSide,
    })
    const malha = new THREE.Mesh(geo, mat)
    malha.position.set(box.pos[0], box.pos[1], box.pos[2])
    malha.lookAt(0, 0, 0)
    estudio.add(malha)
    descartar.push(geo, mat)
  }
  const alvo = pmrem.fromScene(estudio, 0.04)
  pmrem.dispose()
  for (const d of descartar) d.dispose()
  return alvo.texture
}

// ─────────────────────────────────────────────────────────────────────────────
// Texturas em canvas
// ─────────────────────────────────────────────────────────────────────────────

function canvas(tamanho: number, desenhar: (c: CanvasRenderingContext2D, t: number) => void) {
  const el = document.createElement('canvas')
  el.width = tamanho
  el.height = tamanho
  desenhar(el.getContext('2d') as CanvasRenderingContext2D, tamanho)
  const tex = new THREE.CanvasTexture(el)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/** A carne: marrom com pontos de crosta e de gordura, e a marca da chapa. */
function texturaDaCarne(t: number) {
  const r = aleatorio(11)
  return canvas(t, (c) => {
    c.fillStyle = '#4e2c1b'
    c.fillRect(0, 0, t, t)
    for (let i = 0; i < 2400; i++) {
      const x = r() * t
      const y = r() * t
      const raio = 0.6 + r() * 2.6
      const tom = r()
      c.fillStyle =
        tom > 0.72 ? 'rgba(125,74,48,0.7)' : tom > 0.4 ? 'rgba(34,17,9,0.65)' : 'rgba(92,52,30,0.6)'
      c.beginPath()
      c.arc(x, y, raio, 0, Math.PI * 2)
      c.fill()
    }
  })
}

/** O pão por dentro: miolo claro e poroso. */
function texturaDoMiolo(t: number) {
  const r = aleatorio(5)
  return canvas(t, (c) => {
    const g = c.createRadialGradient(t / 2, t / 2, 0, t / 2, t / 2, t / 2)
    g.addColorStop(0, '#fbe3a0')
    g.addColorStop(0.85, '#f5cd6a')
    g.addColorStop(1, '#e6a42a')
    c.fillStyle = g
    c.fillRect(0, 0, t, t)
    for (let i = 0; i < 900; i++) {
      c.fillStyle = r() > 0.5 ? 'rgba(210,150,50,0.35)' : 'rgba(255,245,210,0.5)'
      c.beginPath()
      c.ellipse(r() * t, r() * t, 0.8 + r() * 2.2, 0.6 + r() * 1.6, r() * 3, 0, Math.PI * 2)
      c.fill()
    }
  })
}

/** Bacon: faixas de carne e gordura no comprimento, com borda tostada. */
function texturaDoBacon(t: number) {
  const r = aleatorio(23)
  return canvas(t, (c) => {
    c.fillStyle = '#a8392a'
    c.fillRect(0, 0, t, t)
    const faixas = 5
    for (let i = 0; i < faixas; i++) {
      const x = (i + 0.3 + r() * 0.4) * (t / faixas)
      c.strokeStyle = 'rgba(246,206,178,0.85)'
      c.lineWidth = 4 + r() * 10
      c.beginPath()
      c.moveTo(x, 0)
      for (let y = 0; y <= t; y += 16) c.lineTo(x + Math.sin(y * 0.03 + i) * 6, y)
      c.stroke()
    }
    c.fillStyle = 'rgba(90,22,12,0.5)'
    c.fillRect(0, 0, t * 0.06, t)
    c.fillRect(t * 0.94, 0, t * 0.06, t)
  })
}

/** Tomate por cima: polpa vermelha, lóculos claros com sementes. */
function texturaDoTomate(t: number) {
  const r = aleatorio(31)
  return canvas(t, (c) => {
    c.fillStyle = '#c92a20'
    c.fillRect(0, 0, t, t)
    const m = t / 2
    c.fillStyle = '#e8503a'
    c.beginPath()
    c.arc(m, m, m * 0.84, 0, Math.PI * 2)
    c.fill()
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3
      c.fillStyle = '#f7876a'
      c.beginPath()
      c.ellipse(m + Math.cos(a) * m * 0.46, m + Math.sin(a) * m * 0.46, m * 0.2, m * 0.13, a, 0, 7)
      c.fill()
      for (let s = 0; s < 6; s++) {
        c.fillStyle = '#fbe0a8'
        c.beginPath()
        c.ellipse(
          m + Math.cos(a) * m * (0.36 + r() * 0.2) + (r() - 0.5) * 8,
          m + Math.sin(a) * m * (0.36 + r() * 0.2) + (r() - 0.5) * 8,
          3,
          1.8,
          r() * 3,
          0,
          7,
        )
        c.fill()
      }
    }
    c.fillStyle = '#f4a08a'
    c.beginPath()
    c.arc(m, m, m * 0.14, 0, Math.PI * 2)
    c.fill()
  })
}

/** Sombra de contato: um radial borrado, mais barato que sombra de verdade. */
function texturaDeSombra() {
  return canvas(128, (c, t) => {
    const g = c.createRadialGradient(t / 2, t / 2, 0, t / 2, t / 2, t / 2)
    g.addColorStop(0, 'rgba(0,0,0,0.85)')
    g.addColorStop(0.5, 'rgba(0,0,0,0.4)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    c.fillStyle = g
    c.fillRect(0, 0, t, t)
  })
}

/** A brasa: um ponto quente com halo, para as partículas. */
function texturaDaBrasa() {
  return canvas(64, (c, t) => {
    const g = c.createRadialGradient(t / 2, t / 2, 0, t / 2, t / 2, t / 2)
    g.addColorStop(0, 'rgba(255,236,190,1)')
    g.addColorStop(0.25, 'rgba(255,150,60,0.9)')
    g.addColorStop(1, 'rgba(255,80,20,0)')
    c.fillStyle = g
    c.fillRect(0, 0, t, t)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// As camadas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Une os vértices da costura do torno antes de calcular as normais.
 *
 * O LatheGeometry duplica a primeira coluna de vértices no fim (por causa do
 * UV), e as normais dos dois lados da costura saem diferentes: aparece uma
 * linha vertical no pão. Sem UV — o pão não tem textura —, os vértices
 * duplicados se fundem e a costura some.
 */
function soldar(geo: THREE.BufferGeometry) {
  geo.deleteAttribute('uv')
  const soldada = mergeVertices(geo, 1e-4)
  soldada.computeVertexNormals()
  geo.dispose()
  return soldada
}

type Pecas = { segmentos: number; texturas: number }

/** Pão de baixo: disco com borda arredondada e o miolo por cima. */
function paoBase(p: Pecas, miolo: THREE.Texture) {
  const h = ESPESSURA['pao-base'] as number
  const perfil = [
    [0, 0],
    [0.82, 0],
    [0.95, 0.03],
    [1.02, 0.1],
    [1.03, 0.19],
    [0.99, h - 0.02],
    [0.95, h],
    [0, h],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  const grupo = new THREE.Group()
  const casca = new THREE.Mesh(
    soldar(new THREE.LatheGeometry(perfil, p.segmentos)),
    new THREE.MeshPhysicalMaterial({
      color: '#e8940e',
      roughness: 0.42,
      clearcoat: 0.5,
      clearcoatRoughness: 0.3,
    }),
  )
  const tampa = new THREE.Mesh(
    new THREE.CircleGeometry(0.955, p.segmentos),
    new THREE.MeshStandardMaterial({ map: miolo, roughness: 0.9 }),
  )
  tampa.rotation.x = -Math.PI / 2
  tampa.position.y = h + 0.001
  grupo.add(casca, tampa)
  return grupo
}

/**
 * Pão de cima: a cúpula brilhante da casa. O perfil é de brioche — ombro
 * largo, topo baixo — e leva uma ondulação leve no ângulo, para não parecer
 * torneado.
 */
function paoTopo(p: Pecas, miolo: THREE.Texture) {
  const h = ESPESSURA['pao-topo'] as number
  // De baixo para cima: é a ordem que deixa as normais do torno para fora.
  const perfil = [
    [0.96, 0],
    [1.02, 0.015],
    [1.06, 0.07],
    [1.04, h - 0.47],
    [0.95, h - 0.32],
    [0.8, h - 0.17],
    [0.58, h - 0.06],
    [0.3, h - 0.012],
    [0, h],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  const bruta = new THREE.LatheGeometry(perfil, p.segmentos)
  const ruido = ruidoAngular(3)
  const pos = bruta.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const y = pos.getY(i)
    const a = Math.atan2(z, x)
    const k = 1 + ruido(a) * 0.018
    // A ondulação de altura some no polo: lá todos os vértices são o mesmo
    // ponto, e alturas diferentes fariam uma estrela no topo do pão.
    const peso = Math.min(1, Math.hypot(x, z) / 0.9)
    pos.setXYZ(i, x * k, y * (1 + ruido(a + 1) * 0.03 * peso), z * k)
  }
  const geo = soldar(bruta)
  const grupo = new THREE.Group()
  const cupula = new THREE.Mesh(
    geo,
    new THREE.MeshPhysicalMaterial({
      color: '#e8920c',
      roughness: 0.3,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      sheen: 0.4,
      sheenColor: new THREE.Color('#ffd27a'),
    }),
  )
  const base = new THREE.Mesh(
    new THREE.CircleGeometry(0.965, p.segmentos),
    new THREE.MeshStandardMaterial({ map: miolo, roughness: 0.9 }),
  )
  base.rotation.x = Math.PI / 2
  grupo.add(cupula, base)
  return grupo
}

/** O blend: disco irregular, com crosta, borda que não é círculo perfeito. */
function blend(p: Pecas, textura: THREE.Texture) {
  const h = ESPESSURA.blend as number
  const geo = new THREE.CylinderGeometry(1.07, 1.09, h, p.segmentos, 3, false)
  // Só a borda é irregular. Ruído vertical na tampa do cilindro faceta os
  // triângulos em leque — o disco vira um guarda-chuva.
  const borda = ruidoAngular(7, 6)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    if (Math.hypot(x, z) < 1e-4) continue
    const k = 1 + borda(Math.atan2(z, x)) * 0.05
    pos.setXYZ(i, x * k, pos.getY(i), z * k)
  }
  geo.computeVertexNormals()
  geo.translate(0, h / 2, 0)
  return new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      map: textura,
      color: '#b27a58',
      roughness: 0.74,
      metalness: 0,
    }),
  )
}

/**
 * A fatia de cheddar: um quadrado a 45° sobre a carne, com as pontas
 * derretidas caindo pela borda — o que faz a peça ser lida como "cheese".
 */
function cheddar(p: Pecas) {
  const n = p.segmentos >= 96 ? 48 : 30
  const geo = new THREE.PlaneGeometry(1.94, 1.94, n, n)
  geo.rotateX(-Math.PI / 2)
  geo.rotateY(Math.PI / 4)
  const ruido = ruidoAngular(17, 4)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const d = Math.hypot(x, z)
    const a = Math.atan2(z, x)
    const inicio = 0.98 + ruido(a) * 0.05
    // Fora da borda da carne o queijo derrete para baixo, sem virar cortina.
    const cai = d > inicio ? Math.max(-0.2, -((d - inicio) ** 1.4) * 1.3) : 0
    const recolhe = d > 1.05 ? 1 - (d - 1.05) * 0.3 : 1
    pos.setXYZ(i, x * recolhe, cai + 0.012 * Math.sin(x * 9) * Math.cos(z * 7), z * recolhe)
  }
  geo.computeVertexNormals()
  return new THREE.Mesh(
    geo,
    new THREE.MeshPhysicalMaterial({
      color: '#f59c16',
      roughness: 0.36,
      clearcoat: 0.45,
      clearcoatRoughness: 0.35,
      side: THREE.DoubleSide,
    }),
  )
}

/** Três fatias de bacon onduladas, cruzando o lanche. */
function bacon(p: Pecas, textura: THREE.Texture) {
  const grupo = new THREE.Group()
  const material = new THREE.MeshStandardMaterial({
    map: textura,
    roughness: 0.55,
    side: THREE.DoubleSide,
  })
  const faixas = [
    { x: -0.42, rot: 0.22, fase: 0 },
    { x: 0.05, rot: -0.12, fase: 1.7 },
    { x: 0.48, rot: 0.3, fase: 3.1 },
  ]
  for (const f of faixas) {
    const geo = new THREE.PlaneGeometry(0.36, 2.25, 4, p.segmentos >= 96 ? 70 : 40)
    geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const onda = Math.sin(z * 5.2 + f.fase) * 0.045 + Math.sin(z * 11 + f.fase) * 0.012
      // As pontas passam da borda do pão e caem um pouco.
      const ponta = Math.abs(z) > 0.95 ? -((Math.abs(z) - 0.95) ** 2) * 0.9 : 0
      pos.setXYZ(i, x + Math.sin(z * 3 + f.fase) * 0.05, onda + ponta + 0.035, z)
    }
    geo.computeVertexNormals()
    const fatia = new THREE.Mesh(geo, material)
    fatia.position.x = f.x
    fatia.rotation.y = f.rot
    grupo.add(fatia)
  }
  return grupo
}

/** Anéis de cebola roxa espalhados. */
function cebola(p: Pecas) {
  const grupo = new THREE.Group()
  const r = aleatorio(41)
  const material = new THREE.MeshPhysicalMaterial({
    color: '#9a3f84',
    roughness: 0.35,
    clearcoat: 0.6,
    transmission: 0,
  })
  const quantos = p.segmentos >= 96 ? 11 : 8
  for (let i = 0; i < quantos; i++) {
    const raio = 0.14 + r() * 0.16
    const anel = new THREE.Mesh(
      new THREE.TorusGeometry(raio, 0.022, 6, p.segmentos >= 96 ? 36 : 24),
      material,
    )
    const a = r() * Math.PI * 2
    const d = 0.15 + r() * 0.7
    anel.position.set(Math.cos(a) * d, 0.025 + r() * 0.02, Math.sin(a) * d)
    anel.rotation.x = Math.PI / 2 + (r() - 0.5) * 0.25
    anel.rotation.y = (r() - 0.5) * 0.25
    grupo.add(anel)
  }
  return grupo
}

/** Três rodelas de tomate. */
function tomate(p: Pecas, textura: THREE.Texture) {
  const grupo = new THREE.Group()
  const h = ESPESSURA.tomate as number
  const lado = new THREE.MeshStandardMaterial({ color: '#c3261d', roughness: 0.35 })
  const topo = new THREE.MeshPhysicalMaterial({
    map: textura,
    roughness: 0.25,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
  })
  const posicoes = [
    [-0.46, -0.24],
    [0.46, -0.24],
    [0, 0.5],
  ]
  for (const [x, z] of posicoes) {
    const geo = new THREE.CylinderGeometry(0.47, 0.47, h, p.segmentos >= 96 ? 40 : 28)
    geo.translate(0, h / 2, 0)
    const fatia = new THREE.Mesh(geo, [lado, topo, lado])
    fatia.position.set(x, 0, z)
    fatia.rotation.y = x * 2
    grupo.add(fatia)
  }
  return grupo
}

/** A folha de alface americana: um disco de borda franzida, maior que o pão. */
function alface(p: Pecas) {
  const segs = p.segmentos * 2
  const geo = new THREE.CircleGeometry(1.24, segs, 0, Math.PI * 2)
  geo.rotateX(-Math.PI / 2)
  const ruido = ruidoAngular(51, 6)
  const pos = geo.attributes.position
  const cores: number[] = []
  const claro = new THREE.Color('#d7ef9a')
  const escuro = new THREE.Color('#5e9a2c')
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const d = Math.hypot(x, z) / 1.24
    const a = Math.atan2(z, x)
    const franzido = Math.sin(a * 22) * 0.05 * d ** 3 + ruido(a) * 0.05 * d ** 2
    const alcance = 1 + ruido(a + 2) * 0.1 * d
    pos.setXYZ(i, x * alcance, franzido - d ** 4 * 0.06, z * alcance)
    c.copy(claro).lerp(escuro, Math.min(1, d * 1.1))
    cores.push(c.r, c.g, c.b)
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3))
  geo.computeVertexNormals()
  return new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.55,
      side: THREE.DoubleSide,
    }),
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// A cena
// ─────────────────────────────────────────────────────────────────────────────

type Camadas3D = { camada: Camada; grupo: THREE.Object3D; base: number; h: number; t: number }

/** Onde o lanche fica na tela, em coordenadas normalizadas (−1 a 1). */
type Enquadramento = { x: number; y: number; escala: number }

export class CenaHamburguer {
  aoQuadro?: (posicoes: PosicaoNaTela[]) => void

  private renderer: THREE.WebGLRenderer
  private cena = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(28, 1, 0.1, 80)
  private relogio = new THREE.Timer()
  private lanche = new THREE.Group()
  private giro = new THREE.Group()
  private sombra: THREE.Mesh
  private brasas: THREE.Points
  private velocidadesBrasas: Float32Array
  private camadas: Camadas3D[] = []
  private alturaMontada = 0
  private descartaveis: Array<{ dispose(): void }> = []
  private quadro = 0
  private rodando = false
  private largura = 1
  private altura = 1
  private desktop = true
  /** 0 = no herói; 1 = no centro, pronto para abrir. */
  private entrada = 0
  /** 0 = montado; 1 = aberto em camadas. */
  private abertura = 0
  private suave = { entrada: 0, abertura: 0, px: 0, py: 0 }
  private ponteiro = { x: 0, y: 0 }
  private angulo = -0.5
  private vetor = new THREE.Vector3()
  private direita = new THREE.Vector3()

  constructor(canvas: HTMLCanvasElement, { compacto }: OpcoesCena) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !compacto,
      alpha: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, compacto ? 1.5 : 1.75))
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.18
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    const ambiente = montarAmbiente(this.renderer)
    this.cena.environment = ambiente
    this.descartaveis.push(ambiente)

    const key = new THREE.DirectionalLight('#fff0d8', 1.5)
    key.position.set(-2, 5, 3)
    // O rim dourado: vem de trás e recorta a cúpula do pão contra o preto.
    const rim = new THREE.DirectionalLight('#ffb54a', 2.2)
    rim.position.set(2.5, 2, -4)
    // Preenchimento de céu e chão: sem ele, a face do lanche voltada para a
    // câmera fica só com o reflexo do ambiente, e o pão escurece.
    const ceu = new THREE.HemisphereLight('#ffe2b8', '#2a1a10', 0.45)
    this.cena.add(key, rim, ceu)

    const p: Pecas = { segmentos: compacto ? 64 : 112, texturas: compacto ? 512 : 1024 }
    const miolo = texturaDoMiolo(p.texturas / 2)
    const construtores: Record<string, () => THREE.Object3D> = {
      'pao-base': () => paoBase(p, miolo),
      alface: () => alface(p),
      tomate: () => tomate(p, texturaDoTomate(p.texturas / 2)),
      blend: () => blend(p, texturaDaCarne(p.texturas)),
      cheddar: () => cheddar(p),
      bacon: () => bacon(p, texturaDoBacon(p.texturas / 2)),
      cebola: () => cebola(p),
      'pao-topo': () => paoTopo(p, miolo),
    }

    let y = 0
    for (const camada of MONTAGEM) {
      const grupo = construtores[camada]()
      const h = ESPESSURA[camada] as number
      // O queijo e o bacon assentam sobre a carne: somam pouca altura.
      this.camadas.push({ camada, grupo, base: y, h, t: 0 })
      this.lanche.add(grupo)
      y += h
    }
    this.alturaMontada = y

    this.sombra = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 3.4),
      new THREE.MeshBasicMaterial({
        map: texturaDeSombra(),
        transparent: true,
        depthWrite: false,
        opacity: 0.7,
      }),
    )
    this.sombra.rotation.x = -Math.PI / 2

    const brasas = compacto ? 70 : 140
    const posicoes = new Float32Array(brasas * 3)
    this.velocidadesBrasas = new Float32Array(brasas)
    const r = aleatorio(77)
    for (let i = 0; i < brasas; i++) {
      posicoes[i * 3] = (r() - 0.5) * 4.4
      posicoes[i * 3 + 1] = r() * 4 - 1
      posicoes[i * 3 + 2] = (r() - 0.5) * 3 - 0.6
      this.velocidadesBrasas[i] = 0.12 + r() * 0.3
    }
    const geoBrasas = new THREE.BufferGeometry()
    geoBrasas.setAttribute('position', new THREE.BufferAttribute(posicoes, 3))
    this.brasas = new THREE.Points(
      geoBrasas,
      new THREE.PointsMaterial({
        map: texturaDaBrasa(),
        size: compacto ? 0.07 : 0.06,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    )

    this.giro.add(this.lanche)
    this.giro.add(this.sombra)
    this.cena.add(this.giro, this.brasas)
    this.camera.position.set(0, 0, 11)
    this.camera.lookAt(0, 0, 0)

    this.cena.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
        this.descartaveis.push(obj.geometry)
        const materiais = Array.isArray(obj.material) ? obj.material : [obj.material]
        for (const m of materiais) {
          this.descartaveis.push(m)
          for (const valor of Object.values(m)) {
            if (valor instanceof THREE.Texture) this.descartaveis.push(valor)
          }
        }
      }
    })

    window.addEventListener('pointermove', this.aoMover, { passive: true })
  }

  private aoMover = (e: PointerEvent) => {
    this.ponteiro.x = (e.clientX / window.innerWidth) * 2 - 1
    this.ponteiro.y = (e.clientY / window.innerHeight) * 2 - 1
  }

  redimensionar(largura: number, altura: number, desktop: boolean) {
    this.largura = largura
    this.altura = altura
    this.desktop = desktop
    this.renderer.setSize(largura, altura, false)
    this.camera.aspect = largura / altura
    this.camera.updateProjectionMatrix()
    if (!this.rodando) this.render(0)
  }

  /** Progresso da rolagem: `entrada` leva ao centro, `abertura` separa as camadas. */
  definirProgresso(entrada: number, abertura: number) {
    this.entrada = Math.min(1, Math.max(0, entrada))
    this.abertura = Math.min(1, Math.max(0, abertura))
    if (!this.rodando) this.render(0)
  }

  iniciar() {
    if (this.rodando) return
    this.rodando = true
    this.relogio.reset()
    const laco = (t: number) => {
      if (!this.rodando) return
      this.relogio.update(t)
      this.render(Math.min(0.05, this.relogio.getDelta()))
      this.quadro = requestAnimationFrame(laco)
    }
    this.quadro = requestAnimationFrame(laco)
  }

  pausar() {
    this.rodando = false
    cancelAnimationFrame(this.quadro)
  }

  destruir() {
    this.pausar()
    window.removeEventListener('pointermove', this.aoMover)
    for (const d of this.descartaveis) d.dispose()
    this.renderer.dispose()
  }

  /** Onde o lanche fica: à direita no herói (embaixo no celular), no centro na anatomia. */
  private enquadramento(): Enquadramento {
    const heroi: Enquadramento = this.desktop
      ? { x: 0.45, y: -0.1, escala: 0.94 }
      : { x: 0.08, y: -0.64, escala: 0.62 }
    // Na anatomia o texto fica à esquerda e os rótulos à direita do lanche.
    const anatomia: Enquadramento = this.desktop
      ? { x: 0.2, y: -0.02, escala: 1 }
      : { x: -0.46, y: -0.08, escala: 0.74 }
    const t = suave(0, 1, this.suave.entrada)
    return {
      x: heroi.x + (anatomia.x - heroi.x) * t,
      y: heroi.y + (anatomia.y - heroi.y) * t,
      escala: heroi.escala + (anatomia.escala - heroi.escala) * t,
    }
  }

  private render(dt: number) {
    const s = this.suave
    // Amortecimento exponencial no tempo, e não passo fixo por quadro: igual
    // em 60 Hz e em 144 Hz.
    const k = dt === 0 ? 1 : 1 - Math.exp(-dt * 6)
    s.entrada += (this.entrada - s.entrada) * k
    s.abertura += (this.abertura - s.abertura) * k
    s.px += (this.ponteiro.x - s.px) * (dt === 0 ? 1 : 1 - Math.exp(-dt * 3))
    s.py += (this.ponteiro.y - s.py) * (dt === 0 ? 1 : 1 - Math.exp(-dt * 3))

    // Abre de baixo para cima: cada camada começa a subir um pouco depois da
    // anterior, e o pão de cima é o último a sair.
    const n = this.camadas.length
    let alturaAberta = 0
    for (const [i, c] of this.camadas.entries()) {
      const atraso = (i / n) * 0.45
      const t = suave(atraso, atraso + 0.55, s.abertura)
      c.t = t
      c.grupo.position.y = c.base + i * VAO * t
      // Um giro leve em cada camada aberta, alternado: mostra a face de cima.
      c.grupo.rotation.y = (i % 2 ? 1 : -1) * 0.12 * t
      alturaAberta = Math.max(alturaAberta, c.base + i * VAO * t + c.h)
    }
    this.lanche.position.y = -alturaAberta / 2
    this.sombra.position.y = -alturaAberta / 2 - 0.01
    ;(this.sombra.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - s.abertura * 0.6)

    // Enquadramento: a altura visível na distância da câmera decide a escala.
    const distancia = this.camera.position.z
    const meiaAltura = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * distancia
    const meiaLargura = meiaAltura * this.camera.aspect
    const e = this.enquadramento()
    // Com o lanche aberto, a escala encolhe o bastante para caber na altura.
    const cabe = (meiaAltura * 2 * 0.8) / Math.max(alturaAberta, this.alturaMontada)
    const escalaBase = (meiaAltura * 2 * 0.3) / this.alturaMontada
    // E na largura: no celular o lanche aberto divide a tela com os rótulos,
    // e não pode passar de ~45% dela (a alface, a peça mais larga, tem ~2,6).
    const t = suave(0, 1, s.entrada)
    const fracao = this.desktop ? 0.5 : 0.62 - 0.2 * t
    const cabeLargura = (meiaLargura * 2 * fracao) / 2.6
    const escala = Math.min(escalaBase * e.escala, cabe * (this.desktop ? 1 : 0.8), cabeLargura)
    this.giro.scale.setScalar(escala)
    this.giro.position.set(e.x * meiaLargura, e.y * meiaAltura, 0)

    // Giro contínuo no herói; na anatomia ele desacelera para os rótulos
    // assentarem, sem parar de todo.
    const velocidade = 0.35 * (1 - s.entrada * 0.7)
    this.angulo += dt * velocidade
    this.giro.rotation.y = this.angulo + s.px * 0.25
    this.giro.rotation.x = 0.32 - s.abertura * 0.08 + s.py * 0.06

    // Brasas: sobem, apagam no alto e voltam por baixo.
    const pos = this.brasas.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + this.velocidadesBrasas[i] * dt
      if (y > 3.2) y = -1.2
      pos.setY(i, y)
      pos.setX(i, pos.getX(i) + Math.sin(y * 2 + i) * dt * 0.05)
    }
    pos.needsUpdate = true
    this.brasas.position.copy(this.giro.position)
    ;(this.brasas.material as THREE.PointsMaterial).opacity = 0.85 * (1 - s.entrada * 0.55)

    this.renderer.render(this.cena, this.camera)
    if (this.aoQuadro) this.aoQuadro(this.posicoesNaTela())
  }

  /**
   * Onde cada camada está na tela, em pixels do canvas: o ponto na borda
   * direita do lanche, onde o rótulo começa.
   */
  private posicoesNaTela(): PosicaoNaTela[] {
    this.camera.updateMatrixWorld()
    this.direita.set(1, 0, 0)
    return this.camadas.map((c) => {
      const lado: 1 | -1 = 1
      c.grupo.getWorldPosition(this.vetor)
      const escala = this.giro.scale.x
      this.vetor.addScaledVector(this.direita, lado * 1.12 * escala)
      this.vetor.y += (c.h / 2) * escala
      this.vetor.project(this.camera)
      return {
        camada: c.camada,
        x: ((this.vetor.x + 1) / 2) * this.largura,
        y: ((1 - this.vetor.y) / 2) * this.altura,
        lado,
        aberta: c.t,
      }
    })
  }
}
