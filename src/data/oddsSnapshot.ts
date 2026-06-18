export type OddsThreeWay = {
  home: number
  draw: number
  away: number
}

export type HandicapSnapshot = {
  line: number
  homeOdds: number
  awayOdds: number
}

export type CornersSnapshot = {
  line: number
  overOdds: number
  underOdds: number
}

export type FixtureOddsSnapshot = {
  fixtureId: string
  source: string
  sourceUrl: string
  capturedAt: string
  opening1x2: OddsThreeWay | null
  current1x2: OddsThreeWay
  openingHandicap: HandicapSnapshot | null
  currentHandicap: HandicapSnapshot | null
  openingCorners: CornersSnapshot | null
  currentCorners: CornersSnapshot | null
}

export const oddsSnapshotUpdatedAt = '2026-06-17T00:00:00+08:00'

export const fixtureOddsSnapshots: FixtureOddsSnapshot[] = [
  {
    fixtureId: 'k-1',
    source: 'Flashscore odds comparison',
    sourceUrl:
      'https://www.flashscore.com/match/football/d-r-congo-phn9mm8H/portugal-WvJrjFVN/odds/?mid=4zTHJLbM',
    capturedAt: '2026-06-17T18:00:00+08:00',
    opening1x2: null,
    current1x2: {
      home: 1.27,
      draw: 5.42,
      away: 12.0,
    },
    openingHandicap: null,
    currentHandicap: {
      line: -2,
      homeOdds: 1.95,
      awayOdds: 1.87,
    },
    openingCorners: null,
    currentCorners: {
      line: 9.5,
      overOdds: 1.9,
      underOdds: 1.9,
    },
  },
  {
    fixtureId: 'l-1',
    source: 'Flashscore odds comparison',
    sourceUrl:
      'https://www.flashscore.com/match/football/croatia-K8aznggo/england-j9N9ZNFA/odds/?mid=b5qGuKMs',
    capturedAt: '2026-06-17T18:00:00+08:00',
    opening1x2: null,
    current1x2: {
      home: 1.68,
      draw: 3.7,
      away: 5.4,
    },
    openingHandicap: null,
    currentHandicap: {
      line: -0.75,
      homeOdds: 1.92,
      awayOdds: 1.92,
    },
    openingCorners: null,
    currentCorners: {
      line: 9,
      overOdds: 1.88,
      underOdds: 1.92,
    },
  },
  {
    fixtureId: 'l-2',
    source: 'Flashscore odds comparison',
    sourceUrl:
      'https://www.flashscore.com/match/football/ghana-nNBjHale/panama-OWKqbCfi/odds/?mid=jD1Nwbif',
    capturedAt: '2026-06-17T18:00:00+08:00',
    opening1x2: null,
    current1x2: {
      home: 2.33,
      draw: 3.1,
      away: 3.3,
    },
    openingHandicap: null,
    currentHandicap: {
      line: -0.25,
      homeOdds: 1.94,
      awayOdds: 1.9,
    },
    openingCorners: null,
    currentCorners: {
      line: 8.5,
      overOdds: 1.91,
      underOdds: 1.89,
    },
  },
  {
    fixtureId: 'k-2',
    source: 'Flashscore odds comparison',
    sourceUrl:
      'https://www.flashscore.com/match/football/colombia-G02s4PCS/uzbekistan-EZYKKRMc/odds/?mid=jaMlPbx1',
    capturedAt: '2026-06-17T18:00:00+08:00',
    opening1x2: null,
    current1x2: {
      home: 9,
      draw: 4.75,
      away: 1.37,
    },
    openingHandicap: null,
    currentHandicap: {
      line: 1.25,
      homeOdds: 1.93,
      awayOdds: 1.91,
    },
    openingCorners: null,
    currentCorners: {
      line: 9,
      overOdds: 1.9,
      underOdds: 1.9,
    },
  },
]

export const fixtureOddsSnapshotMap = new Map(
  fixtureOddsSnapshots.map((snapshot) => [snapshot.fixtureId, snapshot]),
)
