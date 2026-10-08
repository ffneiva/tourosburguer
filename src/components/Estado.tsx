import { useEffect, useState } from 'react'
import { CASA } from '@/lib/business'
import { type Estado, estadoDa } from '@/lib/hours'
import { cn } from '@/lib/utils'

/**
 * A casa está aberta agora? Recalculado a cada 30 s.
 *
 * Uma página aberta às 22h55 não pode continuar dizendo "Aberto" depois das
 * 23h — é exatamente a hora em que alguém decide pedir por impulso.
 */
export function useEstado(): Estado {
  const [estado, setEstado] = useState(() => estadoDa(CASA.semana))
  useEffect(() => {
    const id = window.setInterval(() => setEstado(estadoDa(CASA.semana)), 30_000)
    return () => window.clearInterval(id)
  }, [])
  return estado
}

/**
 * O ponto de "chapa acesa": verde e pulsando quando aberto, cinza quando não.
 * Perto de fechar (menos de 30 min), o rótulo avisa.
 */
export function SeloEstado({ className }: { className?: string }) {
  const estado = useEstado()
  const fechando = estado.aberto && (estado.fechaEm ?? 99) <= 30
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'relative h-2 w-2 shrink-0 rounded-full',
          estado.aberto ? 'pulso bg-alface' : 'bg-cinza',
        )}
      />
      <span>{fechando ? `Aberto · fecha em ${estado.fechaEm} min` : estado.rotulo}</span>
    </span>
  )
}
