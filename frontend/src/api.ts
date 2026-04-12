import type { Metrics, CallList } from './types'

const API_KEY = import.meta.env.VITE_API_KEY || 'dev-change-me'

const headers: HeadersInit = {
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY,
}

export async function fetchMetrics(): Promise<Metrics> {
  const res = await fetch('/metrics/', { headers })
  if (!res.ok) throw new Error(`Metrics fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchCalls(limit = 20): Promise<CallList> {
  const res = await fetch(`/calls/?limit=${limit}`, { headers })
  if (!res.ok) throw new Error(`Calls fetch failed: ${res.status}`)
  return res.json()
}
