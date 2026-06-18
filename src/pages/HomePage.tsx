import { useState } from 'react'
import { groupFixtureVenues, groupFixtures, groups } from '../data/worldCup'
import { useWorldCupNews } from '../hooks/useWorldCupNews'
import {
  loadTitanMatchStats,
  loadWorldCupNewsArticle,
  type TitanMatchStatLine,
  type WorldCupNewsItem,
} from '../lib/worldCupApiClient'
import { fixtureOddsSnapshotMap, oddsSnapshotUpdatedAt } from '../data/oddsSnapshot'
import { buildBettingAdvice } from '../utils/bettingAdvice'
import { buildLiveStandings, predictFixture } from '../utils/groupStandings'

const weekdayFormatter = new Intl.DateTimeFormat('zh-TW', { weekday: 'short' })

const getWeekday = (date: string) => {
  const parsedDate = new Date(`2026-${date}T00:00:00`)

  return weekdayFormatter.format(parsedDate)
}

const parseFixtureDateTime = (date: string, time: string) => new Date(`2026-${date}T${time}:00`).getTime()
const hasFinalScore = (score: string) => /(\d+)\s*[-:：]\s*(\d+)/.test(score)

type HomePageProps = {
  liveScores: Record<string, string>
  matchIds: Record<string, string>
}

type SelectedNewsArticle = {
  title: string
  timeLabel: string
  paragraphs: string[]
}

