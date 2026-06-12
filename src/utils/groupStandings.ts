import { groupFixtures, groups, type Group, type TeamStanding } from '../data/worldCup'

type LiveGroup = Group & { teams: Array<TeamStanding & { form: string[] }> }

type ProbabilitySet = {
  favorite: string
  homeWinPercent: number
  drawPercent: number
  awayWinPercent: number
  confidenceIndex: number
}

type KnockoutMatchLike = {
  matchNo: number
  matchup: string
}

export const parseScore = (score: string) => {
  const matchedScore = score.match(/(\d+)\s*[-:：]\s*(\d+)/)

  if (!matchedScore) {
    return null
  }

  return {
    home: Number(matchedScore[1]),
    away: Number(matchedScore[2]),
  }
}

export const buildLiveStandings = (liveScores: Record<string, string>) =>
  groups.map((group) => {
    const teamMap = new Map<string, TeamStanding & { form: string[] }>(
      group.teams.map((team) => [
        team.team,
        {
          ...team,
          form: [] as string[],
        },
      ]),
    )

    groupFixtures
      .filter((fixture) => fixture.groupId === group.id)
      .forEach((fixture) => {
        const score = parseScore(liveScores[fixture.id] ?? fixture.score)

        if (!score) {
          return
        }

        const homeTeam = teamMap.get(fixture.homeTeam)
        const awayTeam = teamMap.get(fixture.awayTeam)

        if (!homeTeam || !awayTeam) {
          return
        }

        homeTeam.played += 1
        awayTeam.played += 1
        homeTeam.goalsFor += score.home
        homeTeam.goalsAgainst += score.away
        awayTeam.goalsFor += score.away
        awayTeam.goalsAgainst += score.home

        if (score.home > score.away) {
          homeTeam.won += 1
          awayTeam.lost += 1
          homeTeam.points += 3
          homeTeam.form.push('W')
          awayTeam.form.push('L')

          return
        }

        if (score.home < score.away) {
          awayTeam.won += 1
          homeTeam.lost += 1
          awayTeam.points += 3
          homeTeam.form.push('L')
          awayTeam.form.push('W')

          return
        }

        homeTeam.drawn += 1
        awayTeam.drawn += 1
        homeTeam.points += 1
        awayTeam.points += 1
        homeTeam.form.push('D')
        awayTeam.form.push('D')
      })

    const teams = [...teamMap.values()]
      .map((team) => ({
        ...team,
        form: team.form.slice(-5),
      }))
      .sort((left, right) => {
        const pointDiff = right.points - left.points

        if (pointDiff !== 0) {
          return pointDiff
        }

        const goalDiff = right.goalsFor - right.goalsAgainst - (left.goalsFor - left.goalsAgainst)

        if (goalDiff !== 0) {
          return goalDiff
        }

        const goalsForDiff = right.goalsFor - left.goalsFor

        if (goalsForDiff !== 0) {
          return goalsForDiff
        }

        return left.team.localeCompare(right.team, 'zh-Hant')
      })

    return {
      ...group,
      teams,
    }
  }) satisfies LiveGroup[]

const formWeight = { W: 1, D: 0, L: -1 }

const baseTeamStrength: Record<string, number> = {
  捷克: 55,
  南非: 45,
  墨西哥: 60,
  南韓: 56,
  瑞士: 59,
  波斯尼亞: 49,
  加拿大: 58,
  卡塔爾: 47,
  蘇格蘭: 54,
  巴西: 66,
  摩洛哥: 60,
  海地: 43,
  土耳其: 57,
  巴拉圭: 54,
  美國: 58,
  澳洲: 53,
  德國: 64,
  厄瓜多爾: 55,
  科特迪瓦: 54,
  庫拉索: 44,
  瑞典: 56,
  荷蘭: 65,
  突尼西亞: 50,
  日本: 59,
  比利時: 63,
  埃及: 52,
  伊朗: 51,
  紐西蘭: 44,
  烏拉圭: 62,
  西班牙: 65,
  佛得角: 46,
  沙地阿拉伯: 48,
  挪威: 57,
  法國: 67,
  塞內加爾: 58,
  伊拉克: 45,
  奧地利: 55,
  阿根廷: 66,
  約旦: 44,
  阿爾及利亞: 50,
  葡萄牙: 64,
  哥倫比亞: 61,
  剛果: 46,
  烏茲別克: 50,
  英格蘭: 66,
  克羅地亞: 60,
  巴拿馬: 46,
  加納: 51,
}

