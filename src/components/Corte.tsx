import { type ReactNode, useEffect, useId, useRef } from 'react'
import { CAMADAS, type Camada, type CamadaMontada } from '@/lib/camadas'
import { cn } from '@/lib/utils'

/**
 * O lanche em corte — desenhado camada por camada a partir da montagem.
 *
 * Não é foto e não finge ser: é o diagrama do que vai dentro, na ordem em que
 * a cozinha monta. Serve a três lugares com a mesma verdade:
 *
 *   · os artesanais da home, que não têm todos foto;
 *   · o painel "monte o seu" do cardápio, onde o lanche cresce a cada
 *     adicional e perde a cebola quando se pede "sem";
 *   · a anatomia sem WebGL (movimento reduzido), aberto em camadas.
 *
 * Cada camada é um <g> posicionado por `transform`, com transição: quando um
 * bacon entra no meio, tudo que está acima sobe junto, suave, e só a camada
 * nova faz a entrada (de cima, como se caísse no lugar). As formas são
 * geradas com ruído determinístico a partir da chave da camada — a mesma
 * fatia de bacon tem sempre o mesmo ondulado.
 */

const L = 240 // largura do quadro
const X0 = 22 // borda esquerda do pão
const X1 = 218 // borda direita do pão

function aleatorio(semente: string) {
  let h = 2166136261
  for (let i = 0; i < semente.length; i++) h = Math.imul(h ^ semente.charCodeAt(i), 16777619)
  let s = h >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const f = (n: number) => Number(n.toFixed(1))

/** Uma borda ondulada de x0 a x1 — `amp` de altura, `n` ondas, com ruído. */
function onda(x0: number, x1: number, y: number, amp: number, n: number, r: () => number) {
  const passos = Math.max(8, Math.round(n * 4))
  const fase = r() * Math.PI * 2
  const pts: string[] = []
  for (let i = 0; i <= passos; i++) {
    const t = i / passos
    const x = x0 + (x1 - x0) * t
    const yy = y + Math.sin(t * n * Math.PI * 2 + fase) * amp + (r() - 0.5) * amp * 0.5
    pts.push(`${f(x)} ${f(yy)}`)
  }
  return pts
}

/** `g` é o prefixo dos degradês desta instância (ver `Corte`). */
type Desenho = (h: number, r: () => number, g: string) => ReactNode

const DESENHOS: Record<Camada, Desenho> = {
  'pao-base': (h, _r, g) => (
    <>
      <path
        d={`M${X0} 3 H${X1} Q${X1 + 5} 3 ${X1 + 2} 11 Q${X1 - 6} ${h} ${X1 - 30} ${h} H${X0 + 30} Q${X0 + 6} ${h} ${X0 - 2} 11 Q${X0 - 5} 3 ${X0} 3 Z`}
        fill={`url(#${g}brioche)`}
      />
      <rect x={X0 + 1} y={1} width={X1 - X0 - 2} height={6} rx={3} fill="#f8d98a" />
      <path
        d={`M${X0 + 14} ${h - 6} Q120 ${h + 1} ${X1 - 14} ${h - 6}`}
        stroke="#b8741a"
        strokeOpacity={0.35}
        strokeWidth={2}
        fill="none"
      />
    </>
  ),
  'pao-topo': (h, _r, g) => (
    <>
      <path
        d={`M${X0 - 3} ${h - 5} Q${X0 - 6} ${h} ${X0 + 6} ${h} H${X1 - 6} Q${X1 + 6} ${h} ${X1 + 3} ${h - 5} C${X1 + 8} ${h * 0.28} ${X1 - 44} 0 120 0 C${X0 + 44} 0 ${X0 - 8} ${h * 0.28} ${X0 - 3} ${h - 5} Z`}
        fill={`url(#${g}cupula)`}
      />
      <path
        d={`M${X0 + 2} ${h - 3} H${X1 - 2}`}
        stroke="#f8d98a"
        strokeWidth={5}
        strokeLinecap="round"
      />
      {/* O brilho da gema pincelada — o pão da casa é espelhado. */}
      <ellipse
        cx={84}
        cy={h * 0.3}
        rx={34}
        ry={h * 0.12}
        fill="#fff6d8"
        opacity={0.38}
        transform={`rotate(-14 84 ${h * 0.3})`}
      />
      <ellipse cx={150} cy={h * 0.2} rx={10} ry={4} fill="#fff6d8" opacity={0.3} />
    </>
  ),
  blend: (h, r) => carne(h, r, '#5a3322', '#3b2015'),
  bife: (h, r) => carne(h, r, '#6a3d27', '#472817'),
  frango: (h, r) => {
    const fios = Array.from({ length: 34 }, () => {
      const x = X0 + 6 + r() * (X1 - X0 - 12)
      const y = 4 + r() * (h - 8)
      const a = (r() - 0.5) * 1.2
      const c = 7 + r() * 9
      return (
        <path
          key={`${f(x)}-${f(y)}`}
          d={`M${f(x)} ${f(y)} l${f(Math.cos(a) * c)} ${f(Math.sin(a) * c)}`}
          stroke={r() > 0.5 ? '#c99a5a' : '#f3d6a6'}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      )
    })
    const topo = onda(X0 + 4, X1 - 4, 3, 2.4, 9, r)
    return (
      <>
        <path
          d={`M${topo.join(' L')} Q${X1 + 2} ${h / 2} ${X1 - 6} ${h} H${X0 + 6} Q${X0 - 2} ${h / 2} ${X0 + 4} 3 Z`}
          fill="#e7c089"
        />
        {fios}
      </>
    )
  },
  cheddar: (h, r) => queijo(h, r, '#f39a1b', '#ffc15a', true),
  mussarela: (h, r) => queijo(h, r, '#f3e2b0', '#fffbe9', false),
  catupiry: (h, r) => {
    const n = 11
    const w = (X1 - X0 + 4) / n
    let d = `M${X0 - 2} ${h}`
    for (let i = 0; i < n; i++) {
      const x = X0 - 2 + i * w
      const alto = 1 + r() * 4
      d += ` Q${f(x + w / 2)} ${f(alto - 6)} ${f(x + w)} ${f(h - 5 + r() * 3)}`
    }
    d += ` L${X1 + 2} ${h} Z`
    return (
      <>
        <path d={d} fill="#f7f0df" />
        <path d={d} fill="none" stroke="#e1d3b3" strokeWidth={1.2} />
      </>
    )
  },
  coalho: (h, r) => {
    const cubos = Array.from({ length: 6 }, (_, i) => {
      const x = X0 + 4 + i * 32 + r() * 6
      const lado = 20 + r() * 5
      const rot = (r() - 0.5) * 16
      return (
        <g
          // biome-ignore lint/suspicious/noArrayIndexKey: forma gerada e fixa — nunca reordena
          key={i}
          transform={`rotate(${f(rot)} ${f(x + lado / 2)} ${f(h - lado / 2)})`}
        >
          <rect x={f(x)} y={f(h - lado)} width={f(lado)} height={f(lado)} rx={4} fill="#f1d9a0" />
          <path
            d={`M${f(x + 3)} ${f(h - lado + 5)} h${f(lado - 6)} M${f(x + 3)} ${f(h - lado / 2)} h${f(lado - 6)}`}
            stroke="#b77a2a"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </g>
      )
    })
    return <>{cubos}</>
  },
  mel: (h, r) => {
    const linha = onda(X0 + 10, X1 - 10, h / 2, 3, 5, r)
    return (
      <path
        d={`M${linha.join(' L')}`}
        stroke="#d88a12"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        opacity={0.95}
      />
    )
  },
  bacon: (h, r) => {
    const topo = onda(X0 - 6, X1 + 6, 2.5, 2.6, 5, r)
    const base = onda(X1 + 6, X0 - 6, h - 1.5, 2.6, 5, r)
    const gordura = onda(X0 - 2, X1 + 2, h / 2, 2.4, 5, r)
    return (
      <>
        <path d={`M${topo.join(' L')} L${base.join(' L')} Z`} fill="#b5412f" />
        <path
          d={`M${gordura.join(' L')}`}
          stroke="#f2c7a4"
          strokeWidth={2.6}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M${topo.join(' L')}`}
          stroke="#7a2519"
          strokeWidth={1.4}
          fill="none"
          opacity={0.7}
        />
      </>
    )
  },
  ovo: (h, r) => {
    const borda = onda(X0 + 6, X1 - 6, h - 5, 2.5, 4, r)
    return (
      <>
        <path
          d={`M${X0 + 2} ${h} Q${X0} ${h - 6} ${borda.join(' L')} Q${X1} ${h - 6} ${X1 - 2} ${h} Z`}
          fill="#fbf6ea"
        />
        <path d={`M92 ${h - 3} Q108 ${-6} 128 ${h - 3} Z`} fill="#f5a60e" />
        <ellipse cx={104} cy={h - 7} rx={5} ry={2} fill="#ffe08a" opacity={0.8} />
      </>
    )
  },
  alface: (h, r) => {
    const topo = onda(X0 - 12, X1 + 12, 3, 3, 14, r)
    const base = onda(X1 + 10, X0 - 10, h - 2, 1.6, 10, r)
    return (
      <>
        <path d={`M${topo.join(' L')} L${base.join(' L')} Z`} fill="#7cb342" />
        <path
          d={`M${onda(X0 - 6, X1 + 6, h / 2 + 1, 1.6, 12, r).join(' L')}`}
          stroke="#b5dd7a"
          strokeWidth={1.4}
          fill="none"
        />
      </>
    )
  },
  rucula: (h, r) => {
    const folhas = Array.from({ length: 12 }, (_, i) => {
      const x = X0 - 6 + i * 18 + r() * 6
      const rot = (r() - 0.5) * 30
      return (
        <ellipse
          // biome-ignore lint/suspicious/noArrayIndexKey: forma gerada e fixa — nunca reordena
          key={i}
          cx={f(x)}
          cy={h / 2}
          rx={13}
          ry={4.2}
          fill={i % 2 ? '#4f8a2b' : '#3f7524'}
          transform={`rotate(${f(rot)} ${f(x)} ${h / 2})`}
        />
      )
    })
    return <>{folhas}</>
  },
  tomate: (h) => (
    <>
      {[0, 1, 2].map((i) => {
        const x = X0 - 2 + i * 67
        return (
          <g key={x}>
            <rect x={x} y={1} width={66} height={h - 1} rx={h / 2} fill="#d9362b" />
            <rect x={x + 6} y={3.5} width={54} height={h - 6} rx={(h - 6) / 2} fill="#ef6a4c" />
            {[14, 30, 46].map((dx) => (
              <ellipse key={dx} cx={x + dx + 3} cy={h / 2 + 0.5} rx={3} ry={1.6} fill="#fbd3a0" />
            ))}
          </g>
        )
      })}
    </>
  ),
  cebola: (h, r) => (
    <>
      {Array.from({ length: 9 }, (_, i) => {
        const cx = X0 + 6 + i * 23 + r() * 4
        return (
          <ellipse
            // biome-ignore lint/suspicious/noArrayIndexKey: forma gerada e fixa — nunca reordena
            key={i}
            cx={f(cx)}
            cy={h / 2}
            rx={13 + r() * 3}
            ry={h / 2 - 0.8}
            fill="none"
            stroke={i % 2 ? '#8e3b76' : '#a8508f'}
            strokeWidth={2.4}
          />
        )
      })}
    </>
  ),
  'batata-palha': (h, r) => (
    <>
      {Array.from({ length: 70 }, (_, i) => {
        const x = X0 - 4 + r() * (X1 - X0 + 8)
        const y = 2 + r() * (h - 4)
        const a = (r() - 0.5) * Math.PI
        const c = 5 + r() * 7
        return (
          <path
            // biome-ignore lint/suspicious/noArrayIndexKey: forma gerada e fixa — nunca reordena
            key={i}
            d={`M${f(x)} ${f(y)} l${f(Math.cos(a) * c)} ${f(Math.sin(a) * c * 0.5)}`}
            stroke={r() > 0.35 ? '#f2c14e' : '#d99a24'}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        )
      })}
    </>
  ),
  barbecue: (h, r) => {
    const topo = onda(X0 + 2, X1 - 2, 1.5, 1.2, 6, r)
    return (
      <path
        d={`M${topo.join(' L')} L${X1 - 4} ${h} L${X1 - 40} ${h} Q${X1 - 44} ${h + 7} ${X1 - 48} ${h} L${X0 + 60} ${h} Q${X0 + 56} ${h + 9} ${X0 + 52} ${h} L${X0 + 4} ${h} Z`}
        fill="#5b1d12"
      />
    )
  },
}

function carne(h: number, r: () => number, cor: string, sombra: string) {
  const topo = onda(X0 + 2, X1 - 2, 2, 1.8, 7, r)
  const base = onda(X1 - 2, X0 + 2, h - 1, 1.4, 6, r)
  const pontos = Array.from({ length: 26 }, (_, i) => (
    <circle
      // biome-ignore lint/suspicious/noArrayIndexKey: forma gerada e fixa — nunca reordena
      key={i}
      cx={f(X0 + 8 + r() * (X1 - X0 - 16))}
      cy={f(4 + r() * (h - 8))}
      r={f(0.8 + r() * 1.6)}
      fill={r() > 0.5 ? '#7a4a33' : '#2a160e'}
      opacity={0.8}
    />
  ))
  return (
    <>
      <path
        d={`M${topo.join(' L')} Q${X1 + 5} ${h / 2} ${base.join(' L')} Q${X0 - 5} ${h / 2} ${topo[0]} Z`}
        fill={cor}
      />
      <path d={`M${base.join(' L')}`} stroke={sombra} strokeWidth={4} fill="none" opacity={0.7} />
      {pontos}
      <path
        d={`M${topo.join(' L')}`}
        stroke="#8a5537"
        strokeWidth={1.4}
        fill="none"
        opacity={0.7}
      />
    </>
  )
}

function queijo(h: number, r: () => number, cor: string, brilho: string, escorre: boolean) {
  const gotas = Array.from({ length: 5 }, () => {
    const x = X0 + 10 + r() * (X1 - X0 - 20)
    const c = (escorre ? 7 : 4) + r() * (escorre ? 9 : 5)
    return `M${f(x - 5)} ${h - 1} Q${f(x - 4)} ${f(h + c)} ${f(x)} ${f(h + c)} Q${f(x + 4)} ${f(h + c)} ${f(x + 5)} ${h - 1} Z`
  })
  return (
    <>
      <rect x={X0 - 8} y={0.5} width={X1 - X0 + 16} height={h - 0.5} rx={2.5} fill={cor} />
      <path d={gotas.join(' ')} fill={cor} />
      <path
        d={`M${X0 - 4} 2.2 H${X1 - 30}`}
        stroke={brilho}
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.8}
      />
    </>
  )
}

type Props = {
  montagem: readonly CamadaMontada[]
  className?: string
  /** Aberto em camadas, com o nome de cada uma ao lado. */
  explodido?: boolean
  /** Nome para o leitor de tela — "Desenho do Touro's Bacon Cheddar em corte". */
  titulo?: string
  /** Rótulos personalizados no modo explodido (camada → texto). */
  rotulos?: Partial<Record<Camada, string>>
}

const VAO = 16
/**
 * Montado, cada camada invade 3 unidades a de baixo: num lanche de verdade o
 * recheio assenta, e sem isso o fundo aparece em frestas entre as fatias.
 */
const ASSENTO = -3

export function Corte({ montagem, className, explodido = false, titulo, rotulos }: Props) {
  // Um prefixo por instância: com vários cortes na página, um id repetido faz
  // o degradê de um sumir quando o outro está escondido.
  const g = useId().replace(/[^\w-]/g, '')
  const montado = useRef(false)
  useEffect(() => {
    montado.current = true
  }, [])

  const vao = explodido ? VAO : ASSENTO
  const alturaTotal =
    montagem.reduce((s, c) => s + CAMADAS[c.camada].altura, 0) + vao * (montagem.length - 1)
  const H = Math.max(alturaTotal + 14, 150)
  const largura = explodido ? 430 : L

  // De baixo para cima: o topo de cada camada, medido a partir do chão.
  let acumulado = 0
  const posicoes = montagem.map((c) => {
    const h = CAMADAS[c.camada].altura
    acumulado += h
    const y = H - 8 - acumulado
    acumulado += vao
    return { ...c, h, y }
  })

  return (
    <svg
      viewBox={`0 0 ${largura} ${H}`}
      className={cn('block h-auto w-full overflow-visible', className)}
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      <defs>
        <linearGradient id={`${g}brioche`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3b528" />
          <stop offset="1" stopColor="#d88a17" />
        </linearGradient>
        <radialGradient id={`${g}cupula`} cx="0.38" cy="0.22" r="0.95">
          <stop offset="0" stopColor="#f9c541" />
          <stop offset="0.55" stopColor="#e79a1c" />
          <stop offset="1" stopColor="#b86c12" />
        </radialGradient>
      </defs>
      <ellipse cx={120} cy={H - 5} rx={96} ry={5} fill="#000" opacity={0.28} />
      {posicoes.map((c, i) => (
        <g
          key={c.chave}
          // Só quem acabou de montar faz a entrada; as demais apenas deslizam
          // para a nova altura. Na primeira pintura, entram em cascata.
          className="camada camada-nova"
          style={{
            transform: `translateY(${c.y}px)`,
            animationDelay: montado.current ? '0ms' : `${i * 55}ms`,
          }}
        >
          {DESENHOS[c.camada](c.h, aleatorio(c.chave), g)}
          {explodido && (
            <g>
              <path
                d={`M${X1 + 16} ${c.h / 2} H${X1 + 44}`}
                stroke="currentColor"
                strokeOpacity={0.4}
                strokeWidth={1}
              />
              <text
                x={X1 + 52}
                y={c.h / 2 + 5}
                fill="currentColor"
                fontSize={15}
                fontFamily="var(--font-display)"
                letterSpacing="0.04em"
                style={{ textTransform: 'uppercase' }}
              >
                {rotulos?.[c.camada] ?? CAMADAS[c.camada].nome}
              </text>
            </g>
          )}
        </g>
      ))}
    </svg>
  )
}
