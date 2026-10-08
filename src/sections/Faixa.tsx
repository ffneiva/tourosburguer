import { Fragment } from 'react'
import { Marquee } from '@/components/Marquee'
import { FAIXA } from '@/lib/business'

/** A estrela do selo, desenhada: cinco pontas, sem depender de fonte. */
function Estrela() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0 fill-current">
      <path d="M12 2.5l2.9 6.2 6.6.7-5 4.5 1.4 6.6L12 17.2l-5.9 3.3 1.4-6.6-5-4.5 6.6-.7z" />
    </svg>
  )
}

/**
 * A faixa de ingredientes — conteúdo de passeio, e por isso marquise.
 *
 * A lista inteira também existe como texto para o leitor de tela, uma vez:
 * a marquise duplica o conteúdo para o laço, e ler a lista duas vezes seguidas
 * seria ruído.
 */
export function Faixa() {
  return (
    <section
      data-tema="claro"
      aria-label="O que vai nos lanches"
      className="relative z-10 bg-gradient-to-b from-ouro-claro to-ouro py-4 text-noite"
    >
      <p className="sr-only">O que vai nos lanches: {FAIXA.join(', ')}.</p>
      <div aria-hidden>
        <Marquee duracao={44}>
          {FAIXA.map((x) => (
            <Fragment key={x}>
              {/* line-height folgado: a marquise recorta, e o til de "PÃO" some. */}
              <span className="cartaz py-1 text-[clamp(1.5rem,2.8vw,2.3rem)] leading-[1.2] whitespace-nowrap">
                {x}
              </span>
              <Estrela />
            </Fragment>
          ))}
        </Marquee>
      </div>
    </section>
  )
}
