# Effect React

A small experimental React framework built around **React Server Components (RSC)**, **Vite**, and **Effect 4**.

The project aims to provide a framework-style routing model while keeping the application API strongly typed and the runtime dependency model explicit through Effect `Layer`s.

## Features

- React 19 with React Server Components
- Vite-powered development and production builds
- Type-safe route definitions with `createRoute()`
- Dynamic route params validated with Effect Schema
- Route `loader` and `action` effects with typed Effect requirements
- Nested layouts through `RouteBuilder.layout()` and `merge()`
- Lexically scoped Effect layers through `RouteBuilder.provide()`
- Route prefixes with `RouteBuilder.prefix()`
- Client-side navigation with `Link` and `useRouter()`
- Route prefetching
- Browser history navigation (`push`, `replace`, `back`, `forward`, `go`)
- RSC navigation without a full document reload
- Route-level error handling, including HTTP 404 errors
- Server-function support provided by `@vitejs/plugin-rsc`

## Stack

- [React](https://react.dev/) 19
- [Effect](https://effect.website/) 4
- [Vite](https://vite.dev/)
- [`@vitejs/plugin-rsc`](https://www.npmjs.com/package/@vitejs/plugin-rsc)
- [`rsc-html-stream`](https://www.npmjs.com/package/rsc-html-stream)
- TypeScript
- Tailwind CSS
- Oxlint / Oxfmt

## Getting Started

Install dependencies with Bun:

```bash
bun install
```

Start the development server:

```bash
bun run dev
```

Create a production build:

```bash
bun run build
```

Preview the production build:

```bash
bun run start
```

Format the project:

```bash
bun run format
```

Lint the project:

```bash
bun run lint
```

## Project Structure

```text
src/
├── components/
│   ├── ui/
│   └── providers.tsx
├── core/
│   ├── entry.client.tsx
│   ├── entry.rsc.tsx
│   ├── entry.ssr.tsx
│   ├── react.tsx
│   ├── request.ts
│   ├── route-builder.ts
│   └── route.ts
├── routes/
│   ├── api/
│   │    └── hello.ts
│   ├── [id].tsx
│   └── _index.tsx
├── services/
│   └── app.service.ts
├── root.tsx
└── routes.ts
```

## Routing

Routes are created with `createRoute()` and registered through `RouteBuilder`.

```tsx
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { createRoute } from '@/core/route'

export default createRoute({
  path: '/users/:id',

  params: Schema.Struct({
    id: Schema.String,
  }),

  loader: ({ id }, request) =>
    Effect.succeed({
      id,
      url: request.url,
    }),

  component: ({ params, loaderData }) =>
    Effect.succeed(
      <main>
        <h1>User {params.id}</h1>
        <pre>{JSON.stringify(loaderData, null, 2)}</pre>
      </main>
    ),
})
```

The route params are inferred from the schema, so `params.id` is typed as a `string` in the example above.

### Static and dynamic routes

Paths use Vite/Effect HTTP router path matching semantics. For example:

```text
/
/about
/users/:id
/files/*path
```

Static routes are preferred over less-specific dynamic routes when more than one route could match.

Every route path should start with `/`.

## Route Builder

`RouteBuilder` is the composition API for the application route tree.

```tsx
import { RouteBuilder } from '@/core/route-builder'
import RootLayout from '@/root'
import IndexPage from '@/routes/_index'
import DashboardLayout from '@/routes/dashboard/__root'
import DashboardPage from '@/routes/dashboard/_index'
import { AppService } from '@/services/app.service'

const dashboard = RouteBuilder.layout(DashboardLayout)
  .add(DashboardPage)
  .provide(AppService.layer)

export default RouteBuilder.layout(RootLayout)
  .add(IndexPage)
  .merge(dashboard)
  .provide(AppService.layer)
```

### Layouts

Layouts are nested in builder order.

A parent builder layout wraps routes defined directly by the parent and routes merged from child builders:

```text
RootLayout
└── DashboardLayout
    └── DashboardPage
```

### `merge()`

`merge()` combines a child builder into the current builder while preserving the child builder's route definitions, layouts, and dependencies.

The parent's scope is inherited by the merged subtree, but the child builder's dependencies do not leak back into the parent or into siblings.

### `provide()` scoping

`provide()` follows lexical/inherited scope semantics.

```tsx
const dashboard = RouteBuilder.layout(DashboardLayout)
  .add(DashboardPage)
  .provide(DashboardService.layer)

export default RouteBuilder.layout(RootLayout)
  .add(IndexPage)
  .merge(dashboard)
  .provide(AppService.layer)
```

The resulting dependency scopes are conceptually:

```text
Root subtree
└── AppService
    ├── IndexPage
    └── Dashboard subtree
        ├── AppService
        └── DashboardService
```

A layer provided by a parent is inherited by child routes. A layer provided by a child remains local to that child subtree.

## Effect Integration

Route handlers are represented as Effect programs.

```tsx
import * as Effect from 'effect/Effect'

loader: () =>
  Effect.gen(function* () {
    const service = yield* AppService

    return yield* service.greeting('User')
  })
```

The builder tracks route Effect requirements at the type level. `provide()` satisfies those requirements by supplying an Effect `Layer`.

This keeps application services explicit instead of relying on a global dependency container.

## Loaders and Actions

A normal page route can define both `loader` and `action`.

```tsx
export default createRoute({
  path: '/todos',

  loader: (_params, request) =>
    Effect.succeed({
      todos: [],
      method: request.method,
    }),

  action: (_params, request) =>
    Effect.tryPromise(async () => {
      const body = await request.json()
      return { created: true, body }
    }),

  component: ({ loaderData, actionData }) =>
    Effect.succeed(<main>{/* render route data */}</main>),
})
```

The route definition is shared by the page and request handlers, so params and Effect requirements remain consistent.

## API Routes

API endpoints use the same `createRoute()` API. There is no separate API route abstraction.

The HTTP method is determined by which handler is defined:

| HTTP method | Route handler |
| ----------- | ------------- |
| `GET`       | `loader`      |
| `POST`      | `action`      |

Example:

```tsx
import * as Effect from 'effect/Effect'

import { createRoute } from '@/core/route'

export default createRoute({
  path: '/api/hello',

  loader: (_params, request) =>
    Effect.succeed({
      method: request.method,
      message: 'Hello from GET',
    }),

  action: (_params, request) =>
    Effect.tryPromise(async () => ({
      method: request.method,
      body: await request.json(),
      message: 'Hello from POST',
    })),
})
```

Requests conceptually behave as:

```text
GET  /api/hello  -> loader()
POST /api/hello  -> action()
```

API routes are intended to return serializable data and do not render the normal page layout/RSC tree as their response body.

## Client Navigation

The client router lives in `src/core/react.tsx`.

### `Link`

Use `Link` for normal application navigation:

```tsx
import { Link } from '@/core/react'

;<Link href='/dashboard'>Dashboard</Link>
```

`Link` still renders a real `<a href="...">`. This gives the application a native browser fallback when JavaScript is unavailable or when the component is rendered outside the router provider.

For ordinary same-origin clicks inside the client router, navigation uses RSC fetching and `history.pushState()` instead of reloading the whole document.

### `useRouter`

Imperative navigation is available through `useRouter()`:

```tsx
'use client'

import { useRouter } from '@/core/react'

export function SaveButton() {
  const router = useRouter()

  return <button onClick={() => router.push('/dashboard')}>Dashboard</button>
}
```

Available methods:

```ts
router.push('/dashboard')
router.replace('/login')
router.back()
router.forward()
router.go(-2)
await router.prefetch('/dashboard')
```

### Prefetching

`Link` prefetches same-origin routes by default when the user hovers or focuses the link.

Disable it when needed:

```tsx
<Link href='/dashboard' prefetch={false}>
  Dashboard
</Link>
```

Prefetched RSC payloads are cached and consumed by the next navigation.

## Error Handling

A route tree can export an `ErrorBoundary` alongside its layout.

The root layout currently handles router errors, including `404`:

```tsx
export function ErrorBoundary({ error, retry }) {
  // render error UI
}
```

An unmatched route produces an error with:

```ts
{
  name: 'NotFoundError',
  status: 404,
}
```

The client promotes that payload into `RouterError`, which is then handled by the React error boundary.

The 404 fallback intentionally uses a normal anchor for its home link so that it remains usable even when the router provider is not available:

```tsx
<a href='/'>Take me home</a>
```

## Request Lifecycle

At a high level, a request flows through the following layers:

```text
Browser request
      │
      ▼
Vite / RSC entry
      │
      ├── Route matching
      │
      ├── Params decoding
      │
      ├── Loader / Action execution
      │
      ├── Effect Layer provisioning
      │
      └── Component + Layout rendering
      │
      ▼
RSC payload
      │
      ├── SSR -> HTML
      │
      └── Client navigation -> React tree update
```

`src/core/entry.rsc.tsx` is responsible for server-side route resolution and RSC payload generation.

`src/core/entry.ssr.tsx` consumes the RSC stream to produce HTML for the initial document request.

`src/core/entry.client.tsx` hydrates the initial payload and handles subsequent client-side navigations.

## Vite Environments

The Vite config defines separate environments for the RSC, SSR, and client stages:

```text
rsc
├── server route execution
├── RSC serialization
└── server functions

ssr
├── RSC deserialization
└── HTML streaming

client
├── hydration
├── CSR rendering
├── client navigation
└── server function calls
```

See `vite.config.ts` for the environment configuration.

## Type Safety Goals

The framework is designed around preserving type information from route definition to runtime execution.

The main type relationships are:

```text
Schema
  ↓
Route params
  ↓
loader / action / component
  ↓
Effect requirements
  ↓
RouteBuilder.provide(layer)
```

For example, changing a params schema should immediately affect the inferred type of every route handler that consumes those params.

Similarly, using an Effect service in a loader creates a route requirement that must be satisfied by the builder's provided layers.

## Current Status

This is an experimental framework/prototype rather than a stable production framework.

The current implementation focuses on the following primitives:

- route matching
- typed params
- Effect-powered route execution
- nested layouts
- scoped dependency provisioning
- RSC-based rendering
- client transitions
- 404 error boundaries
- GET/POST route handlers through `loader` / `action`

The API may evolve as the routing, caching, server-function, and rendering model is developed further.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
