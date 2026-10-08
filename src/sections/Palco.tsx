import { useCallback, useRef, useState } from 'react'
import { Cena3D, suportaWebGL } from '@/components/Cena3D'
import { Corte } from '@/components/Corte'
import { SeloEstado } from '@/components/Estado'
import { Foto } from '@/components/Foto'
import { IconeSetaDiagonal, IconeWhatsApp } from '@/components/Icones'
import { Magnetic } from '@/components/Magnetic'
import { Reveal } from '@/components/Reveal'
import { Titulo } from '@/components/Titulo'
import { useReducedMotion } from '@/hooks/useMediaQuery'
import { registrar } from '@/lib/analytics'
import { ANATOMIA, CASA, itemPorId, TEXTO } from '@/lib/business'
import { resumoDaSemana } from '@/lib/hours'
import { centavos, emReais, montagemDa } from '@/lib/pedido'
import { cn } from '@/lib/utils'

const limitar = (v: number) => Math.min(1, Math.max(0, v))

/**
 * O palco: o herói e a anatomia dividem o mesmo hambúrguer 3D.
 *
 * O canvas mora num bloco `sticky` do tamanho da tela, no começo do palco, com
 * margem negativa da mesma altura — o conteúdo das duas seções corre por cima
 * dele, e ele fica parado enquanto o palco estiver na tela. A rolagem vira
 * dois números: `entrada` (o lanche sai do lado do título e vai para o
 * centro) e `abertura` (as camadas se separam).
 *
 * Sem WebGL ou com movimento reduzido, não há canvas: o herói mostra uma foto
 * real do lanche, e a anatomia, o desenho em corte aberto — a mesma
 * informação, parada.
 */
export function Palco({ pronto }: { pronto: boolean }) {
  const palcoRef = useRef<HTMLDivElement>(null)
  const heroiRef = useRef<HTMLElement>(null)
  const anatomiaRef = useRef<HTMLElement>(null)
  const reduzido = useReducedMotion()
  const [webgl] = useState(suportaWebGL)
  const em3D = webgl && !reduzido

  const progresso = useCallback(() => {
    const heroi = heroiRef.current?.getBoundingClientRect()
    const anatomia = anatomiaRef.current?.getBoundingClientRect()
    if (!heroi || !anatomia) return { entrada: 0, abertura: 0 }
    const vh = window.innerHeight
    return {
      entrada: limitar(-heroi.top / (heroi.height * 0.8)),
      // Abre enquanto a anatomia atravessa a tela, e termina com folga antes
      // do fim — o lanche aberto fica um tempo parado para ser lido.
      abertura: limitar((-anatomia.top + vh * 0.15) / ((anatomia.height - vh) * 0.72)),
    }
  }, [])

  return (
    <div ref={palcoRef} className="grao relative bg-noite text-creme">
      {em3D && (
        <div className="pointer-events-none sticky top-0 z-0 -mb-[100svh] h-[100svh] overflow-hidden">
          {/* A brasa atrás do lanche — acompanha o lado em que ele está. */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(38% 46% at 72% 52%, rgba(226,120,43,0.20), transparent 70%), radial-gradient(60% 50% at 70% 100%, rgba(214,166,80,0.10), transparent 70%)',
            }}
          />
          <Cena3D className="absolute inset-0" progresso={progresso} palco={palcoRef} />
        </div>
      )}
      <Heroi ref={heroiRef} pronto={pronto} em3D={em3D} />
      <Anatomia ref={anatomiaRef} em3D={em3D} />
    </div>
  )
}

