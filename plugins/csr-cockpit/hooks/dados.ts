// Transformações puras do estado: cada uma recebe o valor atual e devolve o
// próximo, para o update() do register.tsx aplicar com ifVersion.

import type { AgentInfo, SessionContextUsage, SessionCost, SessionRateLimit } from 'claude-code'

import type {
  CockpitAgente,
  CockpitArquivo,
  CockpitComando,
  CockpitContexto,
  CockpitEdicao,
  CockpitFichaDoAgente,
  CockpitGastos,
  CockpitLimite,
  CockpitPasso,
  CockpitPonto,
  CockpitRodada,
  CockpitTurno,
  CockpitUi,
} from '../types'
import {
  curto,
  decimal,
  dolar,
  modeloCurto,
  nomeCurtoDoLimite,
  plural,
  primeiraLinha,
  relativo,
  semRaiz,
  tokens,
  umaLinha,
} from './formato'

const MAX_AGENTES = 100
const MAX_ARQUIVOS = 300
const MAX_COMANDOS = 100
const MAX_TURNOS = 10
const MAX_EDICOES = 60
const MAX_PONTOS = 12
const MAX_RODADAS = 60
const MAX_PASSOS = 40

export const FICHAS_DE_COMANDO = 100
export const FICHAS_DE_TURNO = 60

export const UI_INICIAL: CockpitUi = {
  aba: 1,
  isFaixa: false,
  filtro: '',
  turno: 0,
  passo: 0,
  isCalculando: false,
}

export const CONTEXTO_INICIAL: CockpitContexto = { janela: 0, historico: [], limites: [] }

const CAMPOS_DO_RESUMO = [
  'command',
  'file_path',
  'notebook_path',
  'pattern',
  'path',
  'url',
  'query',
  'description',
  'skill',
  'prompt',
]

// O argumento que melhor diz o que a chamada faz, numa linha curta.
export const resumoDaChamada = (campos: Readonly<Record<string, unknown>>, raiz: string): string => {
  for (const nome of CAMPOS_DO_RESUMO) {
    const valor = campos[nome]

    if (typeof valor === 'string' && valor !== '') {
      const texto = nome.endsWith('_path') ? relativo(valor, raiz) : semRaiz(valor, raiz)

      return curto(umaLinha(texto), 80)
    }
  }

  return ''
}

export const comAtividade = (
  lista: readonly CockpitAgente[],
  id: string,
  ferramenta: string,
  argumento: string,
  agora: number,
): CockpitAgente[] => {
  if (!lista.some(agente => agente.id === id)) {
    // Chamada de um agente cujo agent.spawn ainda não foi registrado.
    const novo: CockpitAgente = {
      id,
      tipo: 'agente',
      descricao: '',
      estado: 'rodando',
      inicio: agora,
      ferramenta,
      argumento,
      chamadas: 1,
    }

    return [...lista, novo].slice(-MAX_AGENTES)
  }

  return lista.map(agente =>
    agente.id === id
      ? { ...agente, estado: 'rodando', ferramenta, argumento, chamadas: agente.chamadas + 1 }
      : agente,
  )
}

export const comAgente = (
  lista: readonly CockpitAgente[],
  novo: { id: string; tipo: string; descricao: string; modelo: string | undefined },
  agora: number,
): CockpitAgente[] => {
  const modelo = novo.modelo === undefined ? {} : { modelo: modeloCurto(novo.modelo) }
  const dados = { tipo: novo.tipo, descricao: novo.descricao, ...modelo }

  if (lista.some(agente => agente.id === novo.id)) {
    return lista.map(agente => (agente.id === novo.id ? { ...agente, ...dados } : agente))
  }

  const agente: CockpitAgente = {
    id: novo.id,
    estado: 'rodando',
    inicio: agora,
    chamadas: 0,
    ...dados,
  }

  return [...lista, agente].slice(-MAX_AGENTES)
}

export const comFimDoAgente = (
  lista: readonly CockpitAgente[],
  fim: {
    id: string
    isOk: boolean
    duracaoMs: number
    resposta: string
    motivo: string
    tokens: number | undefined
  },
  agora: number,
): CockpitAgente[] => {
  const resultado = curto(primeiraLinha(fim.resposta), 200) || (fim.isOk ? '' : `terminou por ${fim.motivo}`)
  const fecho = {
    estado: fim.isOk ? ('concluido' as const) : ('falhou' as const),
    duracaoMs: fim.duracaoMs,
    ...(resultado === '' ? {} : { resultado }),
    ...(fim.tokens === undefined ? {} : { tokens: fim.tokens }),
  }

  if (!lista.some(agente => agente.id === fim.id)) {
    const novo: CockpitAgente = {
      id: fim.id,
      tipo: 'agente',
      descricao: '',
      inicio: agora - fim.duracaoMs,
      chamadas: 0,
      ...fecho,
    }

    return [...lista, novo].slice(-MAX_AGENTES)
  }

  return lista.map(agente => (agente.id === fim.id ? { ...agente, ...fecho } : agente))
}

