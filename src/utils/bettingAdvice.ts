import type { FixtureOddsSnapshot } from '../data/oddsSnapshot'

type PredictionSet = {
  favorite: string
  homeWinPercent: number
  drawPercent: number
  awayWinPercent: number
  confidenceIndex: number
}

type FixtureLike = {
  homeTeam: string
  awayTeam: string
}

export type BettingAdvice = {
  winnerPick: string
  handicapPick: string
  cornerPick: string
  edgeLabel: string
  riskLabel: string
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

const impliedProbabilities = (homeOdds: number, drawOdds: number, awayOdds: number) => {
  const rawHome = 1 / homeOdds
  const rawDraw = 1 / drawOdds
  const rawAway = 1 / awayOdds
  const sum = rawHome + rawDraw + rawAway

  if (sum <= 0) {
    return {
      home: 0.33,
      draw: 0.34,
      away: 0.33,
    }
  }

  return {
    home: rawHome / sum,
    draw: rawDraw / sum,
    away: rawAway / sum,
  }
}

const pickRiskLabel = (confidenceIndex: number, edgePercent: number) => {
  if (confidenceIndex >= 82 && edgePercent >= 5) {
    return '中風險'
  }

  if (confidenceIndex >= 70 && edgePercent >= 2.5) {
    return '中高風險'
  }

  return '高風險'
}

export const buildBettingAdvice = (
  fixture: FixtureLike,
  prediction: PredictionSet,
  oddsSnapshot?: FixtureOddsSnapshot,
): BettingAdvice => {
  const modelHome = prediction.homeWinPercent / 100
  const modelAway = prediction.awayWinPercent / 100
  const modelDraw = prediction.drawPercent / 100

  const market = oddsSnapshot?.current1x2
    ? impliedProbabilities(
        oddsSnapshot.current1x2.home,
        oddsSnapshot.current1x2.draw,
        oddsSnapshot.current1x2.away,
      )
    : {
        home: modelHome,
        draw: modelDraw,
        away: modelAway,
      }

  const homeEdge = modelHome - market.home
  const awayEdge = modelAway - market.away
  const drawEdge = modelDraw - market.draw

  const favoriteSide =
    prediction.favorite === fixture.homeTeam
      ? 'home'
      : prediction.favorite === fixture.awayTeam
        ? 'away'
        : 'draw'

  const hasStrongFavorite =
    favoriteSide !== 'draw' &&
    prediction.confidenceIndex >= 68 &&
    Math.abs(prediction.homeWinPercent - prediction.awayWinPercent) >= 12

  let winnerSide: 'home' | 'draw' | 'away' = 'draw'
  let winnerPick = `${prediction.favorite} 勝`
  let edge = 0

  if (hasStrongFavorite) {
    winnerSide = favoriteSide
    winnerPick = favoriteSide === 'home' ? `${fixture.homeTeam} 勝` : `${fixture.awayTeam} 勝`
    edge = favoriteSide === 'home' ? homeEdge : awayEdge
  } else {
    if (homeEdge >= awayEdge && homeEdge >= drawEdge) {
      winnerSide = 'home'
      winnerPick = `${fixture.homeTeam} 勝`
      edge = homeEdge
    } else if (awayEdge >= homeEdge && awayEdge >= drawEdge) {
      winnerSide = 'away'
      winnerPick = `${fixture.awayTeam} 勝`
      edge = awayEdge
    } else {
      winnerSide = 'draw'
      winnerPick = '和局'
      edge = drawEdge
    }
  }

  const expectedGoalGap = clamp((prediction.homeWinPercent - prediction.awayWinPercent) / 22, -1.8, 1.8)
  const marketHandicap = oddsSnapshot?.currentHandicap?.line

  let handicapPick = ''

  if (marketHandicap !== undefined && marketHandicap !== null) {
    if (winnerSide === 'draw') {
      if (marketHandicap < 0) {
        handicapPick = `${fixture.awayTeam} +${Math.abs(marketHandicap).toFixed(2)}（受讓）`
      } else if (marketHandicap > 0) {
        handicapPick = `${fixture.homeTeam} +${Math.abs(marketHandicap).toFixed(2)}（受讓）`
      } else {
        handicapPick = '平手盤（和局傾向）'
      }
    } else if (winnerSide === 'home') {
      if (marketHandicap < 0) {
        handicapPick = `${fixture.homeTeam} ${marketHandicap.toFixed(2)}（讓球）`
      } else if (marketHandicap > 0) {
        handicapPick = `${fixture.homeTeam} +${marketHandicap.toFixed(2)}（受讓）`
      } else {
        handicapPick = `${fixture.homeTeam} 0（平手盤）`
      }
    } else {
      if (marketHandicap > 0) {
        handicapPick = `${fixture.awayTeam} -${marketHandicap.toFixed(2)}（讓球）`
      } else if (marketHandicap < 0) {
        handicapPick = `${fixture.awayTeam} +${Math.abs(marketHandicap).toFixed(2)}（受讓）`
      } else {
        handicapPick = `${fixture.awayTeam} 0（平手盤）`
      }
    }
  } else if (expectedGoalGap >= 0.65) {
    handicapPick = `${fixture.homeTeam} -0.75（讓球）`
  } else if (expectedGoalGap <= -0.65) {
    handicapPick = `${fixture.awayTeam} -0.75（讓球）`
  } else if (expectedGoalGap >= 0.2) {
    handicapPick = `${fixture.homeTeam} -0.25（讓球）`
  } else if (expectedGoalGap <= -0.2) {
    handicapPick = `${fixture.awayTeam} -0.25（讓球）`
  } else {
    handicapPick = `${prediction.favorite} 0（平手盤）`
  }

  const paceFactor = (1 - modelDraw) * 1.8
  const mismatchFactor = Math.abs(modelHome - modelAway) * 1.4
  const expectedCorners = clamp(8.2 + paceFactor + mismatchFactor, 8, 12)
  const cornerLine = oddsSnapshot?.currentCorners?.line ?? Math.round(expectedCorners * 2) / 2

  const cornerPick = expectedCorners >= cornerLine + 0.25
    ? `角球大 ${cornerLine.toFixed(1)}`
    : `角球細 ${cornerLine.toFixed(1)}`

  const edgePercent = Math.max(0, edge * 100)

  return {
    winnerPick,
    handicapPick,
    cornerPick,
    edgeLabel: `模型優勢 ${formatPercent(edge)}`,
    riskLabel: pickRiskLabel(prediction.confidenceIndex, edgePercent),
  }
}
