import { useCallback, useEffect, useState } from 'react'
import { Corte } from '@/components/Corte'
import { Foto } from '@/components/Foto'
import {
  IconeLixo,
  IconeMais,
  IconeMenos,
  IconeSacola,
  IconeSetaDiagonal,
  IconeWhatsApp,
} from '@/components/Icones'
import { NomeItem } from '@/components/NomeItem'
import { Personalizar } from '@/components/Personalizar'
import { TopoPagina } from '@/components/TopoPagina'
import { registrar, registrarConversaoWhatsApp } from '@/lib/analytics'
import {
  ADICIONAIS,
  CARDAPIO,
  CASA,
  CATEGORIAS,
  type Categoria,
  ehLanche,
  type Item,
  itemPorId,
  nomeFalado,
} from '@/lib/business'
import {
  adicionar,
  alterar,
  centavos,
  detalhe,
  type Escolha,
  emReais,
  itemDa,
  linkWhatsApp,
  mensagem,
  montagemDa,
  quantidadeTotal,
  remover,
  restaurar,
  SACOLA_VAZIA,
  type Sacola,
  subtotal,
  totalCentavos,
  validar,
} from '@/lib/pedido'
import { cn } from '@/lib/utils'

const CHAVE = 'touros:sacola'
const ORDEM: Categoria[] = ['artesanais', 'tradicionais', 'bebidas']

/**
 * A sacola sobrevive a um recarregamento — quem monta o pedido, sai para
 * perguntar à família o que querem e volta, encontra tudo lá. É conveniência
 * deste aparelho, e só: qualquer falha do armazenamento vira sacola vazia, e
 * o que vier de lá passa pela mesma normalização de um clique.
 */
function lerSacola(): Sacola {
  try {
    return restaurar(JSON.parse(localStorage.getItem(CHAVE) ?? '[]'))
  } catch {
    return SACOLA_VAZIA
  }
}

/** `/cardapio?montar=touros-tudo` — o botão "Montar" da home abre o painel. */
function lanchePedidoNaUrl(): Item | null {
  const id = new URLSearchParams(window.location.search).get('montar')
  const item = id ? itemPorId(id) : undefined
  return item && ehLanche(item) ? item : null
}

/**
 * /cardapio — o cardápio inteiro, com preço, e a sacola.
 *
 * O site não fecha pedido: a sacola vira uma mensagem pronta no WhatsApp da
 * casa, ou a pessoa segue para o iFood. O que a sacola garante é a conta
 * certa — com adicionais e o que tirar de cada lanche — antes de a conversa
 * começar.
 */
