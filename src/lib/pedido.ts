import {
  ADICIONAIS,
  adicionalPorId,
  CASA,
  ehLanche,
  type Item,
  itemPorId,
  nomeFalado,
} from './business.ts'
import { CAMADAS, type Camada, type CamadaMontada, montar } from './camadas.ts'

/**
 * A sacola do site — o pedido montado aqui e entregue no WhatsApp da casa.
 *
 * O site não fecha pedido nem cobra: quem faz isso é o iFood (ou a casa, pelo
 * WhatsApp). O que ele garante é que a lista chegue certa e somada — com os
 * adicionais e o que tirar de cada lanche —, para a conversa começar em
 * "confirmado" e não num interrogatório.
 *
 * Toda conta é feita em CENTAVOS inteiros. Em ponto flutuante, 3 × 2,90 dá
 * 8,700000000000001 — e um centavo a mais na mensagem é um cliente
 * desconfiado do resto.
 */

/** Um lanche como foi pedido: o item, os adicionais (id → unidades) e o "sem". */
export type Escolha = {
  itemId: string
  adicionais?: Readonly<Record<string, number>>
  sem?: readonly Camada[]
}

export type Linha = {
  /** Identidade da combinação — dois lanches iguais viram uma linha com 2. */
  chave: string
  itemId: string
  adicionais: Readonly<Record<string, number>>
  sem: readonly Camada[]
  quantidade: number
}

export type Sacola = readonly Linha[]

export const SACOLA_VAZIA: Sacola = []

/** Limite por linha: acima disso é encomenda, e se combina conversando. */
export const MAXIMO_POR_LINHA = 20
/** Unidades de um mesmo adicional num lanche. */
export const MAXIMO_POR_ADICIONAL = 5

export const centavos = (reais: number) => Math.round(reais * 100)

/**
 * Normaliza uma escolha: descarta adicional desconhecido ou zerado, "sem" que
 * o lanche não permite, e adicional em bebida. É o que protege a sacola de um
 * localStorage adulterado ou de um cardápio que mudou desde a última visita.
 */
export function normalizar(escolha: Escolha): Linha | null {
  const item = itemPorId(escolha.itemId)
  if (!item) return null
  const adicionais: Record<string, number> = {}
  if (ehLanche(item)) {
    // Na ordem do cardápio, e não na do clique: a chave não pode depender dela.
    for (const a of ADICIONAIS) {
      const q = Math.floor(escolha.adicionais?.[a.id] ?? 0)
      if (q > 0) adicionais[a.id] = Math.min(MAXIMO_POR_ADICIONAL, q)
    }
  }
  const sem = (item.removiveis ?? []).filter((c) => escolha.sem?.includes(c))
  const partes = [
    item.id,
    Object.entries(adicionais)
      .map(([id, q]) => `${id}:${q}`)
      .join(','),
    sem.join(','),
  ]
  return { chave: partes.join('|'), itemId: item.id, adicionais, sem, quantidade: 1 }
}

export function adicionar(sacola: Sacola, escolha: Escolha, quantidade = 1): Sacola {
  const nova = normalizar(escolha)
  if (!nova || quantidade <= 0) return sacola
  const existente = sacola.find((l) => l.chave === nova.chave)
  if (existente) return alterar(sacola, nova.chave, quantidade)
  return [...sacola, { ...nova, quantidade: Math.min(MAXIMO_POR_LINHA, quantidade) }]
}

export function alterar(sacola: Sacola, chave: string, delta: number): Sacola {
  return sacola
    .map((l) =>
      l.chave === chave
        ? { ...l, quantidade: Math.max(0, Math.min(MAXIMO_POR_LINHA, l.quantidade + delta)) }
        : l,
    )
    .filter((l) => l.quantidade > 0)
}

export function remover(sacola: Sacola, chave: string): Sacola {
  return sacola.filter((l) => l.chave !== chave)
}

export function itemDa(linha: Linha): Item {
  // `normalizar` já garantiu que o item existe.
  return itemPorId(linha.itemId) as Item
}

/** Preço de UMA unidade da linha: o lanche mais os adicionais. */
export function precoUnitario(linha: Pick<Linha, 'itemId' | 'adicionais'>): number {
  const item = itemPorId(linha.itemId)
  if (!item) return 0
  let soma = centavos(item.preco)
  for (const [id, q] of Object.entries(linha.adicionais)) {
    const a = adicionalPorId(id)
    if (a) soma += centavos(a.preco) * q
  }
  return soma
}

export const subtotal = (linha: Linha) => precoUnitario(linha) * linha.quantidade

export function totalCentavos(sacola: Sacola): number {
  return sacola.reduce((soma, l) => soma + subtotal(l), 0)
}

export function quantidadeTotal(sacola: Sacola): number {
  return sacola.reduce((soma, l) => soma + l.quantidade, 0)
}

