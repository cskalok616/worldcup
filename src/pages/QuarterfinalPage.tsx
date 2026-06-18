import {
  finalMatch,
  quarterfinalMatches,
  roundOf16Matches,
  roundOf32Matches,
  semifinalMatches,
  thirdPlaceMatch,
} from '../data/worldCup'
import { buildLiveStandings, predictKnockoutMatch } from '../utils/groupStandings'

const weekdayFormatter = new Intl.DateTimeFormat('zh-TW', { weekday: 'short' })

const getWeekday = (date: string) => {
  const parsedDate = new Date(`2026-${date}T00:00:00`)

  return weekdayFormatter.format(parsedDate)
}

const parseMatchup = (matchup: string) => {
  const [homeTeam = matchup, awayTeam = ''] = matchup.split(' - ')

  return { homeTeam, awayTeam: awayTeam || '待定' }
}

const isPlaceholderToken = (token: string) => {
  const normalizedToken = token.trim()

  return (
    normalizedToken.length === 0 ||
    normalizedToken === '待定' ||
    normalizedToken.includes('/') ||
    /^[A-L](1|2|3)$/.test(normalizedToken) ||
    /^\d+(勝者|負者)$/.test(normalizedToken)
  )
}

const canPredictMatchup = (matchup: string) => {
  const { homeTeam, awayTeam } = parseMatchup(matchup)

  return !isPlaceholderToken(homeTeam) && !isPlaceholderToken(awayTeam)
}

type KnockoutTableSectionProps = {
  title: string
  kicker: string
  liveScores: Record<string, string>
  predictionMatches: Array<{
    matchNo: number
    matchup: string
  }>
  matches: Array<{
    id: string
    matchNo: number
    date: string
    time: string
    venue: string
    matchup: string
  }>
}

function KnockoutTableSection({ title, kicker, matches, liveScores, predictionMatches }: KnockoutTableSectionProps) {
  const liveGroups = buildLiveStandings(liveScores)

  return (
    <section className="panel schedule-panel">
      <div className="panel-heading">
        <p className="panel-kicker">{kicker}</p>
        <h2>{title}</h2>
      </div>
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
            {matches.map((match) => {
              const { homeTeam, awayTeam } = parseMatchup(match.matchup)
              const canPredict = canPredictMatchup(match.matchup)
              const prediction = canPredict
                ? predictKnockoutMatch(match.matchup, liveGroups, predictionMatches)
                : null

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
                    {prediction ? (
                      <>
                        <strong>{prediction.favorite}</strong>
                        <span>信心 {prediction.confidenceIndex}</span>
                      </>
                    ) : (
                      <span>待定</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

type QuarterfinalPageProps = {
  liveScores: Record<string, string>
}

export function QuarterfinalPage({ liveScores }: QuarterfinalPageProps) {
  const quarterPredictionMatches = [...roundOf32Matches, ...roundOf16Matches, ...quarterfinalMatches]
  const semifinalPredictionMatches = [...quarterPredictionMatches, ...semifinalMatches]
  const finalPredictionMatches = [...semifinalPredictionMatches, ...thirdPlaceMatch, ...finalMatch]

  return (
    <main className="app-shell">
      <KnockoutTableSection title="8 強賽程" kicker="Quarterfinals" matches={quarterfinalMatches} liveScores={liveScores} predictionMatches={quarterPredictionMatches} />
      <KnockoutTableSection title="半決賽" kicker="Semifinals" matches={semifinalMatches} liveScores={liveScores} predictionMatches={semifinalPredictionMatches} />
      <KnockoutTableSection title="季軍賽" kicker="Third Place" matches={thirdPlaceMatch} liveScores={liveScores} predictionMatches={finalPredictionMatches} />
      <KnockoutTableSection title="決賽" kicker="Final" matches={finalMatch} liveScores={liveScores} predictionMatches={finalPredictionMatches} />
    </main>
  )
}