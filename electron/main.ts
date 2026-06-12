import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, ipcMain } from 'electron'
import {
  getCachedTitanLiveScores,
  getCachedWorldCupNews,
  getCachedWorldCupNewsArticle,
} from '../worldCupApiService'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1180,
    minHeight: 780,
    backgroundColor: '#f6efe1',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: false,
    },
  })

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
}

ipcMain.handle('worldcup:get-live-scores', async () => getCachedTitanLiveScores())
ipcMain.handle('worldcup:get-news', async () => getCachedWorldCupNews())
ipcMain.handle('worldcup:get-news-article', async (_event, pathValue: string) =>
  getCachedWorldCupNewsArticle(pathValue),
)

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})