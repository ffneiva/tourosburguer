import { useId } from 'react'
import { ANEL, BURGUER, ESTRELAS, LETREIRO, QUADRO, TOURO } from '@/lib/marca'
import { cn } from '@/lib/utils'

/**
 * A marca da casa, em vetor (ver lib/marca.ts).
 *
 * Tudo aqui é SVG: o selo nítido em qualquer tamanho, do favicon ao fecho da
 * página, e nenhum byte de imagem no caminho crítico. O dourado é um degradê
 * de metal — do claro ao escuro, de cima para baixo, como o do logo — ou
 * `currentColor`, quando a marca precisa acompanhar o texto (sobre o kraft).
 */

type Peca = { x: number; y: number; w: number; h: number; d: string }

function Metal({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0.18" y2="1">
      <stop offset="0" stopColor="#f6d994" />
      <stop offset="0.42" stopColor="#d9a852" />
      <stop offset="0.7" stopColor="#b98534" />
      <stop offset="1" stopColor="#8e6322" />
    </linearGradient>
  )
}

function usePintura(metal: boolean) {
  // O formato do useId muda entre versões do React (":r0:", "«r0»"); num
  // `url(#…)` só cabe o que é seguro em seletor.
  const id = useId().replace(/[^\w-]/g, '')
  return { id, fill: metal ? `url(#m${id})` : 'currentColor' }
}

const desenha = (p: Peca, fill: string) => (
  <path d={p.d} transform={`translate(${p.x} ${p.y})`} fill={fill} fillRule="evenodd" />
)

/**
 * O selo inteiro: anel, touro, "TOURO'S", "BURGUER" e as cinco estrelas.
 * `fundo` pinta o miolo de preto — para quando o selo pousa sobre foto.
 */
export function Selo({
  className,
  metal = true,
  fundo = false,
  titulo,
}: {
  className?: string
  metal?: boolean
  fundo?: boolean
  titulo?: string
}) {
  const { id, fill } = usePintura(metal)
  const e = ANEL.espessura
  return (
    <svg
      viewBox={`0 0 ${QUADRO.w} ${QUADRO.h}`}
      className={cn('block h-auto', className)}
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      {metal && (
        <defs>
          <Metal id={`m${id}`} />
        </defs>
      )}
      {fundo && <ellipse cx={ANEL.cx} cy={ANEL.cy} rx={ANEL.rx} ry={ANEL.ry} fill="#0c0b0a" />}
      <ellipse
        cx={ANEL.cx}
        cy={ANEL.cy}
        rx={ANEL.rx - e / 2}
        ry={ANEL.ry - e / 2}
        fill="none"
        stroke={fill}
        strokeWidth={e}
      />
      {desenha(TOURO, fill)}
      {desenha(LETREIRO, fill)}
      {desenha(BURGUER, fill)}
      {desenha(ESTRELAS, fill)}
    </svg>
  )
}

/** Uma peça sozinha, no próprio quadro. */
function PecaSolta({
  peca,
  className,
  metal = true,
  titulo,
}: {
  peca: Peca
  className?: string
  metal?: boolean
  titulo?: string
}) {
  const { id, fill } = usePintura(metal)
  return (
    <svg
      viewBox={`0 0 ${peca.w} ${peca.h}`}
      className={cn('block h-auto', className)}
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      {metal && (
        <defs>
          <Metal id={`m${id}`} />
        </defs>
      )}
      <path d={peca.d} fill={fill} fillRule="evenodd" />
    </svg>
  )
}

export const Touro = (p: { className?: string; metal?: boolean; titulo?: string }) => (
  <PecaSolta peca={TOURO} {...p} />
)

const Letreiro = (p: { className?: string; metal?: boolean; titulo?: string }) => (
  <PecaSolta peca={LETREIRO} {...p} />
)

/** As cinco estrelas do selo — também o nome do "Touro's ★★★★★". */
export const Estrelas = (p: { className?: string; metal?: boolean; titulo?: string }) => (
  <PecaSolta peca={ESTRELAS} {...p} />
)

/**
 * A assinatura do cabeçalho: o touro ao lado do letreiro, e "BURGUER" embaixo.
 * `compacto` recolhe a linha de baixo quando o cabeçalho encolhe.
 */
export function Assinatura({
  className,
  compacto = false,
  metal = true,
}: {
  className?: string
  compacto?: boolean
  metal?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Touro metal={metal} className="w-11 sm:w-12" />
      <span className="flex flex-col items-center">
        <Letreiro metal={metal} className="w-[6.4rem] sm:w-[7rem]" />
        <span
          aria-hidden
          className={cn(
            'overflow-hidden font-display text-[0.62rem] font-medium tracking-[0.5em] transition-[opacity,max-height,margin] duration-500',
            metal ? 'text-ouro' : 'text-current',
            compacto ? 'mt-0 max-h-0 opacity-0' : 'mt-1 max-h-4 opacity-100',
          )}
        >
          BURGUER
        </span>
      </span>
    </span>
  )
}