export default function Cardapio() {
  const [sacola, setSacola] = useState<Sacola>(lerSacola)
  const [montando, setMontando] = useState<Item | null>(lanchePedidoNaUrl)
  const [aviso, setAviso] = useState('')
  const [nome, setNome] = useState('')
  const [endereco, setEndereco] = useState('')
  const [pagamento, setPagamento] = useState('')
  const [troco, setTroco] = useState('')
  const [observacao, setObservacao] = useState('')
  const [tentou, setTentou] = useState(false)
  const [sacolaNaTela, setSacolaNaTela] = useState(false)

  // A barra do celular leva até a sacola; com a sacola já na tela, ela só
  // cobriria o botão de enviar.
  useEffect(() => {
    const alvo = document.getElementById('sacola')
    if (!alvo) return
    const io = new IntersectionObserver(([e]) => setSacolaNaTela(e.isIntersecting), {
      rootMargin: '0px 0px -30% 0px',
    })
    io.observe(alvo)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(sacola))
    } catch {
      /* armazenamento bloqueado: a sacola vive só nesta aba */
    }
  }, [sacola])

  // O aviso de "adicionado" some sozinho.
  useEffect(() => {
    if (!aviso) return
    const id = window.setTimeout(() => setAviso(''), 2600)
    return () => window.clearTimeout(id)
  }, [aviso])

  const colocar = useCallback((escolha: Escolha, quantidade = 1) => {
    const item = itemPorId(escolha.itemId)
    if (!item) return
    setSacola((s) => adicionar(s, escolha, quantidade))
    setAviso(`${quantidade > 1 ? `${quantidade}× ` : ''}${nomeFalado(item)} na sacola.`)
    registrar('lanche_na_sacola', { item: item.id })
  }, [])

  const fechar = useCallback(() => {
    setMontando(null)
    // Tira o ?montar da URL: voltar à página não deve reabrir o painel.
    if (window.location.search) window.history.replaceState({}, '', window.location.pathname)
  }, [])

  const dados = { nome, endereco, pagamento, troco, observacao }
  const validacao = validar(sacola, dados)
  const total = totalCentavos(sacola)
  const qtd = quantidadeTotal(sacola)
  const naSacola = (id: string) =>
    sacola.filter((l) => l.itemId === id).reduce((s, l) => s + l.quantidade, 0)

  const enviar = () => {
    setTentou(true)
    if (!validacao.ok) return
    registrarConversaoWhatsApp('sacola')
    registrar('pedido_montado', { itens: qtd, total: total / 100 })
    window.open(linkWhatsApp(mensagem(sacola, dados)), '_blank', 'noopener')
  }

  return (
    <>
      <TopoPagina
        rotulo="Cardápio"
        titulo="O cardápio inteiro, com preço."
        apoio="Adicione como está, ou toque em “Do meu jeito” para pôr adicionais e tirar o que não quiser. A soma aparece na hora, e o pedido sai pronto no WhatsApp da casa — ou peça pelo iFood."
      />

      <section data-tema="claro" className="kraft pt-12 pb-40 lg:pb-28">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_25rem] lg:gap-14">
          <div className="min-w-0">
            <nav aria-label="Seções do cardápio" className="mb-10 flex flex-wrap gap-2">
              {ORDEM.map((c) => (
                <a
                  key={c}
                  href={`#grupo-${c}`}
                  className="rounded-full border border-noite/20 px-4 py-2 text-sm font-medium hover:border-noite/50"
                >
                  {CATEGORIAS[c].nome}
                </a>
              ))}
              <a
                href="#grupo-adicionais"
                className="rounded-full border border-noite/20 px-4 py-2 text-sm font-medium hover:border-noite/50"
              >
                Adicionais
              </a>
            </nav>

            {ORDEM.map((c) => (
              <section
                key={c}
                id={`grupo-${c}`}
                aria-labelledby={`t-${c}`}
                className="mb-16 scroll-mt-24"
              >
                <h2
                  id={`t-${c}`}
                  className="cartaz border-b-2 border-noite pb-3 text-[clamp(2.2rem,4vw,3.2rem)]"
                >
                  {CATEGORIAS[c].nome}
                </h2>
                <p className="mt-3 mb-2 max-w-[56ch] text-tinta">{CATEGORIAS[c].texto}</p>
                <ul>
                  {CARDAPIO.filter((i) => i.categoria === c).map((item) => (
                    <ItemDoCardapio
                      key={item.id}
                      item={item}
                      naSacola={naSacola(item.id)}
                      aoAdicionar={() => colocar({ itemId: item.id })}
                      aoMontar={() => setMontando(item)}
                    />
                  ))}
                </ul>
              </section>
            ))}

            <section id="grupo-adicionais" aria-labelledby="t-adicionais" className="scroll-mt-24">
              <h2
                id="t-adicionais"
                className="cartaz border-b-2 border-noite pb-3 text-[clamp(2.2rem,4vw,3.2rem)]"
              >
                Adicionais
              </h2>
              <p className="mt-3 max-w-[56ch] text-tinta">
                Em qualquer lanche: toque em “Do meu jeito” no lanche e escolha quantos quiser.
              </p>
              <ul className="mt-4 grid gap-x-10 sm:grid-cols-2">
                {ADICIONAIS.map((a) => (
                  <li key={a.id} className="flex items-baseline gap-3 py-2">
                    <span className="shrink-0">{a.nome}</span>
                    <span
                      aria-hidden
                      className="mb-1 flex-1 border-b border-dotted border-noite/35"
                    />
                    <span className="shrink-0 font-mono text-sm tabular">
                      {emReais(centavos(a.preco))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside id="sacola" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
            <div className="grao rounded-[1.75rem] bg-noite p-6 text-creme sm:p-7">
              <p className="rotulo flex items-center gap-2 text-ouro">
                <IconeSacola className="h-4 w-4" /> Sua sacola
              </p>

              {qtd === 0 ? (
                <p className="mt-5 text-nevoa">
                  Vazia por enquanto. Toque em Adicionar nos lanches do cardápio.
                </p>
              ) : (
                <ul className="mt-5 flex flex-col divide-y divide-risco">
                  {sacola.map((l) => {
                    const item = itemDa(l)
                    const extra = detalhe(l)
                    return (
                      <li key={l.chave} className="py-3 first:pt-0">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0 text-[0.98rem] font-medium">
                            <NomeItem item={item} />
                          </span>
                          <span className="shrink-0 font-mono text-sm tabular">
                            {emReais(subtotal(l))}
                          </span>
                        </div>
                        {extra && <p className="mt-0.5 text-[0.82rem] text-ouro-claro">{extra}</p>}
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSacola((s) => alterar(s, l.chave, -1))}
                            aria-label={`Um a menos: ${nomeFalado(item)}`}
                            className="grid h-8 w-8 place-items-center rounded-full border border-creme/20 hover:border-creme/50"
                          >
                            <IconeMenos className="h-3.5 w-3.5" />
                          </button>
                          <output
                            aria-live="polite"
                            className="w-5 text-center font-mono text-sm tabular"
                          >
                            {l.quantidade}
                          </output>
                          <button
                            type="button"
                            onClick={() => setSacola((s) => alterar(s, l.chave, 1))}
                            aria-label={`Um a mais: ${nomeFalado(item)}`}
                            className="grid h-8 w-8 place-items-center rounded-full border border-creme/20 hover:border-creme/50"
                          >
                            <IconeMais className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSacola((s) => remover(s, l.chave))}
                            aria-label={`Tirar da sacola: ${nomeFalado(item)}`}
                            className="ml-auto grid h-8 w-8 place-items-center rounded-full text-cinza hover:text-creme"
                          >
                            <IconeLixo className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}

              <div className="mt-5 border-t border-risco pt-5">
                <p className="flex items-baseline justify-between">
                  <span className="text-sm text-nevoa">Subtotal</span>
                  <span className="cartaz text-[2.2rem] text-ouro tabular">{emReais(total)}</span>
                </p>
                <p className="mt-1 font-mono text-[0.7rem] text-cinza">
                  + a taxa de entrega, que depende do endereço.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <Campo
                  rotulo="Seu nome"
                  valor={nome}
                  mudar={setNome}
                  auto="given-name"
                  erro={tentou && !nome.trim()}
                />
                <Campo
                  rotulo="Endereço de entrega"
                  valor={endereco}
                  mudar={setEndereco}
                  auto="street-address"
                  dica="Rua, número e bairro"
                  erro={tentou && endereco.trim().length < 8}
                />
                <fieldset>
                  <legend className="mb-2 font-mono text-[0.66rem] tracking-[0.14em] text-cinza uppercase">
                    Como prefere pagar
                  </legend>
                  <div className="flex flex-wrap gap-1.5">
                    {CASA.pagamentoPreferencias.map((p) => (
                      <button
                        key={p}
                        type="button"
                        aria-pressed={pagamento === p}
                        onClick={() => setPagamento(pagamento === p ? '' : p)}
                        className={cn(
                          'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                          pagamento === p
                            ? 'border-ouro bg-ouro text-noite'
                            : 'border-creme/20 hover:border-creme/50',
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </fieldset>
                {pagamento === 'Dinheiro' && (
                  <Campo rotulo="Troco para quanto? (opcional)" valor={troco} mudar={setTroco} />
                )}
                <Campo rotulo="Observação (opcional)" valor={observacao} mudar={setObservacao} />
              </div>

              <button
                type="button"
                onClick={enviar}
                className="botao botao-ouro mt-6 min-h-[3.4rem] w-full"
                data-cursor="Enviar"
              >
                <IconeWhatsApp className="h-5 w-5" /> Enviar pelo WhatsApp
              </button>
              {tentou && !validacao.ok && (
                <p id="erro-sacola" role="alert" className="mt-3 text-sm text-ouro-claro">
                  {validacao.motivo}
                </p>
              )}
              <a
                href={CASA.ifood}
                target="_blank"
                rel="noopener"
                onClick={() => registrar('ifood_clique', { origem: 'sacola' })}
                className="mt-4 flex items-center justify-center gap-1.5 text-sm text-nevoa underline underline-offset-4 hover:text-creme"
              >
                Prefere pagar no app? Peça pelo iFood <IconeSetaDiagonal className="h-3.5 w-3.5" />
              </a>
              <p className="mt-4 text-xs leading-relaxed text-cinza">
                O WhatsApp abre com a mensagem pronta; nada é enviado antes de você tocar em enviar
                lá. A casa confirma o pedido, a forma de pagamento e a taxa de entrega na conversa.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <p role="status" aria-live="polite" className="sr-only">
        {aviso}
      </p>
      {aviso && (
        <div
          aria-hidden
          className="veu fixed inset-x-3 top-20 z-[160] mx-auto w-fit rounded-full bg-noite px-5 py-3 text-sm text-creme shadow-xl ring-1 ring-ouro/40"
        >
          {aviso}
        </div>
      )}

      {/* No celular a sacola fica no fim da página: esta barra diz o total e
          leva até ela. Some quando a sacola está vazia. */}
      {qtd > 0 && !sacolaNaTela && !montando && (
        <a
          href="#sacola"
          className="fixed inset-x-3 bottom-3 z-[140] flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-b from-ouro-claro to-ouro px-5 py-4 text-noite shadow-[0_18px_40px_-14px_rgba(214,166,80,0.8)] lg:hidden"
        >
          <span className="flex items-center gap-2 font-semibold">
            <IconeSacola className="h-5 w-5" /> {qtd} {qtd === 1 ? 'item' : 'itens'}
          </span>
          <span className="font-mono tabular">{emReais(total)} · Ver sacola</span>
        </a>
      )}

      {montando && (
        <Personalizar
          item={montando}
          aoFechar={fechar}
          aoConfirmar={(escolha, quantidade) => {
            colocar(escolha, quantidade)
            fechar()
          }}
        />
      )}
    </>
  )
}

function ItemDoCardapio({
  item,
  naSacola,
  aoAdicionar,
  aoMontar,
}: {
  item: Item
  naSacola: number
  aoAdicionar: () => void
  aoMontar: () => void
}) {
  const lanche = ehLanche(item)
  return (
    <li
      id={`item-${item.id}`}
      className="flex scroll-mt-28 gap-4 border-b border-noite/12 py-6 sm:gap-6"
    >
      <Miniatura item={item} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="cartaz min-w-0 text-[1.45rem] leading-tight break-words sm:text-[1.65rem]">
            <NomeItem item={item} />
          </h3>
          <span className="shrink-0 pt-1 font-mono text-[0.98rem] tabular">
            {emReais(centavos(item.preco))}
          </span>
        </div>
        {lanche && (
          <p className="mt-1.5 text-[0.92rem] leading-relaxed text-tinta">{item.descricao}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          <button
            type="button"
            onClick={aoAdicionar}
            aria-label={`Adicionar ${nomeFalado(item)}`}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-noite px-4 text-sm font-semibold text-creme transition-transform active:scale-95"
          >
            <IconeMais className="h-4 w-4" /> Adicionar
          </button>
          {lanche && (
            <button
              type="button"
              onClick={aoMontar}
              aria-label={`Montar do meu jeito: ${nomeFalado(item)}`}
              className="inline-flex h-10 items-center rounded-full border border-noite/30 px-4 text-sm font-semibold hover:border-noite/60"
            >
              Do meu jeito
            </button>
          )}
          {naSacola > 0 && (
            <span className="ml-1 font-mono text-[0.72rem] text-tinta">{naSacola} na sacola</span>
          )}
        </div>
      </div>
    </li>
  )
}

/**
 * A miniatura: foto real quando existe; senão, o desenho em corte num quadro
 * escuro (o lanche sem foto não ganha foto emprestada de outro); nas bebidas,
 * uma lata na cor da marca, sem logo.
 */
function Miniatura({ item }: { item: Item }) {
  const classe = 'w-24 shrink-0 self-start rounded-2xl sm:w-32'
  if (item.foto) {
    return (
      <Foto
        nome={item.foto.arquivo}
        alt={nomeFalado(item)}
        proporcao={1}
        sizes="128px"
        className={classe}
      />
    )
  }
  if (item.camadas) {
    return (
      <div className={cn(classe, 'grid aspect-square place-items-center bg-noite p-2.5')}>
        <Corte montagem={montagemDa({ itemId: item.id, adicionais: {}, sem: [] })} />
      </div>
    )
  }
  const cor =
    item.id === 'coca-cola-zero'
      ? '#1a1a1a'
      : item.id === 'guarana-antarctica'
        ? '#1f7a3a'
        : '#c8102e'
  return (
    <div className={cn(classe, 'grid aspect-square place-items-center bg-noite/90')} aria-hidden>
      <svg viewBox="0 0 40 64" className="h-3/5" aria-hidden="true">
        <rect x="4" y="6" width="32" height="54" rx="6" fill={cor} />
        <rect x="6" y="2" width="28" height="6" rx="2.5" fill="#c9c9c9" />
        <rect x="4" y="22" width="32" height="18" fill="#fff" opacity="0.14" />
      </svg>
    </div>
  )
}

function Campo({
  rotulo,
  valor,
  mudar,
  auto,
  dica,
  erro = false,
}: {
  rotulo: string
  valor: string
  mudar: (v: string) => void
  auto?: string
  dica?: string
  erro?: boolean
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[0.66rem] tracking-[0.14em] text-cinza uppercase">
        {rotulo}
      </span>
      <input
        value={valor}
        onChange={(e) => mudar(e.target.value)}
        autoComplete={auto}
        placeholder={dica}
        aria-invalid={erro || undefined}
        aria-describedby={erro ? 'erro-sacola' : undefined}
        className={cn(
          'h-11 rounded-xl border bg-creme/[0.04] px-3.5 text-[0.95rem] text-creme outline-none placeholder:text-cinza focus:border-ouro',
          erro ? 'border-brasa' : 'border-creme/15',
        )}
      />
    </label>
  )
}
