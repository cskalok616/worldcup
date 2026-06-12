import path from 'node:path'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import {
  getCachedTitanLiveScores,
  getCachedWorldCupNews,
  getCachedWorldCupNewsArticle,
  type WorldCupNewsArticleResponse,
} from '../worldCupApiService'

const outputRoot = path.resolve(process.cwd(), 'public/api')

const writeJson = async (relativePath: string, payload: unknown) => {
  const outputPath = path.join(outputRoot, relativePath)
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf8')
}

const buildStaticApi = async () => {
  await rm(outputRoot, { recursive: true, force: true })

  const liveScores = await getCachedTitanLiveScores()
  const news = await getCachedWorldCupNews()
  const articleEntries = await Promise.all(
    news.items.map(async (item) => {
      try {
        const article = await getCachedWorldCupNewsArticle(item.path)

        return [item.path, article] as const
      } catch (error) {
        const fallback: WorldCupNewsArticleResponse = {
          updatedAt: new Date().toISOString(),
          title: item.title,
          timeLabel: item.timeLabel,
          paragraphs: [error instanceof Error ? error.message : '暫時未能讀取新聞內容。'],
        }

        return [item.path, fallback] as const
      }
    }),
  )

  await writeJson('titan/live-scores.json', liveScores)
  await writeJson('world-cup/news.json', news)
  await writeJson('world-cup/news-articles.json', Object.fromEntries(articleEntries))
}

void buildStaticApi()