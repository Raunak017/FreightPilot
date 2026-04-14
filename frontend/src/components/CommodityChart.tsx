const PRIMARY = '#6366F1'

interface CommodityChartProps {
  data: Record<string, number>
  activeCommodity?: string
  onClickCommodity?: (commodity: string | undefined) => void
}

export default function CommodityChart({ data, activeCommodity, onClickCommodity }: CommodityChartProps) {
  const sorted = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const max = sorted.length > 0 ? Math.max(...sorted.map(([, v]) => v)) : 1

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Commodity Breakdown</h3>
        <p className="text-sm text-slate-400">No data yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-5">
        Commodity Breakdown
        {activeCommodity && (
          <span className="ml-2 text-xs font-normal text-indigo-500 cursor-pointer" onClick={() => onClickCommodity?.(undefined)}>
            Clear filter
          </span>
        )}
      </h3>
      <div className="space-y-3">
        {sorted.map(([name, count]) => {
          const pct = (count / max) * 100
          const isActive = activeCommodity === name
          const isDimmed = activeCommodity && !isActive

          return (
            <div
              key={name}
              className={`cursor-pointer transition-opacity ${isDimmed ? 'opacity-30' : ''}`}
              onClick={() => {
                if (!onClickCommodity) return
                onClickCommodity(isActive ? undefined : name)
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-600">{name}</span>
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
                <span className="text-xs font-semibold text-slate-700 w-6 text-right">{count}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
