import type { Camada } from './camadas.ts'
import type { Semana } from './hours.ts'

/**
 * TODO o conteúdo do site. Texto, preço, horário, cardápio, FAQ.
 *
 * É daqui que saem, ao mesmo tempo, a página, o JSON-LD que o Google indexa,
 * o llms.txt e a mensagem de WhatsApp da sacola. Mudar um preço é editar uma
 * linha deste arquivo e dar push.
 *
 * REGRA: nada aqui é inventado. Cada dado tem a fonte ao lado. O que precisa
 * de confirmação da casa está marcado `CONFIRMAR` e listado no DEPLOY.md.
 *
 * Fontes:
 *   · cardápio  — a arte oficial da casa (set. 2026), guardada fora do
 *                 repositório em _midia-tourosburguer/cardapio-original.png
 *   · Instagram — @tourosburguer.oficial (bio e legendas dos reels)
 *   · iFood     — a loja "Touro's Burguer - Nossa Senhora Aparecida", Juiz de Fora
 *   · o cliente — WhatsApp e telefone
 */

// ─────────────────────────────────────────────────────────────────────────────
// Endereço do site
// ─────────────────────────────────────────────────────────────────────────────

/** Endereço público do site. Trocar aqui quando a marca tiver domínio próprio. */
export const SITE_URL = 'https://tourosburguer.abramdigital.com.br'

/**
 * Se o Google pode indexar.
 *
 * Desligado enquanto o site é apresentação num subdomínio que não é da marca:
 * indexado, ele competiria na busca com o domínio definitivo. Ao migrar, `true`.
 */
export const INDEXAVEL = false

// ─────────────────────────────────────────────────────────────────────────────
// A casa
// ─────────────────────────────────────────────────────────────────────────────

