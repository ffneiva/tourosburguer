import { describe, expect, it } from 'vitest'
import { ADICIONAIS, CARDAPIO, ehLanche, itemPorId } from '@/lib/business'
import { alturaDe, CAMADAS, montar } from '@/lib/camadas'
import {
  adicionar,
  alterar,
  centavos,
  detalhe,
  emReais,
  linkWhatsApp,
  MAXIMO_POR_ADICIONAL,
  MAXIMO_POR_LINHA,
  mensagem,
  montagemDa,
  normalizar,
  precoUnitario,
  quantidadeTotal,
  remover,
  restaurar,
  SACOLA_VAZIA,
  subtotal,
  totalCentavos,
  validar,
} from '@/lib/pedido'

const dados = { nome: 'Ana', endereco: 'Rua Halfeld, 120, Centro', pagamento: 'Pix' }
const LANCHES = CARDAPIO.filter(ehLanche)

describe('sacola', () => {
  it('o mesmo lanche com a mesma escolha vira uma linha só', () => {
    let s = adicionar(SACOLA_VAZIA, { itemId: 'touros-bacon-cheddar' })
    s = adicionar(s, { itemId: 'touros-bacon-cheddar' })
    expect(s).toHaveLength(1)
    expect(s[0].quantidade).toBe(2)
  })

  it('a ordem do clique nos adicionais não muda a identidade da linha', () => {
    let s = adicionar(SACOLA_VAZIA, {
      itemId: 'touros-burguer',
      adicionais: { ovo: 1, bacon: 2 },
      sem: ['tomate', 'cebola'],
    })
    s = adicionar(s, {
      itemId: 'touros-burguer',
      adicionais: { bacon: 2, ovo: 1 },
      sem: ['cebola', 'tomate'],
    })
    expect(s).toHaveLength(1)
    expect(s[0].chave).toBe('touros-burguer|bacon:2,ovo:1|tomate,cebola')
  })

  it('escolhas diferentes do mesmo lanche são linhas diferentes', () => {
    let s = adicionar(SACOLA_VAZIA, { itemId: 'touros-burguer' })
    s = adicionar(s, { itemId: 'touros-burguer', sem: ['cebola'] })
    expect(s).toHaveLength(2)
    expect(quantidadeTotal(s)).toBe(2)
  })

  it('descarta o que não existe ou não cabe', () => {
    expect(adicionar(SACOLA_VAZIA, { itemId: 'pizza' })).toBe(SACOLA_VAZIA)
    expect(adicionar(SACOLA_VAZIA, { itemId: 'touros-burguer' }, 0)).toBe(SACOLA_VAZIA)
    const l = normalizar({
      itemId: 'coca-cola',
      adicionais: { bacon: 1 },
      sem: ['cebola'],
    })
    // Bebida não leva adicional nem "sem".
    expect(l).toMatchObject({ adicionais: {}, sem: [] })
    const b = normalizar({
      itemId: 'touros-5-estrelas',
      adicionais: { bacon: 99, inexistente: 1, ovo: 0, cheddar: -2 },
      sem: ['tomate', 'rucula'],
    })
    // O ★★★★★ não tem tomate para tirar; rúcula sim.
    expect(b).toMatchObject({ adicionais: { bacon: MAXIMO_POR_ADICIONAL }, sem: ['rucula'] })
  })

  it('altera, limita e remove ao chegar a zero, sem mutar a original', () => {
    const s = adicionar(SACOLA_VAZIA, { itemId: 'touros-tudo' }, 999)
    expect(s[0].quantidade).toBe(MAXIMO_POR_LINHA)
    const chave = s[0].chave
    const menos = alterar(s, chave, -3)
    expect(menos[0].quantidade).toBe(MAXIMO_POR_LINHA - 3)
    expect(s[0].quantidade).toBe(MAXIMO_POR_LINHA)
    expect(alterar(s, chave, -100)).toEqual([])
    expect(remover(s, chave)).toEqual([])
    expect(alterar(s, 'outra', 1)).toEqual(s)
  })
})

