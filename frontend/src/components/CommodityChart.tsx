import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface CommodityChartProps {
  data: Record<string, number>
  activeCommodity?: string
  onClickCommodity?: (commodity: string | undefined) => void
}

export default function CommodityChart({ data, activeCommodity, onClickCommodity }: CommodityChartProps) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: key,
    count: value,
  }))

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Commodity Breakdown</h3>
        <p className="text-sm text-slate-400">No data yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Commodity Breakdown
        {activeCommodity && (
          <span className="ml-2 text-xs font-normal text-blue-500 cursor-pointer" onClick={() => onClickCommodity?.(undefined)}>
            Clear filter
          </span>
        )}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData}>
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              fontSize: '13px',
            }}
          />
          <Bar
            dataKey="count"
            fill="#F59E0B"
            radius={[6, 6, 0, 0]}
            barSize={40}
            cursor="pointer"
            onClick={(_: unknown, index: number) => {
              if (!onClickCommodity) return
              const name = chartData[index].name
              onClickCommodity(activeCommodity === name ? undefined : name)
            }}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.name}
                fill="#F59E0B"
                opacity={activeCommodity && activeCommodity !== entry.name ? 0.3 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
