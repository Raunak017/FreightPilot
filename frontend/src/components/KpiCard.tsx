interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
}

export default function KpiCard({ title, value, subtitle, icon }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}
