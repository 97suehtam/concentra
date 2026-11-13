import { ArrowLeft } from 'lucide-react'
import { Sobretitulo, Titulo } from '@/components/titulo'
import { Button } from '@/components/ui/button'
import { irPara } from '@/hooks/use-rota'
import { NOME_APP, PRIVACIDADE } from '@/lib/app'

// Política de Privacidade em linguagem direta. Texto de base, não é parecer jurídico:
// revisar com um advogado antes de abrir a comunidade ao público.
export function TelaPrivacidade() {
  const contato = PRIVACIDADE.contato
  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" className="-ml-2 self-start rounded-full" onClick={() => (window.history.length > 1 ? window.history.back() : irPara('perfil'))}>
        <ArrowLeft data-icon="inline-start" /> Voltar
      </Button>
      <div className="flex flex-col gap-2">
        <Sobretitulo>Atualizada em {PRIVACIDADE.atualizada_em}</Sobretitulo>
        <Titulo antes="Sua" destaque="privacidade" cor="bg-ceu" />
      </div>

      <article className="flex flex-col gap-5 text-sm leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_li]:ml-4 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
        <section className="flex flex-col gap-2">
          <h2>Em poucas palavras</h2>
          <p>
            O {NOME_APP} funciona sem conta: grade, perfil e ingressos ficam só no seu aparelho. Se você entrar com e-mail, guardamos uma cópia
            para levar seus dados a outros aparelhos. A comunidade é opcional, só para maiores de 18, e seu perfil começa privado.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2>Quem cuida dos seus dados</h2>
          <p>
            O controlador é {PRIVACIDADE.controlador}, responsável pelo {NOME_APP}. Para qualquer pedido sobre seus dados:{' '}
            {contato ? <a className="underline" href={`mailto:${contato}`}>{contato}</a> : <b>[contato a definir]</b>}.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2>O que guardamos e por quê</h2>
          <ul>
            <li><b>Sem conta, só no aparelho:</b> nome ou apelido, tipo de folião, escola do coração, grade, conquistas, ingressos guardados e recorde do jogo. Nada disso sai do seu celular.</li>
            <li><b>Com conta:</b> seu e-mail (para o link de entrada) e uma cópia de nome, tipo de folião, escola do coração, conquistas e grade. Base legal: execução do serviço que você pediu.</li>
            <li><b>Na comunidade, se você participar:</b> declaração de 18+, @, bio, foto, noites que vai, setor e se procura galera. Base legal: seu consentimento, que você retira quando quiser.</li>
            <li><b>Denúncias e bloqueios:</b> quem denunciou quem, o motivo e o que foi escrito. Servem para manter a comunidade segura.</li>
            <li><b>Métricas de uso (de todo mundo):</b> contamos visitas e telas abertas pelo Vercel Web Analytics, com país, tipo de aparelho, navegador e o site de onde a pessoa veio. É anônimo e agregado: sem cookies, sem e-mail e sem identificar quem é você. Base legal: interesse legítimo em entender o que melhorar no app.</li>
          </ul>
          <p>Ingressos guardados nunca vão para a nuvem. Não vendemos dados nem usamos para publicidade.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2>Quem vê o quê</h2>
          <ul>
            <li>Perfil <b>privado</b> (o padrão): ninguém além de você.</li>
            <li>Perfil <b>público</b>: outras pessoas maiores de 18, logadas e também públicas veem nome, @, foto aprovada, bio, escola do coração, tipo de folião, noites, setor e conquistas.</li>
            <li>Seu <b>e-mail nunca aparece</b> para outras pessoas.</li>
            <li>Fotos passam por <b>moderação</b> antes de aparecer. O responsável pelo app vê as fotos enviadas e as denúncias para moderar.</li>
            <li>Quem você bloqueia deixa de te ver, e você deixa de ver essa pessoa.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2>Onde ficam</h2>
          <p>
            No Supabase (banco de dados e fotos, servidores em São Paulo), na Vercel (hospedagem do site e métricas de uso) e no Resend (envio do e-mail de entrada).
            Esses serviços processam os dados só para o app funcionar.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2>Seus direitos (LGPD)</h2>
          <ul>
            <li><b>Ver e levar seus dados:</b> Perfil → Conta → "Baixar meus dados" (arquivo JSON).</li>
            <li><b>Corrigir:</b> edite no Perfil a qualquer momento.</li>
            <li><b>Retirar o consentimento:</b> deixe o perfil privado ou tire a foto.</li>
            <li><b>Excluir:</b> Perfil → Conta → "Excluir minha conta" apaga conta, perfil, foto, grade e conexões na hora.</li>
            <li>Para o que não estiver no app, fale com o contato acima. Você também pode reclamar à ANPD.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2>Menores de 18</h2>
          <p>
            A comunidade não é para menores de 18. Perfis que pareçam de menores podem ser denunciados e serão removidos. O resto do app (desfiles,
            grade, notícias, como chegar) pode ser usado por todo mundo, sem conta.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2>Por quanto tempo</h2>
          <p>
            Enquanto sua conta existir. Ao excluir a conta, os dados saem na hora. Denúncias feitas por você ficam, sem o seu nome, para a moderação.
          </p>
        </section>
      </article>
    </div>
  )
}
