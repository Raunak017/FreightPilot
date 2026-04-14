import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

// Blue-ish palette with primary as first color
const COLORS = ['#6366F1', '#818CF8', '#A5B4FC', '#4F46E5', '#C7D2FE', '#3730A3']

interface EquipmentChartProps {
  data: Record<string, number>
  activeEquipment?: string
  onClickEquipment?: (equipment: string | undefined) => void
}

export default function EquipmentChart({ data, activeEquipment, onClickEquipment }: EquipmentChartProps) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: key,
    value,
  }))

  const total = chartData.reduce((s, d) => s + d.value, 0)

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Equipment Demand</h3>
        <p className="text-sm text-slate-400">No data yet</p>
      </div>
    )
  }

  const handleClick = (_: unknown, index: number) => {
    if (!onClickEquipment) return
    const name = chartData[index].name
    onClickEquipment(activeEquipment === name ? undefined : name)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Equipment Demand
        {activeEquipment && (
          <span className="ml-2 text-xs font-normal text-indigo-500 cursor-pointer" onClick={() => onClickEquipment?.(undefined)}>
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
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[index % COLORS.length]}
                  opacity={activeEquipment && activeEquipment !== entry.name ? 0.3 : 1}
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
          {chartData.map((entry, index) => {
            const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0
            return (
              <div
                key={entry.name}
                className={`flex items-center gap-2 cursor-pointer transition-opacity ${
                  activeEquipment && activeEquipment !== entry.name ? 'opacity-30' : ''
                }`}
                onClick={() => {
                  if (!onClickEquipment) return
                  onClickEquipment(activeEquipment === entry.name ? undefined : entry.name)
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
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
