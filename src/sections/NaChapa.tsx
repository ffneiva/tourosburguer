import { IconeInstagram } from '@/components/Icones'
import { Reveal } from '@/components/Reveal'
import { Titulo } from '@/components/Titulo'
import { Video } from '@/components/Video'
import { registrar } from '@/lib/analytics'
import { CASA, TEXTO, VIDEOS } from '@/lib/business'

/**
 * Na chapa — os reels da casa, em laço.
 *
 * É a prova que nenhuma foto de banco dá: o cheddar caindo sobre o blend, a
 * montagem na mão, o papel da casa. O formato é o do próprio reel (9:16), numa
 * trilha que rola de lado — no celular, com o polegar, como no Instagram; no
 * desktop, em grade escalonada.
 *
 * Cada vídeo leva ao reel original: o site não compete com o Instagram da
 * casa, empresta dele.
 */
export function NaChapa() {
  const { naChapa } = TEXTO
  return (
    <section
      id="na-chapa"
      data-tema="claro"
      className="kraft relative z-10 overflow-hidden py-24 sm:py-32"
    >
      <div className="container-x grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <Titulo rotulo={naChapa.rotulo} titulo={naChapa.titulo} apoio={naChapa.apoio} />
        <a
          href={`https://www.instagram.com/${CASA.instagram}/`}
          target="_blank"
          rel="noopener"
          className="botao botao-linha w-fit"
        >
          <IconeInstagram className="h-5 w-5" /> @{CASA.instagram}
        </a>
      </div>

      <div
        className="mt-14 overflow-x-auto overscroll-x-contain [scrollbar-width:none] snap-x snap-mandatory lg:overflow-visible"
        data-transbordo-intencional
      >
        <ul className="flex w-max gap-4 px-5 pb-4 sm:px-8 lg:mx-auto lg:grid lg:w-full lg:max-w-[88rem] lg:grid-cols-5 lg:gap-5 lg:px-14">
          {VIDEOS.map((v, i) => (
            <Reveal
              as="li"
              key={v.arquivo}
              delay={i * 0.07}
              // O escalonamento em degraus no desktop quebra a grade: parece
              // uma parede de reels, e não uma tabela.
              className={`w-[68vw] max-w-[17rem] shrink-0 snap-center lg:w-auto lg:max-w-none ${i % 2 ? 'lg:mt-16' : ''}`}
            >
              <figure>
                <Video
                  nome={v.arquivo}
                  alt={v.titulo}
                  className="aspect-[9/16] rounded-[1.25rem] bg-noite shadow-[0_24px_50px_-24px_rgba(54,43,31,0.7)]"
                />
                <figcaption className="mt-4">
                  <p className="cartaz text-[1.3rem] leading-tight">{v.titulo}</p>
                  <p className="mt-1.5 text-[0.92rem] leading-relaxed text-tinta">{v.texto}</p>
                  <a
                    href={v.reel}
                    target="_blank"
                    rel="noopener"
                    onClick={() => registrar('video_instagram', { video: v.arquivo })}
                    className="mt-2 inline-flex items-center gap-1.5 font-mono text-[0.68rem] tracking-[0.12em] text-tinta-2 uppercase underline-offset-4 hover:underline"
                  >
                    Ver o reel
                  </a>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
