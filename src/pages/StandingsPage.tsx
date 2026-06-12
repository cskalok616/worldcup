import { useState } from 'react'
import { groupFixtures, groups } from '../data/worldCup'
import { buildLiveStandings } from '../utils/groupStandings'

const weekdayFormatter = new Intl.DateTimeFormat('zh-TW', { weekday: 'short' })

const getFixtureWeekday = (date: string) => {
  const parsedDate = new Date(`2026-${date}T00:00:00`)

  return weekdayFormatter.format(parsedDate)
}

type StandingsPageProps = {
  liveScores: Record<string, string>
}

export function StandingsPage({ liveScores }: StandingsPageProps) {
  const liveGroups = buildLiveStandings(liveScores)
  const [activeGroup, setActiveGroup] = useState(groups[0].id)

  const selectedGroup = liveGroups.find((group) => group.id === activeGroup) ?? liveGroups[0]
  const selectedGroupFixtures = groupFixtures.filter((fixture) => fixture.groupId === activeGroup)

  return (
    <main className="app-shell">
      <section className="panel standings-panel standings-page-panel">
        <div className="group-tabs" role="tablist" aria-label="World Cup groups">
          {liveGroups.map((group) => (
            <button
              key={group.id}
              type="button"
              className={group.id === activeGroup ? 'group-tab active' : 'group-tab'}
              onClick={() => setActiveGroup(group.id)}
            >
              {group.label}
            </button>
          ))}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>排名</th>
                <th>球隊</th>
                <th>賽</th>
                <th>勝</th>
                <th>和</th>
                <th>負</th>
                <th>得</th>
                <th>失</th>
                <th>淨</th>
                <th>積分</th>
                <th>近況</th>
              </tr>
            </thead>
            <tbody>
              {selectedGroup.teams.map((team, index) => (
                <tr key={team.team}>
                  <td>{index + 1}</td>
                  <td className="team-name">{team.team}</td>
                  <td>{team.played}</td>
                  <td>{team.won}</td>
                  <td>{team.drawn}</td>
                  <td>{team.lost}</td>
                  <td>{team.goalsFor}</td>
                  <td>{team.goalsAgainst}</td>
                  <td>{team.goalsFor - team.goalsAgainst}</td>
                  <td className="points">{team.points}</td>
                  <td>
                    <div className="form-strip" aria-label={`${team.team} recent form`}>
                      {team.form.map((result, formIndex) => (
                        <span
                          key={`${team.team}-${formIndex}`}
                          className={
                            result === 'W'
                              ? 'form-pill win'
                              : result === 'D'
                                ? 'form-pill draw'
                                : 'form-pill loss'
                          }
                        >
                          {result}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedGroupFixtures.length > 0 ? (
          <div className="group-fixtures">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>星期</th>
                    <th>時間</th>
                    <th>主隊</th>
                    <th>比分</th>
                    <th>客隊</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGroupFixtures.map((fixture) => (
                    <tr key={fixture.id}>
                      <td>{fixture.date}</td>
                      <td>{getFixtureWeekday(fixture.date)}</td>
                      <td>{fixture.time}</td>
                      <td className="team-name">{fixture.homeTeam}</td>
                      <td className="points">{liveScores[fixture.id] ?? fixture.score}</td>
                      <td className="team-name">{fixture.awayTeam}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  )
}