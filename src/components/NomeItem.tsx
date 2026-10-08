import { type Item, nomeFalado } from '@/lib/business'
import { cn } from '@/lib/utils'
import { Estrelas } from './Logo'

/**
 * O nome de um item como a casa escreve — com as cinco estrelas do selo no
 * "Touro's ★★★★★", desenhadas em vetor (o ★ não existe na fonte do título, e
 * em fonte de sistema ele sai de outro tamanho). O leitor de tela ouve o nome
 * por extenso.
 */
export function NomeItem({ item, className }: { item: Item; className?: string }) {
  if (!item.nome.includes('★')) return <span className={className}>{item.nome}</span>
  const texto = item.nome.replace(/★+/g, '').trim()
  return (
    <span className={cn('inline-flex items-baseline gap-[0.35em]', className)}>
      <span className="sr-only">{nomeFalado(item)}</span>
      <span aria-hidden>{texto}</span>
      <Estrelas metal={false} className="inline-block h-[0.62em] w-auto self-center" />
    </span>
  )
}
