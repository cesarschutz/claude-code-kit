// Node 24+: node --test plugins/csr-reviewer/tests/register.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

const source = readFileSync(new URL('../hooks/register.tsx', import.meta.url), 'utf8')
const { register, GLOBAL_ENABLED_KEY } = await import(
  `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`
)

function session(store = new Map()) {
  const handlers = new Map()
  let forks = 0
  let opened = false
  let invalidations = 0
  let failWrite = false
  let failRead = false
  const uiNode = type => props => ({ type, ...props })
  const $ = {
    store: {
      get: async key => { if (failRead) throw Error('read failure'); return store.get(key) },
      set: async (key, value) => { if (failWrite) throw Error('write failure'); store.set(key, value) },
    },
    clock: { now: async () => 1000 },
    model: { fork: async () => {
      forks++
      return { text: '{"summary":"Nothing to flag","findings":[]}', usage: {
        input_tokens: 1, output_tokens: 2, cache_read_input_tokens: 3, cache_creation_input_tokens: 4,
      } }
    } },
    command: { register: async () => ({}) },
    ui: {
      invalidate: () => { invalidations++ },
      open: async () => { opened = true },
      close: async () => { opened = false },
      panes: async () => opened ? [{ id: 'csr-reviewer' }] : [],
      resolve: () => ({ Box: uiNode('Box'), Text: uiNode('Text'), Button: uiNode('Button') }),
    },
  }
  register((event, filter, handler) => handlers.set(event, handler ?? filter))
  const dispatch = (event, args = {}) => handlers.get(event)($, args, async e => e)
  return {
    start: () => dispatch('session.start'),
    command: args => dispatch('command.run', { args }),
    turn: args => dispatch('turn.complete', { reason: 'answer', isAborted: false, ...args }),
    press: element => dispatch('ui.press', { element }),
    render: () => dispatch('ui.render', { props: { bodyColumns: 80 } }),
    get forks() { return forks }, get invalidations() { return invalidations },
    failWrite: () => { failWrite = true }, failRead: () => { failRead = true },
  }
}

const flush = () => new Promise(resolve => setImmediate(resolve))

test('fresh install starts off and help/status never spawn a reviewer', async () => {
  const s = session()
  await s.start(); await s.turn()
  const { text } = await s.command('help')
  assert.match(text, /Global \(todas as conversas\): desativado/)
  assert.match(text, /Nesta conversa: desativado \(segue o global\)/)
  assert.match(text, /\/reviewer enable/)
  assert.match(text, /\/reviewer disable/)
  assert.match((await s.command('status')).text, /segue o global/)
  assert.equal(s.forks, 0)
})

test('enable/disable persist, affect other open sessions and reset the issuing override', async () => {
  const store = new Map(), a = session(store), b = session(store)
  await a.start(); await b.start()
  await a.command('on'); await a.command('enable')
  assert.equal(store.get(GLOBAL_ENABLED_KEY), true)
  assert.match((await a.command('status')).text, /ativado \(segue o global\)/)
  await b.turn(); assert.equal(b.forks, 1)
  const c = session(store); await c.start(); await c.turn(); assert.equal(c.forks, 1)
  await a.command('disable'); await b.turn(); assert.equal(b.forks, 1)
  const d = session(store); await d.start(); await d.turn(); assert.equal(d.forks, 0)
})

test('on/off remain local, take precedence, and disappear in a new session', async () => {
  const store = new Map(), a = session(store), b = session(store)
  await a.start(); await b.start(); await a.command('on')
  await a.turn(); await b.turn()
  assert.equal(a.forks, 1); assert.equal(b.forks, 0); assert.equal(store.size, 0)
  await b.command('enable'); await a.command('off'); await a.turn()
  assert.equal(a.forks, 1)
  assert.match((await a.command('help')).text, /Global \(todas as conversas\): ativado/)
  assert.match((await a.command('help')).text, /Nesta conversa: desativado \(override da sessão\)/)
  await b.command('disable'); await b.command('enable'); await a.turn()
  assert.equal(a.forks, 1)
  const c = session(store); await c.start(); await c.turn(); assert.equal(c.forks, 1)
})

test('manual review runs once while auto stays off', async () => {
  const s = session(); await s.start(); await s.command('run'); await flush()
  assert.equal(s.forks, 1)
  await s.turn(); assert.equal(s.forks, 1)
  assert.match((await s.command('status')).text, /Nesta conversa: desativado/)
})

test('UI toggle only changes this session and renders both states', async () => {
  const store = new Map(), s = session(store); await s.start()
  await s.press('toggle'); await s.turn(); assert.equal(s.forks, 1)
  assert.equal(store.size, 0)
  assert.match(JSON.stringify(await s.render()), /global off · sessão on \(override\)/)
  await s.press('toggle'); await s.turn(); assert.equal(s.forks, 1)
  assert.ok(s.invalidations > 0)
})

test('read/write failures do not claim global preference was saved or start auto review', async () => {
  const s = session(); await s.start(); s.failWrite()
  assert.match((await s.command('enable')).text, /Não foi possível salvar/)
  await s.turn(); assert.equal(s.forks, 0)
  const t = session(new Map([[GLOBAL_ENABLED_KEY, true]])); t.failRead(); await t.start()
  assert.match((await t.command('help')).text, /Não foi possível ler/)
  await t.turn(); assert.equal(t.forks, 0)
})

test('subagents, aborted turns, and non-answer turns do not trigger review', async () => {
  const s = session(); await s.start(); await s.command('enable')
  await s.turn({ agentId: 'child' }); await s.turn({ isAborted: true }); await s.turn({ reason: 'tool' })
  assert.equal(s.forks, 0)
})

test('unknown commands show help guidance without changing the state', async () => {
  const s = session(); await s.start()
  assert.match((await s.command('typo')).text, /Use \/reviewer help/)
  await s.turn(); assert.equal(s.forks, 0)
})