const getTeamStrength = (team: TeamStanding & { form: string[] }) => {
  const baseStrength = baseTeamStrength[team.team] ?? 50

  if (team.played === 0) {
    return baseStrength
  }

  const pointsPerMatch = team.points / team.played
  const goalDiffPerMatch = (team.goalsFor - team.goalsAgainst) / team.played
  const goalsForPerMatch = team.goalsFor / team.played
  const formScore = team.form.reduce((sum, item) => sum + formWeight[item as keyof typeof formWeight], 0)
  const liveStrength = 50 + pointsPerMatch * 10 + goalDiffPerMatch * 8 + goalsForPerMatch * 4 + formScore * 2
  const baseWeight = clamp(0.55 - (team.played - 1) * 0.12, 0.18, 0.55)

  return baseStrength * baseWeight + liveStrength * (1 - baseWeight)
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const parseMatchup = (matchup: string) => {
  const [homeTeam = matchup, awayTeam = ''] = matchup.split(' - ')

  return {
    homeTeam: homeTeam.trim(),
    awayTeam: awayTeam.trim() || '待定',
  }
}

const formatPrediction = (
  homeLabel: string,
  awayLabel: string,
  homeStrength: number,
  awayStrength: number,
): ProbabilitySet => {
  const adjustedDiff = homeStrength + 4 - awayStrength
  const winBias = 1 / (1 + Math.exp(-adjustedDiff / 10))
  const drawProbability = clamp(0.3 - Math.abs(adjustedDiff) * 0.004, 0.16, 0.3)
  const remainingProbability = 1 - drawProbability
  const homeWinProbability = remainingProbability * winBias
  const roundedHome = Math.round(homeWinProbability * 100)
  const roundedDraw = Math.round(drawProbability * 100)
  const roundedAway = Math.max(0, 100 - roundedHome - roundedDraw)

  const resultOptions = [
    { label: homeLabel, probability: roundedHome },
    { label: '和局', probability: roundedDraw },
    { label: awayLabel, probability: roundedAway },
  ].sort((left, right) => right.probability - left.probability)

  return {
    favorite: resultOptions[0]?.label ?? homeLabel,
    homeWinPercent: roundedHome,
    drawPercent: roundedDraw,
    awayWinPercent: roundedAway,
    confidenceIndex: clamp(55 + (resultOptions[0]?.probability ?? roundedHome) - (resultOptions[1]?.probability ?? roundedDraw), 55, 96),
  }
}

const getLiveGroupTeamByRank = (liveGroups: LiveGroup[], groupId: string, rank: number) => {
  const group = liveGroups.find((item) => item.id === groupId)

  return group?.teams[rank - 1]
}

const getTokenStrength = (
  token: string,
  liveGroups: LiveGroup[],
  knockoutLookup: Map<number, KnockoutMatchLike>,
  cache: Map<string, number>,
): number => {
  const normalizedToken = token.trim()

  if (cache.has(normalizedToken)) {
    return cache.get(normalizedToken) ?? 50
  }

  if (normalizedToken.includes('/')) {
    const candidates = normalizedToken
      .split('/')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => getTokenStrength(item, liveGroups, knockoutLookup, cache))
    const averageStrength = candidates.length > 0 ? candidates.reduce((sum, item) => sum + item, 0) / candidates.length : 50

    cache.set(normalizedToken, averageStrength)

    return averageStrength
  }

  const exactTeam = liveGroups.flatMap((group) => group.teams).find((team) => team.team === normalizedToken)

  if (exactTeam) {
    const strength = getTeamStrength(exactTeam)
    cache.set(normalizedToken, strength)

    return strength
  }

  const groupRankMatch = normalizedToken.match(/^([A-L])(1|2|3)$/)

  if (groupRankMatch) {
    const groupId = groupRankMatch[1]
    const rank = Number(groupRankMatch[2])
    const rankBonus = rank === 1 ? 7 : rank === 2 ? 1 : -5
    const rankedTeam = getLiveGroupTeamByRank(liveGroups, groupId, rank)
    const strength = (rankedTeam ? getTeamStrength(rankedTeam) : 50) + rankBonus

    cache.set(normalizedToken, strength)

    return strength
  }

  const winnerLoserMatch = normalizedToken.match(/^(\d+)(勝者|負者)$/)

  if (winnerLoserMatch) {
    const sourceMatchNo = Number(winnerLoserMatch[1])
    const sourceMatch = knockoutLookup.get(sourceMatchNo)

    if (!sourceMatch) {
      return 50
    }

    const { homeTeam, awayTeam } = parseMatchup(sourceMatch.matchup)
    const homeStrength = getTokenStrength(homeTeam, liveGroups, knockoutLookup, cache)
    const awayStrength = getTokenStrength(awayTeam, liveGroups, knockoutLookup, cache)
    const stronger = Math.max(homeStrength, awayStrength)
    const weaker = Math.min(homeStrength, awayStrength)
    const diff = Math.abs(homeStrength - awayStrength)
    const strength = winnerLoserMatch[2] === '勝者' ? stronger + diff * 0.2 : weaker - diff * 0.08

    cache.set(normalizedToken, strength)

    return strength
  }

  cache.set(normalizedToken, 50)

  return 50
}

export const predictFixture = (
  fixture: { groupLabel: string; homeTeam: string; awayTeam: string },
  liveGroups: LiveGroup[],
) => {
  const group = liveGroups.find((item) => item.label === fixture.groupLabel)
  const homeTeam = group?.teams.find((item) => item.team === fixture.homeTeam)
  const awayTeam = group?.teams.find((item) => item.team === fixture.awayTeam)

  const homeStrength = homeTeam ? getTeamStrength(homeTeam) : 50
  const awayStrength = awayTeam ? getTeamStrength(awayTeam) : 50

  return formatPrediction(fixture.homeTeam, fixture.awayTeam, homeStrength, awayStrength)
}

export const predictKnockoutMatch = (
  matchup: string,
  liveGroups: LiveGroup[],
  knockoutMatches: KnockoutMatchLike[],
) => {
  const { homeTeam, awayTeam } = parseMatchup(matchup)
  const knockoutLookup = new Map(knockoutMatches.map((match) => [match.matchNo, match]))
  const cache = new Map<string, number>()
  const homeStrength = getTokenStrength(homeTeam, liveGroups, knockoutLookup, cache)
  const awayStrength = getTokenStrength(awayTeam, liveGroups, knockoutLookup, cache)

  return formatPrediction(homeTeam, awayTeam, homeStrength, awayStrength)
}