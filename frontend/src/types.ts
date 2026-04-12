export interface Metrics {
  total_calls: number
  booked_count: number
  booking_rate: number
  avg_agreed_price: number
  avg_rounds_to_close: number
  outcomes: Record<string, number>
  sentiments: Record<string, number>
  rounds_distribution: Record<string, number>
}

export interface Call {
  id: number
  mc_number: string | null
  carrier_name: string | null
  dot_number: number | null
  matched_load_id: string | null
  final_price: number | null
  rounds_used: number | null
  outcome: string
  sentiment: string | null
  transcript_summary: string | null
  created_at: string
}

export interface CallList {
  results: Call[]
  count: number
}
