import bracketBackdrop from '../assets/bracket-backdrop.svg'
import {
  finalMatch,
  quarterfinalMatches,
  roundOf16Matches,
  roundOf32Matches,
  semifinalMatches,
  thirdPlaceMatch,
} from '../data/worldCup'

const weekdayFormatter = new Intl.DateTimeFormat('zh-TW', { weekday: 'short' })

const getWeekday = (date: string) => {
  const parsedDate = new Date(`2026-${date}T00:00:00`)

  return weekdayFormatter.format(parsedDate)
}

const parseMatchup = (matchup: string) => {
  const [homeTeam = '', awayTeam = ''] = matchup.split(' - ')

  return { homeTeam, awayTeam }
}

type BracketMatch = {
  id: string
  matchNo: number
  date: string
  time: string
  venue: string
  matchup: string
}

type PositionedMatch = {
  match: BracketMatch
  x: number
  y: number
  width: number
  height: number
  tone:
    | 'round32'
    | 'round16'
    | 'quarter'
    | 'semi'
    | 'third'
    | 'final'
}

const boardWidth = 1480
const boardHeight = 1120
const roundOf32YOffset = -26
const roundOf32PairSpread = 16

const leftRoundOf32Order = [74, 77, 73, 75, 83, 84, 81, 82]
const rightRoundOf32Order = [76, 78, 79, 80, 86, 88, 85, 87]
const leftRoundOf16Order = [89, 90, 93, 94]
const rightRoundOf16Order = [91, 92, 95, 96]
const leftQuarterOrder = [97, 98]
const rightQuarterOrder = [99, 100]

const roundOf32Lookup = new Map(roundOf32Matches.map((match) => [match.matchNo, match]))
const roundOf16Lookup = new Map(roundOf16Matches.map((match) => [match.matchNo, match]))
const quarterLookup = new Map(quarterfinalMatches.map((match) => [match.matchNo, match]))

const createPositions = () => {
  const positions: PositionedMatch[] = []

  const pushMatches = (
    order: number[],
    lookup: Map<number, BracketMatch>,
    x: number,
    yValues: number[],
    width: number,
    height: number,
    tone: PositionedMatch['tone'],
  ) => {
    order.forEach((matchNo, index) => {
      const match = lookup.get(matchNo)

      if (!match) {
        return
      }

      positions.push({
        match,
        x,
        y: yValues[index],
        width,
        height,
        tone,
      })
    })
  }

  pushMatches(
    leftRoundOf32Order,
    roundOf32Lookup,
    16,
    [70, 155, 320, 405, 570, 655, 820, 905].map(
      (value, index) => value + roundOf32YOffset + (index % 2 === 1 ? roundOf32PairSpread : 0),
    ),
    170,
    84,
    'round32',
  )
  pushMatches(
    rightRoundOf32Order,
    roundOf32Lookup,
    1294,
    [70, 155, 320, 405, 570, 655, 820, 905].map(
      (value, index) => value + roundOf32YOffset + (index % 2 === 1 ? roundOf32PairSpread : 0),
    ),
    170,
    84,
    'round32',
  )
  pushMatches(leftRoundOf16Order, roundOf16Lookup, 200, [116, 365, 612, 860], 170, 84, 'round16')
  pushMatches(rightRoundOf16Order, roundOf16Lookup, 1110, [116, 365, 612, 860], 170, 84, 'round16')
  pushMatches(leftQuarterOrder, quarterLookup, 392, [250, 700], 172, 88, 'quarter')
  pushMatches(rightQuarterOrder, quarterLookup, 916, [250, 700], 172, 88, 'quarter')

  positions.push({
    match: semifinalMatches[0],
    x: 558,
    y: 432,
    width: 180,
    height: 88,
    tone: 'semi',
  })
  positions.push({
    match: semifinalMatches[1],
    x: 742,
    y: 432,
    width: 180,
    height: 88,
    tone: 'semi',
  })
  positions.push({
    match: thirdPlaceMatch[0],
    x: 640,
    y: 252,
    width: 200,
    height: 88,
    tone: 'third',
  })
  positions.push({
    match: finalMatch[0],
    x: 505,
    y: 865,
    width: 470,
    height: 156,
    tone: 'final',
  })

  return positions
}

const positionedMatches = createPositions()
const positionLookup = new Map(positionedMatches.map((item) => [item.match.matchNo, item]))

const roundedElbowPath = (startX: number, startY: number, endX: number, endY: number, midX: number) => {
  const dirToMid = Math.sign(midX - startX) || 1
  const dirToEnd = Math.sign(endX - midX) || dirToMid
  const dirY = Math.sign(endY - startY) || 1
  const radius = Math.max(
    8,
    Math.min(18, Math.abs(midX - startX) / 2, Math.abs(endX - midX) / 2, Math.abs(endY - startY) / 2),
  )
  const horizontalEntry = midX - dirToMid * radius
  const verticalExit = endY - dirY * radius
  const horizontalResume = midX + dirToEnd * radius

  return [
    `M ${startX} ${startY}`,
    `H ${horizontalEntry}`,
    `Q ${midX} ${startY} ${midX} ${startY + dirY * radius}`,
    `V ${verticalExit}`,
    `Q ${midX} ${endY} ${horizontalResume} ${endY}`,
    `H ${endX}`,
  ].join(' ')
}

