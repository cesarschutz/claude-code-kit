// Transformações puras do estado: cada uma recebe o valor atual e devolve o
// próximo, para o update() do register.tsx aplicar com ifVersion.

import type { AgentInfo, SessionContextUsage, SessionCost, SessionRateLimit } from 'claude-code'

import type {
  CockpitAgente,
  CockpitArquivo,
  CockpitComando,
  CockpitContexto,
  CockpitEdicao,
  CockpitLimite,
  CockpitPonto,
  CockpitTurno,
  CockpitUi,
} from '../types'
import { curto, dolar, modeloCurto, primeiraLinha, relativo, umaLinha } from './formato'

const MAX_AGENTES = 100
const MAX_ARQUIVOS = 300
const MAX_COMANDOS = 100
const MAX_TURNOS = 10
const MAX_EDICOES = 60
const MAX_PONTOS = 12

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
      const texto = nome.endsWith('_path') ? relativo(valor, raiz) : valor

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
  fim: { id: string; isOk: boolean; duracaoMs: number; resposta: string; motivo: string },
  agora: number,
): CockpitAgente[] => {
  const resultado = curto(primeiraLinha(fim.resposta), 200) || (fim.isOk ? '' : `terminou por ${fim.motivo}`)
  const fecho = {
    estado: fim.isOk ? ('concluido' as const) : ('falhou' as const),
    duracaoMs: fim.duracaoMs,
    ...(resultado === '' ? {} : { resultado }),
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

export const textoDoStatus = (
  agentes: readonly CockpitAgente[],
  contexto: CockpitContexto,
): string => {
  const rodando = agentes.filter(agente => agente.estado === 'rodando').length
  const preenchido = contexto.percentual === undefined ? '–' : `${contexto.percentual}%`

  return [
    `agentes ${rodando} rodando`,
    `${agentes.length - rodando} concluídos`,
    `ctx ${preenchido}`,
    dolar(contexto.custo),
  ].join(' · ')
}
