export interface ErrorReport {
  source: 'runtime' | 'rejection'
  message: string
  stack?: string
}

export function formatErrorReport(source: ErrorReport['source'], reason: unknown): ErrorReport {
  if (reason instanceof Error) {
    return { source, message: reason.message, stack: reason.stack }
  }
  return { source, message: String(reason) }
}

type ReportSink = (report: ErrorReport) => void

const sinks = new Set<ReportSink>()

export function onGlobalError(sink: ReportSink): () => void {
  sinks.add(sink)
  return () => sinks.delete(sink)
}

function showBanner(message: string): void {
  if (document.getElementById('global-error-banner')) return
  const banner = document.createElement('div')
  banner.id = 'global-error-banner'
  banner.setAttribute('role', 'alert')
  banner.textContent = `${message} — reload the app if the issue persists.`
  Object.assign(banner.style, {
    position: 'fixed',
    bottom: '0',
    left: '0',
    right: '0',
    zIndex: '9999',
    padding: '8px 16px',
    background: '#7f1d1d',
    color: '#fff',
    font: '13px sans-serif',
    textAlign: 'center',
  })
  document.body.appendChild(banner)
}

function publish(report: ErrorReport): void {
  console.error(`[global:${report.source}] ${report.message}`, report.stack ?? '')
  showBanner(report.message)
  sinks.forEach((sink) => sink(report))
}

let installed = false

export function installGlobalErrorHandlers(): void {
  if (installed) return
  installed = true

  window.addEventListener('error', (event) => {
    publish(formatErrorReport('runtime', event.error ?? event.message))
  })

  window.addEventListener('unhandledrejection', (event) => {
    publish(formatErrorReport('rejection', event.reason))
  })
}
