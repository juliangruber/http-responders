'use strict'

const { test } = require('tap')
const http = require('http')
const { json, redirect, download, file, stream } = require('.')
const fs = require('fs')
const fetch = require('node-fetch')
const { Readable } = require('stream')
const AbortController = require('abort-controller')

const server = http.createServer((req, res) => {
  if (req.url === '/json') {
    json(res, { beep: 'boop' })
  } else if (req.url === '/redirect') {
    redirect(req, res, 'https://example.com/')
  } else if (req.url === '/stream') {
    stream(res, fs.createReadStream(__filename))
  } else if (req.url === '/stream/error') {
    stream(res, fs.createReadStream('bleep')).catch(() => res.end('caught'))
  } else if (req.url === '/stream/close') {
    const readable = new Readable()
    readable._read = () => {
      setTimeout(() => readable.push('hi'), 100)
    }
    stream(res, readable)
  } else if (req.url === '/file') {
    file(res, __filename)
  } else if (req.url === '/file/error') {
    file(res, 'bleep').catch(() => res.end('caught'))
  } else if (req.url === '/download') {
    download(res, __filename)
  } else if (req.url === '/download/error') {
    download(res, 'bleep').catch(() => res.end('caught'))
  }
})
let address

test('setup', t => {
  server.listen(() => {
    address = `http://localhost:${server.address().port}`
    t.end()
  })
})

test('json', async t => {
  const res = await fetch(`${address}/json`)
  t.equal(res.headers.get('Content-Type'), 'application/json')
  const body = await res.json()
  t.deepEqual(body, { beep: 'boop' })
})

test('redirect', async t => {
  await t.test('GET', async t => {
    const res = await fetch(`${address}/redirect`, {
      redirect: 'manual'
    })
    t.equal(res.headers.get('Location'), 'https://example.com/')
    const text = await res.text()
    t.equal(text, '-> https://example.com/')
  })

  await t.test('HEAD', async t => {
    const res = await fetch(`${address}/redirect`, {
      method: 'HEAD',
      redirect: 'manual'
    })
    t.equal(res.headers.get('Location'), 'https://example.com/')
    const text = await res.text()
    t.equal(text, '')
  })
})

test('stream', async t => {
  await t.test('no error', async t => {
    const res = await fetch(`${address}/stream`)
    const body = await res.buffer()
    t.deepEqual(body, await fs.promises.readFile(__filename))
  })
  await t.test('error', async t => {
    const res = await fetch(`${address}/stream/error`)
    const text = await res.text()
    t.deepEqual(text, 'caught')
  })
  await t.test('close', async t => {
    const controller = new AbortController()
    const res = await fetch(`${address}/stream/close`, {
      signal: controller.signal
    })
    controller.abort()
    let err
    try {
      await res.text()
    } catch (_err) {
      err = _err
    }
    t.equal(err.name, 'AbortError')
  })
})

test('file', async t => {
  await t.test('no error', async t => {
    const res = await fetch(`${address}/file`)
    t.equal(
      res.headers.get('Content-Length'),
      String((await fs.promises.stat(__filename)).size)
    )
    const body = await res.buffer()
    t.deepEqual(body, await fs.promises.readFile(__filename))
  })
  await t.test('error', async t => {
    const res = await fetch(`${address}/file/error`)
    const text = await res.text()
    t.deepEqual(text, 'caught')
  })
})

test('download', async t => {
  await t.test('no error', async t => {
    const res = await fetch(`${address}/download`)
    t.equal(
      res.headers.get('Content-Disposition'),
      'attachment; filename="test.js"'
    )
    t.equal(
      res.headers.get('Content-Length'),
      String((await fs.promises.stat(__filename)).size)
    )
    const body = await res.buffer()
    t.deepEqual(body, await fs.promises.readFile(__filename))
  })
  await t.test('error', async t => {
    const res = await fetch(`${address}/download/error`)
    const text = await res.text()
    t.deepEqual(text, 'caught')
  })
})

test('cleanup', t => {
  server.close()
  t.end()
})
