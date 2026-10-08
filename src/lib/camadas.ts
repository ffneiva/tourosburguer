/**
 * As camadas de um lanche — o vocabulário comum ao desenho em corte
 * (components/Corte), à cena 3D (scene/hamburguer) e à sacola (lib/pedido).
 *
 * Cada lanche do cardápio é uma lista delas, de baixo para cima. Pedir um
 * adicional acrescenta a camada dele; pedir "sem" tira uma. O desenho é a
 * soma exata do que vai na mensagem de WhatsApp — se as duas coisas saíssem
 * de lugares diferentes, um dia o desenho mostraria um bacon que a cozinha
 * não recebeu.
 */
export type Camada =
  | 'pao-base'
  | 'pao-topo'
  | 'blend'
  | 'bife'
  | 'frango'
  | 'cheddar'
  | 'mussarela'
  | 'catupiry'
  | 'coalho'
  | 'mel'
  | 'bacon'
  | 'ovo'
  | 'alface'
  | 'rucula'
  | 'tomate'
  | 'cebola'
  | 'batata-palha'
  | 'barbecue'

type Info = {
  /** Como aparece em "sem …" e na legenda do desenho. */
  nome: string
  /** Altura no desenho em corte (unidades do viewBox de 240 de largura). */
  altura: number
  /** Cor principal — a mesma no corte e na cena 3D. */
  cor: string
}

export const CAMADAS: Record<Camada, Info> = {
  'pao-base': { nome: 'pão', altura: 26, cor: '#e9a51f' },
  'pao-topo': { nome: 'pão', altura: 64, cor: '#e39a1a' },
  blend: { nome: 'blend', altura: 30, cor: '#5a3322' },
  bife: { nome: 'bife', altura: 17, cor: '#6a3d27' },
  frango: { nome: 'frango desfiado', altura: 26, cor: '#e7c089' },
  cheddar: { nome: 'cheddar', altura: 9, cor: '#f39a1b' },
  mussarela: { nome: 'mussarela', altura: 9, cor: '#f3e2b0' },
  catupiry: { nome: 'catupiry', altura: 15, cor: '#f7f0df' },
  coalho: { nome: 'queijo coalho', altura: 16, cor: '#f1d9a0' },
  mel: { nome: 'mel', altura: 4, cor: '#d88a12' },
  bacon: { nome: 'bacon', altura: 13, cor: '#b5412f' },
  ovo: { nome: 'ovo', altura: 12, cor: '#fbf6ea' },
  alface: { nome: 'alface', altura: 13, cor: '#7cb342' },
  rucula: { nome: 'rúcula', altura: 9, cor: '#4f8a2b' },
  tomate: { nome: 'tomate', altura: 13, cor: '#d9362b' },
  cebola: { nome: 'cebola roxa', altura: 10, cor: '#8e3b76' },
  'batata-palha': { nome: 'batata palha', altura: 12, cor: '#f2c14e' },
  barbecue: { nome: 'barbecue', altura: 5, cor: '#5b1d12' },
}

/** Uma camada numa montagem, com identidade estável para a animação. */
export type CamadaMontada = { chave: string; camada: Camada }

/**
 * Onde um adicional entra na montagem.
 *
 * Queijo vai sobre a carne, molho sobre o que houver de proteína, ovo e bacon
 * por cima dos queijos. Na prática: logo abaixo da primeira camada "de cima"
 * que o lanche tem (cebola, rúcula, batata palha ou o pão). Um blend a mais
 * vai sobre o blend que já existe — é assim que se faz um duplo.
 */
const TOPO: readonly Camada[] = ['cebola', 'batata-palha', 'pao-topo']

function posicaoDoAdicional(lista: readonly Camada[], camada: Camada): number {
  if (camada === 'blend' || camada === 'frango') {
    const carne = lista.findLastIndex((c) => c === 'blend' || c === 'bife' || c === 'frango')
    if (carne >= 0) return carne + 1
  }
  const topo = lista.findIndex((c) => TOPO.includes(c))
  return topo >= 0 ? topo : lista.length
}

/**
 * A montagem final de um lanche: a base do cardápio, menos o que foi tirado,
 * mais os adicionais (cada unidade, uma camada).
 *
 * As chaves são estáveis: a terceira fatia de bacon é sempre `bacon+3`, então
 * ao pedir mais uma o desenho anima só a que entrou.
 */
export function montar(
  base: readonly Camada[],
  adicionais: ReadonlyArray<readonly [Camada, number]> = [],
  sem: readonly Camada[] = [],
): CamadaMontada[] {
  // A chave é a ocorrência ("o segundo blend"), e não a posição: trocando de
  // lanche, o pão e a carne continuam sendo os mesmos nós, e só deslizam.
  const vistas = new Map<Camada, number>()
  const lista: CamadaMontada[] = base
    .filter((c) => !sem.includes(c))
    .map((camada) => {
      const n = (vistas.get(camada) ?? 0) + 1
      vistas.set(camada, n)
      return { chave: `${camada}#${n}`, camada }
    })

  for (const [camada, quantidade] of adicionais) {
    for (let n = 1; n <= quantidade; n++) {
      const i = posicaoDoAdicional(
        lista.map((x) => x.camada),
        camada,
      )
      lista.splice(i, 0, { chave: `${camada}+${n}`, camada })
    }
  }
  return lista
}

/** Altura total da montagem no desenho em corte. */
export function alturaDe(montagem: readonly CamadaMontada[]): number {
  return montagem.reduce((soma, c) => soma + CAMADAS[c.camada].altura, 0)
}
