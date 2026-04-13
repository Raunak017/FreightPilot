import type { Metrics, CallList, LoadList } from './types'

const API_KEY = import.meta.env.VITE_API_KEY || 'dev-change-me'

const headers: HeadersInit = {
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY,
}

export async function fetchMetrics(days?: number): Promise<Metrics> {
  const params = days ? `?days=${days}` : ''
  const res = await fetch(`/metrics/${params}`, { headers })
  if (!res.ok) throw new Error(`Metrics fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchCalls(limit = 500): Promise<CallList> {
  const res = await fetch(`/calls/?limit=${limit}`, { headers })
  if (!res.ok) throw new Error(`Calls fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchLoads(): Promise<LoadList> {
  const res = await fetch('/loads/all', { headers })
  if (!res.ok) throw new Error(`Loads fetch failed: ${res.status}`)
  return res.json()
}
