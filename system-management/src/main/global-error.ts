function describe(reason: unknown): string {
  return reason instanceof Error ? (reason.stack ?? reason.message) : String(reason)
}

let installed = false

export function installMainErrorHandlers(): void {
  if (installed) return
  installed = true

  process.on('uncaughtException', (error) => {
    console.error('[main:uncaughtException]', describe(error))
  })

  process.on('unhandledRejection', (reason) => {
    console.error('[main:unhandledRejection]', describe(reason))
  })
}

installMainErrorHandlers()
