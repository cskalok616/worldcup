import { groupFixtureVenues, groupFixtures, groups } from '../data/worldCup'

const weekdayFormatter = new Intl.DateTimeFormat('zh-TW', { weekday: 'short' })

const getWeekday = (date: string) => {
  const parsedDate = new Date(`2026-${date}T00:00:00`)

  return weekdayFormatter.format(parsedDate)
}

const parseFixtureDateTime = (date: string, time: string) => new Date(`2026-${date}T${time}:00`).getTime()

type SchedulePageProps = {
  liveScores: Record<string, string>
}

export function SchedulePage({ liveScores }: SchedulePageProps) {
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
                  <td className="points">{row.score}</td>
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