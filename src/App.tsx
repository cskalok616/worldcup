import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { BracketPage } from './pages/BracketPage'
import { useTitanLiveScores } from './hooks/useTitanLiveScores'
import { HomePage } from './pages/HomePage'
import { QuarterfinalPage } from './pages/QuarterfinalPage'
import { RoundOf16Page } from './pages/RoundOf16Page'
import { RoundOf32Page } from './pages/RoundOf32Page'
import { SchedulePage } from './pages/SchedulePage'
import { StandingsPage } from './pages/StandingsPage'

function formatUpdatedAt(updatedAt: string) {
  const date = new Date(updatedAt)

  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${String(
    date.getHours(),
  ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function App() {
  const { liveScores, updatedAt } = useTitanLiveScores()
  const formattedUpdatedAt = updatedAt ? formatUpdatedAt(updatedAt) : '載入中'

  return (
    <div className="route-shell">
      <header className="site-header">
        <NavLink to="/" className="site-brand">
          <div>
            <strong>World Cup 2026</strong>
            <span>賽程與積分榜</span>
          </div>
        </NavLink>

        <nav className="site-nav" aria-label="Main navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? 'site-nav-link active' : 'site-nav-link'
            }
          >
            首頁
          </NavLink>
          <NavLink
            to="/schedule"
            className={({ isActive }) =>
              isActive ? 'site-nav-link active' : 'site-nav-link'
            }
          >
            小組賽賽程
          </NavLink>
          <NavLink
            to="/standings"
            className={({ isActive }) =>
              isActive ? 'site-nav-link active' : 'site-nav-link'
            }
          >
            小組賽積分榜
          </NavLink>
          <NavLink
            to="/round-of-32"
            className={({ isActive }) =>
              isActive ? 'site-nav-link active' : 'site-nav-link'
            }
          >
            32強賽程
          </NavLink>
          <NavLink
            to="/round-of-16"
            className={({ isActive }) =>
              isActive ? 'site-nav-link active' : 'site-nav-link'
            }
          >
            16強賽程
          </NavLink>
          <NavLink
            to="/quarterfinals"
            className={({ isActive }) =>
              isActive ? 'site-nav-link active' : 'site-nav-link'
            }
          >
            8強賽程
          </NavLink>
          <NavLink
            to="/bracket"
            className={({ isActive }) =>
              isActive ? 'site-nav-link active' : 'site-nav-link'
            }
          >
            對陣圖
          </NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<HomePage liveScores={liveScores} />} />
        <Route path="/schedule" element={<SchedulePage liveScores={liveScores} />} />
        <Route path="/standings" element={<StandingsPage liveScores={liveScores} />} />
        <Route path="/round-of-32" element={<RoundOf32Page liveScores={liveScores} />} />
        <Route path="/round-of-16" element={<RoundOf16Page liveScores={liveScores} />} />
        <Route path="/quarterfinals" element={<QuarterfinalPage liveScores={liveScores} />} />
        <Route path="/bracket" element={<BracketPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <footer className="site-footer">
        <span>資料更新時間：{formattedUpdatedAt}</span>
      </footer>
    </div>
  )
}

export default App
