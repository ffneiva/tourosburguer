import { Foto } from '@/components/Foto'
import { Reveal } from '@/components/Reveal'
import { Titulo } from '@/components/Titulo'
import { ADICIONAIS, CARDAPIO, itemPorId, TEXTO } from '@/lib/business'
import { centavos, emReais } from '@/lib/pedido'

/**
 * O resto do cardápio, em uma seção: o lanche tradicional, os adicionais e as
 * bebidas.
 *
 * Os adicionais estão em lista com pontilhado até o preço — é assim que a
 * própria casa os apresenta no cardápio, e é o formato que se lê de relance.
 */
function LinhaDePreco({ nome, preco }: { nome: string; preco: number }) {
  return (
    <li className="flex items-baseline gap-3 py-2">
      <span className="shrink-0">{nome}</span>
      <span aria-hidden className="mb-1 flex-1 border-b border-dotted border-noite/35" />
      <span className="shrink-0 font-mono text-[0.95rem] tabular">{emReais(centavos(preco))}</span>
    </li>
  )
}

export function DoSeuJeito() {
  const { doSeuJeito } = TEXTO
  const tudo = itemPorId('touros-tudo')
  const bebidas = CARDAPIO.filter((i) => i.categoria === 'bebidas')

  return (
    <section id="do-seu-jeito" data-tema="claro" className="kraft relative z-10 py-24 sm:py-32">
      <div className="container-x">
        <Titulo rotulo={doSeuJeito.rotulo} titulo={doSeuJeito.titulo} apoio={doSeuJeito.apoio} />

        <div className="mt-16 grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {tudo?.foto && (
            <Reveal className="grid gap-6 rounded-[1.75rem] bg-noite p-4 text-creme sm:grid-cols-[0.9fr_1fr] sm:p-5">
              <a href={tudo.foto.reel} target="_blank" rel="noopener" className="block">
                <Foto
                  nome={tudo.foto.arquivo}
                  alt="O Touro’s Tudo no prato, com batata palha e molho"
                  sizes="(min-width: 1024px) 20rem, 90vw"
                  className="h-full rounded-[1.25rem]"
                />
              </a>
              <div className="flex flex-col justify-center p-2 sm:py-4 sm:pr-4">
                <p className="rotulo text-ouro">Lanche tradicional</p>
                <h3 className="cartaz mt-3 text-[clamp(2.4rem,4.4vw,3.6rem)]">{tudo.nome}</h3>
                <p className="mt-2 font-display text-[2rem] font-medium text-ouro tabular">
                  {emReais(centavos(tudo.preco))}
                </p>
                <p className="mt-4 text-[0.98rem] leading-relaxed text-nevoa">{tudo.descricao}</p>
                <a
                  href={`/cardapio?montar=${tudo.id}`}
                  className="botao botao-ouro mt-7 w-fit min-h-[3rem] px-6"
                  data-cursor="Montar"
                >
                  Montar o meu
                </a>
              </div>
            </Reveal>
          )}

          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-1">
            <Reveal delay={0.08}>
              <h3 className="cartaz border-b-2 border-noite pb-3 text-[1.9rem]">Adicionais</h3>
              <p className="mt-3 text-sm text-tinta">Em qualquer lanche, quantos quiser.</p>
              <ul className="mt-3 text-[1.02rem]">
                {ADICIONAIS.map((a) => (
                  <LinhaDePreco key={a.id} nome={a.nome} preco={a.preco} />
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.14}>
              <h3 className="cartaz border-b-2 border-noite pb-3 text-[1.9rem]">Bebidas</h3>
              <p className="mt-3 text-sm text-tinta">Lata de 350 ml.</p>
              <ul className="mt-3 text-[1.02rem]">
                {bebidas.map((b) => (
                  <LinhaDePreco
                    key={b.id}
                    nome={b.nome.replace(' lata 350 ml', '')}
                    preco={b.preco}
                  />
                ))}
              </ul>
              <a href="/cardapio" className="botao botao-noite mt-10 w-full min-h-[3.2rem]">
                Ver o cardápio inteiro
              </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
