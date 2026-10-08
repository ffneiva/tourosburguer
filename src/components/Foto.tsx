import { useState } from 'react'
import MANIFESTO from '@/data/fotos.json'
import { cn } from '@/lib/utils'

type Registro = { cor: string; proporcao: number }
const FOTOS = MANIFESTO as Record<string, Registro>

/**
 * Foto do site: AVIF com WebP de reserva, 360 px e 720 px. Enquanto não
 * chega, o quadro mostra a cor dominante da própria foto, e a proporção vem
 * do manifesto (src/data/fotos.json) — o espaço é reservado antes de a imagem
 * existir, e a lista do cardápio não pula a cada foto que carrega.
 */
type Props = {
  nome: string
  alt: string
  sizes?: string
  className?: string
  prioridade?: boolean
  /** Força uma proporção de quadro (a foto é recortada com `object-cover`). */
  proporcao?: number
}

export function Foto({
  nome,
  alt,
  sizes = '(min-width: 1024px) 360px, 50vw',
  className,
  prioridade = false,
  proporcao,
}: Props) {
  const [carregou, setCarregou] = useState(false)
  const registro = FOTOS[nome]
  const base = `/images/fotos/${nome}`
  const srcset = (ext: string) => `${base}-360.${ext} 360w, ${base}-720.${ext} 720w`
  const razao = proporcao ?? registro?.proporcao ?? 1

  return (
    <picture
      className={cn('block overflow-hidden', className)}
      style={{
        backgroundColor: registro?.cor ?? 'color-mix(in oklab, currentColor 8%, transparent)',
        aspectRatio: String(razao),
      }}
    >
      <source type="image/avif" srcSet={srcset('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcset('webp')} sizes={sizes} />
      <img
        src={`${base}-360.webp`}
        alt={alt}
        width={360}
        height={Math.round(360 / razao)}
        loading={prioridade ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setCarregou(true)}
        className={cn(
          'h-full w-full object-cover transition-[opacity,transform] duration-700 ease-[var(--ease-touro)]',
          carregou ? 'opacity-100' : 'opacity-0',
        )}
      />
    </picture>
  )
}
