# AGENTS.md

Instruções para qualquer agente de IA — de qualquer modelo — que for trabalhar
neste repositório. Também servem para humanos; são as mesmas regras.

> Este arquivo é a fonte. `CLAUDE.md` apenas aponta para cá.

---

## 1. O fluxo é Issue → branch → PR → merge

**Nenhuma mudança entra na `main` direto.** Vale para correção de uma linha,
troca de preço e atualização de dependência.

```
1. Abra uma Issue (templates em .github/ISSUE_TEMPLATE).
2. Branch a partir da main:  fix/12-preco-cortado · content/13-preco-bacon-cheddar
3. Commits em Conventional Commits (seção 2).
4. PR mencionando a Issue:   "Closes #12"
5. CI verde. Squash merge.
```

Um PR, um assunto. Se a descrição precisa de "e também", são dois PRs.

## 2. Commits

`tipo(escopo): descrição no imperativo, minúscula, sem ponto final`

**Tipos:** `feat`, `fix`, `content`, `refactor`, `perf`, `style`, `test`,
`docs`, `build`, `ci`, `chore`, `revert`.

**Escopos:** `heroi`, `secoes`, `cardapio`, `pedido`, `midia`, `seo`, `marca`,
`3d`, `a11y`, `infra`, `ci`, `deps`, `docs`, `testes`.

```
content(cardapio): preço do Touro’s Bacon Cheddar conforme o cardápio novo
fix(pedido): adicional em bebida entrava na conta
perf(3d): alface com 128 segmentos em vez de 224 no celular
```

O corpo do commit explica o **porquê**. O diff já diz o quê.

## 3. Onde as coisas moram

```
src/lib/business.ts   ← TODO o conteúdo: casa, horário, cardápio, adicionais, FAQ
src/lib/camadas.ts    ← as camadas de um lanche (corte 2D, cena 3D e sacola)
src/lib/pedido.ts     ← a sacola: adicionais, "sem", conta em centavos, mensagem
src/lib/hours.ts      ← "aberto agora", no fuso de Brasília
src/lib/marca.ts      ← o selo da casa em vetor (vetorizado do logo)
src/lib/routes.ts     ← rotas e o <head> de cada uma
src/lib/seo.ts        ← JSON-LD e llms.txt, derivados de business.ts
src/scene/hamburguer.ts ← o lanche 3D, three.js puro
src/components/Corte.tsx ← o lanche desenhado em corte, camada por camada
src/sections/         ← seções da home, na ordem em que aparecem
src/pages/            ← as rotas que não são a home
scripts/              ← fontes, fotos, vídeos (dos reels), marca, smoke do dev
tests/unit/           ← Vitest — lógica pura
tests/e2e/            ← Playwright — contra o build de produção
```

**Regra dura:** texto que o visitante lê não fica em componente. Fica em
`business.ts`.

## 4. Regras de conteúdo

- **Nada inventado.** Nenhum depoimento, nenhuma nota, nenhum "+mil pedidos".
  A nota do iFood é do iFood e não vai para o site nem para o JSON-LD.
- **A fonte do cardápio é a arte oficial da casa.** Preço que mudou lá muda
  aqui no mesmo dia. O iFood pode ter preço diferente (a taxa da plataforma) —
  o site diz isso no FAQ e não tenta igualar.
- **Foto é foto real.** Toda foto sai de um reel da casa (`scripts/midia.mjs`
  diz de qual, em que segundo). Lanche sem foto aparece com o desenho em
  corte — **nunca** com a foto de outro lanche.
- **O desenho em corte é a montagem do cardápio.** Mudou a composição de um
  lanche, muda `camadas` em `business.ts`; o desenho, a cena e a mensagem
  acompanham.
- **Nenhum prazo de entrega prometido.** Quem informa o tempo é a casa.
- **O que não foi confirmado com a casa está marcado `CONFIRMAR`** em
  `business.ts` e listado no DEPLOY.md.
- **A marca é o selo da casa** (touro, dourado sobre preto). O dourado vem do
  vetor em `marca.ts`; não redesenhe o touro.

## 5. Movimento e acessibilidade

1. **Estado escondido nunca sobrevive a uma falha.** Animação de entrada só
   esconde com a classe de "armado" presente (`heroi-armado`). Sem JS, tudo
   visível.
2. **`prefers-reduced-motion` desliga o que não é essencial:** abertura, cursor,
   cena 3D (a anatomia vira o desenho em corte parado), vídeos (fica o pôster),
   scroll suave.
3. **Anime `transform` e `opacity`.** Altura: `grid-template-rows: 0fr → 1fr`.

Um `<h1>` por página, todo botão com nome acessível, foco visível, região viva
anunciando troca de rota e item adicionado à sacola. O painel "Do meu jeito" é
diálogo modal de verdade (foco preso, Esc fecha, foco volta).

## 6. Desempenho

O CI falha se o caminho crítico passar de **170 kB comprimidos**.

- Ícone: desenhe o SVG. Nada de biblioteca de ícones.
- Data/hora: `Intl`. Nada de date-fns/dayjs/moment.
- Animação: CSS primeiro; `motion` só para animação de **saída**.
- Vídeo: sem `src` até chegar perto da tela, pausado fora dela.

Carregado sob demanda, e precisa continuar sendo: `three`, `lenis`,
`web-vitals`, `@sentry/react`, a página do cardápio, os vídeos.

## 7. Antes de abrir o PR

```bash
npm run lint && npx tsc -b && npm run test && npm run knip
npm run check:dev && npm run build && npm run e2e
```

## 8. Publicação

Arquivos estáticos numa CDN (S3 website + Cloudflare). **Custo operacional próximo de
zero é restrição do projeto.** Nada de servidor, banco ou mensalidade.

**Nunca comite chave, ARN, ID de conta ou nome de bucket** — o repositório é
público. O `deploy.yml` lê tudo de `vars.*`.

## 9. Estilo de código

- **Português** em nomes e comentários.
- Comentário explica o **porquê**.
- Sem `any`, sem `console.log`.
- Aspas simples, sem ponto e vírgula, vírgula final, 100 colunas. O Biome cuida.
