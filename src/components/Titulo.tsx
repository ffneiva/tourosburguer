import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SplitHeading } from './Reveal'

type Props = {
  rotulo: string
  titulo: string
  apoio?: ReactNode
  className?: string
  /** Nível do título — h2 nas seções da home, h1 no topo das páginas. */
  nivel?: 1 | 2
  centro?: boolean
}

/**
 * O cabeçalho de seção: rótulo em mono com as três estrelinhas do selo e o
 * título em cartaz — Oswald, caixa alta, apertado, como no cardápio da casa.
 */
export function Titulo({ rotulo, titulo, apoio, className, nivel = 2, centro = false }: Props) {
  const Tag = nivel === 1 ? 'h1' : 'h2'
  return (
    <header className={cn('relative', centro && 'text-center', className)}>
      <p
        className={cn('rotulo mb-5 flex items-center gap-3 opacity-80', centro && 'justify-center')}
      >
        <span aria-hidden className="h-px w-8 bg-current opacity-50" />
        {rotulo}
      </p>
      <Tag
        className={cn('cartaz max-w-[16ch] text-[clamp(2.6rem,6.6vw,5.4rem)]', centro && 'mx-auto')}
      >
        <SplitHeading text={titulo} />
      </Tag>
      {apoio && (
        <div
          className={cn(
            'mt-6 max-w-[54ch] text-[1.05rem] leading-relaxed opacity-80',
            centro && 'mx-auto',
          )}
        >
          {apoio}
        </div>
      )}
    </header>
  )
}
