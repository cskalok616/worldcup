import { runInNewContext } from 'node:vm'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { groupFixtures } from './src/data/worldCup'

const TITAN_SCORE_DATA_URL = 'https://zq.titan007.com/jsData/matchResult/2026/c75.js?version=2026051302'
const TITAN_REFERER_URL = 'https://zq.titan007.com/big/CupMatch/2026/75.html'
const CACHE_TTL_MS = 60_000
const HK01_WORLD_CUP_TAG_URL = 'https://www.hk01.com/tag/21842'
const HK01_NEWS_CACHE_TTL_MS = 600_000

type TitanMatchRecord = [
  number,
  number,
  number,
  string,
  number,
  number,
  string,
  ...unknown[],
]

type TitanSandbox = {
  jh: Record<string, TitanMatchRecord[]>
  arrTeam: Array<[number, string, string, string, string, string]>
}

export type LiveScoresResponse = {
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

let cachedResponse: LiveScoresResponse | null = null
let cachedAt = 0
let inflightRequest: Promise<LiveScoresResponse> | null = null
let cachedNewsResponse: WorldCupNewsResponse | null = null
let cachedNewsAt = 0
let inflightNewsRequest: Promise<WorldCupNewsResponse> | null = null
const cachedArticleResponses = new Map<string, WorldCupNewsArticleResponse>()
const cachedArticleAt = new Map<string, number>()
const inflightArticleRequests = new Map<string, Promise<WorldCupNewsArticleResponse>>()

const normalizeTeamName = (team: string) =>
  team
    .replace(/\s+/g, '')
    .replace('佛得角共和國', '佛得角')
    .replace('剛果民主共和國', '剛果')

const formatTitanScore = (rawScore: string) => {
  if (!rawScore) {
    return 'VS'
  }

  const localizedScore = rawScore.includes('|') ? rawScore.split('|')[1] ?? rawScore.split('|')[0] : rawScore

  return localizedScore.trim() || 'VS'
}

const getGroupKey = (jh: Record<string, TitanMatchRecord[]>, groupId: string) =>
  Object.keys(jh).find((key) => /^G\d+[A-L]$/.test(key) && key.endsWith(groupId))

const decodeHtml = (value: string) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const sanitizeNewsTitle = (title: string) => {
  const withoutPrefix = title.replace(/^世界盃2026[^｜]{0,12}｜\s*/, '').trim()

  return withoutPrefix.replace(/\s*｜有片$/, '').trim()
}

const stripHtml = (value: string) =>
  decodeHtml(value.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, ' ')).replace(/\s*\n\s*/g, '\n').trim()

const formatAgeLabel = (publishedAt: string) => {
  const ageMs = Date.now() - new Date(publishedAt).getTime()
  const ageMinutes = Math.max(0, Math.round(ageMs / 60_000))

  if (ageMinutes < 60) {
    return {
      ageMinutes,
      timeLabel: `${ageMinutes} 分鐘前`,
    }
  }

  if (ageMinutes < 24 * 60) {
    const hours = Math.round(ageMinutes / 60)

    return {
      ageMinutes,
      timeLabel: `${hours} 小時前`,
    }
  }

  const days = Math.round(ageMinutes / (24 * 60))

  return {
    ageMinutes,
    timeLabel: `${days} 天前`,
  }
}

