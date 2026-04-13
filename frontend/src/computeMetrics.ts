import type { Call, Load, Metrics } from './types'

export function computeMetrics(calls: Call[], loads: Load[]): Metrics {
  const loadMap = new Map(loads.map((l) => [l.load_id, l]))
  const total = calls.length

  const booked = calls.filter((c) => c.outcome === 'booked')
  const bookedCount = booked.length
  const bookingRate = total > 0 ? Math.round((bookedCount / total) * 1000) / 10 : 0

  const bookedWithPrice = booked.filter((c) => c.final_price != null)
  const avgPrice = bookedWithPrice.length > 0
    ? Math.round((bookedWithPrice.reduce((s, c) => s + c.final_price!, 0) / bookedWithPrice.length) * 100) / 100
    : 0

  const bookedWithRounds = booked.filter((c) => c.rounds_used != null)
  const avgRounds = bookedWithRounds.length > 0
    ? Math.round((bookedWithRounds.reduce((s, c) => s + c.rounds_used!, 0) / bookedWithRounds.length) * 10) / 10
    : 0

  // Outcomes
  const outcomes: Record<string, number> = {}
  calls.forEach((c) => { outcomes[c.outcome] = (outcomes[c.outcome] || 0) + 1 })

  // Sentiments
  const sentiments: Record<string, number> = {}
  calls.forEach((c) => {
    if (c.sentiment) sentiments[c.sentiment] = (sentiments[c.sentiment] || 0) + 1
  })

  // Rounds distribution
  const roundsDist: Record<string, number> = {}
  booked.forEach((c) => {
    if (c.rounds_used != null) {
      const key = String(c.rounds_used)
      roundsDist[key] = (roundsDist[key] || 0) + 1
    }
  })

  // Funnel
  const verifiedCount = calls.filter((c) => c.mc_number != null).length
  const matchedCount = calls.filter((c) => c.matched_load_id != null).length

  // Margin + rate per mile + haul distance
  const bookedWithLoads = booked
    .filter((c) => c.final_price != null && c.matched_load_id != null)
    .map((c) => ({ call: c, load: loadMap.get(c.matched_load_id!) }))
    .filter((x): x is { call: Call; load: Load } => x.load != null)

  const totalMargin = bookedWithLoads.reduce(
    (s, { call, load }) => s + (call.final_price! - load.loadboard_rate), 0
  )
  const avgMargin = bookedWithLoads.length > 0
    ? Math.round((totalMargin / bookedWithLoads.length) * 100) / 100
    : 0

  const rpmData = bookedWithLoads.filter(({ load }) => load.miles > 0)
  const avgRpm = rpmData.length > 0
    ? Math.round((rpmData.reduce((s, { call, load }) => s + call.final_price! / load.miles, 0) / rpmData.length) * 100) / 100
    : 0

  const haulData = bookedWithLoads.filter(({ load }) => load.miles > 0)
  const avgHaul = haulData.length > 0
    ? Math.round(haulData.reduce((s, { load }) => s + load.miles, 0) / haulData.length)
    : 0

  // Top lanes
  const laneCounts: Record<string, number> = {}
  calls.forEach((c) => {
    if (c.matched_load_id) {
      const load = loadMap.get(c.matched_load_id)
      if (load) {
        const lane = `${load.origin} → ${load.destination}`
        laneCounts[lane] = (laneCounts[lane] || 0) + 1
      }
    }
  })
  const topLanes = Object.entries(laneCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([lane, count]) => ({ lane, count }))

  // Equipment demand
  const equipCounts: Record<string, number> = {}
  calls.forEach((c) => {
    if (c.matched_load_id) {
      const load = loadMap.get(c.matched_load_id)
      if (load) equipCounts[load.equipment_type] = (equipCounts[load.equipment_type] || 0) + 1
    }
  })

  // Commodity breakdown
  const commodityCounts: Record<string, number> = {}
  calls.forEach((c) => {
    if (c.matched_load_id) {
      const load = loadMap.get(c.matched_load_id)
      if (load) commodityCounts[load.commodity_type] = (commodityCounts[load.commodity_type] || 0) + 1
    }
  })

  // Avg duration
  const withDuration = calls.filter((c) => c.duration != null)
  const avgDuration = withDuration.length > 0
    ? Math.round(withDuration.reduce((s, c) => s + c.duration!, 0) / withDuration.length)
    : 0

  return {
    total_calls: total,
    booked_count: bookedCount,
    booking_rate: bookingRate,
    avg_agreed_price: avgPrice,
    avg_rounds_to_close: avgRounds,
    outcomes,
    sentiments,
    rounds_distribution: roundsDist,
    funnel: {
      total_calls: total,
      verified_mc: verifiedCount,
      load_matched: matchedCount,
      booked: bookedCount,
    },
    margin_protection: {
      total_margin_given: Math.round(totalMargin * 100) / 100,
      avg_margin_per_deal: avgMargin,
      deals_count: bookedWithLoads.length,
    },
    top_lanes: topLanes,
    equipment_demand: equipCounts,
    commodity_breakdown: commodityCounts,
    avg_rate_per_mile: avgRpm,
    avg_haul_distance: avgHaul,
    avg_duration: avgDuration,
  }
}
