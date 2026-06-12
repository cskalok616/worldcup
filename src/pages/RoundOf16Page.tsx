import { roundOf16Matches, roundOf32Matches } from '../data/worldCup'
import { buildLiveStandings, predictKnockoutMatch } from '../utils/groupStandings'

const weekdayFormatter = new Intl.DateTimeFormat('zh-TW', { weekday: 'short' })

const getWeekday = (date: string) => {
  const parsedDate = new Date(`2026-${date}T00:00:00`)

  return weekdayFormatter.format(parsedDate)
}

const parseMatchup = (matchup: string) => {
  const [homeTeam = '', awayTeam = ''] = matchup.split(' - ')

  return { homeTeam, awayTeam }
}

type RoundOf16PageProps = {
  liveScores: Record<string, string>
}

export function RoundOf16Page({ liveScores }: RoundOf16PageProps) {
  const liveGroups = buildLiveStandings(liveScores)
  const predictionMatches = [...roundOf32Matches, ...roundOf16Matches]

  return (
    <main className="app-shell">
      <section className="panel schedule-panel schedule-page-panel">
        <div className="table-wrap schedule-table-wrap">
          <table>
            <thead>
              <tr>
                <th>場序</th>
                <th>日期</th>
                <th>星期</th>
                <th>時間</th>
                <th>主隊</th>
                <th>比分</th>
                <th>客隊</th>
                <th>比賽場地</th>
                <th>預測</th>
              </tr>
            </thead>
            <tbody>
              {roundOf16Matches.map((match) => {
                const { homeTeam, awayTeam } = parseMatchup(match.matchup)
                const prediction = predictKnockoutMatch(match.matchup, liveGroups, predictionMatches)

                return (
                  <tr key={match.id}>
                    <td>{match.matchNo}</td>
                    <td>{match.date}</td>
                    <td>{getWeekday(match.date)}</td>
                    <td>{match.time}</td>
                    <td className="team-name">{homeTeam}</td>
                    <td className="points">VS</td>
                    <td className="team-name">{awayTeam}</td>
                    <td>{match.venue}</td>
                    <td className="prediction-table-cell">
                      <strong>{prediction.favorite}</strong>
                      <span>信心 {prediction.confidenceIndex}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}