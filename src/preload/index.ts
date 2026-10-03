import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppData,
  Language,
  LevelPlan,
  LevelSearchQuery,
  SyncResult
} from '../shared/types'

export interface SyncRequest {
  input: string
  existing: LevelPlan[]
  addNew: boolean
  fetchDetails: boolean
  /** Добирать из Global Demonlist уровни, которых ещё нет в профиле игрока. */
  addUncompleted: boolean
}

export interface StringsChangedPayload {
  overrides: Record<string, string>
  language: Language
}

const api = {
  loadData: (): Promise<AppData> => ipcRenderer.invoke('data:load'),
  saveData: (data: AppData): Promise<AppData> => ipcRenderer.invoke('data:save', data),
  searchLevels: (query: LevelSearchQuery): Promise<unknown[]> => ipcRenderer.invoke('api:searchLevels', query),
  getLevel: (id: number): Promise<unknown> => ipcRenderer.invoke('api:getLevel', id),
  syncUser: (request: SyncRequest): Promise<SyncResult> => ipcRenderer.invoke('api:syncUser', request),
  openExternal: (url: string): Promise<boolean> => ipcRenderer.invoke('app:openExternal', url),
  fetchImage: (url: string): Promise<string> => ipcRenderer.invoke('media:fetchImage', url),
  exportData: (defaultName: string): Promise<string | null> => ipcRenderer.invoke('file:export', defaultName),
  importData: (): Promise<{ path: string; data: AppData } | null> => ipcRenderer.invoke('file:import'),
  revealDataFile: (): Promise<string> => ipcRenderer.invoke('file:reveal'),
  dataFilePath: (): Promise<string> => ipcRenderer.invoke('file:path'),
  dataDir: (): Promise<string> => ipcRenderer.invoke('file:dir'),
  revealDataDir: (): Promise<string> => ipcRenderer.invoke('file:revealDir'),
  moveDataDir: (): Promise<string | null> => ipcRenderer.invoke('file:moveDir'),
  pickImage: (): Promise<string | null> => ipcRenderer.invoke('file:pickImage'),
  pickBackground: (): Promise<string | null> => ipcRenderer.invoke('file:pickBackground'),
  previewFromClipboard: (): Promise<string> => ipcRenderer.invoke('file:previewFromClipboard'),
  clipboardImage: (): Promise<string> => ipcRenderer.invoke('file:clipboardImage'),
  pickFont: (): Promise<string | null> => ipcRenderer.invoke('file:pickFont'),
  readAsset: (relative: string): Promise<string> => ipcRenderer.invoke('asset:read', relative),
  systemFonts: (): Promise<string[]> => ipcRenderer.invoke('fonts:list'),
  stringsFilePath: (language: Language): Promise<string> => ipcRenderer.invoke('strings:path', language),
  revealStringsFile: (language: Language): Promise<string> => ipcRenderer.invoke('strings:reveal', language),
  reloadStrings: (language: Language): Promise<Record<string, string>> =>
    ipcRenderer.invoke('strings:reload', language),
  loadStrings: (language: Language): Promise<Record<string, string>> =>
    ipcRenderer.invoke('strings:load', language),
  onStringsChanged: (callback: (payload: StringsChangedPayload) => void): (() => void) => {
    const listener = (_event: unknown, payload: StringsChangedPayload): void => callback(payload)
    ipcRenderer.on('strings:changed', listener)
    return () => ipcRenderer.removeListener('strings:changed', listener)
  },
  setZoom: (scale: number): Promise<boolean> => ipcRenderer.invoke('app:setZoom', scale)
}

export type PlannerApi = typeof api

contextBridge.exposeInMainWorld('api', api)
