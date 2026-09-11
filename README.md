# Effect RSC Framework

Flat React + Vite + RSC + Effect framework prototype.

## Route builder

Every route path must start with `/`:

```ts
const dashboard = RouteBuilder.layout(DashboardLayout).add(
  '/dashboard',
  DashboardRoute
)

export default RouteBuilder.layout(RootLayout)
  .add('/', IndexRoute)
  .merge(dashboard)
```

A merged builder is a **nested scope**, not a flattened route list:

```text
/dashboard
RootLayout
└── DashboardLayout
    └── DashboardRoute
```

### Prefix

`prefix()` scopes a builder to a URL prefix. The argument must start with `/`:

```ts
const dashboard = RouteBuilder.prefix('/dashboard')
  .layout(DashboardLayout)
  .add('/settings', SettingsRoute)
  .add('/users', UsersRoute)
```

This creates `/dashboard/settings` and `/dashboard/users`.

### Effect service scoping

`provide()` is scoped to the builder and its descendants. It does not leak to sibling builders:

```ts
const dashboard = RouteBuilder.layout(DashboardLayout)
  .provide(DashboardLive)
  .add('/dashboard', DashboardRoute)

const admin = RouteBuilder.provide(AdminLive).add('/admin', AdminRoute)

const root = RouteBuilder.layout(RootLayout)
  .add('/', IndexRoute)
  .merge(dashboard)
  .merge(admin)
```

`/dashboard` receives `DashboardLive` (plus any parent layers), `/admin` receives `AdminLive`, and neither sibling receives the other's layer.

## Development

```bash
npm install
npm run dev
```

Open `/todos` or `/dashboard`.

## Production

```bash
npm run build
npm start
```

The production server is the Node adapter in `server.mjs`.
