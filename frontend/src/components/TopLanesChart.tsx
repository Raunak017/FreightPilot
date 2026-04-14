const PRIMARY = '#6366F1'

interface TopLanesChartProps {
  data: { lane: string; count: number }[]
  activeLane?: string
  onClickLane?: (lane: string | undefined) => void
}

function shortenLane(lane: string): string {
  // "Chicago, IL → Dallas, TX" -> "Chicago → Dallas"
  return lane
    .split('→')
    .map((part) => part.trim().replace(/,\s*[A-Z]{2}$/, ''))
    .join(' → ')
}

export default function TopLanesChart({ data, activeLane, onClickLane }: TopLanesChartProps) {
  const top5 = data.slice(0, 5)
  const max = top5.length > 0 ? Math.max(...top5.map((d) => d.count)) : 1

  if (top5.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Top Lanes</h3>
        <p className="text-sm text-slate-400">No lane data yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-5">
        Top Lanes
        {activeLane && (
          <span className="ml-2 text-xs font-normal text-indigo-500 cursor-pointer" onClick={() => onClickLane?.(undefined)}>
            Clear filter
          </span>
        )}
      </h3>
      <div className="space-y-3">
        {top5.map((entry) => {
          const pct = (entry.count / max) * 100
          const isActive = activeLane === entry.lane
          const isDimmed = activeLane && !isActive

          return (
            <div
              key={entry.lane}
              className={`cursor-pointer transition-opacity ${isDimmed ? 'opacity-30' : ''}`}
              onClick={() => {
                if (!onClickLane) return
                onClickLane(isActive ? undefined : entry.lane)
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-600">{shortenLane(entry.lane)}</span>
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
