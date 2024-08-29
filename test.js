import test from 'test'
import assert from 'node:assert'
import http from 'http'
import { status, json, redirect, download, file, stream } from './index.js'
import fs from 'fs'
import fetch from 'node-fetch'
import { Readable } from 'stream'
import AbortController from 'abort-controller'
import { fileURLToPath } from 'url'
import { promisify } from 'node:util'

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/status') {
      status(res, 404)
    } else if (req.url === '/json') {
      json(res, { beep: 'boop' })
    } else if (req.url === '/redirect') {
      redirect(req, res, 'https://example.com/')
    } else if (req.url === '/redirect-301') {
      redirect(req, res, 'https://example.com/', 301)
    } else if (req.url === '/stream') {
      await stream(res, fs.createReadStream(fileURLToPath(import.meta.url)))
    } else if (req.url === '/stream/error') {
      try {
        await stream(res, fs.createReadStream('bleep'))
      } catch (_) {
        res.end('caught')
      }
    } else if (req.url === '/stream/close') {
      const readable = new Readable()
      readable._read = () => {
        setTimeout(() => readable.push('hi'), 100)
      }
      await stream(res, readable)
    } else if (req.url === '/file') {
      await file(res, fileURLToPath(import.meta.url))
    } else if (req.url === '/file/error') {
      try {
        await file(res, 'bleep')
      } catch (_) {
        res.end('caught')
      }
    } else if (req.url === '/download') {
      await download(res, fileURLToPath(import.meta.url))
    } else if (req.url === '/download/error') {
      try {
        await download(res, 'bleep')
      } catch (_) {
        res.end('caught')
      }
    }
  } catch (err) {
    console.error(err)
    res.statusCode = 500
    res.end()
  }
})
let address

test('setup', async t => {
  await promisify(server.listen.bind(server))()
  address = `http://localhost:${server.address().port}`
})

test('status', async t => {
  const res = await fetch(`${address}/status`)
  const text = await res.text()
  assert.deepStrictEqual(text, 'Not Found')
})

test('json', async t => {
  const res = await fetch(`${address}/json`)
  assert.strictEqual(res.headers.get('Content-Type'), 'application/json')
  const body = await res.json()
  assert.deepStrictEqual(body, { beep: 'boop' })
})

test('redirect', async t => {
  await t.test('GET', async t => {
    const res = await fetch(`${address}/redirect`, {
      redirect: 'manual'
    })
    assert.strictEqual(res.headers.get('Location'), 'https://example.com/')
    assert.strictEqual(res.status, 302)
    const text = await res.text()
    assert.strictEqual(text, '-> https://example.com/')
  })

  await t.test('HEAD', async t => {
    const res = await fetch(`${address}/redirect`, {
      method: 'HEAD',
      redirect: 'manual'
    })
    assert.strictEqual(res.headers.get('Location'), 'https://example.com/')
    assert.strictEqual(res.status, 302)
    const text = await res.text()
    assert.strictEqual(text, '')
  })

  await t.test('301', async t => {
    const res = await fetch(`${address}/redirect-301`, {
      redirect: 'manual'
    })
    assert.strictEqual(res.headers.get('Location'), 'https://example.com/')
    assert.strictEqual(res.status, 301)
    const text = await res.text()
    assert.strictEqual(text, '-> https://example.com/')
  })
})

test('stream', async t => {
  await t.test('no error', async t => {
    const res = await fetch(`${address}/stream`)
    const body = await res.buffer()
    assert.deepStrictEqual(body, await fs.promises.readFile(fileURLToPath(import.meta.url)))
  })
  await t.test('error', async t => {
    const res = await fetch(`${address}/stream/error`)
    const text = await res.text()
    assert.deepStrictEqual(text, 'caught')
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
    assert.strictEqual(err.name, 'AbortError')
  })
})

test('file', async t => {
  await t.test('no error', async t => {
    const res = await fetch(`${address}/file`)
    assert.strictEqual(
      res.headers.get('Content-Length'),
      String((await fs.promises.stat(fileURLToPath(import.meta.url))).size)
    )
    const body = await res.buffer()
    assert.deepStrictEqual(body, await fs.promises.readFile(fileURLToPath(import.meta.url)))
  })
  await t.test('error', async t => {
    const res = await fetch(`${address}/file/error`)
    const text = await res.text()
    assert.deepStrictEqual(text, 'caught')
  })
})

test('download', async t => {
  await t.test('no error', async t => {
    const res = await fetch(`${address}/download`)
    assert.strictEqual(
      res.headers.get('Content-Disposition'),
      'attachment; filename="test.js"'
    )
    assert.strictEqual(
      res.headers.get('Content-Length'),
      String((await fs.promises.stat(fileURLToPath(import.meta.url))).size)
    )
    const body = await res.buffer()
    assert.deepStrictEqual(body, await fs.promises.readFile(fileURLToPath(import.meta.url)))
  })
  await t.test('error', async t => {
    const res = await fetch(`${address}/download/error`)
    const text = await res.text()
    assert.deepStrictEqual(text, 'caught')
  })
})

test('cleanup', async t => {
  server.close()
})
