import { IconeSetaDiagonal, IconeWhatsApp } from '@/components/Icones'
import { Reveal } from '@/components/Reveal'
import { Titulo } from '@/components/Titulo'
import { registrar } from '@/lib/analytics'
import { CASA, TEXTO } from '@/lib/business'
import { resumoDaSemana } from '@/lib/hours'

/**
 * Como pedir — os dois caminhos, lado a lado.
 *
 * O iFood calcula a taxa pelo endereço e cobra no app; o WhatsApp é para quem
 * prefere conversar, e recebe a lista pronta da sacola do site. Nenhum prazo
 * de entrega é prometido aqui: quem informa o tempo daquela noite é a casa.
 */
export function ComoPedir() {
  const info = [
    {
      rotulo: 'Horário',
      valor: resumoDaSemana(CASA.semana)
        .map((l) => `${l.dias}, ${l.horario}`)
        .join(' · '),
    },
    { rotulo: 'Entrega', valor: `${CASA.regiao} — a taxa depende do endereço` },
    { rotulo: 'WhatsApp', valor: CASA.telefone },
    { rotulo: 'Todo lanche', valor: 'Acompanha 1 sachê de molho Touro’s' },
  ]

  return (
    <section
      id="como-pedir"
      data-tema="escuro"
      className="grao relative z-10 bg-noite py-24 text-creme sm:py-32"
    >
      <div className="container-x">
        <Titulo rotulo="Como pedir" titulo="Três passos até a primeira mordida." />

        <ol className="mt-16 grid gap-6 md:grid-cols-3">
          {TEXTO.comoPedir.map((p, i) => (
            <Reveal as="li" key={p.titulo} delay={i * 0.08} className="border-t border-risco pt-6">
              <p className="cartaz text-[3.4rem] leading-none text-ouro/80 tabular">
                {String(i + 1).padStart(2, '0')}
              </p>
              <h3 className="cartaz mt-4 text-[2rem]">{p.titulo}</h3>
              <p className="mt-3 max-w-[32ch] leading-relaxed text-nevoa">{p.texto}</p>
            </Reveal>
          ))}
        </ol>

        <div className="mt-20 grid gap-10 rounded-[1.75rem] border border-ouro/25 bg-carvao/60 p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <dl className="grid gap-6 sm:grid-cols-2">
            {info.map((x) => (
              <div key={x.rotulo}>
                <dt className="font-mono text-[0.68rem] tracking-[0.14em] text-ouro uppercase">
                  {x.rotulo}
                </dt>
                <dd className="mt-1.5 leading-relaxed">{x.valor}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-3">
            <a
              href={CASA.ifood}
              target="_blank"
              rel="noopener"
              onClick={() => registrar('ifood_clique', { origem: 'como-pedir' })}
              className="botao botao-ouro min-h-[3.3rem] px-7"
            >
              Pedir no iFood <IconeSetaDiagonal className="h-4 w-4" />
            </a>
            <a href="/cardapio" className="botao botao-linha min-h-[3.3rem] px-7">
              <IconeWhatsApp className="h-5 w-5" /> Montar pelo WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
