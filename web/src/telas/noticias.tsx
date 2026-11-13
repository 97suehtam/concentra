import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { Carregando, Erro, Vazio } from '@/components/estados'
import { Sobretitulo, Titulo } from '@/components/titulo'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useConsulta } from '@/hooks/use-consulta'
import { useFavoritos } from '@/hooks/use-favoritos'
import { consultarNoticias, formatarData, type Noticia } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export function TelaNoticias() {
  const estado = useConsulta<Noticia[]>(consultarNoticias)
  const favoritos = useFavoritos()
  const [soMinhas, setSoMinhas] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Sobretitulo>Liga-SP, SASP, SRzd e Canal do Carnaval</Sobretitulo>
        <Titulo antes="O que rola no" destaque="samba" cor="bg-rosa" />
      </div>

      <div className="flex items-center justify-between rounded-full bg-card px-4 py-3 ring-1 ring-border">
        <Label htmlFor="so-minhas" className="text-sm">Só das escolas da minha grade</Label>
        <Switch id="so-minhas" checked={soMinhas} onCheckedChange={setSoMinhas} disabled={favoritos.lista.length === 0} />
      </div>

      {estado.status === 'carregando' && <Carregando />}
      {estado.status === 'erro' && <Erro titulo="Não deu para carregar as notícias" mensagem={estado.mensagem} />}
      {estado.status === 'ok' && (() => {
        const lista = soMinhas
          ? estado.dados.filter((n) => n.noticias_escolas.some(({ escolas: e }) => favoritos.ehFavorita(e.slug)))
          : estado.dados
        if (!lista.length)
          return (
            <Vazio emoji="🤫" titulo="Silêncio na avenida">
              <p className="text-sm text-muted-foreground">Nenhuma notícia recente das escolas da sua grade.</p>
            </Vazio>
          )
        return (
          <ul className="cascata grid gap-3 md:grid-cols-2">
            {lista.map((n, i) => <ItemNoticia key={n.id} noticia={n} indice={i} ehFavorita={favoritos.ehFavorita} />)}
          </ul>
        )
      })()}
    </div>
  )
}

// Só título e link: o texto da matéria fica no site da fonte
function ItemNoticia({ noticia: n, indice, ehFavorita }: { noticia: Noticia; indice: number; ehFavorita: (slug: string) => boolean }) {
  return (
    <li style={{ '--i': indice } as React.CSSProperties}>
      <a
        href={n.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex h-full flex-col gap-2 rounded-3xl bg-card p-4 ring-1 ring-border transition-[background-color,transform,scale] duration-200 ease-mola hover:bg-muted active:scale-[0.98]"
      >
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">{n.fontes.nome.split(' – ')[0]}</span>
          {n.publicada_em && <span>· {formatarData(n.publicada_em, { day: '2-digit', month: 'short' })}</span>}
          <ExternalLink className="ml-auto size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
        <span className="leading-snug font-semibold">{n.titulo}</span>
        {n.noticias_escolas.length > 0 && (
          <span className="flex flex-wrap gap-1">
            {n.noticias_escolas.map(({ escolas: e }) => (
              <Badge key={e.slug} className={cn(!ehFavorita(e.slug) && 'bg-secondary text-secondary-foreground')}>
                {ehFavorita(e.slug) && '♥ '}{e.nome}
              </Badge>
            ))}
          </span>
        )}
      </a>
    </li>
  )
}