const TERMINADOS = ['completed', 'failed', 'killed']

// Acerta a lista com $.agent.list(): tipo dos agentes ainda sem agent.spawn
// registrado e o fim dos que terminaram sem turn.complete (mortos).
export const comListaDaSessao = (
  lista: readonly CockpitAgente[],
  infos: readonly AgentInfo[],
  agora: number,
): CockpitAgente[] => {
  const proxima = lista.map(agente => {
    const info = infos.find(um => um.id === agente.id)

    if (info === undefined) {
      return agente
    }

    const tipo = agente.tipo === 'agente' ? info.type : agente.tipo
    const descricao = agente.descricao === '' ? info.description : agente.descricao
    const acabou = agente.estado === 'rodando' && TERMINADOS.includes(info.status)

    if (!acabou) {
      return { ...agente, tipo, descricao }
    }

    const fechado: CockpitAgente = {
      ...agente,
      tipo,
      descricao,
      estado: info.status === 'completed' ? 'concluido' : 'falhou',
      duracaoMs: agente.duracaoMs ?? agora - agente.inicio,
    }

    return info.status === 'completed' ? fechado : { ...fechado, resultado: `terminou como ${info.status}` }
  })

  for (const info of infos) {
    if (!proxima.some(agente => agente.id === info.id)) {
      const isRodando = !TERMINADOS.includes(info.status)
      proxima.push({
        id: info.id,
        tipo: info.type,
        descricao: info.description,
        estado: isRodando ? 'rodando' : info.status === 'completed' ? 'concluido' : 'falhou',
        inicio: agora,
        chamadas: 0,
      })
    }
  }

  return proxima.slice(-MAX_AGENTES)
}

const comPonto = (
  historico: readonly CockpitPonto[],
  n: number,
  valor: number,
): CockpitPonto[] =>
  [...historico.filter(ponto => ponto.n !== n), { n, tokens: valor }].slice(-MAX_PONTOS)

// Grava uma medição ($.session.usage ou session.measure) no contexto.
export const comMedida = (
  atual: CockpitContexto,
  turno: number,
  contexto: SessionContextUsage,
  limites: readonly SessionRateLimit[],
  custo: SessionCost | undefined,
): CockpitContexto => {
  const proximo: CockpitContexto = {
    janela: contexto.window,
    historico: atual.historico,
    limites: limites.map((limite): CockpitLimite =>
      limite.resetsAt === undefined
        ? { tipo: limite.kind, percentual: limite.percentUsed }
        : { tipo: limite.kind, percentual: limite.percentUsed, renova: limite.resetsAt },
    ),
  }

  // Sem leitura (sessão nova ou recém-compactada), o preenchimento fica vazio.
  if (contexto.tokens !== undefined) {
    proximo.tokens = contexto.tokens
    proximo.percentual =
      contexto.percent ?? Math.round((contexto.tokens / Math.max(1, contexto.window)) * 100)

    // A leitura de antes do primeiro turno não é um ponto do gráfico.
    if (turno > 0) {
      proximo.historico = comPonto(atual.historico, turno, contexto.tokens)
    }
  }

  const usd = custo?.usd ?? atual.custo

  if (usd !== undefined) {
    proximo.custo = usd
  }

  if (atual.tokensAntes !== undefined) {
    proximo.tokensAntes = atual.tokensAntes
  }

  if (atual.custoAntes !== undefined) {
    proximo.custoAntes = atual.custoAntes
  }

  if (atual.detalhe !== undefined) {
    proximo.detalhe = atual.detalhe
  }

  return proximo
}

// No início de um turno: guarda de onde o turno parte, para o que ele somou.
export const comInicioDoTurno = (atual: CockpitContexto): CockpitContexto => {
  const { tokensAntes: _tokens, custoAntes: _custo, ...resto } = atual

  return {
    ...resto,
    ...(atual.tokens === undefined ? {} : { tokensAntes: atual.tokens }),
    ...(atual.custo === undefined ? {} : { custoAntes: atual.custo }),
  }
}

