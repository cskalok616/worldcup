import { useEffect, useState } from 'react'
import { loadWorldCupNews as fetchWorldCupNews, type WorldCupNewsItem } from '../lib/worldCupApiClient'

const WORLD_CUP_NEWS_REFRESH_MS = 600_000

export const useWorldCupNews = () => {
  const [newsItems, setNewsItems] = useState<WorldCupNewsItem[]>([])
  const [updatedAt, setUpdatedAt] = useState<string>('')

  useEffect(() => {
    let isDisposed = false

    const loadLatestWorldCupNews = async () => {
      try {
        const payload = await fetchWorldCupNews()

        if (!isDisposed) {
          setNewsItems(payload.items)
          setUpdatedAt(payload.updatedAt)
        }
      } catch (error) {
        console.error('Unable to load World Cup news.', error)
      }
    }

    void loadLatestWorldCupNews()

    const timerId = window.setInterval(() => {
      void loadLatestWorldCupNews()
    }, WORLD_CUP_NEWS_REFRESH_MS)

    return () => {
      isDisposed = true
      window.clearInterval(timerId)
    }
  }, [])

  return {
    newsItems,
    updatedAt,
  }
}
