export interface Metrics {
  total_calls: number
  booked_count: number
  booking_rate: number
  avg_agreed_price: number
  avg_rounds_to_close: number
  outcomes: Record<string, number>
  sentiments: Record<string, number>
  rounds_distribution: Record<string, number>
  funnel: {
    total_calls: number
    verified_mc: number
    load_matched: number
    booked: number
  }
  margin_protection: {
    total_margin_given: number
    avg_margin_per_deal: number
    deals_count: number
  }
  top_lanes: { lane: string; count: number }[]
  equipment_demand: Record<string, number>
  commodity_breakdown: Record<string, number>
  avg_rate_per_mile: number
  avg_haul_distance: number
  avg_duration: number
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
  duration: number | null
  created_at: string
}

export interface CallList {
  results: Call[]
  count: number
}
