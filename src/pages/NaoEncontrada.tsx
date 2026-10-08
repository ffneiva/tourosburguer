import { TopoPagina } from '@/components/TopoPagina'
import { CASA, NAO_ENCONTRADA_TEXTO as T } from '@/lib/business'

/**
 * 404 — servido com status 404 de verdade pela borda (S3 + Cloudflare).
 * Em vez de um beco sem saída, os caminhos que quase sempre eram o destino.
 */
export function NaoEncontrada() {
  return (
    <TopoPagina rotulo={T.rotulo} titulo={T.titulo} apoio={T.apoio} className="min-h-[80svh]">
      <div className="mt-10 flex flex-wrap gap-3">
        <a href="/cardapio" className="botao botao-ouro">
          Ver o cardápio
        </a>
        <a href={CASA.ifood} target="_blank" rel="noopener" className="botao botao-linha">
          Pedir no iFood
        </a>
        <a href="/" className="botao botao-linha">
          Início
        </a>
      </div>
    </TopoPagina>
  )
}
