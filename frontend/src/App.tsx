import { useEffect, useState } from 'react'
import { fetchMetrics, fetchCalls } from './api'
import type { Metrics, Call } from './types'
import KpiCard from './components/KpiCard'
import OutcomeChart from './components/OutcomeChart'
import SentimentChart from './components/SentimentChart'
import RoundsChart from './components/RoundsChart'
import CallsTable from './components/CallsTable'

function PhoneIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function DollarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

function RepeatIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  )
}

export default function App() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [m, c] = await Promise.all([fetchMetrics(), fetchCalls()])
        setMetrics(m)
        setCalls(c.results)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-sm font-medium">{error}</p>
          <p className="text-slate-400 text-xs mt-2">Make sure the API is running on port 8000</p>
        </div>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">CarrierCalls AI</h1>
            <p className="text-sm text-slate-500 mt-0.5">Inbound carrier sales dashboard</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            Live
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Calls"
            value={metrics.total_calls}
            icon={<PhoneIcon />}
          />
          <KpiCard
            title="Booking Rate"
            value={`${metrics.booking_rate}%`}
            subtitle={`${metrics.booked_count} booked`}
            icon={<CheckIcon />}
          />
          <KpiCard
            title="Avg. Agreed Price"
            value={`$${metrics.avg_agreed_price.toLocaleString()}`}
            subtitle="On booked calls"
            icon={<DollarIcon />}
          />
          <KpiCard
            title="Avg. Rounds to Close"
            value={metrics.avg_rounds_to_close}
            subtitle="Negotiation rounds"
            icon={<RepeatIcon />}
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <OutcomeChart data={metrics.outcomes} />
          <SentimentChart data={metrics.sentiments} />
          <RoundsChart data={metrics.rounds_distribution} />
        </div>

        {/* Calls table */}
        <CallsTable calls={calls} />
      </main>
    </div>
  )
}
