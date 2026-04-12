import type { Call } from '../types'

const OUTCOME_BADGE: Record<string, string> = {
  booked: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  declined_by_carrier: 'bg-amber-50 text-amber-700 border-amber-200',
  no_eligible_mc: 'bg-red-50 text-red-700 border-red-200',
  no_matching_load: 'bg-violet-50 text-violet-700 border-violet-200',
  negotiation_failed: 'bg-orange-50 text-orange-700 border-orange-200',
  abandoned: 'bg-slate-50 text-slate-600 border-slate-200',
}

const SENTIMENT_BADGE: Record<string, string> = {
  positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  neutral: 'bg-amber-50 text-amber-700 border-amber-200',
  negative: 'bg-red-50 text-red-700 border-red-200',
}

const OUTCOME_LABELS: Record<string, string> = {
  booked: 'Booked',
  declined_by_carrier: 'Declined',
  no_eligible_mc: 'Ineligible MC',
  no_matching_load: 'No Match',
  negotiation_failed: 'Neg. Failed',
  abandoned: 'Abandoned',
}

function Badge({ text, className }: { text: string; className: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${className}`}>
      {text}
    </span>
  )
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPrice(price: number | null): string {
  if (price === null) return '-'
  return `$${price.toLocaleString()}`
}

interface CallsTableProps {
  calls: Call[]
}

export default function CallsTable({ calls }: CallsTableProps) {
  if (calls.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Recent Calls</h3>
        <p className="text-sm text-slate-400">No calls recorded yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 pb-0">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Recent Calls</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Time</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Carrier</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Load</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Outcome</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Sentiment</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Price</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Rounds</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {calls.map((call) => (
              <tr key={call.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{formatDate(call.created_at)}</td>
                <td className="px-6 py-3">
                  <div className="font-medium text-slate-700">{call.carrier_name || '-'}</div>
                  {call.mc_number && (
                    <div className="text-xs text-slate-400">MC-{call.mc_number}</div>
                  )}
                </td>
                <td className="px-6 py-3 text-slate-600 font-mono text-xs">{call.matched_load_id || '-'}</td>
                <td className="px-6 py-3">
                  <Badge
                    text={OUTCOME_LABELS[call.outcome] || call.outcome}
                    className={OUTCOME_BADGE[call.outcome] || OUTCOME_BADGE.abandoned}
                  />
                </td>
                <td className="px-6 py-3">
                  {call.sentiment ? (
                    <Badge
                      text={call.sentiment.charAt(0).toUpperCase() + call.sentiment.slice(1)}
                      className={SENTIMENT_BADGE[call.sentiment] || SENTIMENT_BADGE.neutral}
                    />
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
                <td className="px-6 py-3 text-right font-medium text-slate-700">{formatPrice(call.final_price)}</td>
                <td className="px-6 py-3 text-center text-slate-500">{call.rounds_used ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
