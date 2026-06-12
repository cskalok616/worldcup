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

const isStaticDataMode = import.meta.env.VITE_STATIC_DATA_MODE === 'true'
let cachedNewsArticles: Record<string, WorldCupNewsArticleResponse> | null = null

const getElectronApi = () => window.worldCupApi
const buildAssetPath = (relativePath: string) => `${import.meta.env.BASE_URL}${relativePath.replace(/^\//, '')}`

const fetchJson = async <T>(url: string) => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  return (await response.json()) as T
}

export const isElectronWorldCupApp = () => Boolean(getElectronApi()?.isElectron)

export const loadTitanLiveScores = async () => {
  const electronApi = getElectronApi()

  if (electronApi) {
    return electronApi.getLiveScores()
  }

  if (isStaticDataMode) {
    return fetchJson<TitanLiveScoreResponse>(buildAssetPath('api/titan/live-scores.json'))
  }

  return fetchJson<TitanLiveScoreResponse>('/api/titan/live-scores')
}

export const loadWorldCupNews = async () => {
  const electronApi = getElectronApi()

  if (electronApi) {
    return electronApi.getNews()
  }

  if (isStaticDataMode) {
    return fetchJson<WorldCupNewsResponse>(buildAssetPath('api/world-cup/news.json'))
  }

  return fetchJson<WorldCupNewsResponse>('/api/world-cup/news')
}

export const loadWorldCupNewsArticle = async (path: string) => {
  const electronApi = getElectronApi()

  if (electronApi) {
    return electronApi.getNewsArticle(path)
  }

  if (isStaticDataMode) {
    if (!cachedNewsArticles) {
      cachedNewsArticles = await fetchJson<Record<string, WorldCupNewsArticleResponse>>(
        buildAssetPath('api/world-cup/news-articles.json'),
      )
    }

    const article = cachedNewsArticles[path]

    if (!article) {
      throw new Error('World Cup news article not found.')
    }

    return article
  }

  return fetchJson<WorldCupNewsArticleResponse>(
    `/api/world-cup/news/article?path=${encodeURIComponent(path)}`,
  )
}