declare module '*.mjs' {
  export interface BootstrapConfig {
    gatewayUrl: string
    bootstrapUsername: string
    bootstrapPassword: string
    accountUsername: string
    accountPassword: string
    roleIds: string
  }

  export interface BootstrapResult {
    created: boolean
    username: string
    adminId: number | null
    roleAssigned: boolean
  }

  export interface GatewayResponse {
    ok: boolean
    status: number
    json(): Promise<unknown>
  }

  export function readBootstrapConfig(env?: Record<string, string | undefined>): BootstrapConfig

  export function bootstrapGatewayAccount(
    config: BootstrapConfig,
    fetchImpl?: (
      url: string,
      init?: { method?: string; headers?: Record<string, string>; body?: string },
    ) => Promise<GatewayResponse>,
  ): Promise<BootstrapResult>
}
