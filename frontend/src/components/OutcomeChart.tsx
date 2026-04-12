import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const OUTCOME_COLORS: Record<string, string> = {
  booked: '#10B981',
  declined_by_carrier: '#F59E0B',
  no_eligible_mc: '#EF4444',
  no_matching_load: '#8B5CF6',
  negotiation_failed: '#F97316',
  abandoned: '#94A3B8',
}

const OUTCOME_LABELS: Record<string, string> = {
  booked: 'Booked',
  declined_by_carrier: 'Declined',
  no_eligible_mc: 'Ineligible MC',
  no_matching_load: 'No Match',
  negotiation_failed: 'Negotiation Failed',
  abandoned: 'Abandoned',
}

interface OutcomeChartProps {
  data: Record<string, number>
}

export default function OutcomeChart({ data }: OutcomeChartProps) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: OUTCOME_LABELS[key] || key,
    count: value,
    key,
  }))

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Call Outcomes</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
          <YAxis
            type="category"
            dataKey="name"
            width={130}
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
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
            {chartData.map((entry) => (
              <Cell
                key={entry.key}
                fill={OUTCOME_COLORS[entry.key] || '#94A3B8'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
