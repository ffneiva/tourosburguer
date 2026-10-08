import { useEffect } from 'react'
import { prefersReducedMotion } from '@/lib/utils'

/**
 * Scroll suave, com a biblioteca carregada sob demanda.
 *
 * Duas decisões de carregamento:
 *
 * · **Lenis por import dinâmico.** São ~5 kB comprimidos que só fazem
 *   diferença em desktop com roda de mouse. Quem abre no celular — a maioria
 *   de quem chega por Instagram — e quem pediu movimento reduzido nunca baixam
 *   esse código. Como a decisão depende de `matchMedia`, ela só pode ser
 *   tomada no navegador, que é onde o import dinâmico acontece.
 *
 * · **Sem GSAP.** A anatomia do lanche é `position: sticky` e a posição da
 *   rolagem, lida a cada evento de scroll — o Lenis rola a janela de verdade,
 *   então quem escuta `scroll` recebe a posição suavizada sem ligação nenhuma.
 */

export function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return
    // Sem roda de mouse não há o que suavizar: o scroll por toque já tem
    // inércia nativa, e sequestrá-lo só piora.
    if (!window.matchMedia('(pointer: fine)').matches) return

    let cancelado = false
    let destruir: (() => void) | undefined

    import('lenis').then(({ default: LenisCtor }) => {
      if (cancelado) return

      const lenis = new LenisCtor({
        duration: 1.05,
        easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
        smoothWheel: true,
        syncTouch: false,
      })

      let frame = 0
      const raf = (time: number) => {
        lenis.raf(time)
        frame = requestAnimationFrame(raf)
      }
      frame = requestAnimationFrame(raf)

      destruir = () => {
        cancelAnimationFrame(frame)
        lenis.destroy()
      }
    })

    return () => {
      cancelado = true
      destruir?.()
    }
  }, [])
}

/** Rola até um id da página respeitando o Lenis (que ignora o hash nativo). */
export function scrollToSection(id: string) {
  const alvo = document.getElementById(id)
  if (!alvo) return
  alvo.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
}
