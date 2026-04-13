import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface RoundsChartProps {
  data: Record<string, number>
  activeRounds?: number
  onClickRounds?: (rounds: number | undefined) => void
}

export default function RoundsChart({ data, activeRounds, onClickRounds }: RoundsChartProps) {
  const chartData = Object.entries(data)
    .map(([round, count]) => ({
      round: `Round ${round}`,
      rawRound: Number(round),
      count,
    }))
    .sort((a, b) => a.rawRound - b.rawRound)

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Rounds to Close</h3>
        <p className="text-sm text-slate-400">No booked calls yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Rounds to Close
        {activeRounds != null && (
          <span className="ml-2 text-xs font-normal text-blue-500 cursor-pointer" onClick={() => onClickRounds?.(undefined)}>
            Clear filter
          </span>
        )}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData}>
          <XAxis dataKey="round" tick={{ fontSize: 12, fill: '#64748B' }} />
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
            fill="#3B82F6"
            radius={[6, 6, 0, 0]}
            barSize={40}
            cursor="pointer"
            onClick={(_: unknown, index: number) => {
              if (!onClickRounds) return
              const rounds = chartData[index].rawRound
              onClickRounds(activeRounds === rounds ? undefined : rounds)
            }}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.round}
                fill="#3B82F6"
                opacity={activeRounds != null && activeRounds !== entry.rawRound ? 0.3 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
