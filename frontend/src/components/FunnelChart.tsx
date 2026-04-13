interface FunnelChartProps {
  data: {
    total_calls: number
    verified_mc: number
    load_matched: number
    booked: number
  }
  activeFunnelStep?: string
  onClickFunnelStep?: (step: string | undefined) => void
}

const STEPS = [
  { key: 'total_calls', label: 'Total Calls', color: '#3B82F6', filterKey: undefined },
  { key: 'verified_mc', label: 'Verified MC', color: '#6366F1', filterKey: 'verified_mc' },
  { key: 'load_matched', label: 'Load Matched', color: '#8B5CF6', filterKey: 'load_matched' },
  { key: 'booked', label: 'Booked', color: '#10B981', filterKey: 'booked' },
] as const

export default function FunnelChart({ data, activeFunnelStep, onClickFunnelStep }: FunnelChartProps) {
  const max = data.total_calls || 1

  const handleClick = (filterKey: string | undefined) => {
    if (!onClickFunnelStep || !filterKey) return
    onClickFunnelStep(activeFunnelStep === filterKey ? undefined : filterKey)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-5">
        Conversion Funnel
        {activeFunnelStep && (
          <span className="ml-2 text-xs font-normal text-blue-500 cursor-pointer" onClick={() => onClickFunnelStep?.(undefined)}>
            Clear filter
          </span>
        )}
      </h3>
      <div className="space-y-3">
        {STEPS.map((step, i) => {
          const value = data[step.key]
          const pct = max > 0 ? Math.round((value / max) * 100) : 0
          const prevValue = i > 0 ? data[STEPS[i - 1].key] : null
          const dropoff = prevValue && prevValue > 0
            ? Math.round(((prevValue - value) / prevValue) * 100)
            : null
          const isActive = activeFunnelStep === step.filterKey
          const isDimmed = activeFunnelStep && !isActive && step.filterKey

          return (
            <div
              key={step.key}
              className={`${step.filterKey ? 'cursor-pointer' : ''} ${isDimmed ? 'opacity-40' : ''} transition-opacity`}
              onClick={() => handleClick(step.filterKey)}
            >
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
                  style={{
                    width: `${Math.max(pct, 4)}%`,
                    backgroundColor: step.color,
                    outline: isActive ? '2px solid #3B82F6' : 'none',
                    outlineOffset: '2px',
                  }}
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
