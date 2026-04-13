import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

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
          <span className="ml-2 text-xs font-normal text-blue-500 cursor-pointer" onClick={() => onClickEquipment?.(undefined)}>
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
