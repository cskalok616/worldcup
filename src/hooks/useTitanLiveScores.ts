import { useEffect, useState } from 'react'
import { loadTitanLiveScores, type TitanLiveScoreResponse } from '../lib/worldCupApiClient'

const LIVE_SCORE_REFRESH_MS = 60_000

export const useTitanLiveScores = () => {
  const [liveScores, setLiveScores] = useState<Record<string, string>>({})
  const [matchIds, setMatchIds] = useState<Record<string, string>>({})
  const [updatedAt, setUpdatedAt] = useState<string>('')

  useEffect(() => {
    let isDisposed = false

    const loadLiveScores = async () => {
      try {
        const payload = (await loadTitanLiveScores()) as TitanLiveScoreResponse

        if (!isDisposed) {
          setLiveScores(payload.scores)
          setMatchIds(payload.matchIds ?? {})
          setUpdatedAt(payload.updatedAt)
        }
      } catch (error) {
        console.error('Unable to load Titan live scores.', error)
      }
    }

    void loadLiveScores()

    const timerId = window.setInterval(() => {
      void loadLiveScores()
    }, LIVE_SCORE_REFRESH_MS)

    return () => {
      isDisposed = true
      window.clearInterval(timerId)
    }
  }, [])

  return {
    liveScores,
    matchIds,
    updatedAt,
  }
}