const extractWorldCupNews = (html: string) => {
  const headlineRegex = /<time[^>]*dateTime="([^"]+)"[^>]*><\/time>[\s\S]{0,800}?<a[^>]*data-testid="content-card-title"[^>]*href="([^"]+)"[^>]*>(世界盃2026[^<]+|2026世界盃[^<]+)<\/a>/g
  const items = new Map<string, WorldCupNewsItem>()

  for (const match of html.matchAll(headlineRegex)) {
    const publishedAt = decodeHtml(match[1] ?? '')
    const path = decodeHtml(match[2] ?? '')
    const rawTitle = sanitizeNewsTitle(decodeHtml(match[3] ?? ''))

    if (!rawTitle || items.has(rawTitle) || !path) {
      continue
    }

    const { ageMinutes, timeLabel } = formatAgeLabel(publishedAt)

    items.set(rawTitle, {
      title: rawTitle,
      timeLabel,
      ageMinutes,
      path,
    })

    if (items.size >= 12) {
      break
    }
  }

  return [...items.values()].sort((left, right) => left.ageMinutes - right.ageMinutes)
}

const extractWorldCupArticle = (html: string) => {
  const articleStart = html.indexOf('<article id="article-content-section"')

  if (articleStart < 0) {
    return []
  }

  const articleEnd = html.indexOf('</article>', articleStart)
  const articleSection = html.slice(articleStart, articleEnd >= 0 ? articleEnd : articleStart + 20000)
  const paragraphs = [...articleSection.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
    .map((match) => stripHtml(match[1] ?? ''))
    .filter((paragraph) => paragraph.length > 0)

  return paragraphs
}

const fetchTitanLiveScores = async (): Promise<LiveScoresResponse> => {
  const response = await fetch(TITAN_SCORE_DATA_URL, {
    headers: {
      'accept-language': 'zh-TW,zh;q=0.9,en;q=0.8',
      referer: TITAN_REFERER_URL,
      'user-agent': 'Mozilla/5.0',
    },
  })

  if (!response.ok) {
    throw new Error(`Titan score feed request failed: ${response.status}`)
  }

  const source = await response.text()
  const sandbox: TitanSandbox = { jh: {}, arrTeam: [] }

  runInNewContext(source, sandbox, { timeout: 1_000 })

  const teamNameById = Object.fromEntries(
    sandbox.arrTeam.map((team) => [team[0], normalizeTeamName(team[2] || team[1])]),
  )

  const scores = Object.fromEntries(
    groupFixtures.map((fixture) => {
      const groupKey = getGroupKey(sandbox.jh, fixture.groupId)
      const records = (groupKey ? sandbox.jh[groupKey] : []) ?? []
      const fixtureDateTime = `2026-${fixture.date} ${fixture.time}`

      const matchedRecord =
        records.find((record) => {
          const recordDateTime = typeof record[3] === 'string' ? record[3].slice(0, 16) : ''
          const homeTeamName = normalizeTeamName(String(teamNameById[Number(record[4])] ?? ''))
          const awayTeamName = normalizeTeamName(String(teamNameById[Number(record[5])] ?? ''))

          return (
            recordDateTime === fixtureDateTime &&
            homeTeamName === normalizeTeamName(fixture.homeTeam) &&
            awayTeamName === normalizeTeamName(fixture.awayTeam)
          )
        }) ?? records[groupFixtures.filter((item) => item.groupId === fixture.groupId).indexOf(fixture)]

      return [fixture.id, formatTitanScore(matchedRecord?.[6] ?? fixture.score)]
    }),
  )

  return {
    updatedAt: new Date().toISOString(),
    scores,
  }
}

const fetchWorldCupNews = async (): Promise<WorldCupNewsResponse> => {
  const response = await fetch(HK01_WORLD_CUP_TAG_URL, {
    headers: {
      'accept-language': 'zh-TW,zh;q=0.9,en;q=0.8',
      'user-agent': 'Mozilla/5.0',
    },
  })

  if (!response.ok) {
    throw new Error(`HK01 news request failed: ${response.status}`)
  }

  const html = await response.text()
  const items = extractWorldCupNews(html)

  return {
    updatedAt: new Date().toISOString(),
    items,
  }
}

const fetchWorldCupNewsArticle = async (path: string): Promise<WorldCupNewsArticleResponse> => {
  const newsList = await getCachedWorldCupNews()
  const matchedItem = newsList.items.find((item) => item.path === path)
  const articleUrl = new URL(path, 'https://www.hk01.com').toString()
  const response = await fetch(articleUrl, {
    headers: {
      'accept-language': 'zh-TW,zh;q=0.9,en;q=0.8',
      'user-agent': 'Mozilla/5.0',
    },
  })

  if (!response.ok) {
    throw new Error(`HK01 article request failed: ${response.status}`)
  }

  const html = await response.text()
  const paragraphs = extractWorldCupArticle(html)

  return {
    updatedAt: new Date().toISOString(),
    title: matchedItem?.title ?? '新聞內容',
    timeLabel: matchedItem?.timeLabel ?? '較早前',
    paragraphs,
  }
}

export const getCachedTitanLiveScores = async () => {
  const now = Date.now()

  if (cachedResponse && now - cachedAt < CACHE_TTL_MS) {
    return cachedResponse
  }

  if (!inflightRequest) {
    inflightRequest = fetchTitanLiveScores()
      .then((result) => {
        cachedResponse = result
        cachedAt = Date.now()

        return result
      })
      .finally(() => {
        inflightRequest = null
      })
  }

  return inflightRequest
}

export const getCachedWorldCupNews = async () => {
  const now = Date.now()

  if (cachedNewsResponse && now - cachedNewsAt < HK01_NEWS_CACHE_TTL_MS) {
    return cachedNewsResponse
  }

  if (!inflightNewsRequest) {
    inflightNewsRequest = fetchWorldCupNews()
      .then((result) => {
        cachedNewsResponse = result
        cachedNewsAt = Date.now()

        return result
      })
      .finally(() => {
        inflightNewsRequest = null
      })
  }

  return inflightNewsRequest
}

export const getCachedWorldCupNewsArticle = async (path: string) => {
  const now = Date.now()
  const cachedArticle = cachedArticleResponses.get(path)
  const articleCachedAt = cachedArticleAt.get(path) ?? 0

  if (cachedArticle && now - articleCachedAt < HK01_NEWS_CACHE_TTL_MS) {
    return cachedArticle
  }

  const inflightArticle = inflightArticleRequests.get(path)

  if (inflightArticle) {
    return inflightArticle
  }

  const request = fetchWorldCupNewsArticle(path)
    .then((result) => {
      cachedArticleResponses.set(path, result)
      cachedArticleAt.set(path, Date.now())

      return result
    })
    .finally(() => {
      inflightArticleRequests.delete(path)
    })

  inflightArticleRequests.set(path, request)

  return request
}

const sendJson = (res: ServerResponse, statusCode: number, payload: unknown) => {
  res.statusCode = statusCode
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

const attachTitanLiveScoreRoute = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
  if (req.method !== 'GET' || req.url !== '/api/titan/live-scores') {
    next()

    return
  }

  void getCachedTitanLiveScores()
    .then((payload) => {
      sendJson(res, 200, payload)
    })
    .catch((error) => {
      sendJson(res, 503, {
        message: 'Unable to load Titan live scores.',
        error: error instanceof Error ? error.message : String(error),
      })
    })
}

const attachWorldCupNewsRoute = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
  if (req.method !== 'GET' || req.url !== '/api/world-cup/news') {
    next()

    return
  }

  void getCachedWorldCupNews()
    .then((payload) => {
      sendJson(res, 200, payload)
    })
    .catch((error) => {
      sendJson(res, 503, {
        message: 'Unable to load World Cup news.',
        error: error instanceof Error ? error.message : String(error),
      })
    })
}

const attachWorldCupNewsArticleRoute = (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) => {
  const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1')

  if (req.method !== 'GET' || requestUrl.pathname !== '/api/world-cup/news/article') {
    next()

    return
  }

  const path = requestUrl.searchParams.get('path') ?? ''

  if (!path.startsWith('/')) {
    sendJson(res, 400, { message: 'Invalid article path.' })

    return
  }

  void getCachedWorldCupNewsArticle(path)
    .then((payload) => {
      sendJson(res, 200, payload)
    })
    .catch((error) => {
      sendJson(res, 503, {
        message: 'Unable to load World Cup news article.',
        error: error instanceof Error ? error.message : String(error),
      })
    })
}

export const attachWorldCupApiRoutes = (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) => {
  attachTitanLiveScoreRoute(req, res, () =>
    attachWorldCupNewsRoute(req, res, () => attachWorldCupNewsArticleRoute(req, res, next)),
  )
}