import { useEffect, useState } from 'react'
import { fetchMetrics, fetchCalls } from './api'
import type { Metrics, Call } from './types'
import KpiCard from './components/KpiCard'
import OutcomeChart from './components/OutcomeChart'
import SentimentChart from './components/SentimentChart'
import RoundsChart from './components/RoundsChart'
import FunnelChart from './components/FunnelChart'
import TopLanesChart from './components/TopLanesChart'
import EquipmentChart from './components/EquipmentChart'
import CommodityChart from './components/CommodityChart'
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

function RouteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /><circle cx="18" cy="5" r="3" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

const DATE_RANGES = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: 'All time', value: undefined },
] as const

export default function App() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<number | undefined>(undefined)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [m, c] = await Promise.all([fetchMetrics(dateRange), fetchCalls()])
        setMetrics(m)
        setCalls(c.results)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [dateRange])

  if (loading && !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-red-500 text-sm font-medium">{error}</p>
          <p className="text-slate-400 text-xs mt-2">Make sure the API is running on port 8000</p>
        </div>
      </div>
    )
  }

  if (!metrics) return null

  const formatDuration = (s: number) => {
    if (!s) return '0s'
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Freight Pilot</h1>
            <p className="text-sm text-slate-500 mt-0.5">Carrier Sales Intelligence</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Date range filter */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              {DATE_RANGES.map((range) => (
                <button
                  key={range.label}
                  onClick={() => setDateRange(range.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    dateRange === range.value
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              Live
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* KPI Cards — Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
            title="Avg. Price"
            value={`$${metrics.avg_agreed_price.toLocaleString()}`}
            subtitle="Booked calls"
            icon={<DollarIcon />}
          />
          <KpiCard
            title="Rate/Mile"
            value={`$${metrics.avg_rate_per_mile}`}
            subtitle={`${metrics.avg_haul_distance} mi avg`}
            icon={<RouteIcon />}
          />
          <KpiCard
            title="Margin Given"
            value={`$${metrics.margin_protection.total_margin_given.toLocaleString()}`}
            subtitle={`$${metrics.margin_protection.avg_margin_per_deal}/deal avg`}
            icon={<ShieldIcon />}
          />
          <KpiCard
            title="Avg. Duration"
            value={formatDuration(metrics.avg_duration)}
            subtitle="Per call"
            icon={<ClockIcon />}
          />
        </div>

        {/* Funnel + Outcomes + Sentiment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <FunnelChart data={metrics.funnel} />
          <OutcomeChart data={metrics.outcomes} />
          <SentimentChart data={metrics.sentiments} />
        </div>

        {/* Top Lanes + Equipment + Commodity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <TopLanesChart data={metrics.top_lanes} />
          <EquipmentChart data={metrics.equipment_demand} />
          <CommodityChart data={metrics.commodity_breakdown} />
        </div>

        {/* Rounds chart (standalone, smaller) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <RoundsChart data={metrics.rounds_distribution} />
        </div>

        {/* Calls table */}
        <CallsTable calls={calls} />
      </main>
    </div>
  )
}