describe('conta em centavos', () => {
  it('todo lanche × todo adicional × 1 a 5 unidades, sem erro de ponto flutuante', () => {
    for (const item of LANCHES) {
      for (const a of ADICIONAIS) {
        for (let q = 1; q <= MAXIMO_POR_ADICIONAL; q++) {
          const s = adicionar(SACOLA_VAZIA, { itemId: item.id, adicionais: { [a.id]: q } }, 3)
          const unitario = centavos(item.preco) + centavos(a.preco) * q
          expect(precoUnitario(s[0])).toBe(unitario)
          expect(totalCentavos(s)).toBe(unitario * 3)
          expect(Number.isInteger(totalCentavos(s))).toBe(true)
        }
      }
    }
  })

  it('todo item × toda quantidade de 1 a 20', () => {
    for (const item of CARDAPIO) {
      for (let q = 1; q <= MAXIMO_POR_LINHA; q++) {
        const total = totalCentavos(adicionar(SACOLA_VAZIA, { itemId: item.id }, q))
        expect(total).toBe(centavos(item.preco) * q)
        expect(emReais(total)).toMatch(/^R\$ \d{1,3}(\.\d{3})*,\d{2}$/)
      }
    }
  })

  it('a mussarela de 2,90 não vira 8,700000000000001 em três unidades', () => {
    const s = adicionar(SACOLA_VAZIA, { itemId: 'touros-tudo', adicionais: { mussarela: 3 } })
    expect(emReais(subtotal(s[0]))).toBe('R$ 26,70')
  })

  it('formata em reais', () => {
    expect(emReais(1800)).toBe('R$ 18,00')
    expect(emReais(123456)).toBe('R$ 1.234,56')
    expect(precoUnitario({ itemId: 'nada', adicionais: {} })).toBe(0)
  })
})

describe('montagem e detalhe', () => {
  it('cada lanche do cardápio tem montagem com pão embaixo e em cima', () => {
    for (const item of LANCHES) {
      const m = montagemDa({ itemId: item.id, adicionais: {}, sem: [] })
      expect(m[0].camada, item.id).toBe('pao-base')
      expect(m.at(-1)?.camada, item.id).toBe('pao-topo')
      expect(new Set(m.map((c) => c.chave)).size).toBe(m.length)
    }
    expect(montagemDa({ itemId: 'coca-cola', adicionais: {}, sem: [] })).toEqual([])
  })

  it('adicional entra no lugar certo; "sem" sai; o pão continua em cima', () => {
    const m = montagemDa({
      itemId: 'touros-burguer',
      adicionais: { cheddar: 1, blend: 1, bacon: 2 },
      sem: ['cebola'],
    }).map((c) => c.camada)
    expect(m).toEqual([
      'pao-base',
      'alface',
      'tomate',
      'blend',
      'blend',
      'cheddar',
      'bacon',
      'bacon',
      'pao-topo',
    ])
  })

  it('a chave de cada unidade de adicional é estável', () => {
    const um = montar(['pao-base', 'blend', 'pao-topo'], [['bacon', 1]])
    const dois = montar(['pao-base', 'blend', 'pao-topo'], [['bacon', 2]])
    expect(dois.map((c) => c.chave)).toEqual(expect.arrayContaining(um.map((c) => c.chave)))
    expect(alturaDe(dois) - alturaDe(um)).toBe(CAMADAS.bacon.altura)
    // Sem camada de topo, o adicional vai por último.
    expect(montar(['blend'], [['ovo', 1]]).map((c) => c.camada)).toEqual(['blend', 'ovo'])
  })

  it('o detalhe diz o que muda, em minúscula', () => {
    expect(detalhe({ adicionais: { bacon: 2, ovo: 1 }, sem: ['cebola'] })).toBe(
      '+ 2 bacon, + ovo · sem cebola roxa',
    )
    expect(detalhe({ adicionais: {}, sem: [] })).toBe('')
  })
})

