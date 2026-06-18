import { useEffect, useState } from 'react'
import { groupFixtureVenues, groupFixtures, groups } from '../data/worldCup'
import { loadTitanMatchStats } from '../lib/worldCupApiClient'

const weekdayFormatter = new Intl.DateTimeFormat('zh-TW', { weekday: 'short' })

const getWeekday = (date: string) => {
  const parsedDate = new Date(`2026-${date}T00:00:00`)

  return weekdayFormatter.format(parsedDate)
}

const parseFixtureDateTime = (date: string, time: string) => new Date(`2026-${date}T${time}:00`).getTime()

type SchedulePageProps = {
  liveScores: Record<string, string>
  matchIds: Record<string, string>
}

const hasFinalScore = (score: string) => /(\d+)\s*[-:：]\s*(\d+)/.test(score)

export function SchedulePage({ liveScores, matchIds }: SchedulePageProps) {
  const [cornerLabelsByFixture, setCornerLabelsByFixture] = useState<Record<string, string>>({})

  useEffect(() => {
    let isDisposed = false

    const loadCornerStats = async () => {
      const completedFixtures = groupFixtures.filter((fixture) =>
        hasFinalScore(liveScores[fixture.id] ?? fixture.score),
      )

      const pendingFixtures = completedFixtures.filter(
        (fixture) => matchIds[fixture.id] && !Object.hasOwn(cornerLabelsByFixture, fixture.id),
      )

      if (pendingFixtures.length === 0) {
        return
      }

      const entries = await Promise.all(
        pendingFixtures.map(async (fixture) => {
          try {
            const payload = await loadTitanMatchStats(matchIds[fixture.id])
            const cornerStat = payload.stats.find((stat) => stat.label === '角球')

            if (!cornerStat) {
              return [fixture.id, ''] as const
            }

            return [fixture.id, `${cornerStat.home}-${cornerStat.away}`] as const
          } catch (error) {
            console.error(`Unable to load corner stats for fixture ${fixture.id}.`, error)

            return [fixture.id, ''] as const
          }
        }),
      )

      if (!isDisposed) {
        setCornerLabelsByFixture((current) => ({
          ...current,
          ...Object.fromEntries(entries),
        }))
      }
    }

    void loadCornerStats()

    return () => {
      isDisposed = true
    }
  }, [liveScores, matchIds])

  const scheduleRows = [...groupFixtures]
    .sort(
      (left, right) =>
        parseFixtureDateTime(left.date, left.time) - parseFixtureDateTime(right.date, right.time),
    )
    .map((fixture, index) => ({
      matchNo: index + 1,
      date: fixture.date,
      weekday: getWeekday(fixture.date),
      time: fixture.time,
      homeTeam: fixture.homeTeam,
      score: liveScores[fixture.id] ?? fixture.score,
      cornerScore: cornerLabelsByFixture[fixture.id] ?? '',
      awayTeam: fixture.awayTeam,
      groupLabel: groups.find((group) => group.id === fixture.groupId)?.label ?? fixture.groupId,
      venue: groupFixtureVenues[fixture.id] ?? '待定',
      id: fixture.id,
    }))

  return (
    <main className="app-shell">
      <section className="panel schedule-panel schedule-page-panel">
        <div className="table-wrap schedule-table-wrap">
          <table>
            <thead>
              <tr>
                <th>場次</th>
                <th>日期</th>
                <th>星期</th>
                <th>時間</th>
                <th>主隊</th>
                <th>比分</th>
                <th>客隊</th>
                <th>組別</th>
                <th>比賽場地</th>
              </tr>
            </thead>
            <tbody>
              {scheduleRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.matchNo}</td>
                  <td>{row.date}</td>
                  <td>{row.weekday}</td>
                  <td>{row.time}</td>
                  <td className="team-name">{row.homeTeam}</td>
                  <td className="points">
                    {row.score}
                    {row.cornerScore ? `（角球 ${row.cornerScore}）` : ''}
                  </td>
                  <td className="team-name">{row.awayTeam}</td>
                  <td>{row.groupLabel}</td>
                  <td>{row.venue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}