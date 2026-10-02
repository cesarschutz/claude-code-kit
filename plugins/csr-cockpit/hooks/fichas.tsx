// O detalhe de um item aberto a partir de uma lista: um agente, um comando ou
// um turno. Como em telas.tsx, nada aqui chama `$`.

import type { RenderElement } from 'claude-code'

import type {
  CockpitAgente,
  CockpitComando,
  CockpitFichaDoAgente,
  CockpitFichaDoComando,
  CockpitFichaDoTurno,
  CockpitPasso,
} from '../types'
import type { Grupo } from './dados'
import { dolar, duracao, plural, tokens } from './formato'
import type { Acoes, Elementos, Quadro } from './telas'

const botaoDeVoltar = (el: Elementos, acoes: Acoes): RenderElement => {
  const { Button } = el

  return <Button key="voltar" label="‹ Voltar (v)" hotkey="v" onPress={acoes.voltar} />
}

const semItem = (el: Elementos, acoes: Acoes, aviso: string): RenderElement => {
  const { Box, Text } = el

  return (
    <Box key="ficha" flexDirection="column" rowGap={1}>
      {botaoDeVoltar(el, acoes)}
      <Text dimColor>{aviso}</Text>
    </Box>
  )
}

const linhaDoPasso = (el: Elementos, passo: CockpitPasso): RenderElement => {
  const { Text } = el
  const isRodando = passo.estado === 'rodando'
  const isOk = passo.estado === 'ok'
  const marca = isRodando ? '●' : isOk ? '✓' : '✗'
  const cor = isRodando ? 'suggestion' : isOk ? 'success' : 'error'
  const tempo = passo.duracaoMs === undefined ? 'rodando' : duracao(passo.duracaoMs)

  return (
    <Text wrap="truncate-end">
      <Text color={cor}>{`${marca} `}</Text>
      <Text>{`${passo.ferramenta} ${passo.argumento}`.trim()}</Text>
      <Text dimColor>{` · ${tempo}`}</Text>
    </Text>
  )
}

export const fichaDoAgente = (
  el: Elementos,
  agente: CockpitAgente | undefined,
  ficha: CockpitFichaDoAgente | undefined,
  quadro: Quadro,
  acoes: Acoes,
): RenderElement => {
  const { Box, Button, Markdown, Text } = el

  if (agente === undefined) {
    return semItem(el, acoes, 'Este agente não está mais na lista.')
  }

  const isRodando = agente.estado === 'rodando'
  const isOk = agente.estado === 'concluido'
  const marca = isRodando ? '●' : isOk ? '✓' : '✗'
  const cor = isRodando ? 'suggestion' : isOk ? 'success' : 'error'
  const tempo = isRodando
    ? duracao(quadro.agora - agente.inicio)
    : agente.duracaoMs === undefined
      ? 'duração n/d'
      : duracao(agente.duracaoMs)
  const passos = ficha?.passos ?? []
  const todas = ficha?.mensagens ?? []
  // A resposta final é a última coisa que o agente escreveu: não repete na lista.
  const resposta = ficha?.resposta ?? (isRodando ? undefined : todas.at(-1))
  const mensagens = resposta !== undefined && todas.at(-1) === resposta ? todas.slice(0, -1) : todas
  const uso = ficha?.tokens
  const entrada = uso === undefined ? 0 : uso.entrada + uso.cacheLido + uso.cacheGravado

  return (
    <Box key="ficha" flexDirection="column" rowGap={1}>
      <Box flexDirection="row" flexWrap="wrap" columnGap={1}>
        {botaoDeVoltar(el, acoes)}
        <Button
          key="mensagens"
          label="Reler mensagens (m)"
          hotkey="m"
          onPress={() => acoes.mensagens(agente.id)}
        />
      </Box>
      <Box flexDirection="column">
        <Text wrap="truncate-end">
          <Text color={cor}>{`${marca} `}</Text>
          <Text bold>{agente.tipo}</Text>
          <Text dimColor>{` · ${agente.modelo ?? 'modelo n/d'} · ${tempo}`}</Text>
          <Text dimColor>{` · ${plural(agente.chamadas, 'chamada', 'chamadas')}`}</Text>
        </Text>
        {agente.descricao !== '' && <Text wrap="wrap">{agente.descricao}</Text>}
      </Box>
      {uso !== undefined && (
        <Box flexDirection="column">
          <Text bold>Tokens</Text>
          <Text wrap="wrap">
            {`Entrada ${tokens(entrada)} (${tokens(uso.cacheLido)} lidos do cache) · saída ${tokens(uso.saida)}`}
          </Text>
        </Box>
      )}
      {ficha !== undefined && ficha.pedido !== '' && (
        <Box flexDirection="column">
          <Text bold>Pedido que o agente recebeu</Text>
          <Markdown text={ficha.pedido} dimColor />
        </Box>
      )}
      <Box flexDirection="column">
        <Text bold>{`Chamadas (${passos.length})`}</Text>
        {passos.length === 0 && <Text dimColor>Nenhuma chamada de ferramenta ainda.</Text>}
        {passos.map(passo => linhaDoPasso(el, passo))}
      </Box>
      {(isRodando || mensagens.length > 0) && (
        <Box flexDirection="column" rowGap={1}>
          <Box flexDirection="column">
            <Text bold>{`O que o agente escreveu (${mensagens.length})`}</Text>
            {mensagens.length === 0 && <Text dimColor>Nenhuma mensagem escrita ainda.</Text>}
          </Box>
          {mensagens.map(mensagem => (
            <Markdown text={mensagem} />
          ))}
        </Box>
      )}
      {resposta !== undefined && (
        <Box flexDirection="column">
          <Text bold>Resposta final</Text>
          <Markdown text={resposta} />
        </Box>
      )}
    </Box>
  )
}

