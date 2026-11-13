import { useEffect } from 'react'
import { BarraLateral } from '@/components/barra-lateral'
import { NavPilula } from '@/components/nav-pilula'
import { Onboarding } from '@/components/onboarding'
import { Topo } from '@/components/topo'
import { Toaster } from '@/components/ui/sonner'
import { usePerfil } from '@/hooks/use-perfil'
import { temTransicao, useRota, useSlugEscola } from '@/hooks/use-rota'
import { registrarTela } from '@/lib/metricas'
import { TelaComoChegar } from '@/telas/como-chegar'
import { TelaDesfiles } from '@/telas/desfiles'
import { TelaEscola } from '@/telas/escola'
import { TelaGalera } from '@/telas/galera'
import { TelaPrivacidade } from '@/telas/privacidade'
import { TelaIngressos } from '@/telas/ingressos'
import { TelaMinhaGrade } from '@/telas/minha-grade'
import { TelaNoticias } from '@/telas/noticias'
import { TelaPerfil } from '@/telas/perfil'

const TELAS = {
  desfiles: TelaDesfiles,
  grade: TelaMinhaGrade,
  noticias: TelaNoticias,
  ingressos: TelaIngressos,
  chegar: TelaComoChegar,
  perfil: TelaPerfil,
  escola: TelaEscola,
  galera: TelaGalera,
  privacidade: TelaPrivacidade,
}

// Mobile first. Celular: uma coluna com a barra em pílula embaixo. Tablet (md): coluna mais larga.
// Desktop (lg): barra lateral fixa à esquerda e o conteúdo ao lado, com grades de duas colunas.
export default function App() {
  const rota = useRota()
  const slug = useSlugEscola()
  const { perfil } = usePerfil()
  const Tela = TELAS[rota]

  useEffect(() => registrarTela(rota, slug), [rota, slug])

  return (
    <div className="mx-auto min-h-svh max-w-md px-4 pb-32 md:max-w-2xl md:px-6 lg:grid lg:max-w-6xl lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 lg:px-8 lg:pb-16">
      <BarraLateral ativa={rota} />
      <div className="flex min-w-0 flex-col gap-6 lg:pt-10">
        <Topo />
        {/* Com View Transitions, quem anima a troca é o CSS (index.css). Sem ela, fica o fade de entrada.
            A chave inclui o slug: trocar de escola reinicia a tela. */}
        <main key={`${rota}/${slug}`} className={temTransicao ? undefined : 'animate-in fade-in slide-in-from-bottom-2 duration-300'}>
          <Tela />
        </main>
      </div>
      <NavPilula ativa={rota} />
      {!perfil.onboardingFeito && <Onboarding />}
      <Toaster position="top-center" />
    </div>
  )
}
