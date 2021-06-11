import fs from 'fs'
import { basename } from 'path'

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
  const stat = await fs.promises.stat(path)
  res.setHeader('content-length', stat.size)
  await stream(res, fs.createReadStream(path, opts))
}

export const download = async (res, path, opts) => {
  const filename = basename(path).replace(/"/, '\\"')
  res.setHeader('content-disposition', `attachment; filename="${filename}"`)
  await file(res, path, opts)
}
