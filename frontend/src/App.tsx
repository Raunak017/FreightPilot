import { useEffect, useMemo, useState } from 'react'
import { fetchCalls, fetchLoads } from './api'
import { computeMetrics } from './computeMetrics'
import type { Call, Load, Filters } from './types'
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

const DATE_RANGES = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: 'All time', value: undefined },
] as const

function filterByDate(calls: Call[], days?: number): Call[] {
  if (!days) return calls
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return calls.filter((c) => new Date(c.created_at) >= cutoff)
}

function filterByFunnel(calls: Call[], step?: string): Call[] {
  if (!step) return calls
  switch (step) {
    case 'verified_mc':
      return calls.filter((c) => c.mc_number != null)
    case 'load_matched':
      return calls.filter((c) => c.matched_load_id != null)
    case 'booked':
      return calls.filter((c) => c.outcome === 'booked')
    default:
      return calls
  }
}

function applyFilters(calls: Call[], filters: Filters): Call[] {
  let result = calls
  if (filters.outcome) result = result.filter((c) => c.outcome === filters.outcome)
  if (filters.sentiment) result = result.filter((c) => c.sentiment === filters.sentiment)
  if (filters.funnelStep) result = filterByFunnel(result, filters.funnelStep)
  return result
}

export default function App() {
  const [allCalls, setAllCalls] = useState<Call[]>([])
  const [loads, setLoads] = useState<Load[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<number | undefined>(undefined)
  const [filters, setFilters] = useState<Filters>({})

  useEffect(() => {
    async function load() {
      try {
        const [c, l] = await Promise.all([fetchCalls(), fetchLoads()])
        setAllCalls(c.results)
        setLoads(l.results)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const dateCalls = useMemo(() => filterByDate(allCalls, dateRange), [allCalls, dateRange])
  const filteredCalls = useMemo(() => applyFilters(dateCalls, filters), [dateCalls, filters])
  const metrics = useMemo(() => computeMetrics(filteredCalls, loads), [filteredCalls, loads])
  // Funnel always uses date-filtered calls (not cross-filtered) so it shows full picture
  const funnelMetrics = useMemo(() => computeMetrics(dateCalls, loads), [dateCalls, loads])

  const hasActiveFilter = filters.outcome || filters.sentiment || filters.funnelStep

  const clearAllFilters = () => setFilters({})

  if (loading) {
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
        {/* Active filter banner */}
        {hasActiveFilter && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center justify-between">
            <div className="text-sm text-blue-700">
              Filtering by:
              {filters.outcome && <span className="ml-1 font-medium">{filters.outcome}</span>}
              {filters.sentiment && <span className="ml-1 font-medium">{filters.sentiment} sentiment</span>}
              {filters.funnelStep && <span className="ml-1 font-medium">{filters.funnelStep.replace('_', ' ')}</span>}
              <span className="text-blue-500 ml-1">({filteredCalls.length} calls)</span>
            </div>
            <button
              onClick={clearAllFilters}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          </div>
        )}

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
            subtitle={`$${metrics.avg_rate_per_mile}/mi · ${metrics.avg_haul_distance} mi avg`}
            icon={<DollarIcon />}
          />
          <KpiCard
            title="Avg. Rounds to Close"
            value={metrics.avg_rounds_to_close}
            subtitle={`${formatDuration(metrics.avg_duration)} avg call`}
            icon={<RouteIcon />}
          />
        </div>

        {/* Funnel + Outcomes + Sentiment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <FunnelChart
            data={funnelMetrics.funnel}
            activeFunnelStep={filters.funnelStep}
            onClickFunnelStep={(step) => setFilters((f) => ({ ...f, funnelStep: step as Filters['funnelStep'], outcome: undefined }))}
          />
          <OutcomeChart
            data={metrics.outcomes}
            activeOutcome={filters.outcome}
            onClickOutcome={(outcome) => setFilters((f) => ({ ...f, outcome, funnelStep: undefined }))}
          />
          <SentimentChart
            data={metrics.sentiments}
            activeSentiment={filters.sentiment}
            onClickSentiment={(sentiment) => setFilters((f) => ({ ...f, sentiment }))}
          />
        </div>

        {/* Top Lanes + Equipment + Commodity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <TopLanesChart data={metrics.top_lanes} />
          <EquipmentChart data={metrics.equipment_demand} />
          <CommodityChart data={metrics.commodity_breakdown} />
        </div>

        {/* Rounds chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <RoundsChart data={metrics.rounds_distribution} />
        </div>

        {/* Calls table */}
        <CallsTable calls={filteredCalls} />
      </main>
    </div>
  )
}
