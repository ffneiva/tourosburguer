import { useEffect, useState } from 'react'
import { useReducedMotion } from '@/hooks/useMediaQuery'
import { Selo } from './Logo'

/**
 * A abertura: o selo acende.
 *
 * O selo da casa aparece no escuro, um reflexo passa pelo metal, e a cortina
 * preta sobe revelando a página. É o letreiro da porta ligando.
 *
 * Três regras:
 *
 * · **Só na home e só uma vez por sessão.** Quem chega por um link de
 *   /cardapio vindo do Instagram quer o cardápio, não uma abertura.
 * · **Curta.** ~1,8 s do primeiro quadro à página livre. Não espera fonte nem
 *   3D: a cortina cobre a troca de fonte, e a cena chega quando chegar.
 * · **Nunca prende a página.** Com movimento reduzido ela não existe; e se a
 *   animação não disparar por qualquer motivo, um temporizador libera tudo.
 */
const CHAVE = 'touros:abertura'

function jaViu(): boolean {
  try {
    return sessionStorage.getItem(CHAVE) === '1'
  } catch {
    // Armazenamento bloqueado (aba privada em alguns navegadores): mostrar de
    // novo é o erro menos grave.
    return false
  }
}

function marcarComoVista() {
  try {
    sessionStorage.setItem(CHAVE, '1')
  } catch {
    /* idem */
  }
}

export function devePreCarregar(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  return !jaViu()
}

type Props = { aoTerminar: () => void }

export function Preloader({ aoTerminar }: Props) {
  const reduzido = useReducedMotion()
  const [fase, setFase] = useState<'selo' | 'saindo' | 'fim'>('selo')

  useEffect(() => {
    if (reduzido) {
      setFase('fim')
      aoTerminar()
      return
    }
    marcarComoVista()
    const sair = window.setTimeout(() => setFase('saindo'), 1050)
    // O herói começa a entrar enquanto a cortina ainda sobe: a página "já
    // está lá atrás" quando ela se abre, em vez de aparecer depois.
    const liberar = window.setTimeout(aoTerminar, 1250)
    const fim = window.setTimeout(() => setFase('fim'), 2100)
    return () => {
      window.clearTimeout(sair)
      window.clearTimeout(liberar)
      window.clearTimeout(fim)
    }
  }, [reduzido, aoTerminar])

  if (fase === 'fim') return null

  return (
    <div
      aria-hidden
      className={`grao fixed inset-0 z-[500] grid place-items-center overflow-hidden bg-noite ${fase === 'saindo' ? 'abertura-saindo' : ''}`}
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(40% 40% at 50% 50%, rgba(214,166,80,0.16), transparent 70%)',
        }}
      />
      <div className="abertura-selo relative w-40 sm:w-48">
        <Selo />
        {/* O reflexo que passa pelo metal. */}
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[50%]">
          <span
            className="absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
            style={{ animation: 'reflexo 1.3s var(--ease-corte) 250ms both' }}
          />
        </span>
      </div>
    </div>
  )
}
