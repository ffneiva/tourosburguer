import { type RefObject, useEffect, useRef, useState } from 'react'
import { useIsDesktop, useReducedMotion } from '@/hooks/useMediaQuery'
import { ANATOMIA } from '@/lib/business'
import { cn } from '@/lib/utils'
import type { CenaHamburguer, PosicaoNaTela } from '@/scene/hamburguer'

/**
 * O hambúrguer em WebGL — carregado sob demanda, pausado fora da tela.
 *
 * Fica num palco `sticky` que atravessa o herói e a anatomia: no herói ele
 * gira ao lado do título; ao rolar, vai para o centro e se abre em camadas,
 * com um rótulo em HTML preso a cada uma. Quatro decisões:
 *
 * · **three.js por import dinâmico, disparado pela visibilidade.** O chunk só
 *   é pedido depois do primeiro paint. O LCP é o título, nunca o canvas.
 *
 * · **Monta uma vez e nunca desmonta.** Remontar recria o contexto WebGL e
 *   recozinha o ambiente. O que liga e desliga é o laço de render.
 *
 * · **Rótulos por referência, não por estado.** A cena informa a posição de
 *   cada camada a cada quadro; os rótulos são movidos direto no DOM. Passar
 *   isso por `setState` seria um render do React por quadro.
 *
 * · **Sem WebGL (ou com movimento reduzido) não existe este componente** —
 *   quem o usa mostra a foto e o desenho em corte no lugar (ver Palco).
 */
let suporte: boolean | null = null

export function suportaWebGL(): boolean {
  if (suporte !== null) return suporte
  try {
    const canvas = document.createElement('canvas')
    suporte = Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    suporte = false
  }
  return suporte
}

type Props = {
  className?: string
  /** Devolve o progresso da rolagem: entrada (herói → centro) e abertura. */
  progresso: () => { entrada: number; abertura: number }
  /** Elemento cuja presença na tela liga a cena (o palco inteiro). */
  palco: RefObject<HTMLElement | null>
}

const NOMES = Object.fromEntries(ANATOMIA.camadas.map((c) => [c.camada, c]))

export function Cena3D({ className, progresso, palco }: Props) {
  const caixaRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotulosRef = useRef<Array<HTMLDivElement | null>>([])
  const cenaRef = useRef<CenaHamburguer | null>(null)
  const progressoRef = useRef(progresso)
  progressoRef.current = progresso
  const desktop = useIsDesktop()
  const reduzido = useReducedMotion()
  const [pintou, setPintou] = useState(false)

  useEffect(() => {
    const caixa = caixaRef.current
    const canvas = canvasRef.current
    const alvo = palco.current
    if (!caixa || !canvas || !alvo || reduzido || !suportaWebGL()) return

    let cancelado = false
    let visivel = false
    let limpar: (() => void) | undefined

    const posicionarRotulos = (posicoes: PosicaoNaTela[]) => {
      for (const [i, p] of posicoes.entries()) {
        const el = rotulosRef.current[i]
        if (!el) continue
        const aceso = Math.max(0, (p.aberta - 0.55) / 0.45)
        el.style.opacity = aceso.toFixed(3)
        el.dataset.lado = p.lado === 1 ? 'direita' : 'esquerda'
        el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(${p.lado === 1 ? '0' : '-100%'}, -50%)`
      }
    }

    const montar = () => {
      import('@/scene/hamburguer')
        .then(({ CenaHamburguer }) => {
          if (cancelado) return
          const cena = new CenaHamburguer(canvas, { compacto: !desktop })
          cenaRef.current = cena
          cena.aoQuadro = posicionarRotulos

          const medir = () => {
            const { width, height } = caixa.getBoundingClientRect()
            cena.redimensionar(Math.max(1, width), Math.max(1, height), desktop)
          }
          medir()
          const ro = new ResizeObserver(medir)
          ro.observe(caixa)

          const aoRolar = () => {
            const { entrada, abertura } = progressoRef.current()
            cena.definirProgresso(entrada, abertura)
          }
          aoRolar()
          window.addEventListener('scroll', aoRolar, { passive: true })

          if (visivel) cena.iniciar()
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              if (!cancelado) setPintou(true)
            }),
          )

          limpar = () => {
            ro.disconnect()
            window.removeEventListener('scroll', aoRolar)
            cena.destruir()
            cenaRef.current = null
          }
        })
        .catch(() => {
          // Chunk bloqueado ou rede caiu: fica o fundo, que já é uma
          // composição completa. Nada a propagar.
        })
    }

    let montado = false
    const io = new IntersectionObserver(
      ([entrada]) => {
        visivel = entrada.isIntersecting
        if (visivel && !montado) {
          montado = true
          montar()
        }
        if (visivel) cenaRef.current?.iniciar()
        else cenaRef.current?.pausar()
      },
      { rootMargin: '200px 0px' },
    )
    io.observe(alvo)

    const aoTrocarAba = () => {
      if (document.hidden) cenaRef.current?.pausar()
      else if (visivel) cenaRef.current?.iniciar()
    }
    document.addEventListener('visibilitychange', aoTrocarAba)

    return () => {
      cancelado = true
      io.disconnect()
      document.removeEventListener('visibilitychange', aoTrocarAba)
      limpar?.()
    }
  }, [desktop, reduzido, palco])

  return (
    <div ref={caixaRef} aria-hidden className={cn('pointer-events-none', className)}>
      <canvas
        ref={canvasRef}
        className={cn(
          'h-full w-full transition-opacity duration-[1400ms] ease-[var(--ease-touro)]',
          pintou ? 'opacity-100' : 'opacity-0',
        )}
      />
      {/* Os rótulos das camadas: posicionados pela cena, quadro a quadro. */}
      {ANATOMIA.camadas
        .slice()
        .reverse()
        .map((c, i) => (
          <div
            key={c.camada}
            ref={(el) => {
              rotulosRef.current[i] = el
            }}
            className="absolute top-0 left-0 flex items-center gap-3 opacity-0 will-change-transform data-[lado=esquerda]:flex-row-reverse data-[lado=esquerda]:text-right"
          >
            <span className="h-px w-4 shrink-0 bg-ouro/70 sm:w-14" />
            <span className="flex flex-col whitespace-nowrap">
              <span className="cartaz text-[0.82rem] text-creme sm:text-[clamp(0.95rem,1.6vw,1.35rem)]">
                {NOMES[c.camada]?.nome}
              </span>
              {NOMES[c.camada]?.nota && (
                <span className="hidden font-mono text-[0.62rem] tracking-[0.12em] text-ouro uppercase sm:block">
                  {NOMES[c.camada]?.nota}
                </span>
              )}
            </span>
          </div>
        ))}
    </div>
  )
}
