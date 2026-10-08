import { useEffect, useRef, useState } from 'react'
import { ADICIONAIS, type Item, nomeFalado } from '@/lib/business'
import { CAMADAS, type Camada } from '@/lib/camadas'
import {
  centavos,
  type Escolha,
  emReais,
  MAXIMO_POR_ADICIONAL,
  MAXIMO_POR_LINHA,
  montagemDa,
  precoUnitario,
} from '@/lib/pedido'
import { cn } from '@/lib/utils'
import { Corte } from './Corte'
import { IconeFechar, IconeMais, IconeMenos } from './Icones'
import { NomeItem } from './NomeItem'

/**
 * "Monte do seu jeito" — o painel de um lanche.
 *
 * O desenho em corte no topo é a montagem exata do que vai para a sacola:
 * cada adicional entra como camada, cada "sem" sai, e o preço embaixo soma
 * na hora. É o mesmo cálculo da mensagem de WhatsApp (lib/pedido) — o que se
 * vê aqui é o que a cozinha recebe.
 *
 * É um diálogo modal: foco preso dentro, Esc fecha, e o foco volta ao botão
 * que o abriu. No celular sobe de baixo (folha); no desktop, entra pela
 * direita.
 */
type Props = {
  item: Item
  aoFechar: () => void
  aoConfirmar: (escolha: Escolha, quantidade: number) => void
}

export function Personalizar({ item, aoFechar, aoConfirmar }: Props) {
  const [adicionais, setAdicionais] = useState<Record<string, number>>({})
  const [sem, setSem] = useState<Camada[]>([])
  const [quantidade, setQuantidade] = useState(1)
  const painel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null
    const el = painel.current
    el?.querySelector<HTMLElement>('[data-foco-inicial]')?.focus()
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        aoFechar()
        return
      }
      if (e.key !== 'Tab' || !el) return
      const focaveis = [
        ...el.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input'),
      ]
      if (!focaveis.length) return
      const primeiro = focaveis[0]
      const ultimo = focaveis[focaveis.length - 1]
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primeiro.focus()
      }
    }
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', aoTeclar)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', aoTeclar)
      anterior?.focus()
    }
  }, [aoFechar])

  const mudar = (id: string, delta: number) =>
    setAdicionais((a) => {
      const q = Math.max(0, Math.min(MAXIMO_POR_ADICIONAL, (a[id] ?? 0) + delta))
      const novo = { ...a }
      if (q === 0) delete novo[id]
      else novo[id] = q
      return novo
    })

  const alternarSem = (c: Camada) =>
    setSem((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]))

  const unitario = precoUnitario({ itemId: item.id, adicionais })
  const montagem = montagemDa({ itemId: item.id, adicionais, sem })

  return (
    <div className="fixed inset-0 z-[400] flex items-end lg:items-stretch lg:justify-end">
      <button
        type="button"
        aria-label="Fechar"
        tabIndex={-1}
        onClick={aoFechar}
        className="veu absolute inset-0 cursor-default bg-noite/70 backdrop-blur-sm"
      />
      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-personalizar"
        className="painel relative flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-noite-2 text-creme shadow-2xl lg:max-h-none lg:w-[31rem] lg:rounded-none lg:rounded-l-[1.75rem]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-risco px-6 pt-5 pb-4">
          <div>
            <p className="rotulo text-ouro">Monte do seu jeito</p>
            <h2 id="titulo-personalizar" className="cartaz mt-2 text-[1.9rem]">
              <NomeItem item={item} />
            </h2>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            data-foco-inicial
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-creme/20 hover:border-creme/50"
          >
            <IconeFechar className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Preso no topo: rolando os adicionais, o lanche continua à vista,
              crescendo a cada toque. */}
          <div
            className="sticky top-0 z-10 grid place-items-center border-b border-risco/60 bg-noite-2 px-10 pt-5 pb-3"
            style={{
              backgroundImage:
                'radial-gradient(55% 60% at 50% 60%, rgba(226,120,43,0.16), transparent)',
            }}
          >
            <Corte
              montagem={montagem}
              titulo={`${nomeFalado(item)} como está sendo montado`}
              className="max-w-[11rem] lg:max-w-[14rem]"
            />
          </div>
          <p className="px-6 pt-4 text-[0.92rem] leading-relaxed text-cinza">{item.descricao}</p>

          <fieldset className="mt-6 px-6">
            <legend className="rotulo mb-2 text-ouro">Adicionais</legend>
            <ul>
              {ADICIONAIS.map((a) => {
                const q = adicionais[a.id] ?? 0
                return (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-4 border-b border-risco/70 py-2.5"
                  >
                    <span className="min-w-0">
                      <span className={cn('block', q > 0 && 'text-ouro-claro')}>{a.nome}</span>
                      <span className="font-mono text-xs text-cinza tabular">
                        + {emReais(centavos(a.preco))}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => mudar(a.id, -1)}
                        disabled={q === 0}
                        aria-label={`Tirar um: ${a.nome}`}
                        className="grid h-9 w-9 place-items-center rounded-full border border-creme/20 disabled:opacity-30"
                      >
                        <IconeMenos className="h-4 w-4" />
                      </button>
                      <output aria-live="polite" className="w-5 text-center font-mono tabular">
                        {q}
                      </output>
                      <button
                        type="button"
                        onClick={() => mudar(a.id, 1)}
                        disabled={q >= MAXIMO_POR_ADICIONAL}
                        aria-label={`Adicionar: ${a.nome}`}
                        className="grid h-9 w-9 place-items-center rounded-full bg-ouro text-noite disabled:opacity-30"
                      >
                        <IconeMais className="h-4 w-4" />
                      </button>
                    </span>
                  </li>
                )
              })}
            </ul>
          </fieldset>

          {item.removiveis && item.removiveis.length > 0 && (
            <fieldset className="mt-6 px-6 pb-6">
              <legend className="rotulo mb-3 text-ouro">Tirar</legend>
              <div className="flex flex-wrap gap-2">
                {item.removiveis.map((c) => {
                  const tirado = sem.includes(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={tirado}
                      onClick={() => alternarSem(c)}
                      className={cn(
                        'rounded-full border px-4 py-2 text-sm transition-colors',
                        tirado
                          ? 'border-brasa bg-brasa/15 text-creme line-through decoration-brasa'
                          : 'border-creme/20 hover:border-creme/50',
                      )}
                    >
                      sem {CAMADAS[c].nome}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-risco bg-noite px-6 py-4">
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
              disabled={quantidade <= 1}
              aria-label="Um lanche a menos"
              className="grid h-10 w-10 place-items-center rounded-full border border-creme/20 disabled:opacity-30"
            >
              <IconeMenos className="h-4 w-4" />
            </button>
            <output aria-live="polite" className="w-6 text-center font-mono tabular">
              {quantidade}
            </output>
            <button
              type="button"
              onClick={() => setQuantidade((q) => Math.min(MAXIMO_POR_LINHA, q + 1))}
              aria-label="Um lanche a mais"
              className="grid h-10 w-10 place-items-center rounded-full border border-creme/20"
            >
              <IconeMais className="h-4 w-4" />
            </button>
          </span>
          <button
            type="button"
            onClick={() => aoConfirmar({ itemId: item.id, adicionais, sem }, quantidade)}
            className="botao botao-ouro min-h-[3.2rem] flex-1 px-5"
          >
            Adicionar · <span className="tabular">{emReais(unitario * quantidade)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
