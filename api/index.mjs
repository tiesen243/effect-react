import rscHandler from '../dist/rsc/index.js'

export default async function handler(req, res) {
  const protocol = req.headers['x-forwarded-proto'] ?? 'https'
  const host = req.headers.host ?? 'localhost'
  const url = `${protocol}://${host}${req.url ?? '/'}`

  const body =
    req.method === 'GET' || req.method === 'HEAD'
      ? undefined
      : await new Promise((resolve, reject) => {
          const chunks = []
          req.on('data', (chunk) => chunks.push(chunk))
          req.on('end', () => resolve(Buffer.concat(chunks)))
          req.on('error', reject)
        })

  const response = await rscHandler(
    new Request(url, { method: req.method, headers: req.headers, body })
  )

  res.statusCode = response.status
  for (const [key, value] of response.headers) res.setHeader(key, value)

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
