import { useEstado } from '@/components/Estado'
import { IconeSetaDiagonal } from '@/components/Icones'
import { Selo } from '@/components/Logo'
import { Magnetic } from '@/components/Magnetic'
import { Perguntas } from '@/components/Perguntas'
import { Titulo } from '@/components/Titulo'
import { registrar } from '@/lib/analytics'
import { CASA, FAQ, TEXTO } from '@/lib/business'

/** As perguntas que chegam de verdade — horário, entrega, adicional, preço. */
export function SecaoPerguntas() {
  return (
    <section id="perguntas" data-tema="claro" className="kraft relative z-10 py-24 sm:py-32">
      <div className="container-x grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Titulo rotulo="Perguntas" titulo="Antes de você perguntar." />
        <Perguntas itens={FAQ} />
      </div>
    </section>
  )
}

/**
 * O fecho: o selo grande, a pergunta da casa, e o estado de agora — às 20h
 * de uma terça ele diz "Aberto · até 23h"; num domingo, quando reabre.
 */
export function Fecho() {
  const estado = useEstado()
  return (
    <section
      data-tema="escuro"
      aria-labelledby="titulo-fecho"
      className="grao relative z-10 overflow-hidden bg-noite py-28 text-center text-creme sm:py-40"
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(45% 55% at 50% 42%, rgba(226,120,43,0.16), transparent 70%)',
        }}
      />
      <div className="container-x relative flex flex-col items-center">
        <Selo className="w-36 sm:w-44" />
        <h2 id="titulo-fecho" className="cartaz mt-12 text-[clamp(3.4rem,10vw,8rem)] leading-[0.9]">
          <span className="ouro-metal">{TEXTO.fecho.titulo}</span>
        </h2>
        <p className="mt-5 text-[clamp(1.1rem,2vw,1.4rem)] text-nevoa">{TEXTO.fecho.texto}</p>
        <p className="mt-2 font-mono text-xs tracking-[0.14em] text-ouro uppercase">
          Agora: {estado.rotulo}
        </p>
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Magnetic>
            <a
              href={CASA.ifood}
              target="_blank"
              rel="noopener"
              onClick={() => registrar('ifood_clique', { origem: 'fecho' })}
              className="botao botao-ouro min-h-[3.3rem] px-8"
              data-cursor="Pedir"
            >
              Pedir no iFood <IconeSetaDiagonal className="h-4 w-4" />
            </a>
          </Magnetic>
          <a href="/cardapio" className="botao botao-linha min-h-[3.3rem] px-7">
            Montar pelo WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