export const fichaDoComando = (
  el: Elementos,
  comando: CockpitComando | undefined,
  ficha: CockpitFichaDoComando | undefined,
  quadro: Quadro,
  acoes: Acoes,
): RenderElement => {
  const { Box, Code, Text } = el

  if (comando === undefined) {
    return semItem(el, acoes, 'Este comando não está mais na lista.')
  }

  const isVivo = comando.estado === 'rodando' || comando.estado === 'fundo'
  const isOk = comando.estado === 'ok'
  const marca = isVivo ? '●' : isOk ? '✓' : '✗'
  const cor = isVivo ? 'suggestion' : isOk ? 'success' : 'error'
  const partes = [
    comando.estado === 'rodando' ? `rodando há ${duracao(quadro.agora - comando.inicio)}` : undefined,
    comando.estado === 'fundo' ? 'em segundo plano' : undefined,
    comando.estado === 'negado' ? 'negado' : undefined,
    isOk ? 'concluído' : undefined,
    comando.estado === 'falhou' && comando.saida === undefined ? 'falhou' : undefined,
    comando.saida === undefined ? undefined : `exit ${comando.saida}`,
    comando.nota,
    comando.duracaoMs === undefined ? undefined : duracao(comando.duracaoMs),
    `por ${comando.quem}`,
  ].filter((parte): parte is string => parte !== undefined)
  const texto = ficha?.comando === undefined || ficha.comando === '' ? comando.comando : ficha.comando
  const temSaida = ficha?.saida !== undefined || ficha?.erro !== undefined

  return (
    <Box key="ficha" flexDirection="column" rowGap={1}>
      {botaoDeVoltar(el, acoes)}
      <Box flexDirection="column">
        <Text wrap="wrap">
          <Text color={cor}>{`${marca} `}</Text>
          <Text>{partes.join(' · ')}</Text>
        </Text>
        {ficha?.descricao !== undefined && <Text dimColor wrap="wrap">{ficha.descricao}</Text>}
      </Box>
      <Box flexDirection="column">
        <Text bold>Comando</Text>
        <Code source={texto} language="bash" wrap="wrap" />
      </Box>
      {ficha?.saida !== undefined && (
        <Box flexDirection="column">
          <Text bold>Saída</Text>
          <Code source={ficha.saida} wrap="wrap" />
        </Box>
      )}
      {ficha?.erro !== undefined && (
        <Box flexDirection="column">
          <Text bold>{isOk ? 'Saída de erro' : 'Erro'}</Text>
          <Code source={ficha.erro} wrap="wrap" />
        </Box>
      )}
      {!temSaida && (
        <Text dimColor>{isVivo ? 'A saída aparece quando o comando terminar.' : 'Sem saída.'}</Text>
      )}
    </Box>
  )
}

