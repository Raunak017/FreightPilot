import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

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
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: OUTCOME_LABELS[key] || key,
    count: value,
    key,
  }))

  const handleClick = (entry: { key: string }) => {
    if (!onClickOutcome) return
    onClickOutcome(activeOutcome === entry.key ? undefined : entry.key)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Call Outcomes
        {activeOutcome && (
          <span className="ml-2 text-xs font-normal text-indigo-500 cursor-pointer" onClick={() => onClickOutcome?.(undefined)}>
            Clear filter
          </span>
        )}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ left: -10, right: 10 }}>
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            tick={{ fontSize: 12, fill: '#64748B' }}
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
            radius={[0, 6, 6, 0]}
            barSize={20}
            cursor="pointer"
            onClick={(_: unknown, index: number) => handleClick(chartData[index])}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.key}
                fill={PRIMARY}
                opacity={activeOutcome && activeOutcome !== entry.key ? 0.3 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