describe('pedido para o WhatsApp', () => {
  const sacola = adicionar(
    adicionar(SACOLA_VAZIA, {
      itemId: 'touros-bacon-cheddar',
      adicionais: { bacon: 1 },
      sem: ['cebola'],
    }),
    { itemId: 'coca-cola' },
    2,
  )

  it('valida sacola vazia, nome e endereço, nessa ordem', () => {
    expect(validar(SACOLA_VAZIA, dados)).toEqual({ ok: false, motivo: 'A sacola está vazia.' })
    expect(validar(sacola, { ...dados, nome: '  ' })).toMatchObject({ ok: false })
    expect(validar(sacola, { ...dados, endereco: 'Rua' })).toMatchObject({
      ok: false,
      motivo: expect.stringContaining('endereço'),
    })
    expect(validar(sacola, dados)).toEqual({ ok: true })
  })

  it('a mensagem traz cada lanche, o que muda, o subtotal e a pergunta da taxa', () => {
    const texto = mensagem(sacola, { ...dados, observacao: 'Interfone 12' })
    expect(texto).toBe(
      [
        'Olá, Touro’s! Quero fazer um pedido:',
        '',
        '1x Touro’s Bacon Cheddar — R$ 40,90',
        '   + 1x Bacon (R$ 6,00)',
        '   sem cebola roxa',
        '2x Coca-Cola lata 350 ml — R$ 13,00',
        '',
        'Subtotal: R$ 53,90',
        '',
        'Nome: Ana',
        'Endereço: Rua Halfeld, 120, Centro',
        'Pagamento: Pix',
        'Observação: Interfone 12',
        '',
        'Qual fica a taxa de entrega para o meu endereço?',
      ].join('\n'),
    )
  })

  it('o ★★★★★ vai por extenso, e o troco só aparece no dinheiro', () => {
    const s = adicionar(SACOLA_VAZIA, { itemId: 'touros-5-estrelas', adicionais: { ovo: 2 } }, 2)
    const texto = mensagem(s, { ...dados, pagamento: 'Dinheiro', troco: 'R$ 100' })
    expect(texto).toContain('2x Touro’s 5 Estrelas — R$ 97,80')
    expect(texto).toContain('   + 2x Ovo (R$ 4,00 cada)')
    expect(texto).toContain('Pagamento: Dinheiro (troco para R$ 100)')
    expect(texto).not.toContain('★')
    expect(mensagem(s, { ...dados, troco: 'R$ 100' })).not.toContain('troco')
  })

  it('o link codifica a mensagem para o número da casa', () => {
    const url = linkWhatsApp('Olá & tchau')
    expect(url).toBe('https://wa.me/5532991486422?text=Ol%C3%A1%20%26%20tchau')
  })
})

describe('restaurar a sacola guardada', () => {
  it('aceita a própria sacola de volta', () => {
    const s = adicionar(SACOLA_VAZIA, { itemId: 't-chicken-catupiry', adicionais: { ovo: 1 } }, 2)
    expect(restaurar(JSON.parse(JSON.stringify(s)))).toEqual(s)
  })

  it('ignora lixo sem quebrar', () => {
    expect(restaurar(null)).toBe(SACOLA_VAZIA)
    expect(restaurar({ a: 1 })).toBe(SACOLA_VAZIA)
    expect(
      restaurar([
        null,
        7,
        { itemId: 'pizza', quantidade: 1 },
        { itemId: 'touros-tudo' },
        { itemId: 'touros-tudo', quantidade: 2, adicionais: 'x', sem: 'y' },
      ]),
    ).toEqual([
      expect.objectContaining({ itemId: 'touros-tudo', quantidade: 2, adicionais: {}, sem: [] }),
    ])
  })
})

describe('cardápio', () => {
  it('ids únicos, preço positivo e toda camada conhecida', () => {
    expect(new Set(CARDAPIO.map((i) => i.id)).size).toBe(CARDAPIO.length)
    for (const i of CARDAPIO) {
      expect(i.preco).toBeGreaterThan(0)
      for (const c of [...(i.camadas ?? []), ...(i.removiveis ?? [])])
        expect(CAMADAS[c]).toBeTruthy()
      for (const c of i.removiveis ?? []) expect(i.camadas, `${i.id} sem ${c}`).toContain(c)
    }
    expect(itemPorId('touros-tudo')?.preco).toBe(18)
  })
})