export const fichaDoTurno = (
  el: Elementos,
  grupo: Grupo | undefined,
  fichas: readonly CockpitFichaDoTurno[],
  agentes: readonly CockpitAgente[],
  edicoes: number,
  quadro: Quadro,
  acoes: Acoes,
): RenderElement => {
  const { Box, Code, Markdown, Text } = el

  if (grupo === undefined) {
    return semItem(el, acoes, 'Este turno não está mais na lista.')
  }

  const fichaDe = (n: number | undefined) => fichas.find(ficha => ficha.n === n)
  const tempo = grupo.isAndando ? duracao(quadro.agora - grupo.inicio) : duracao(grupo.duracaoMs)
  const numeros = [
    grupo.variacao === undefined
      ? undefined
      : `${grupo.variacao >= 0 ? '+' : '−'}${tokens(grupo.variacao)} de contexto`,
    grupo.custo === undefined ? undefined : dolar(grupo.custo),
    edicoes > 0 ? plural(edicoes, 'edição', 'edições') : undefined,
    grupo.falhas > 0 ? plural(grupo.falhas, 'falha', 'falhas') : undefined,
  ].filter((parte): parte is string => parte !== undefined)
  const usadas = Object.entries(grupo.porFerramenta).sort((a, b) => b[1] - a[1])
  const cabeca = fichaDe(grupo.cabeca?.n)
  const pedido = cabeca?.pedido === undefined || cabeca.pedido === '' ? (grupo.cabeca?.pedido ?? '') : cabeca.pedido
  const nomeDoAgente = (id: string | undefined): string => {
    const agente = agentes.find(um => um.id === id)

    return agente === undefined ? 'agente' : `agente ${agente.tipo}`
  }

  return (
    <Box key="ficha" flexDirection="column" rowGap={1}>
      {botaoDeVoltar(el, acoes)}
      <Box flexDirection="column">
        <Text wrap="truncate-end">
          <Text bold>{`Turno ${grupo.ordem}`}</Text>
          {grupo.isAndando && <Text color="suggestion">{` · em andamento · ${tempo}`}</Text>}
          {!grupo.isAndando && <Text dimColor>{` · ${tempo}`}</Text>}
          {grupo.isAbortado && <Text color="error">{' · interrompido'}</Text>}
        </Text>
        {numeros.length > 0 && <Text dimColor wrap="wrap">{numeros.join(' · ')}</Text>}
      </Box>
      <Box flexDirection="column">
        <Text bold>{`Ferramentas (${grupo.ferramentas})`}</Text>
        {usadas.length === 0 && <Text dimColor>Nenhuma chamada de ferramenta.</Text>}
        {usadas.length > 0 && (
          <Text wrap="wrap">{usadas.map(([nome, vezes]) => `${nome} ${vezes}`).join(' · ')}</Text>
        )}
      </Box>
      {pedido !== '' && (
        <Box flexDirection="column">
          <Text bold>Pedido</Text>
          <Code source={pedido} wrap="wrap" />
        </Box>
      )}
      <Box flexDirection="column">
        <Text bold>Resposta</Text>
        {cabeca?.resposta === undefined || cabeca.resposta === '' ? (
          <Text dimColor>
            {grupo.cabeca?.duracaoMs === undefined ? 'O turno ainda está em andamento.' : 'Sem texto de resposta.'}
          </Text>
        ) : (
          <Markdown text={cabeca.resposta} />
        )}
      </Box>
      {grupo.retornos.map(retorno => {
        const resposta = fichaDe(retorno.n)?.resposta
        const duracaoDoRetorno =
          retorno.duracaoMs === undefined ? 'em andamento' : duracao(retorno.duracaoMs)

        return (
          <Box flexDirection="column">
            <Text wrap="truncate-end">
              <Text bold>{`Depois do retorno do ${nomeDoAgente(retorno.agenteId)}`}</Text>
              <Text dimColor>{` · ${duracaoDoRetorno}`}</Text>
            </Text>
            {resposta === undefined || resposta === '' ? (
              <Text dimColor>Sem texto de resposta.</Text>
            ) : (
              <Markdown text={resposta} />
            )}
          </Box>
        )
      })}
    </Box>
  )
}