export const comLeitura = (
  lista: readonly CockpitArquivo[],
  caminho: string,
  quem: string,
): CockpitArquivo[] => {
  const anterior = lista.find(arquivo => arquivo.caminho === caminho)
  const lido: CockpitArquivo = {
    caminho,
    vezes: (anterior?.vezes ?? 0) + 1,
    quem: [...new Set([...(anterior?.quem ?? []), quem])],
  }

  // O mais recente primeiro.
  return [lido, ...lista.filter(arquivo => arquivo.caminho !== caminho)].slice(0, MAX_ARQUIVOS)
}

export const comComando = (
  lista: readonly CockpitComando[],
  comando: CockpitComando,
): CockpitComando[] => [...lista, comando].slice(-MAX_COMANDOS)

export const comFimDoComando = (
  lista: readonly CockpitComando[],
  id: string,
  fim: Pick<CockpitComando, 'estado' | 'duracaoMs' | 'saida' | 'nota'>,
): CockpitComando[] =>
  lista.map(comando => {
    if (comando.id !== id) {
      return comando
    }

    const fechado: CockpitComando = { ...comando, estado: fim.estado }

    if (fim.duracaoMs !== undefined) {
      fechado.duracaoMs = fim.duracaoMs
    }

    if (fim.saida !== undefined) {
      fechado.saida = fim.saida
    }

    if (fim.nota !== undefined) {
      fechado.nota = fim.nota
    }

    return fechado
  })

export const comEdicao = (
  turnos: readonly CockpitTurno[],
  n: number,
  edicao: CockpitEdicao,
): CockpitTurno[] => {
  const atual = turnos.find(turno => turno.n === n)
  const proximo: CockpitTurno = {
    n,
    edicoes: [...(atual?.edicoes ?? []), edicao].slice(-MAX_EDICOES),
  }

  return [...turnos.filter(turno => turno.n !== n), proximo]
    .sort((a, b) => a.n - b.n)
    .slice(-MAX_TURNOS)
}

export const custoDoUltimoTurno = (contexto: CockpitContexto): number | undefined =>
  contexto.custo === undefined || contexto.custoAntes === undefined
    ? undefined
    : Math.max(0, contexto.custo - contexto.custoAntes)

// O que o último pedido somou ao contexto, do início dele até agora.
export const variacaoDoUltimoTurno = (contexto: CockpitContexto): number | undefined =>
  contexto.tokens === undefined || contexto.tokensAntes === undefined
    ? undefined
    : contexto.tokens - contexto.tokensAntes

// Entre parênteses, ao lado do total: o que o último turno somou. Sem mudança, nada.
const somado = (texto: string | undefined): string => (texto === undefined ? '' : ` (${texto})`)

const tokensSomados = (contexto: CockpitContexto): string | undefined => {
  const delta = variacaoDoUltimoTurno(contexto)

  return delta === undefined || Math.round(delta) === 0
    ? undefined
    : `${delta > 0 ? '+' : '−'}${tokens(delta)}`
}

const custoSomado = (contexto: CockpitContexto): string | undefined => {
  const delta = custoDoUltimoTurno(contexto)

  return delta === undefined || delta < 0.005 ? undefined : `+${decimal(delta, 2)}`
}

// A linha de resumo: só o que já tem leitura, cada parte com o seu nome. Sem
// nada para dizer (sessão recém-aberta), não há linha.
export const textoDoStatus = (
  agentes: readonly CockpitAgente[],
  contexto: CockpitContexto,
): string | undefined => {
  const rodando = agentes.filter(agente => agente.estado === 'rodando').length
  const prontos = agentes.length - rodando
  const partes: string[] = []

  if (contexto.percentual !== undefined) {
    partes.push(`contexto ${contexto.percentual}%`)

    if (contexto.tokens !== undefined) {
      partes.push(`${tokens(contexto.tokens)} tokens${somado(tokensSomados(contexto))}`)
    }

    if (contexto.custo !== undefined) {
      partes.push(`${dolar(contexto.custo)}${somado(custoSomado(contexto))}`)
    }
  }

  if (contexto.limites.length > 0) {
    const limites = contexto.limites.map(
      limite => `${nomeCurtoDoLimite(limite.tipo)} ${limite.percentual}%`,
    )
    partes.push(`limite ${limites.join(', ')}`)
  }

  if (agentes.length > 0) {
    const grupos = [
      rodando > 0 ? `${rodando} rodando` : undefined,
      prontos > 0 ? plural(prontos, 'concluído', 'concluídos') : undefined,
    ].filter((grupo): grupo is string => grupo !== undefined)
    partes.push(`agentes ${grupos.join(', ')}`)
  }

  return partes.length === 0 ? undefined : partes.join(' · ')
}

