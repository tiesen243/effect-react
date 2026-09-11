export async function loadRoutes() {
  const mod = await import('@/routes')
  return mod.default.make()
}
