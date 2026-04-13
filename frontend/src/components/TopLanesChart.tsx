import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface TopLanesChartProps {
  data: { lane: string; count: number }[]
  activeLane?: string
  onClickLane?: (lane: string | undefined) => void
}

export default function TopLanesChart({ data, activeLane, onClickLane }: TopLanesChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Top Lanes</h3>
        <p className="text-sm text-slate-400">No lane data yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Top Lanes
        {activeLane && (
          <span className="ml-2 text-xs font-normal text-blue-500 cursor-pointer" onClick={() => onClickLane?.(undefined)}>
            Clear filter
          </span>
        )}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
          <YAxis
            type="category"
            dataKey="lane"
            width={180}
            tick={{ fontSize: 11, fill: '#64748B' }}
          />
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
            fill="#6366F1"
            radius={[0, 6, 6, 0]}
            barSize={20}
            cursor="pointer"
            onClick={(_: unknown, index: number) => {
              if (!onClickLane) return
              const lane = data[index].lane
              onClickLane(activeLane === lane ? undefined : lane)
            }}
          >
            {data.map((entry) => (
              <Cell
                key={entry.lane}
                fill="#6366F1"
                opacity={activeLane && activeLane !== entry.lane ? 0.3 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
