import fs from 'fs'
import { promisify } from 'util'
import { basename } from 'path'
import { once } from 'events'

export const json = (res, json) => {
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(json))
}

export const redirect = (req, res, location) => {
  res.statusCode = 302
  res.setHeader('location', location)
  const body = req.method === 'HEAD' ? '' : `-> ${location}`
  res.end(body)
}

export const stream = async (res, stream) => {
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

export const file = async (res, path, opts) => {
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

export const download = async (res, path, opts) => {
  const filename = basename(path).replace(/"/, '\\"')
  res.setHeader('content-disposition', `attachment; filename="${filename}"`)
  await file(res, path, opts)
}
