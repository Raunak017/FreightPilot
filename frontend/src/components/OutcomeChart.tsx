const PRIMARY = '#6366F1'

const OUTCOME_LABELS: Record<string, string> = {
  booked: 'Booked',
  declined_by_carrier: 'Declined',
  no_eligible_mc: 'Ineligible MC',
  no_matching_load: 'No Match',
  abandoned: 'Abandoned',
}

interface OutcomeChartProps {
  data: Record<string, number>
  activeOutcome?: string
  onClickOutcome?: (outcome: string | undefined) => void
}

export default function OutcomeChart({ data, activeOutcome, onClickOutcome }: OutcomeChartProps) {
  const sorted = Object.entries(data)
    .map(([key, count]) => ({ key, label: OUTCOME_LABELS[key] || key, count }))
    .sort((a, b) => b.count - a.count)

  const max = sorted.length > 0 ? Math.max(...sorted.map((d) => d.count)) : 1

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Call Outcomes</h3>
        <p className="text-sm text-slate-400">No data yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-5">
        Call Outcomes
        {activeOutcome && (
          <span className="ml-2 text-xs font-normal text-indigo-500 cursor-pointer" onClick={() => onClickOutcome?.(undefined)}>
            Clear filter
          </span>
        )}
      </h3>
      <div className="space-y-3">
        {sorted.map((entry) => {
          const pct = (entry.count / max) * 100
          const isActive = activeOutcome === entry.key
          const isDimmed = activeOutcome && !isActive

          return (
            <div
              key={entry.key}
              className={`cursor-pointer transition-opacity ${isDimmed ? 'opacity-30' : ''}`}
              onClick={() => {
                if (!onClickOutcome) return
                onClickOutcome(isActive ? undefined : entry.key)
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-600">{entry.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(pct, 8)}%`,
                      backgroundColor: PRIMARY,
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-6 text-right">{entry.count}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