const roundedVerticalPath = (startX: number, startY: number, endX: number, endY: number, midY: number) => {
  const dirToMid = Math.sign(midY - startY) || -1
  const dirToEnd = Math.sign(endY - midY) || dirToMid
  const dirX = Math.sign(endX - startX) || 1
  const radius = Math.max(
    8,
    Math.min(18, Math.abs(midY - startY) / 2, Math.abs(endX - startX) / 2, Math.abs(endY - midY) / 2),
  )
  const verticalEntry = midY - dirToMid * radius
  const horizontalExit = endX - dirX * radius
  const verticalResume = midY + dirToEnd * radius

  return [
    `M ${startX} ${startY}`,
    `V ${verticalEntry}`,
    `Q ${startX} ${midY} ${startX + dirX * radius} ${midY}`,
    `H ${horizontalExit}`,
    `Q ${endX} ${midY} ${endX} ${verticalResume}`,
    `V ${endY}`,
  ].join(' ')
}

const connectorPath = (fromMatchNo: number, toMatchNo: number, side: 'left' | 'right') => {
  const from = positionLookup.get(fromMatchNo)
  const to = positionLookup.get(toMatchNo)

  if (!from || !to) {
    return ''
  }

  const startX = side === 'left' ? from.x + from.width : from.x
  const endX = side === 'left' ? to.x : to.x + to.width
  const startY = from.y + from.height / 2
  const endY = to.y + to.height / 2
  const gap = Math.abs(endX - startX)
  const bendOffset = Math.max(26, Math.min(42, gap * 0.26))
  const midX = side === 'left' ? startX + bendOffset : startX - bendOffset

  return roundedElbowPath(startX, startY, endX, endY, midX)
}

const verticalConnector = (fromMatchNo: number, toMatchNo: number, position: 'top' | 'bottom') => {
  const from = positionLookup.get(fromMatchNo)
  const to = positionLookup.get(toMatchNo)

  if (!from || !to) {
    return ''
  }

  const startX = from.x + from.width / 2
  const startY = position === 'top' ? from.y : from.y + from.height
  const endX = to.x + to.width / 2
  const endY = position === 'top' ? to.y + to.height : to.y
  const midY = position === 'top' ? startY - 30 : startY + 38

  return roundedVerticalPath(startX, startY, endX, endY, midY)
}

function BracketCard({ item }: { item: PositionedMatch }) {
  const { homeTeam, awayTeam } = parseMatchup(item.match.matchup)
  const isFinal = item.tone === 'final'
  const headerText = `${item.match.date} ${getWeekday(item.match.date)} ${item.match.time}`

  return (
    <article
      className={`bracket-card bracket-card-${item.tone}`}
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
      }}
    >
      <div className="bracket-card-head">
        <span className="bracket-card-number">{item.match.matchNo}</span>
        <span className="bracket-card-head-text">{headerText}</span>
      </div>
      <div className={`bracket-card-body${isFinal ? ' bracket-card-body-final' : ''}`}>
        <div className="bracket-card-row">{homeTeam}</div>
        <div className="bracket-card-row">{awayTeam}</div>
      </div>
      {isFinal ? <div className="bracket-card-meta">{item.match.venue}</div> : null}
    </article>
  )
}

export function BracketPage() {
  const linePaths = [
    connectorPath(74, 89, 'left'),
    connectorPath(77, 89, 'left'),
    connectorPath(73, 90, 'left'),
    connectorPath(75, 90, 'left'),
    connectorPath(83, 93, 'left'),
    connectorPath(84, 93, 'left'),
    connectorPath(81, 94, 'left'),
    connectorPath(82, 94, 'left'),
    connectorPath(76, 91, 'right'),
    connectorPath(78, 91, 'right'),
    connectorPath(79, 92, 'right'),
    connectorPath(80, 92, 'right'),
    connectorPath(86, 95, 'right'),
    connectorPath(88, 95, 'right'),
    connectorPath(85, 96, 'right'),
    connectorPath(87, 96, 'right'),
    connectorPath(89, 97, 'left'),
    connectorPath(90, 97, 'left'),
    connectorPath(93, 98, 'left'),
    connectorPath(94, 98, 'left'),
    connectorPath(91, 99, 'right'),
    connectorPath(92, 99, 'right'),
    connectorPath(95, 100, 'right'),
    connectorPath(96, 100, 'right'),
    connectorPath(97, 101, 'left'),
    connectorPath(98, 101, 'left'),
    connectorPath(99, 102, 'right'),
    connectorPath(100, 102, 'right'),
    verticalConnector(101, 103, 'top'),
    verticalConnector(102, 103, 'top'),
    verticalConnector(101, 104, 'bottom'),
    verticalConnector(102, 104, 'bottom'),
  ].filter(Boolean)

  return (
    <main className="app-shell bracket-page-shell">
      <section className="panel bracket-panel">
        <div className="bracket-scroll-wrap">
          <div
            className="bracket-board"
            style={{ backgroundImage: `linear-gradient(180deg, rgba(10, 17, 32, 0.18), rgba(10, 17, 32, 0.08)), url(${bracketBackdrop})` }}
          >
            <div className="bracket-top-mark">
              <div className="bracket-title-block">
                <strong>FIFA World Cup 2026</strong>
                <span>USA MEXICO CANADA</span>
              </div>
            </div>

            <div className="bracket-stage-chip bracket-stage-chip-third">季軍賽</div>
            <div className="bracket-stage-chip bracket-stage-chip-final">決賽</div>

            <svg
              className="bracket-lines"
              viewBox={`0 0 ${boardWidth} ${boardHeight}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {linePaths.map((path, index) => (
                <path key={`${path}-${index}`} d={path} />
              ))}
            </svg>

            {positionedMatches.map((item) => (
              <BracketCard key={item.match.id} item={item} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}