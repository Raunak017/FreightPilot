interface FunnelChartProps {
  data: {
    total_calls: number
    verified_mc: number
    load_matched: number
    booked: number
  }
}

const STEPS = [
  { key: 'total_calls', label: 'Total Calls', color: '#3B82F6' },
  { key: 'verified_mc', label: 'Verified MC', color: '#6366F1' },
  { key: 'load_matched', label: 'Load Matched', color: '#8B5CF6' },
  { key: 'booked', label: 'Booked', color: '#10B981' },
] as const

export default function FunnelChart({ data }: FunnelChartProps) {
  const max = data.total_calls || 1

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-5">Conversion Funnel</h3>
      <div className="space-y-3">
        {STEPS.map((step, i) => {
          const value = data[step.key]
          const pct = max > 0 ? Math.round((value / max) * 100) : 0
          const prevValue = i > 0 ? data[STEPS[i - 1].key] : null
          const dropoff = prevValue && prevValue > 0
            ? Math.round(((prevValue - value) / prevValue) * 100)
            : null

          return (
            <div key={step.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-600">{step.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">{value}</span>
                  {dropoff !== null && dropoff > 0 && (
                    <span className="text-xs text-red-400">-{dropoff}%</span>
                  )}
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-6 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: step.color }}
                >
                  {pct >= 15 && (
                    <span className="text-xs font-medium text-white">{pct}%</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
