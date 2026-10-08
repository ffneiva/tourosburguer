import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Touro } from './Logo'
import { SplitHeading } from './Reveal'

type Props = {
  rotulo: string
  titulo: string
  apoio?: ReactNode
  children?: ReactNode
  className?: string
}

/**
 * O topo das páginas internas: noite, título em cartaz, o touro na borda.
 *
 * É mais baixo que o herói da home de propósito — quem abre /cardapio veio
 * consultar, e o conteúdo precisa começar na primeira dobra do celular.
 */
export function TopoPagina({ rotulo, titulo, apoio, children, className }: Props) {
  return (
    <section
      data-tema="escuro"
      className={cn(
        'grao relative overflow-hidden bg-noite pt-32 pb-14 text-creme sm:pt-40 sm:pb-18',
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(40% 60% at 85% 20%, rgba(214,166,80,0.14), transparent 70%)',
        }}
      />
      <Touro
        metal={false}
        className="absolute top-24 -right-10 w-[clamp(12rem,30vw,26rem)] text-ouro/[0.07] sm:right-6"
      />
      <div className="container-x relative">
        <p className="rotulo mb-6 flex items-center gap-3 text-ouro">
          <span aria-hidden className="h-px w-8 bg-current" />
          {rotulo}
        </p>
        <h1 className="cartaz max-w-[18ch] text-[clamp(2.8rem,8vw,6.2rem)]">
          <SplitHeading text={titulo} />
        </h1>
        {apoio && (
          <div className="mt-7 max-w-[58ch] text-[1.06rem] leading-relaxed text-nevoa">{apoio}</div>
        )}
        {children}
      </div>
    </section>
  )
}
