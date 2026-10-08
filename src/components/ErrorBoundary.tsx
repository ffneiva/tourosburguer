import { Component, type ErrorInfo, type ReactNode } from 'react'
import { CASA } from '@/lib/business'

/**
 * Rede de segurança contra erro de render.
 *
 * Sem isto, uma exceção em qualquer componente derruba a árvore inteira e o
 * visitante fica com uma tela preta — sem cardápio, sem WhatsApp, sem saída.
 * Numa sexta à noite, isso é um pedido a menos.
 *
 * O fallback é deliberadamente pobre em recursos: HTML e estilo inline, sem
 * depender de nenhum componente do site. Se o que quebrou foi o sistema de
 * design, um fallback bonito quebraria junto.
 */
type Props = { children: ReactNode }
type State = { erro: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { erro: null }

  static getDerivedStateFromError(erro: Error): State {
    return { erro }
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    // O Sentry, quando configurado, captura isto pelo handler global. O console
    // continua sendo o caminho de diagnóstico em desenvolvimento e para quem
    // abrir o inspetor em produção.
    console.error('[render]', erro, info.componentStack)
  }

  render() {
    if (!this.state.erro) return this.props.children

    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          background: '#0c0b0a',
          color: '#d5ccbe',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '32rem' }}>
          <p
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#d6a650',
              margin: '0 0 1rem',
            }}
          >
            Algo quebrou aqui
          </p>
          <h1 style={{ fontSize: '1.7rem', margin: '0 0 1rem', color: '#f5ecdc' }}>
            O site travou, mas a chapa não.
          </h1>
          <p style={{ margin: '0 0 2rem', lineHeight: 1.6, color: '#9f9587' }}>
            Recarregue a página ou faça o pedido direto pelo WhatsApp.
          </p>
          <a
            href={`https://wa.me/${CASA.whatsapp}`}
            style={{
              display: 'inline-block',
              padding: '0.9rem 1.9rem',
              borderRadius: '999px',
              background: '#d6a650',
              color: '#0c0b0a',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            WhatsApp {CASA.telefone}
          </a>
        </div>
      </div>
    )
  }
}
