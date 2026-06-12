import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('worldCupApi', {
  isElectron: true,
  getLiveScores: () => ipcRenderer.invoke('worldcup:get-live-scores'),
  getNews: () => ipcRenderer.invoke('worldcup:get-news'),
  getNewsArticle: (path: string) => ipcRenderer.invoke('worldcup:get-news-article', path),
})