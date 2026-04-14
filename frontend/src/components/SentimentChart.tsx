import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#10B981',
  neutral: '#6366F1',
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

  const total = chartData.reduce((s, d) => s + d.value, 0)

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
          <span className="ml-2 text-xs font-normal text-indigo-500 cursor-pointer" onClick={() => onClickSentiment?.(undefined)}>
            Clear filter
          </span>
        )}
      </h3>
      <div className="flex items-center">
        <ResponsiveContainer width="60%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
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
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-3 ml-2">
          {chartData.map((entry) => {
            const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0
            return (
              <div
                key={entry.key}
                className={`flex items-center gap-2 cursor-pointer transition-opacity ${
                  activeSentiment && activeSentiment !== entry.key ? 'opacity-30' : ''
                }`}
                onClick={() => {
                  if (!onClickSentiment) return
                  onClickSentiment(activeSentiment === entry.key ? undefined : entry.key)
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: SENTIMENT_COLORS[entry.key] }}
                />
                <span className="text-xs text-slate-600">{entry.name}</span>
                <span className="text-xs font-semibold text-slate-800">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
