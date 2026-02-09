/**
 * HTTP-only dev server. Runs the app on http://localhost:3000 with no HTTPS.
 * Use: npm run dev  or  pnpm dev
 * Then open http://localhost:3000 (not https).
 */
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development'

const { createServer } = require('http')
const next = require('next')

const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, (err) => {
    if (err) throw err
    const url = `http://localhost:${port}`
    console.log('\n>> BiasharaHub frontend (HTTP only)\n')
    console.log('> Local:', url)
    console.log('> Open this URL in your browser (use http, not https)\n')
    const { exec } = require('child_process')
    const cmd =
      process.platform === 'win32'
        ? `start "" "${url}"`
        : process.platform === 'darwin'
          ? `open "${url}"`
          : `xdg-open "${url}"`
    exec(cmd, () => {})
  })
})