export const GASTOS_INICIAIS: CockpitGastos = { visto: 0, agentes: {} }

const MAX_GASTOS = 150

// O motor só dá o custo da sessão inteira. Ao fim de cada resposta do modelo,
// o que esse custo subiu desde a última leitura vai para quem fez a resposta:
// um subagente (`agenteId`) ou o loop principal (ninguém). `contexto` é o
// tamanho do contexto do agente nessa resposta.
export const comGasto = (
  atual: CockpitGastos,
  usd: number | undefined,
  agenteId: string | undefined,
  contexto: number | undefined,
): CockpitGastos => {
  const subiu = usd === undefined ? 0 : Math.max(0, usd - atual.visto)
  const visto = usd === undefined ? atual.visto : Math.max(atual.visto, usd)

  if (agenteId === undefined) {
    return { ...atual, visto }
  }

  const antes = atual.agentes[agenteId]
  const tamanho = contexto ?? antes?.contexto
  const agentes = {
    ...atual.agentes,
    [agenteId]: {
      usd: (antes?.usd ?? 0) + subiu,
      ...(tamanho === undefined ? {} : { contexto: tamanho }),
    },
  }
  const sobra = Object.keys(agentes).length - MAX_GASTOS

  return {
    visto,
    agentes:
      sobra > 0 ? Object.fromEntries(Object.entries(agentes).slice(sobra)) : agentes,
  }
}

// A lista de agentes com o custo e o contexto de cada um, para as telas.
export const comGastos = (
  lista: readonly CockpitAgente[],
  gastos: CockpitGastos,
): CockpitAgente[] =>
  lista.map(agente => {
    const gasto = gastos.agentes[agente.id]

    return gasto === undefined
      ? agente
      : {
          ...agente,
          custo: gasto.usd,
          ...(gasto.contexto === undefined ? {} : { contexto: gasto.contexto }),
        }
  })

export const comRodada = (
  lista: readonly CockpitRodada[],
  nova: CockpitRodada,
): CockpitRodada[] => [...lista.filter(rodada => rodada.n !== nova.n), nova].slice(-MAX_RODADAS)

// Um turno que o Claude Code abre sozinho quando um agente em segundo plano
// devolve o resultado: o texto vem embrulhado e traz o id do agente.
export const retornoDe = (
  texto: string,
): { agenteId: string | undefined; relato: string | undefined } | undefined => {
  const inicio = texto.trimStart()

  if (inicio.startsWith('<task-notification')) {
    return {
      agenteId: /<task-id>([^<]+)<\/task-id>/.exec(inicio)?.[1],
      relato: /<result>([\s\S]*?)<\/result>/.exec(inicio)?.[1]?.trim(),
    }
  }

  if (inicio.startsWith('<agent-message')) {
    const relato = inicio
      .replace(/^<agent-message[^>]*>/, '')
      .replace(/<\/agent-message>\s*$/, '')
      .trim()

    return {
      agenteId: /^<agent-message[^>]*\bfrom="([^"]+)"/.exec(inicio)?.[1],
      relato: relato === '' ? undefined : relato,
    }
  }

  return undefined
}

// Os turnos agrupados pelo pedido da pessoa: o turno que ela abriu e os
// retornos dos agentes dele, com os números somados. O mais recente primeiro.
export type Grupo = {
  ordem: number
  cabeca: CockpitRodada | undefined
  retornos: CockpitRodada[]
  inicio: number
  isAndando: boolean
  isAbortado: boolean
  duracaoMs: number
  variacao: number | undefined
  custo: number | undefined
  ferramentas: number
  falhas: number
  porFerramenta: Record<string, number>
}

