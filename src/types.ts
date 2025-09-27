export interface User {
  id: number
  email: string
  name: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: number
  name: string
  description: string
  user_id: number
  hourly_rate?: number
  created_at: string
  updated_at: string
}

export interface Settings {
  id: number
  default_hourly_rate?: number
  currency: string
  created_at: string
  updated_at: string
}

export interface TimeEntry {
  id: number
  project_id: number
  user_id: number
  description: string
  start_time: string
  end_time?: string
  duration?: number
  billable: boolean
  created_at: string
  updated_at: string
}

export interface HealthStatus {
  status: string
  service: string
}