export function HomePage({ liveScores, matchIds }: HomePageProps) {
  const [showMoreNews, setShowMoreNews] = useState(false)
  const [selectedNewsPath, setSelectedNewsPath] = useState('')
  const [selectedArticle, setSelectedArticle] = useState<SelectedNewsArticle | null>(null)
  const [isArticleLoading, setIsArticleLoading] = useState(false)
  const [articleError, setArticleError] = useState('')
  const [expandedReportId, setExpandedReportId] = useState('')
  const [loadingReportId, setLoadingReportId] = useState('')
  const [reportErrors, setReportErrors] = useState<Record<string, string>>({})
  const [reportStats, setReportStats] = useState<Record<string, TitanMatchStatLine[]>>({})
  const { newsItems } = useWorldCupNews()
  const liveGroups = buildLiveStandings(liveScores)
  const scheduleRows = [...groupFixtures]
    .sort(
      (left, right) =>
        parseFixtureDateTime(left.date, left.time) - parseFixtureDateTime(right.date, right.time),
    )
    .map((fixture) => ({
      date: fixture.date,
      weekday: getWeekday(fixture.date),
      time: fixture.time,
      homeTeam: fixture.homeTeam,
      score: liveScores[fixture.id] ?? fixture.score,
      awayTeam: fixture.awayTeam,
      groupLabel: groups.find((group) => group.id === fixture.groupId)?.label ?? fixture.groupId,
      venue: groupFixtureVenues[fixture.id] ?? '待定',
      id: fixture.id,
    }))

  const now = Date.now()
  const nextRow =
    scheduleRows.find((row) => parseFixtureDateTime(row.date, row.time) >= now) ?? scheduleRows[0]
  const upcomingRows = scheduleRows.filter((row) => row.date === nextRow?.date)
  const completedRows = [...scheduleRows]
    .filter((row) => hasFinalScore(row.score))
    .sort(
      (left, right) =>
        parseFixtureDateTime(right.date, right.time) - parseFixtureDateTime(left.date, left.time),
    )
  const latestResultDate = completedRows[0]?.date ?? ''
  const recentResultRows = latestResultDate
    ? completedRows.filter((row) => row.date === latestResultDate)
    : []
  const predictionRows = scheduleRows
    .filter(
      (row) =>
        row.score === 'VS' &&
        parseFixtureDateTime(row.date, row.time) >= now &&
        row.date === nextRow?.date,
    )
    .map((row) => ({
      ...row,
      prediction: predictFixture(row, liveGroups),
      oddsSnapshot: fixtureOddsSnapshotMap.get(row.id),
    }))
  const topNews = newsItems.slice(0, 3)
  const extraNews = newsItems.slice(3)

  const openNewsArticle = async (item: WorldCupNewsItem) => {
    if (!item.path) {
      return
    }

    setSelectedNewsPath(item.path)
    setIsArticleLoading(true)
    setArticleError('')

    try {
      const payload = (await loadWorldCupNewsArticle(item.path)) as SelectedNewsArticle & {
        updatedAt: string
      }

      setSelectedArticle({
        title: payload.title,
        timeLabel: payload.timeLabel,
        paragraphs: payload.paragraphs,
      })
    } catch (error) {
      console.error('Unable to load World Cup news article.', error)
      setArticleError('暫時未能讀取新聞內容，請稍後再試。')
      setSelectedArticle(null)
    } finally {
      setIsArticleLoading(false)
    }
  }

  const openResultStats = async (fixtureId: string) => {
    if (expandedReportId === fixtureId) {
      setExpandedReportId('')

      return
    }

    const matchId = matchIds[fixtureId]

    if (!matchId) {
      setExpandedReportId(fixtureId)
      setReportErrors((current) => ({
        ...current,
        [fixtureId]: '暫時找不到該場次的技術統計連結。',
      }))

      return
    }

    setExpandedReportId(fixtureId)
    setLoadingReportId(fixtureId)
    setReportErrors((current) => ({ ...current, [fixtureId]: '' }))

    try {
      const payload = await loadTitanMatchStats(matchId)

      setReportStats((current) => ({
        ...current,
        [fixtureId]: payload.stats,
      }))
    } catch (error) {
      console.error('Unable to load Titan match stats.', error)
      setReportErrors((current) => ({
        ...current,
        [fixtureId]: '讀取技術統計失敗，請稍後再試。',
      }))
    } finally {
      setLoadingReportId('')
    }
  }

  return (
    <main className="app-shell">
      <section className="overview-grid">
        <article className="panel schedule-preview-panel">
          <div className="panel-heading">
            <h2>即將開始的賽事</h2>
          </div>
          <div className="schedule-preview-list upcoming-preview-list">
            {upcomingRows.map((row) => (
              <div key={row.id} className="preview-row">
                <div>
                  <strong>
                    {row.homeTeam} vs {row.awayTeam}
                  </strong>
                  <p>
                    {row.date} {row.weekday} · {row.time} · {row.groupLabel} · {row.venue}
                  </p>
                </div>
                <span className="schedule-stage">{row.score}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel route-cta-panel">
          <div className="panel-heading">
            <h2>比分戰報</h2>
            <p className="result-date-note">
              {latestResultDate ? `${latestResultDate} ${getWeekday(latestResultDate)} · 全部賽果` : '等待完賽賽果中'}
            </p>
          </div>
          <div className="schedule-preview-list upcoming-preview-list">
            {recentResultRows.length > 0 ? (
              recentResultRows.map((row) => (
                <div key={`report-${row.id}`} className="result-report-item">
                  <div className="preview-row">
                    <div>
                      <strong>
                        {row.homeTeam} vs {row.awayTeam}
                      </strong>
                      <p>
                        {row.date} {row.weekday} · {row.time} · {row.groupLabel}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="schedule-stage score-trigger"
                      onClick={() => void openResultStats(row.id)}
                    >
                      {row.score}
                    </button>
                  </div>
                  {expandedReportId === row.id ? (
                    <div className="result-stats-panel">
                      {loadingReportId === row.id ? (
                        <div className="result-stats-empty">技術統計載入中...</div>
                      ) : null}

                      {reportErrors[row.id] ? (
                        <div className="result-stats-empty">{reportErrors[row.id]}</div>
                      ) : null}

                      {reportStats[row.id] && loadingReportId !== row.id && !reportErrors[row.id] ? (
                        <div className="result-stats-table" role="table" aria-label="match stats table">
                          {reportStats[row.id].map((stat) => (
                            <div key={`${row.id}-${stat.label}`} className="result-stats-row" role="row">
                              <span className="result-stats-value" role="cell">{stat.home}</span>
                              <span className="result-stats-label" role="cell">{stat.label}</span>
                              <span className="result-stats-value" role="cell">{stat.away}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="preview-row">
                <div>
                  <strong>尚無完賽戰報</strong>
                  <p>比賽結束後，這裡會顯示當天全部賽果。</p>
                </div>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="hero-panel">
        <div className="hero-copy">
          <div className="panel-heading prediction-heading">
            <h2>勝出預測</h2>
          </div>
          <div className="prediction-list">
            {predictionRows.length > 0 ? (
              predictionRows.map((row) => (
                <article key={`prediction-${row.id}`} className="prediction-card">
                  <div className="prediction-card-head">
                    <strong>
                      {row.homeTeam} vs {row.awayTeam}
                    </strong>
                    <span>
                      {row.date} {row.weekday} · {row.time} · {row.groupLabel}
                    </span>
                  </div>
                  <div className="prediction-favorite">
                    較看好：<strong>{row.prediction.favorite}</strong>
                  </div>
                  <div className="prediction-confidence">
                    <span>信心指數</span>
                    <strong>{row.prediction.confidenceIndex}</strong>
                  </div>
                  <div className="prediction-meter" aria-hidden="true">
                    <span style={{ flexBasis: `${row.prediction.homeWinPercent}%` }} />
                    <span style={{ flexBasis: `${row.prediction.drawPercent}%` }} />
                    <span style={{ flexBasis: `${row.prediction.awayWinPercent}%` }} />
                  </div>
                  <div className="prediction-probabilities">
                    <span>{row.homeTeam} {row.prediction.homeWinPercent}%</span>
                    <span>和局 {row.prediction.drawPercent}%</span>
                    <span>{row.awayTeam} {row.prediction.awayWinPercent}%</span>
                  </div>
                  <div className="prediction-betting-head">
                    <strong>購買建議</strong>
                    <span>盤口快照：{row.oddsSnapshot ? '已同步' : '缺資料，使用模型估算'}</span>
                  </div>
                  {(() => {
                    const advice = buildBettingAdvice(row, row.prediction, row.oddsSnapshot)

                    return (
                      <div className="prediction-betting-grid" role="group" aria-label="betting advice">
                        <div className="prediction-table-cell">
                          <strong>勝負</strong>
                          <span>{advice.winnerPick}</span>
                        </div>
                        <div className="prediction-table-cell">
                          <strong>讓球</strong>
                          <span>{advice.handicapPick}</span>
                        </div>
                        <div className="prediction-table-cell">
                          <strong>角球</strong>
                          <span>{advice.cornerPick}</span>
                        </div>
                        <div className="prediction-table-cell">
                          <strong>風險</strong>
                          <span>{advice.riskLabel} · {advice.edgeLabel}</span>
                        </div>
                      </div>
                    )
                  })()}
                  <div className="prediction-odds-meta">
                    {row.oddsSnapshot ? (
                      <>
                        <span>
                          現盤 1X2：{row.oddsSnapshot.current1x2.home.toFixed(2)} / {row.oddsSnapshot.current1x2.draw.toFixed(2)} / {row.oddsSnapshot.current1x2.away.toFixed(2)}
                        </span>
                        <span>
                          初盤：{row.oddsSnapshot.opening1x2 ? `${row.oddsSnapshot.opening1x2.home.toFixed(2)} / ${row.oddsSnapshot.opening1x2.draw.toFixed(2)} / ${row.oddsSnapshot.opening1x2.away.toFixed(2)}` : '來源未提供可解析初盤'}
                        </span>
                      </>
                    ) : (
                      <span>目前沒有對應盤口資料，僅以模型勝率計算建議。</span>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="prediction-empty">今天暫時沒有可預測的未開賽賽事。</div>
            )}
          </div>
          <p className="prediction-note">
            盤口來源快照時間：{oddsSnapshotUpdatedAt}。此欄位僅供資訊參考，請依風險承受能力管理投注。
          </p>
        </div>

        <div className="hero-card news-card-panel">
          <div className="hero-card-header news-card-header">
            <h2>世界杯新聞</h2>
          </div>
          <div className="hero-stat-grid">
            {(topNews.length > 0
              ? topNews
              : [{ title: '暫時未讀取到新聞', timeLabel: '稍後再試', ageMinutes: 0, path: '' }]
            ).map((item) => (
              <button
                key={`${item.title}-${item.timeLabel}`}
                type="button"
                className={`stat-card news-stat-card${selectedNewsPath === item.path ? ' active' : ''}`}
                onClick={() => void openNewsArticle(item)}
                disabled={!item.path || isArticleLoading}
              >
                <strong>{item.title}</strong>
                <span>{item.timeLabel}</span>
              </button>
            ))}
          </div>
          <div className="news-more-wrap">
            {extraNews.length > 0 ? (
              <button
                type="button"
                className="news-more-button"
                onClick={() => setShowMoreNews((current) => !current)}
              >
                {showMoreNews ? '收起新聞' : '更多新聞'}
              </button>
            ) : null}

            {showMoreNews && extraNews.length > 0 ? (
              <div className="news-more-list">
                {extraNews.map((item) => (
                  <button
                    key={`${item.title}-${item.timeLabel}`}
                    type="button"
                    className={`news-more-item${selectedNewsPath === item.path ? ' active' : ''}`}
                    onClick={() => void openNewsArticle(item)}
                  >
                    <strong>{item.title}</strong>
                    <span>{item.timeLabel}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {isArticleLoading ? <div className="news-article-view">新聞內容載入中...</div> : null}

            {articleError ? <div className="news-article-view">{articleError}</div> : null}

            {selectedArticle && !isArticleLoading && !articleError ? (
              <article className="news-article-view">
                <div className="news-article-head">
                  <strong>{selectedArticle.title}</strong>
                  <span>{selectedArticle.timeLabel}</span>
                </div>
                <div className="news-article-body">
                  {selectedArticle.paragraphs.map((paragraph, index) => (
                    <p key={`${selectedArticle.title}-${index}`}>{paragraph}</p>
                  ))}
                </div>
              </article>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}