import { type KeyboardEvent, useRef, useState } from 'react'
import { Corte } from '@/components/Corte'
import { Foto } from '@/components/Foto'
import { IconeSetaDiagonal } from '@/components/Icones'
import { NomeItem } from '@/components/NomeItem'
import { Titulo } from '@/components/Titulo'
import { ARTESANAIS, CASA, nomeFalado, TEXTO } from '@/lib/business'
import { centavos, emReais, montagemDa } from '@/lib/pedido'
import { cn } from '@/lib/utils'

/**
 * Os artesanais — um seletor, e não uma grade de cartões.
 *
 * Os seis lanches se distinguem pelo que tem dentro, e é isso que o seletor
 * mostra: escolher outro transforma o desenho em corte no lugar. As camadas
 * em comum (pão, blend, verdura) deslizam para a nova altura, e só as que
 * mudam entram ou saem — a diferença entre o Bacon Cheddar e o Bacon
 * Catupiry fica visível num toque.
 *
 * A foto real aparece ao lado quando existe (de um reel da casa); quando não
 * existe, não é inventada.
 *
 * Acessibilidade: é um `tablist` de verdade — setas trocam de lanche, Home e
 * End vão às pontas, e o painel é anunciado pelo nome do lanche.
 */
export function Artesanais() {
  const { artesanais } = TEXTO
  const [atual, setAtual] = useState(0)
  const abas = useRef<Array<HTMLButtonElement | null>>([])
  const item = ARTESANAIS[atual]

  const aoTeclar = (e: KeyboardEvent) => {
    const n = ARTESANAIS.length
    const destino =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? (atual + 1) % n
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? (atual - 1 + n) % n
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? n - 1
              : null
    if (destino === null) return
    e.preventDefault()
    setAtual(destino)
    abas.current[destino]?.focus()
  }

  return (
    <section
      id="artesanais"
      data-tema="escuro"
      className="grao relative z-10 overflow-hidden bg-noite-2 py-24 text-creme sm:py-32"
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(40% 45% at 70% 55%, rgba(226,120,43,0.14), transparent 70%)',
        }}
      />
      <div className="container-x relative">
        <Titulo rotulo={artesanais.rotulo} titulo={artesanais.titulo} apoio={artesanais.apoio} />

        <div className="mt-14 grid gap-10 lg:grid-cols-[23rem_1fr] lg:gap-14">
          <div
            role="tablist"
            aria-label="Os artesanais"
            aria-orientation="vertical"
            onKeyDown={aoTeclar}
            className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
            data-transbordo-intencional
          >
            {ARTESANAIS.map((x, i) => (
              <button
                key={x.id}
                ref={(el) => {
                  abas.current[i] = el
                }}
                type="button"
                role="tab"
                id={`aba-${x.id}`}
                aria-selected={i === atual}
                aria-controls="painel-artesanal"
                tabIndex={i === atual ? 0 : -1}
                onClick={() => setAtual(i)}
                className={cn(
                  'group flex shrink-0 items-baseline justify-between gap-6 rounded-2xl border px-5 py-4 text-left transition-colors duration-300 lg:rounded-none lg:border-0 lg:border-b lg:px-0 lg:py-5',
                  i === atual
                    ? 'border-ouro bg-ouro/10 text-creme lg:border-ouro lg:bg-transparent'
                    : 'border-risco text-cinza hover:text-creme',
                )}
              >
                <span className="cartaz text-[1.3rem] whitespace-nowrap lg:text-[1.5rem]">
                  <NomeItem item={x} />
                </span>
                <span
                  className={cn(
                    'shrink-0 font-mono text-sm whitespace-nowrap tabular',
                    i === atual ? 'text-ouro' : 'text-cinza',
                  )}
                >
                  {emReais(centavos(x.preco))}
                </span>
              </button>
            ))}
          </div>

          <div
            id="painel-artesanal"
            role="tabpanel"
            aria-labelledby={`aba-${item.id}`}
            className="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr]"
          >
            <div className="relative mx-auto w-full max-w-[30rem]">
              <Corte
                montagem={montagemDa({ itemId: item.id, adicionais: {}, sem: [] })}
                titulo={`Desenho em corte do ${nomeFalado(item)}`}
              />
            </div>

            <div>
              <p className="rotulo text-ouro">
                {String(atual + 1).padStart(2, '0')} / {String(ARTESANAIS.length).padStart(2, '0')}
              </p>
              <h3 className="cartaz mt-3 text-[clamp(2.2rem,4vw,3.4rem)]">
                <NomeItem item={item} />
              </h3>
              {item.chamada && (
                <p className="mt-3 text-[1.1rem] leading-snug text-ouro-claro">{item.chamada}</p>
              )}
              <p className="mt-4 text-[0.98rem] leading-relaxed text-nevoa">{item.descricao}</p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href={`/cardapio?montar=${item.id}`}
                  className="botao botao-ouro min-h-[3.1rem] px-6"
                  data-cursor="Montar"
                >
                  Montar · {emReais(centavos(item.preco))}
                </a>
                <a
                  href={CASA.ifood}
                  target="_blank"
                  rel="noopener"
                  className="botao botao-linha min-h-[3.1rem] px-5"
                >
                  No iFood <IconeSetaDiagonal className="h-4 w-4" />
                </a>
              </div>

              {item.foto && (
                <a
                  href={item.foto.reel}
                  target="_blank"
                  rel="noopener"
                  className="group mt-8 flex items-center gap-4"
                >
                  <Foto
                    key={item.foto.arquivo}
                    nome={item.foto.arquivo}
                    alt={`${nomeFalado(item)}, foto real`}
                    sizes="96px"
                    className="w-20 shrink-0 rounded-xl ring-1 ring-ouro/30"
                  />
                  <span className="text-sm leading-snug text-cinza group-hover:text-creme">
                    <span className="block font-medium text-creme">Foto real</span>
                    Quadro de um reel da casa. Ver o vídeo ↗
                  </span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
