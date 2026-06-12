import type { Plugin } from 'vite'
import { attachWorldCupApiRoutes } from './worldCupApiService'

export const titanLiveScoresPlugin = (): Plugin => ({
  name: 'titan-live-scores-plugin',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      attachWorldCupApiRoutes(req, res, next)
    })
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      attachWorldCupApiRoutes(req, res, next)
    })
  },
})