function Heroi({
  ref,
  pronto,
  em3D,
}: {
  ref: React.Ref<HTMLElement>
  pronto: boolean
  em3D: boolean
}) {
  const { heroi } = TEXTO
  const horario = resumoDaSemana(CASA.semana)[0]

  const fatos = [
    { rotulo: 'Agora', valor: <SeloEstado /> },
    { rotulo: horario.dias, valor: horario.horario },
    { rotulo: 'Entrega', valor: CASA.regiao },
    { rotulo: 'Todo lanche', valor: 'Acompanha molho Touro’s' },
  ]

  return (
    <section
      ref={ref}
      data-tema="escuro"
      aria-labelledby="titulo-heroi"
      className={cn(
        'heroi-armado relative z-10 flex min-h-[100svh] flex-col',
        pronto && 'heroi-pronto',
      )}
    >
      <div className="container-x relative grid flex-1 items-center gap-10 pt-28 pb-8 sm:pt-32 lg:grid-cols-[1.15fr_1fr] lg:pt-24">
        <div className="max-w-[44rem] min-w-0">
          <p data-surge className="rotulo mb-6 text-ouro" style={{ ['--i' as string]: 0 }}>
            {heroi.sobretitulo}
          </p>

          <h1 id="titulo-heroi" className="cartaz text-[clamp(2.5rem,6.3vw,6.2rem)] leading-[0.92]">
            {heroi.titulo.map((linha, i) => (
              <span
                key={linha}
                data-linha
                // O padding-top dá ar ao acento: overflow-hidden recorta na
                // borda do padding, e sem ele o acento de "Hambúrgueres" sumiria.
                className="-mt-[0.12em] block overflow-hidden pt-[0.12em] pb-[0.04em]"
              >
                <span className={cn('block', i === 2 && 'ouro-metal')}>{linha}</span>
              </span>
            ))}
          </h1>

          <p
            data-surge
            className="mt-7 max-w-[32rem] text-[1.08rem] leading-relaxed text-nevoa"
            style={{ ['--i' as string]: 1 }}
          >
            {heroi.apoio}
          </p>

          <div
            data-surge
            className="mt-9 flex flex-wrap items-center gap-3"
            style={{ ['--i' as string]: 2 }}
          >
            <Magnetic>
              <a
                href={CASA.ifood}
                target="_blank"
                rel="noopener"
                onClick={() => registrar('ifood_clique', { origem: 'heroi' })}
                className="botao botao-ouro min-h-[3.3rem] px-7"
                data-cursor="Pedir"
              >
                Pedir no iFood <IconeSetaDiagonal className="h-4 w-4" />
              </a>
            </Magnetic>
            <a href="/cardapio" className="botao botao-linha min-h-[3.3rem] px-6">
              <IconeWhatsApp className="h-5 w-5" /> Montar pelo WhatsApp
            </a>
          </div>
        </div>

        {/* Sem 3D, a foto real ocupa o lugar do lanche girando. */}
        {em3D ? (
          <div aria-hidden className="h-[36svh] lg:h-auto" />
        ) : (
          <div
            data-surge
            style={{ ['--i' as string]: 3 }}
            className="relative mx-auto w-full max-w-[26rem]"
          >
            <Foto
              nome="bacon-cheddar"
              alt="Touro’s Bacon Cheddar embrulhado no papel da casa"
              prioridade
              sizes="(min-width: 1024px) 26rem, 80vw"
              className="rounded-t-[12rem] rounded-b-[1.5rem] ring-1 ring-ouro/40"
            />
          </div>
        )}
      </div>

      {em3D && (
        <p
          data-surge
          aria-hidden
          style={{ ['--i' as string]: 4 }}
          className="container-x mb-4 hidden justify-end font-mono text-[0.68rem] tracking-[0.14em] text-cinza uppercase lg:flex"
        >
          Role para abrir o lanche ↓
        </p>
      )}

      {/* Informação de consulta: grade fixa, nunca marquise. */}
      <div
        data-surge
        className="relative border-t border-creme/10 bg-noite/70 backdrop-blur-md"
        style={{ ['--i' as string]: 3 }}
      >
        <dl className="container-x grid grid-cols-2 gap-x-6 gap-y-4 py-5 lg:grid-cols-4">
          {fatos.map((f) => (
            <div key={f.rotulo}>
              <dt className="font-mono text-[0.66rem] tracking-[0.14em] text-ouro uppercase">
                {f.rotulo}
              </dt>
              <dd className="mt-1.5 text-[0.95rem] font-medium">{f.valor}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function Anatomia({ ref, em3D }: { ref: React.Ref<HTMLElement>; em3D: boolean }) {
  const { anatomia } = TEXTO
  const item = itemPorId(ANATOMIA.item)
  const rotulos = Object.fromEntries(ANATOMIA.camadas.map((c) => [c.camada, c.nome]))

  const fecho = item && (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
      <p>
        <span className="cartaz block text-[clamp(1.6rem,3vw,2.2rem)]">{item.nome}</span>
        <span className="font-mono text-ouro tabular">{emReais(centavos(item.preco))}</span>
      </p>
      <a
        href={`/cardapio#item-${item.id}`}
        className="botao botao-ouro min-h-[3rem] px-6"
        data-cursor="Montar"
      >
        Montar o meu
      </a>
    </div>
  )

  if (!em3D) {
    return (
      <section
        ref={ref}
        id="anatomia"
        data-tema="escuro"
        className="relative z-10 border-t border-risco py-24 sm:py-32"
      >
        <div className="container-x grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Titulo rotulo={anatomia.rotulo} titulo={anatomia.titulo} apoio={anatomia.apoio} />
            <div className="mt-10">{fecho}</div>
          </div>
          {item && (
            <Corte
              montagem={montagemDa({ itemId: item.id, adicionais: {}, sem: [] })}
              explodido
              rotulos={rotulos}
              titulo={`${item.nome} aberto em camadas`}
              className="max-w-[34rem] text-ouro-claro"
            />
          )}
        </div>
      </section>
    )
  }

  return (
    <section
      ref={ref}
      id="anatomia"
      data-tema="escuro"
      aria-labelledby="titulo-anatomia"
      className="relative z-10 h-[300svh]"
    >
      <div className="sticky top-0 h-[100svh] pt-24 sm:pt-28">
        <div className="container-x">
          <div className="max-w-[18rem] sm:max-w-[22rem] lg:max-w-[20rem] xl:max-w-[26rem]">
            <p className="rotulo mb-4 flex items-center gap-3 text-ouro">
              <span aria-hidden className="h-px w-8 bg-current" />
              {anatomia.rotulo}
            </p>
            <h2 id="titulo-anatomia" className="cartaz text-[clamp(2.2rem,5.4vw,4.6rem)]">
              {anatomia.titulo}
            </h2>
            <p className="mt-5 hidden text-[1.02rem] leading-relaxed text-nevoa sm:block">
              {anatomia.apoio}
            </p>
          </div>
        </div>
        {/* A lista em texto, para quem não vê o canvas: a mesma ordem, de cima
            para baixo. */}
        <ol className="sr-only">
          {ANATOMIA.camadas.map((c) => (
            <li key={c.camada}>
              {c.nome}
              {c.nota ? `, ${c.nota}` : ''}
            </li>
          ))}
        </ol>
      </div>
      {/* O fecho chega com o fim da seção, quando o lanche já está aberto. */}
      <Reveal className="container-x absolute inset-x-0 bottom-0 pb-12">{fecho}</Reveal>
    </section>
  )
}
