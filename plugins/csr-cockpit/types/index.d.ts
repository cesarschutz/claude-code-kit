// Contrato do estado do mod: tudo o que o painel desenha fica em $.state,
// sob estas chaves, e sobrevive ao hot reload. Só dados JSON.

export type CockpitAba = 1 | 2 | 3 | 4 | 5

export type CockpitUi = {
  aba: CockpitAba
  // A versão compacta acima do prompt, quando o painel não teve lugar.
  isFaixa: boolean
  filtro: string
  // O turno em vista na aba Diffs; 0 acompanha o mais recente.
  turno: number
  passo: number
  isCalculando: boolean
  // O item aberto em detalhe (um agente, um comando ou um turno), se houver.
  foco?: CockpitFoco
}

export type CockpitFoco = {
  tipo: 'agente' | 'comando' | 'turno'
  id: string
}

export type CockpitAgente = {
  id: string
  tipo: string
  descricao: string
  modelo?: string
  estado: 'rodando' | 'concluido' | 'falhou'
  inicio: number
  duracaoMs?: number
  ferramenta?: string
  argumento?: string
  chamadas: number
  resultado?: string
  // Total de tokens que o agente consumiu, quando o motor informa.
  tokens?: number
  // Preenchidos na leitura, a partir de `gastos`: o custo atribuído ao agente
  // e o tamanho do contexto dele na última resposta.
  custo?: number
  contexto?: number
}

// O que um subagente custou e o tamanho do contexto próprio dele.
export type CockpitGasto = {
  usd: number
  contexto?: number
}

// `visto` é o custo da sessão na última leitura: o que ele sobe ao fim de cada
// resposta do modelo vai para quem fez a resposta.
export type CockpitGastos = {
  visto: number
  agentes: Record<string, CockpitGasto>
}

export type CockpitLinha = {
  // '+' entrou, '-' saiu, ' ' contexto, '@' cabeçalho do trecho.
  t: '+' | '-' | ' ' | '@'
  n?: number
  x: string
}

export type CockpitEdicao = {
  id: string
  ferramenta: 'Edit' | 'Write'
  caminho: string
  mais: number
  menos: number
  linhas: CockpitLinha[]
  cortadas: number
  isNovo: boolean
}

export type CockpitTurno = {
  n: number
  edicoes: CockpitEdicao[]
}

export type CockpitPonto = {
  n: number
  tokens: number
}

export type CockpitLimite = {
  tipo: string
  percentual: number
  renova?: string
}

export type CockpitCategoria = {
  nome: string
  tokens: number
  tipo: string
}

export type CockpitDetalhe = {
  categorias: CockpitCategoria[]
  total: number
  janela: number
  modelo: string
  // O turno em que foi calculado, e se é a contagem exata ou a estimativa local.
  turno?: number
  isExato?: boolean
}

export type CockpitContexto = {
  janela: number
  tokens?: number
  percentual?: number
  historico: CockpitPonto[]
  tokensAntes?: number
  custo?: number
  custoAntes?: number
  limites: CockpitLimite[]
  detalhe?: CockpitDetalhe
}

export type CockpitArquivo = {
  caminho: string
  vezes: number
  quem: string[]
}

export type CockpitComando = {
  id: string
  comando: string
  estado: 'rodando' | 'ok' | 'falhou' | 'negado' | 'fundo'
  saida?: number
  nota?: string
  inicio: number
  duracaoMs?: number
  quem: string
  // Onde está o detalhe do comando (o id do membro em fichasDeComandos).
  ficha?: string
}

// Um turno do loop principal, para a aba Turnos.
export type CockpitRodada = {
  n: number
  // O número do pedido da pessoa a que o turno pertence: o turno que ela abriu
  // e os retornos automáticos dos agentes dele levam o mesmo número.
  ordem?: number
  // Turno aberto pelo retorno de um agente em segundo plano, não pela pessoa.
  isRetorno?: boolean
  agenteId?: string
  // O começo do pedido que abriu o turno, numa linha.
  pedido: string
  inicio: number
  duracaoMs?: number
  isAbortado?: boolean
  // O contexto ao fim do turno e quanto ele somou.
  tokens?: number
  variacao?: number
  custo?: number
  ferramentas: number
  falhas: number
  // Quantas vezes cada ferramenta foi chamada no turno.
  porFerramenta?: Record<string, number>
}

// Uma chamada de ferramenta de um subagente, para o detalhe dele.
export type CockpitPasso = {
  id: string
  ferramenta: string
  argumento: string
  estado: 'rodando' | 'ok' | 'falhou'
  duracaoMs?: number
}

export type CockpitTokens = {
  entrada: number
  saida: number
  cacheLido: number
  cacheGravado: number
  modelo: string
}

// O detalhe de um subagente: o pedido que recebeu, as últimas chamadas, as
// últimas mensagens que escreveu e, ao terminar, a resposta e os tokens.
export type CockpitFichaDoAgente = {
  pedido: string
  passos: CockpitPasso[]
  mensagens?: string[]
  resposta?: string
  tokens?: CockpitTokens
}

// O detalhe de um comando Bash: o comando inteiro e o fim da saída.
export type CockpitFichaDoComando = {
  id: string
  comando: string
  descricao?: string
  saida?: string
  erro?: string
}

// O detalhe de um turno: o pedido e a resposta inteiros.
export type CockpitFichaDoTurno = {
  n: number
  pedido: string
  resposta?: string
}

declare module 'claude-code' {
  interface PluginState {
    'csr-cockpit': {
      ui: CockpitUi
      agentes: CockpitAgente[]
      turnos: CockpitTurno[]
      contexto: CockpitContexto
      arquivos: CockpitArquivo[]
      comandos: CockpitComando[]
      turno: number
      rodadas: CockpitRodada[]
      serie: number
      pedidos: number
      gastos: CockpitGastos
      fichasDeAgentes: StateFamily<CockpitFichaDoAgente>
      fichasDeComandos: StateFamily<CockpitFichaDoComando>
      fichasDeTurnos: StateFamily<CockpitFichaDoTurno>
    }
  }
}
