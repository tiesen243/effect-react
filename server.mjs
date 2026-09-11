import { readFile } from 'node:fs/promises'
import http from 'node:http'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

import rscHandler from './dist/rsc/index.js'

const root = fileURLToPath(new URL('.', import.meta.url))
const clientRoot = join(root, 'dist/client')

const mime = {
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
}

async function serveAsset(pathname, res) {
  const relative = normalize(pathname).replace(/^[/\\]+/, '')
  if (!relative.startsWith('assets/')) return false

  const file = join(clientRoot, relative)
  if (!file.startsWith(clientRoot)) return false

  try {
    const body = await readFile(file)
    res.writeHead(200, {
      'Content-Type': mime[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    })
    res.end(body)
    return true
  } catch {
    return false
  }
}

function toRequest(req) {
  const protocol = 'http'
  const host = req.headers.host ?? 'localhost'
  const url = `${protocol}://${host}${req.url ?? '/'}`

  return new Request(url, {
    method: req.method,
    headers: req.headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req,
    duplex: 'half',
  })
}

async function writeResponse(res, response) {
  res.writeHead(response.status, Object.fromEntries(response.headers))
  if (!response.body) {
    res.end()
    return
  }

  const reader = response.body.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    res.write(Buffer.from(value))
  }
  res.end()
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (await serveAsset(url.pathname, res)) return

    await writeResponse(res, await rscHandler(toRequest(req)))
  } catch (error) {
    console.error(error)
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end('Internal Server Error')
  }
})

const port = Number(process.env.PORT ?? 3000)
server.listen(port, () => {
  console.log(`Effect RSC listening on http://localhost:${port}`)
})
