function patchNavigator() {
  Object.defineProperty(navigator, 'webdriver', { get: () => false })
  Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] })
  Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] })

  const originalQuery = navigator.permissions.query
  navigator.permissions.query = (parameters: PermissionDescriptor) =>
    parameters.name === 'notifications'
      ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
      : originalQuery(parameters)
}

function patchWebGL() {
  const getParameter = WebGLRenderingContext.prototype.getParameter
  WebGLRenderingContext.prototype.getParameter = function (parameter) {
    if (parameter === 37445) return 'Apple'
    if (parameter === 37446) return 'Apple GPU'
    return getParameter.call(this, parameter)
  }
}

function patchCanvas() {
  const toDataURL = HTMLCanvasElement.prototype.toDataURL
  HTMLCanvasElement.prototype.toDataURL = function (type?: string, quality?: number) {
    return toDataURL.call(this, type, quality)
  }
}

export function applyFingerprintCorrection() {
  patchNavigator()
  patchWebGL()
  patchCanvas()
  window.addEventListener('DOMContentLoaded', () => {
    console.log('[Preload] Browser fingerprint correction applied')
  })
}
