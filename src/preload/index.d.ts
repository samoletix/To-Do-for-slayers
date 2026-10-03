import type { PlannerApi } from './index'

declare global {
  interface Window {
    api: PlannerApi
  }
}

export {}
