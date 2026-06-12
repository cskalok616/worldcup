export type TitanLiveScoreResponse = {
  updatedAt: string
  scores: Record<string, string>
}

export type WorldCupNewsItem = {
  title: string
  timeLabel: string
  ageMinutes: number
  path: string
}

export type WorldCupNewsResponse = {
  updatedAt: string
  items: WorldCupNewsItem[]
}

export type WorldCupNewsArticleResponse = {
  updatedAt: string
  title: string
  timeLabel: string
  paragraphs: string[]
}

export type ElectronWorldCupApi = {
  isElectron: boolean
  getLiveScores: () => Promise<TitanLiveScoreResponse>
  getNews: () => Promise<WorldCupNewsResponse>
  getNewsArticle: (path: string) => Promise<WorldCupNewsArticleResponse>
}

const getElectronApi = () => window.worldCupApi

export const isElectronWorldCupApp = () => Boolean(getElectronApi()?.isElectron)

export const loadTitanLiveScores = async () => {
  const electronApi = getElectronApi()

  if (electronApi) {
    return electronApi.getLiveScores()
  }

  const response = await fetch('/api/titan/live-scores')

  if (!response.ok) {
    throw new Error(`Live score request failed: ${response.status}`)
  }

  return (await response.json()) as TitanLiveScoreResponse
}

export const loadWorldCupNews = async () => {
  const electronApi = getElectronApi()

  if (electronApi) {
    return electronApi.getNews()
  }

  const response = await fetch('/api/world-cup/news')

  if (!response.ok) {
    throw new Error(`World Cup news request failed: ${response.status}`)
  }

  return (await response.json()) as WorldCupNewsResponse
}

export const loadWorldCupNewsArticle = async (path: string) => {
  const electronApi = getElectronApi()

  if (electronApi) {
    return electronApi.getNewsArticle(path)
  }

  const response = await fetch(`/api/world-cup/news/article?path=${encodeURIComponent(path)}`)

  if (!response.ok) {
    throw new Error(`World Cup news article request failed: ${response.status}`)
  }

  return (await response.json()) as WorldCupNewsArticleResponse
}