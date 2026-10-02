// Contrato do estado do mod: tudo o que o painel desenha fica em $.state,
// sob estas chaves, e sobrevive ao hot reload. Só dados JSON.

export type CockpitAba = 1 | 2 | 3 | 4

export type CockpitUi = {
  aba: CockpitAba
  // A versão compacta acima do prompt, quando o painel não teve lugar.
  isFaixa: boolean
  filtro: string
  // O turno em vista na aba Diffs; 0 acompanha o mais recente.
  turno: number
  passo: number
  isCalculando: boolean
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
}

declare module 'claude-code' {
  interface PluginState {
    'cs-cockpit': {
      ui: CockpitUi
      agentes: CockpitAgente[]
      turnos: CockpitTurno[]
      contexto: CockpitContexto
      arquivos: CockpitArquivo[]
      comandos: CockpitComando[]
      turno: number
    }
  }
}
