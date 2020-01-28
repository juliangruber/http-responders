'use strict'

const fs = require('fs')
const { promisify } = require('util')
const { basename } = require('path')
const { once } = require('events')

const json = (res, json) => {
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(json))
}

const redirect = (req, res, location) => {
  res.statusCode = 302
  res.setHeader('location', location)
  const body = req.method === 'HEAD' ? '' : `-> ${location}`
  res.end(body)
}

const stream = async (res, stream) => {
  stream.pipe(res)
  await new Promise((resolve, reject) => {
    stream.on('error', reject)
    res.on('close', () => {
      stream.destroy()
      resolve()
    })
    res.on('finish', resolve)
  })
}

const file = async (res, path, opts) => {
  const readStream = fs.createReadStream(path, opts)
  const stats = await Promise.race([
    (async () => {
      const [fd] = await once(readStream, 'open')
      return promisify(fs.fstat)(fd)
    })(),
    once(readStream, 'error')
  ])
  res.setHeader('content-length', stats.size)
  await stream(res, readStream)
}

const download = async (res, path, opts) => {
  const filename = basename(path).replace(/"/, '\\"')
  res.setHeader('content-disposition', `attachment; filename="${filename}"`)
  await file(res, path, opts)
}

module.exports = { json, redirect, download, file, stream }