export const gruposDeTurnos = (rodadas: readonly CockpitRodada[]): Grupo[] => {
  const grupos = new Map<number, CockpitRodada[]>()

  for (const rodada of rodadas) {
    const ordem = rodada.ordem ?? rodada.n
    grupos.set(ordem, [...(grupos.get(ordem) ?? []), rodada])
  }

  return [...grupos.entries()]
    .map(([ordem, membros]): Grupo => {
      const lidos = (ler: (rodada: CockpitRodada) => number | undefined): number[] =>
        [...membros]
          .sort((a, b) => a.n - b.n)
          .map(ler)
          .filter((valor): valor is number => valor !== undefined)
      const somar = (ler: (rodada: CockpitRodada) => number | undefined): number | undefined => {
        const valores = lidos(ler)

        return valores.length === 0 ? undefined : valores.reduce((a, b) => a + b, 0)
      }
      // Contexto e custo já vêm contados desde o começo do pedido: vale a última leitura.
      const ultimo = (ler: (rodada: CockpitRodada) => number | undefined): number | undefined =>
        lidos(ler).at(-1)
      const porFerramenta: Record<string, number> = {}

      for (const rodada of membros) {
        for (const [nome, vezes] of Object.entries(rodada.porFerramenta ?? {})) {
          porFerramenta[nome] = (porFerramenta[nome] ?? 0) + vezes
        }
      }

      return {
        ordem,
        cabeca: membros.find(rodada => rodada.isRetorno !== true),
        retornos: membros.filter(rodada => rodada.isRetorno === true),
        inicio: Math.min(...membros.map(rodada => rodada.inicio)),
        isAndando: membros.some(rodada => rodada.duracaoMs === undefined),
        isAbortado: membros.some(rodada => rodada.isAbortado === true),
        duracaoMs: somar(rodada => rodada.duracaoMs) ?? 0,
        variacao: ultimo(rodada => rodada.variacao),
        custo: ultimo(rodada => rodada.custo),
        ferramentas: somar(rodada => rodada.ferramentas) ?? 0,
        falhas: somar(rodada => rodada.falhas) ?? 0,
        porFerramenta,
      }
    })
    .sort((a, b) => b.ordem - a.ordem)
}

const naRodada = (
  lista: readonly CockpitRodada[],
  n: number,
  muda: (rodada: CockpitRodada) => CockpitRodada,
): CockpitRodada[] => lista.map(rodada => (rodada.n === n ? muda(rodada) : rodada))

export const comChamadaNaRodada = (
  lista: readonly CockpitRodada[],
  n: number,
  ferramenta: string,
  isFalha: boolean,
): CockpitRodada[] =>
  naRodada(lista, n, rodada => ({
    ...rodada,
    ferramentas: rodada.ferramentas + 1,
    falhas: rodada.falhas + (isFalha ? 1 : 0),
    porFerramenta: {
      ...rodada.porFerramenta,
      [ferramenta]: (rodada.porFerramenta?.[ferramenta] ?? 0) + 1,
    },
  }))

const FICHA_VAZIA: CockpitFichaDoAgente = { pedido: '', passos: [] }

// Uma chamada do subagente entra na ficha dele (as últimas 40).
export const comPasso = (
  ficha: CockpitFichaDoAgente | undefined,
  passo: CockpitPasso,
): CockpitFichaDoAgente => {
  const atual = ficha ?? FICHA_VAZIA

  return {
    ...atual,
    passos: [...atual.passos.filter(um => um.id !== passo.id), passo].slice(-MAX_PASSOS),
  }
}

export const comFimDoPasso = (
  ficha: CockpitFichaDoAgente | undefined,
  id: string,
  isOk: boolean,
  duracaoMs: number,
): CockpitFichaDoAgente => {
  const atual = ficha ?? FICHA_VAZIA

  return {
    ...atual,
    passos: atual.passos.map(passo =>
      passo.id === id ? { ...passo, estado: isOk ? 'ok' : 'falhou', duracaoMs } : passo,
    ),
  }
}

export const naFicha = (
  ficha: CockpitFichaDoAgente | undefined,
  muda: Partial<CockpitFichaDoAgente>,
): CockpitFichaDoAgente => ({ ...(ficha ?? FICHA_VAZIA), ...muda })

export const comFimDaRodada = (
  lista: readonly CockpitRodada[],
  n: number,
  duracaoMs: number,
  isAbortado: boolean,
): CockpitRodada[] =>
  naRodada(lista, n, rodada =>
    isAbortado ? { ...rodada, duracaoMs, isAbortado: true } : { ...rodada, duracaoMs },
  )

// O que o turno somou ao contexto e quanto custou, pela medição mais recente.
export const comMedidaNaRodada = (
  lista: readonly CockpitRodada[],
  n: number,
  contexto: CockpitContexto,
): CockpitRodada[] =>
  naRodada(lista, n, rodada => {
    const proxima: CockpitRodada = { ...rodada }
    const custo = custoDoUltimoTurno(contexto)

    if (contexto.tokens !== undefined) {
      proxima.tokens = contexto.tokens

      if (contexto.tokensAntes !== undefined) {
        proxima.variacao = contexto.tokens - contexto.tokensAntes
      }
    }

    if (custo !== undefined) {
      proxima.custo = custo
    }

    return proxima
  })
