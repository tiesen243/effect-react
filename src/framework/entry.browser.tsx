import { createFromFetch } from '@vitejs/plugin-rsc/browser'
import { hydrateRoot } from 'react-dom/client'

async function main() {
  const root = await createFromFetch(fetch(window.location.href + '.rsc'))
  hydrateRoot(document, root as never)
}

void main()

if (import.meta.hot) {
  import.meta.hot.on('rsc:update', async () => {
    const root = await createFromFetch(fetch(window.location.href + '.rsc'))
    hydrateRoot(document, root as never)
  })
}