/** A montagem do lanche da linha, para o desenho em corte. */
export function montagemDa(linha: Pick<Linha, 'itemId' | 'adicionais' | 'sem'>): CamadaMontada[] {
  const item = itemPorId(linha.itemId)
  if (!item?.camadas) return []
  const extras = Object.entries(linha.adicionais)
    .map(([id, q]) => [adicionalPorId(id)?.camada, q] as const)
    .filter((x): x is readonly [Camada, number] => Boolean(x[0]))
  return montar(item.camadas, extras, linha.sem)
}

/** "+ 2 bacon, + 1 ovo · sem cebola roxa" — o detalhe de uma linha. */
export function detalhe(linha: Pick<Linha, 'adicionais' | 'sem'>): string {
  const mais = Object.entries(linha.adicionais).map(([id, q]) => {
    const a = adicionalPorId(id)
    return `+ ${q > 1 ? `${q} ` : ''}${a?.nome.toLowerCase() ?? id}`
  })
  const menos = linha.sem.map((c) => `sem ${CAMADAS[c].nome}`)
  return [mais.join(', '), menos.join(', ')].filter(Boolean).join(' · ')
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** 4090 → "R$ 40,90" (com espaço comum, não o não separável do Intl). */
export function emReais(valorCentavos: number): string {
  return BRL.format(valorCentavos / 100).replace(/\s/g, ' ')
}

export type Dados = {
  nome: string
  endereco: string
  pagamento?: string
  troco?: string
  observacao?: string
}

export type Validacao = { ok: true } | { ok: false; motivo: string }

export function validar(sacola: Sacola, dados: Dados): Validacao {
  if (quantidadeTotal(sacola) === 0) return { ok: false, motivo: 'A sacola está vazia.' }
  if (!dados.nome.trim()) return { ok: false, motivo: 'Diga o seu nome.' }
  if (dados.endereco.trim().length < 8) {
    return { ok: false, motivo: 'Informe o endereço de entrega (rua, número e bairro).' }
  }
  return { ok: true }
}

/**
 * A mensagem que chega no WhatsApp da casa.
 *
 * Um bloco por lanche, como se anota na comanda: a quantidade e o nome, e
 * embaixo, recuado, o que muda — adicional e "sem". O subtotal no fim, e a
 * pergunta da taxa de entrega explícita: ela depende do endereço, e o site
 * não sabe calculá-la. Sem emoji: alguns aparelhos de balcão ainda os mostram
 * como quadradinho.
 */
export function mensagem(sacola: Sacola, dados: Dados): string {
  const l = ['Olá, Touro’s! Quero fazer um pedido:', '']
  for (const linha of sacola) {
    const item = itemDa(linha)
    l.push(`${linha.quantidade}x ${nomeFalado(item)} — ${emReais(subtotal(linha))}`)
    for (const [id, q] of Object.entries(linha.adicionais)) {
      const a = adicionalPorId(id)
      if (!a) continue
      // O valor já está no subtotal da linha; aqui ele só explica a soma.
      const cada = linha.quantidade > 1 ? ' cada' : ''
      l.push(`   + ${q}x ${a.nome} (${emReais(centavos(a.preco) * q)}${cada})`)
    }
    for (const c of linha.sem) l.push(`   sem ${CAMADAS[c].nome}`)
  }
  l.push('', `Subtotal: ${emReais(totalCentavos(sacola))}`, '')
  l.push(`Nome: ${dados.nome.trim()}`, `Endereço: ${dados.endereco.trim()}`)
  if (dados.pagamento?.trim()) {
    const troco = dados.pagamento === 'Dinheiro' && dados.troco?.trim()
    l.push(`Pagamento: ${dados.pagamento.trim()}${troco ? ` (troco para ${troco})` : ''}`)
  }
  if (dados.observacao?.trim()) l.push(`Observação: ${dados.observacao.trim()}`)
  l.push('', 'Qual fica a taxa de entrega para o meu endereço?')
  return l.join('\n')
}

export function linkWhatsApp(texto: string, numero: string = CASA.whatsapp): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
}

/**
 * Lê a sacola guardada, passando cada linha pela normalização. Aceita
 * qualquer coisa — é o que vem de um localStorage que o usuário pode editar.
 */
export function restaurar(bruto: unknown): Sacola {
  if (!Array.isArray(bruto)) return SACOLA_VAZIA
  let s: Sacola = SACOLA_VAZIA
  for (const x of bruto) {
    if (!x || typeof x !== 'object') continue
    const o = x as Partial<Linha>
    if (typeof o.itemId !== 'string' || typeof o.quantidade !== 'number') continue
    s = adicionar(
      s,
      {
        itemId: o.itemId,
        adicionais: o.adicionais && typeof o.adicionais === 'object' ? o.adicionais : {},
        sem: Array.isArray(o.sem) ? o.sem : [],
      },
      Math.floor(o.quantidade),
    )
  }
  return s
}
