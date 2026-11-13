import { useEffect, useState } from 'react'

type Resposta = { data: unknown; error: { message: string } | null }

type Estado<T> =
  | { status: 'carregando' }
  | { status: 'erro'; mensagem: string }
  | { status: 'ok'; dados: T }

// Várias telas usam as mesmas consultas: cada função roda uma vez por sessão
const cache = new Map<() => PromiseLike<Resposta>, Promise<Resposta>>()
// O que já chegou fica guardado aqui também: voltar a uma tela renderiza na hora, sem esqueleto.
// É isso que deixa a transição de tela e a volta da rolagem acontecerem no mesmo quadro.
const prontas = new Map<() => PromiseLike<Resposta>, Resposta>()

function buscar(consulta: () => PromiseLike<Resposta>) {
  let promessa = cache.get(consulta)
  if (!promessa) {
    promessa = Promise.resolve(consulta())
    cache.set(consulta, promessa)
    promessa.then((r) => {
      // Erro não fica em cache: a próxima tela tenta de novo
      if (r.error) cache.delete(consulta)
      else prontas.set(consulta, r)
    })
  }
  return promessa
}

function estadoDe<T>(r: Resposta): Estado<T> {
  return r.error ? { status: 'erro', mensagem: r.error.message } : { status: 'ok', dados: r.data as T }
}

// Passe uma função estável (definida fora do componente), como as de lib/supabase.ts
export function useConsulta<T>(consulta: () => PromiseLike<Resposta>) {
  const [estado, setEstado] = useState<Estado<T>>(() => {
    const pronta = prontas.get(consulta)
    return pronta ? estadoDe<T>(pronta) : { status: 'carregando' }
  })

  useEffect(() => {
    let ativo = true
    buscar(consulta).then((r) => { if (ativo) setEstado(estadoDe<T>(r)) })
    return () => { ativo = false }
  }, [consulta])

  return estado
}