export const CASA = {
  nome: 'Touro’s Burguer',
  // Fonte: bio do Instagram.
  lema: 'Hambúrgueres que viciam na primeira mordida.',
  cidade: 'Juiz de Fora',
  uf: 'MG',
  regiao: 'Juiz de Fora',
  // Fonte: o cliente — wa.me/5532991486422.
  whatsapp: '5532991486422',
  telefone: '(32) 99148-6422',
  instagram: 'tourosburguer.oficial',
  /** A loja no iFood. */
  ifood:
    'https://www.ifood.com.br/delivery/juiz-de-fora-mg/touros-burguer-nossa-senhora-aparecida/36ed7b0d-ca2a-45c8-b63d-2e6644452193',
  /**
   * Fonte: bio do Instagram — "Seg. à Sáb. • 18h30 às 23h". Domingo fechado.
   * Índice 0 = domingo.
   */
  semana: [
    [],
    [['18:30', '23:00']],
    [['18:30', '23:00']],
    [['18:30', '23:00']],
    [['18:30', '23:00']],
    [['18:30', '23:00']],
    [['18:30', '23:00']],
  ] as Semana,
  /**
   * CONFIRMAR: nenhuma fonte pública diz quais formas de pagamento a casa
   * aceita na entrega. A sacola pergunta a preferência de quem pede, e a casa
   * confirma na conversa — o site não afirma nada.
   */
  pagamentoPreferencias: ['Pix', 'Cartão', 'Dinheiro'],
  /**
   * O iFood chama a loja de "Nossa Senhora Aparecida", que é um bairro de
   * Juiz de Fora. CONFIRMAR o endereço antes de publicá-lo: até lá o site diz
   * só a cidade — é delivery, e a pessoa não precisa do endereço para pedir.
   */
  endereco: null as null | string,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Cardápio
// ─────────────────────────────────────────────────────────────────────────────

export type Categoria = 'artesanais' | 'tradicionais' | 'bebidas'

/** Foto real, tirada de um reel da casa (ver scripts/midia.mjs). */
type Foto = {
  /**
   * Nome do arquivo em assets-src/fotos (sem extensão). A proporção e a cor
   * dominante saem de src/data/fotos.json, gerado por `npm run assets`.
   */
  arquivo: string
  /** O reel de onde o quadro saiu. */
  reel: string
}

export type Item = {
  id: string
  /** Como está no cardápio. */
  nome: string
  /**
   * Como se diz em voz alta — para leitor de tela, mensagem e busca. Só existe
   * quando `nome` tem símbolo (as cinco estrelas).
   */
  nomeFalado?: string
  /** A composição, como a casa escreve no cardápio. */
  descricao: string
  preco: number
  categoria: Categoria
  /** A montagem, de baixo para cima — é o que o desenho em corte mostra. */
  camadas?: readonly Camada[]
  /** O que dá para pedir "sem". Só verdura: tirar bacon é outro lanche. */
  removiveis?: readonly Camada[]
  foto?: Foto
  /** Uma frase nossa, só nos artesanais. */
  chamada?: string
}

export const CATEGORIAS: Record<Categoria, { nome: string; texto: string }> = {
  artesanais: {
    nome: 'Artesanais',
    texto:
      'Pão brioche artesanal e blend bovino de 120 g. Todos acompanham um sachê de molho Touro’s.',
  },
  tradicionais: {
    nome: 'Lanches tradicionais',
    texto: 'O lanche de chapa, com tudo dentro.',
  },
  bebidas: {
    nome: 'Bebidas',
    texto: 'Lata de 350 ml, gelada.',
  },
}

const VERDURAS = ['alface', 'tomate', 'cebola'] as const satisfies readonly Camada[]

/** Reels de onde saíram as fotos — ver _midia-tourosburguer/reels/indice.json. */
const REEL = {
  montandoBaconCatupiry: 'https://www.instagram.com/tourosburguer.oficial/reel/DdfTXXOOfdF/',
  montagemTChicken: 'https://www.instagram.com/tourosburguer.oficial/reel/DcUc8FxOIT_/',
  cheddarEBacon: 'https://www.instagram.com/tourosburguer.oficial/reel/Dco_I7hOUfT/',
  cheeseGiro: 'https://www.instagram.com/tourosburguer.oficial/reel/Dc7M4cuuBWO/',
  tourosTudo: 'https://www.instagram.com/tourosburguer.oficial/reel/Db4G43POfOT/',
  embalando: 'https://www.instagram.com/tourosburguer.oficial/reel/Dcj3mg7uhwc/',
  melhorDeJf: 'https://www.instagram.com/tourosburguer.oficial/reel/DdkPYSPOBXj/',
} as const

/**
 * Os 10 itens do cardápio oficial, na ordem dele. Preço e composição são os
 * da arte; a montagem (`camadas`) segue a dos reels de montagem da casa: pão,
 * alface e tomate, a carne, os queijos, o bacon, a cebola, o pão.
 */
export const CARDAPIO: Item[] = [
  {
    id: 'touros-burguer',
    nome: 'Touro’s Burguer',
    descricao:
      'Pão brioche artesanal selado na manteiga, blend de carne bovina 120 g, tomates especiais, alface americana e cebola roxa com especiarias. Acompanha 1 sachê de molho especial Touro’s.',
    preco: 24.9,
    categoria: 'artesanais',
    camadas: ['pao-base', 'alface', 'tomate', 'blend', 'cebola', 'pao-topo'],
    removiveis: VERDURAS,
    chamada: 'O da casa. Blend, verdura e o pão selado na manteiga.',
  },
  {
    id: 'touros-cheese-burguer',
    nome: 'Touro’s Cheese Burguer',
    descricao:
      'Pão brioche artesanal selado na manteiga, blend de carne bovina 120 g, camada de queijo cheddar derretido, tomates especiais, alface americana e cebola roxa com especiarias. Acompanha 1 sachê de molho Touro’s.',
    preco: 28.9,
    categoria: 'artesanais',
    camadas: ['pao-base', 'alface', 'tomate', 'blend', 'cheddar', 'cebola', 'pao-topo'],
    removiveis: VERDURAS,
    // Identificado pela composição (cheddar, tomate, alface) — CONFIRMAR.
    foto: { arquivo: 'cheese-burguer', reel: REEL.cheeseGiro },
    chamada: 'O clássico, com o cheddar escorrendo.',
  },
  {
    id: 'touros-bacon-cheddar',
    nome: 'Touro’s Bacon Cheddar',
    descricao:
      'Pão brioche artesanal, blend de carne bovina 120 g, camada de queijo cheddar derretido, fatias de bacon selecionados, tomates especiais, alface americana e cebola roxa com especiarias. Acompanha 1 sachê de molho Touro’s.',
    preco: 34.9,
    categoria: 'artesanais',
    camadas: ['pao-base', 'alface', 'tomate', 'blend', 'cheddar', 'bacon', 'cebola', 'pao-topo'],
    removiveis: VERDURAS,
    // Identificado pela composição (cheddar em fatia sobre o blend, bacon) — CONFIRMAR.
    foto: { arquivo: 'bacon-cheddar', reel: REEL.cheddarEBacon },
    chamada: 'Cheddar derretido na chapa e bacon por cima.',
  },
  {
    id: 'touros-bacon-catupiry',
    nome: 'Touro’s Bacon Catupiry',
    descricao:
      'Pão brioche artesanal, blend de carne bovina 120 g, camada de queijo mussarela derretido, catupiry original, fatias de bacon selecionados, tomates especiais, alface americana e cebola roxa com especiarias. Acompanha 1 sachê de molho Touro’s.',
    preco: 41.9,
    categoria: 'artesanais',
    camadas: [
      'pao-base',
      'alface',
      'tomate',
      'blend',
      'mussarela',
      'catupiry',
      'bacon',
      'cebola',
      'pao-topo',
    ],
    removiveis: VERDURAS,
    // Fonte da identificação: a legenda do reel, "Montando um TOURO'S BACON CATUPIRY".
    foto: { arquivo: 'bacon-catupiry', reel: REEL.montandoBaconCatupiry },
    chamada: 'Mussarela, catupiry original e bacon, nessa ordem.',
  },
  {
    id: 'touros-5-estrelas',
    nome: 'Touro’s ★★★★★',
    nomeFalado: 'Touro’s 5 Estrelas',
    descricao:
      'Pão brioche artesanal, blend de carne bovina 120 g, camada de queijo cheddar derretido, pedaços de queijo coalho com fios de mel especial, fatias de bacon selecionados, rúcula fresca e cebola roxa com especiarias. Acompanha 1 sachê de molho Touro’s.',
    preco: 44.9,
    categoria: 'artesanais',
    camadas: [
      'pao-base',
      'rucula',
      'blend',
      'cheddar',
      'coalho',
      'mel',
      'bacon',
      'cebola',
      'pao-topo',
    ],
    removiveis: ['rucula', 'cebola'],
    chamada: 'Queijo coalho com fios de mel sobre o cheddar. O mais completo da casa.',
  },
  {
    id: 't-chicken-catupiry',
    nome: 'T’ Chicken Catupiry',
    descricao:
      'Pão brioche artesanal, 120 g de frango desfiado mergulhado no catupiry original, queijo mussarela derretido, fatias de bacon selecionados, tomates especiais, alface americana e cebola roxa com especiarias. Acompanha 1 sachê de molho Touro’s.',
    preco: 41.9,
    categoria: 'artesanais',
    camadas: [
      'pao-base',
      'alface',
      'tomate',
      'frango',
      'catupiry',
      'mussarela',
      'bacon',
      'cebola',
      'pao-topo',
    ],
    removiveis: VERDURAS,
    // Fonte da identificação: a legenda do reel, "Acompanhe a montagem do T Chicken Catupiry".
    foto: { arquivo: 't-chicken', reel: REEL.montagemTChicken },
    chamada: 'O de frango: desfiado e mergulhado no catupiry.',
  },
  {
    id: 'touros-tudo',
    nome: 'Touro’s Tudo',
    descricao:
      'Pão brioche, bife de hambúrguer 60 g, bacon, mussarela, ovo, batata palha, alface, tomate e cebola roxa. Acompanha 1 sachê de molho Touro’s.',
    preco: 18,
    categoria: 'tradicionais',
    camadas: [
      'pao-base',
      'alface',
      'tomate',
      'bife',
      'mussarela',
      'ovo',
      'bacon',
      'batata-palha',
      'cebola',
      'pao-topo',
    ],
    removiveis: [...VERDURAS, 'batata-palha'],
    // Fonte: o reel "Touro's tudo por apenas $18,00?".
    foto: { arquivo: 'touros-tudo', reel: REEL.tourosTudo },
  },
  {
    id: 'coca-cola',
    nome: 'Coca-Cola lata 350 ml',
    descricao: 'Lata de 350 ml.',
    preco: 6.5,
    categoria: 'bebidas',
  },
  {
    id: 'coca-cola-zero',
    nome: 'Coca-Cola Zero lata 350 ml',
    descricao: 'Lata de 350 ml.',
    preco: 6.5,
    categoria: 'bebidas',
  },
  {
    id: 'guarana-antarctica',
    nome: 'Guaraná Antarctica lata 350 ml',
    descricao: 'Lata de 350 ml.',
    preco: 6.5,
    categoria: 'bebidas',
  },
]

export type Adicional = {
  id: string
  nome: string
  preco: number
  /** A camada que entra no desenho quando o adicional é pedido. */
  camada: Camada
}

/** Fonte: o cardápio oficial, bloco "Adicionais" — na ordem dele. */
export const ADICIONAIS: Adicional[] = [
  { id: 'bacon', nome: 'Bacon', preco: 6, camada: 'bacon' },
  { id: 'barbecue', nome: 'Barbecue', preco: 3, camada: 'barbecue' },
  { id: 'blend', nome: 'Blend artesanal 120 g', preco: 13, camada: 'blend' },
  { id: 'catupiry', nome: 'Catupiry Original', preco: 8, camada: 'catupiry' },
  { id: 'cheddar', nome: 'Cheddar derretido', preco: 4, camada: 'cheddar' },
  { id: 'frango', nome: 'Frango desfiado 120 g', preco: 12, camada: 'frango' },
  { id: 'mussarela', nome: 'Mussarela', preco: 2.9, camada: 'mussarela' },
  { id: 'ovo', nome: 'Ovo', preco: 2, camada: 'ovo' },
  { id: 'coalho', nome: 'Queijo Coalho', preco: 9, camada: 'coalho' },
]

export const itemPorId = (id: string) => CARDAPIO.find((i) => i.id === id)
export const adicionalPorId = (id: string) => ADICIONAIS.find((a) => a.id === id)
export const ehLanche = (i: Item) => i.categoria !== 'bebidas'
export const ARTESANAIS = CARDAPIO.filter((i) => i.categoria === 'artesanais')
export const nomeFalado = (i: Item) => i.nomeFalado ?? i.nome

/** O que corre na faixa (marquise) — ingredientes do próprio cardápio. */
export const FAIXA = [
  'Blend artesanal 120 g',
  'Pão brioche selado na manteiga',
  'Cheddar derretido',
  'Bacon selecionado',
  'Catupiry original',
  'Queijo coalho com mel',
  'Cebola roxa com especiarias',
  'Molho Touro’s',
] as const

/**
 * A montagem mostrada em 3D na "Anatomia" — o Touro's Bacon Cheddar, com as
 * palavras do cardápio para cada camada (de cima para baixo, como se lê).
 */
export const ANATOMIA = {
  item: 'touros-bacon-cheddar',
  camadas: [
    { camada: 'pao-topo', nome: 'Pão brioche artesanal', nota: 'o de cima, dourado' },
    { camada: 'cebola', nome: 'Cebola roxa', nota: 'com especiarias' },
    { camada: 'bacon', nome: 'Bacon', nota: 'fatias selecionadas' },
    { camada: 'cheddar', nome: 'Cheddar', nota: 'derretido sobre a carne' },
    { camada: 'blend', nome: 'Blend bovino', nota: '120 g, artesanal' },
    { camada: 'tomate', nome: 'Tomates', nota: 'especiais' },
    { camada: 'alface', nome: 'Alface americana', nota: '' },
    { camada: 'pao-base', nome: 'Pão brioche', nota: 'a base' },
  ],
} as const satisfies {
  item: string
  camadas: readonly { camada: Camada; nome: string; nota: string }[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Vídeos da chapa — trechos dos reels da casa (ver scripts/midia.mjs)
// ─────────────────────────────────────────────────────────────────────────────

export const VIDEOS = [
  {
    arquivo: 'cheddar',
    titulo: 'O cheddar vai direto na chapa',
    texto: 'Fatia por fatia, sobre o blend ainda no fogo.',
    reel: REEL.cheddarEBacon,
  },
  {
    arquivo: 'montagem',
    titulo: 'Montando um Bacon Catupiry',
    texto: 'Pão, verdura, carne, mussarela, catupiry, bacon. Em ordem.',
    reel: REEL.montandoBaconCatupiry,
  },
  {
    arquivo: 'giro',
    titulo: 'Pronto para sair',
    texto: 'Pão brioche brilhando, cheddar e tomate.',
    reel: REEL.cheeseGiro,
  },
  {
    arquivo: 'chapa',
    titulo: 'Da chapa para o lanche',
    texto: 'Cebola roxa com barbecue na chapa, e o bacon por cima.',
    reel: REEL.montagemTChicken,
  },
  {
    arquivo: 'embalando',
    titulo: 'Embrulhado na hora',
    texto: 'No papel da casa, direto para a sacola.',
    reel: REEL.embalando,
  },
] as const

// ─────────────────────────────────────────────────────────────────────────────
// Texto das seções
// ─────────────────────────────────────────────────────────────────────────────

export const TEXTO = {
  heroi: {
    sobretitulo: 'Hamburgueria artesanal · Juiz de Fora',
    // A frase é a da bio do Instagram da casa.
    titulo: ['Hambúrgueres', 'que viciam na', 'primeira mordida.'],
    apoio:
      'Blend artesanal de 120 g, pão brioche e ingredientes selecionados. De segunda a sábado, das 18h30 às 23h, em Juiz de Fora.',
  },
  anatomia: {
    rotulo: 'Anatomia',
    titulo: 'Camada por camada.',
    apoio: 'O Touro’s Bacon Cheddar, aberto. Oito camadas, do pão ao pão.',
  },
  naChapa: {
    rotulo: 'Na chapa',
    titulo: 'Feito na hora, e filmado.',
    apoio:
      'Os vídeos são da própria casa, tirados do Instagram. O que você vê é o que sai da chapa.',
  },
  artesanais: {
    rotulo: 'Os artesanais',
    titulo: 'Seis lanches, um touro.',
    apoio:
      'Escolha um para ver o que tem dentro. Todos com pão brioche artesanal e blend de 120 g — menos o T’ Chicken, que é de frango.',
  },
  doSeuJeito: {
    rotulo: 'Do seu jeito',
    titulo: 'Mais bacon? Mais queijo? Pode.',
    apoio:
      'Qualquer lanche aceita adicionais. No cardápio do site você escolhe, vê o lanche crescer e a soma muda na hora.',
  },
  comoPedir: [
    {
      titulo: 'Escolha',
      texto: 'Monte o pedido aqui, com adicionais e a soma na hora — ou abra a loja no iFood.',
    },
    {
      titulo: 'Peça',
      texto:
        'Pelo iFood, que calcula a entrega pelo seu endereço, ou pelo WhatsApp, com a lista pronta.',
    },
    {
      titulo: 'Morda',
      texto: 'Sai da chapa, vai embrulhado no papel da casa e chega em Juiz de Fora.',
    },
  ],
  fecho: {
    // "Deu vontade?" é a legenda de um reel da casa.
    titulo: 'Deu vontade?',
    texto: 'De segunda a sábado, das 18h30 às 23h.',
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Perguntas
// ─────────────────────────────────────────────────────────────────────────────

export const FAQ = [
  {
    pergunta: 'Qual o horário?',
    resposta: 'De segunda a sábado, das 18h30 às 23h. Domingo a chapa descansa.',
  },
  {
    pergunta: 'Onde vocês entregam?',
    resposta:
      'Em Juiz de Fora. A taxa depende do endereço: no iFood ela aparece antes de você fechar o pedido; pelo WhatsApp, a casa informa na conversa.',
  },
  {
    pergunta: 'Posso pedir pelo WhatsApp?',
    resposta:
      'Pode. Monte o pedido no cardápio do site e toque em "Enviar pelo WhatsApp": a lista chega pronta, com adicionais, o que tirar e a soma, e a casa confirma a taxa de entrega para o seu endereço.',
  },
  {
    pergunta: 'Dá para colocar adicional ou tirar ingrediente?',
    resposta:
      'Dá. Bacon, barbecue, blend, catupiry, cheddar, frango, mussarela, ovo e queijo coalho entram em qualquer lanche, e alface, tomate e cebola saem se você pedir. No cardápio do site o preço já soma.',
  },
  {
    pergunta: 'O que vem junto?',
    resposta: 'Todo lanche acompanha um sachê de molho Touro’s.',
  },
  {
    pergunta: 'Os preços são os mesmos do iFood?',
    resposta:
      'Os preços deste site são os do cardápio da casa, para pedido pelo WhatsApp. No iFood valem os preços e as taxas mostrados no app.',
  },
] as const

// ─────────────────────────────────────────────────────────────────────────────
// Páginas de apoio
// ─────────────────────────────────────────────────────────────────────────────

export const NAO_ENCONTRADA_TEXTO = {
  rotulo: 'Página não encontrada',
  titulo: 'Esse lanche não está no cardápio.',
  apoio: 'O endereço pode ter mudado ou ter sido digitado com um erro.',
} as const

/**
 * A política de privacidade — cada bloco corresponde a uma coisa que o código
 * faz de fato (ver lib/analytics, lib/observability, pages/Cardapio).
 */
export const PRIVACIDADE = [
  {
    titulo: 'O que este site guarda',
    texto:
      'Nada no servidor. O site é um conjunto de arquivos estáticos: não tem cadastro, login, banco de dados nem formulário que envie dados para nós. No seu aparelho fica só a sacola montada no cardápio, até você esvaziá-la ou limpar os dados do navegador, e a marca de que você já viu a abertura, que some ao fechar a aba. Nome e endereço digitados na sacola não são guardados.',
  },
  {
    titulo: 'Pedido pelo WhatsApp',
    texto:
      'A sacola monta uma mensagem no seu navegador e abre o WhatsApp com ela pronta. Nada é enviado antes de você tocar em "enviar" no próprio WhatsApp; a partir daí, a conversa é com a casa, pelas regras do WhatsApp.',
  },
  {
    titulo: 'Medição',
    texto:
      'Quando a medição de audiência estiver ligada, o site usa o Google Analytics 4, que não armazena endereços IP, para saber quantas pessoas visitam cada página e tocam em "pedir", e para medir a velocidade de carregamento no seu aparelho. Não há anúncio personalizado nem venda de dados.',
  },
  {
    titulo: 'Erros técnicos',
    texto:
      'Quando ligado, o Sentry registra erros de funcionamento do site (qual página, qual navegador, qual linha do código falhou) para que sejam corrigidos. Não grava a tela nem o que você digita.',
  },
  {
    titulo: 'iFood e Instagram',
    texto:
      'Os botões "Pedir no iFood" levam à loja da casa no iFood, e os vídeos têm link para o Instagram. Lá valem as políticas de privacidade dessas plataformas.',
  },
  {
    titulo: 'Seus direitos',
    texto: `Pela LGPD, você pode pedir informação sobre dados seus que estejam com o ${CASA.nome}. Como o site não armazena dados pessoais, o pedido vai para a casa, pelo WhatsApp ${CASA.telefone}.`,
  },
] as const
