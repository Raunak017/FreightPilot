import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#10B981',
  neutral: '#F59E0B',
  negative: '#EF4444',
}

const SENTIMENT_LABELS: Record<string, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
}

interface SentimentChartProps {
  data: Record<string, number>
  activeSentiment?: string
  onClickSentiment?: (sentiment: string | undefined) => void
}

export default function SentimentChart({ data, activeSentiment, onClickSentiment }: SentimentChartProps) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: SENTIMENT_LABELS[key] || key,
    value,
    key,
  }))

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Carrier Sentiment</h3>
        <p className="text-sm text-slate-400">No data yet</p>
      </div>
    )
  }

  const handleClick = (_: unknown, index: number) => {
    if (!onClickSentiment) return
    const key = chartData[index].key
    onClickSentiment(activeSentiment === key ? undefined : key)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Carrier Sentiment
        {activeSentiment && (
          <span className="ml-2 text-xs font-normal text-blue-500 cursor-pointer" onClick={() => onClickSentiment?.(undefined)}>
            Clear filter
          </span>
        )}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
            cursor="pointer"
            onClick={handleClick}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.key}
                fill={SENTIMENT_COLORS[entry.key] || '#94A3B8'}
                opacity={activeSentiment && activeSentiment !== entry.key ? 0.3 : 1}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              fontSize: '13px',
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '13px', color: '#64748B' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
