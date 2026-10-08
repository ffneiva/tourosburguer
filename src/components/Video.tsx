import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { Foto } from './Foto'

/**
 * Um trecho de reel da casa, em laço e sem som.
 *
 * Três regras, porque vídeo é o que mais pesa numa página de celular:
 *
 * · **Nada é baixado antes de o cartão chegar perto da tela.** Até lá, o
 *   `<video>` não tem `src` e o que aparece é o pôster (uma foto de ~20 kB).
 * · **Só toca o que está visível.** Fora da tela, pausa — cinco vídeos
 *   decodificando ao mesmo tempo esquentam o celular e gastam bateria.
 * · **Movimento reduzido: não toca.** Fica o pôster, que é o primeiro quadro.
 */
type Props = {
  nome: string
  alt: string
  className?: string
}

export function Video({ nome, alt, className }: Props) {
  const ref = useRef<HTMLVideoElement>(null)
  const caixa = useRef<HTMLDivElement>(null)
  const reduzido = useReducedMotion()
  const [perto, setPerto] = useState(false)
  const [tocando, setTocando] = useState(false)

  useEffect(() => {
    const el = caixa.current
    if (!el || reduzido) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setPerto(true)
        const video = ref.current
        if (!video) return
        if (e.intersectionRatio > 0.35) video.play().catch(() => {})
        else video.pause()
      },
      { rootMargin: '300px 0px', threshold: [0, 0.35, 0.6] },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduzido])

  return (
    <div ref={caixa} className={cn('relative overflow-hidden', className)}>
      <Foto
        nome={`video-${nome}`}
        alt={alt}
        sizes="(min-width: 1024px) 300px, 70vw"
        className="absolute inset-0 h-full w-full"
      />
      {!reduzido && (
        <video
          ref={ref}
          src={perto ? `/videos/${nome}.mp4` : undefined}
          muted
          loop
          playsInline
          // Com `src` só perto da tela, o autoplay dispara na hora certa; o
          // observador pausa quando sai e retoma quando volta.
          autoPlay
          preload="none"
          aria-hidden
          onPlaying={() => setTocando(true)}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
            tocando ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}
    </div>
  )
}
