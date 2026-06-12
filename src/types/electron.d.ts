import type { ElectronWorldCupApi } from '../lib/worldCupApiClient'

declare global {
  interface Window {
    worldCupApi?: ElectronWorldCupApi
  }
}

export {}