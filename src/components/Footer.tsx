import { registrar } from '@/lib/analytics'
import { CASA } from '@/lib/business'
import { resumoDaSemana } from '@/lib/hours'
import { IconeInstagram, IconeSetaDiagonal, IconeWhatsApp } from './Icones'
import { Selo } from './Logo'

/** O rodapé: tudo que se precisa para pedir, sem abrir mais nada. */
export function Footer() {
  return (
    <footer
      data-tema="escuro"
      className="grao relative overflow-hidden bg-noite pt-24 pb-10 text-nevoa"
    >
      <div className="container-x">
        <div className="flex flex-col gap-10 border-b border-risco pb-14 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-6">
            <Selo className="w-24 shrink-0 sm:w-28" titulo={CASA.nome} />
            <div>
              <p className="cartaz text-[clamp(1.8rem,4vw,2.6rem)] text-creme">{CASA.nome}</p>
              <p className="mt-2 max-w-[30ch] text-sm leading-relaxed">{CASA.lema}</p>
            </div>
          </div>
          <a
            href={CASA.ifood}
            target="_blank"
            rel="noopener"
            onClick={() => registrar('ifood_clique', { origem: 'rodape' })}
            className="botao botao-ouro w-fit min-h-[3.25rem] px-7"
          >
            Pedir no iFood <IconeSetaDiagonal className="h-4 w-4" />
          </a>
        </div>

        <div className="grid gap-10 py-14 text-sm leading-relaxed sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="rotulo mb-3 text-ouro">Horário</p>
            {resumoDaSemana(CASA.semana).map((l) => (
              <p key={l.dias}>
                {l.dias} · <span className="tabular">{l.horario}</span>
              </p>
            ))}
          </div>
          <div>
            <p className="rotulo mb-3 text-ouro">Entrega</p>
            <p>{CASA.regiao} — a taxa depende do endereço</p>
          </div>
          <div>
            <p className="rotulo mb-3 text-ouro">Pedidos</p>
            <a
              href={CASA.ifood}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 hover:text-creme"
            >
              Loja no iFood <IconeSetaDiagonal className="h-3 w-3" />
            </a>
            <a
              href={`https://wa.me/${CASA.whatsapp}`}
              target="_blank"
              rel="noopener"
              className="mt-1 flex items-center gap-1.5 hover:text-creme"
            >
              <IconeWhatsApp className="h-4 w-4" /> {CASA.telefone}
            </a>
          </div>
          <div>
            <p className="rotulo mb-3 text-ouro">Instagram</p>
            <a
              href={`https://www.instagram.com/${CASA.instagram}/`}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 hover:text-creme"
            >
              <IconeInstagram className="h-4 w-4" /> @{CASA.instagram}
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t border-risco pt-8 text-sm sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Rodapé" className="flex flex-wrap gap-x-6 gap-y-2">
            <a href="/cardapio" className="hover:text-creme">
              Cardápio
            </a>
            <a href="/#como-pedir" className="hover:text-creme">
              Como pedir
            </a>
            <a href="/politica-de-privacidade" className="hover:text-creme">
              Privacidade
            </a>
          </nav>
          <p className="text-xs text-cinza">
            © {new Date().getFullYear()} {CASA.nome} · {CASA.cidade}/{CASA.uf}
          </p>
        </div>
      </div>
    </footer>
  )
}
