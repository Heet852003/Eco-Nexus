/**
 * Calculate vendor score based on buyer goals
 * 
 * Scoring formula:
 * score = -cost*weight - carbon*weight - delivery*weight + sustainability*weight
 * 
 * Higher score = better choice
 * 
 * @param {Object} vendor - Vendor object with price, carbon, delivery, sustainability_score
 * @param {Object} goals - Buyer goals with weights
 * @returns {number} Calculated score
 */
export function calculateScore(vendor, goals) {
  // Normalize values (assuming max ranges for normalization)
  const maxPrice = 50
  const maxCarbon = 100
  const maxDelivery = 10
  const maxSustainability = 10

  // Normalize to 0-1 scale (lower is better for cost, carbon, delivery)
  const normalizedPrice = Math.min(vendor.price / maxPrice, 1)
  const normalizedCarbon = Math.min(vendor.carbon / maxCarbon, 1)
  const normalizedDelivery = Math.min(vendor.delivery / maxDelivery, 1)
  const normalizedSustainability = vendor.sustainability_score / maxSustainability

  // Calculate weighted score
  // Negative for things we want to minimize, positive for things we want to maximize
  let score = 0
  
  // Minimize cost (negative contribution)
  score -= normalizedPrice * goals.minimize_cost
  
  // Minimize carbon (negative contribution)
  score -= normalizedCarbon * goals.minimize_carbon
  
  // Minimize delivery time (negative contribution)
  score -= normalizedDelivery * goals.minimize_delivery
  
  // Maximize sustainability (positive contribution)
  score += normalizedSustainability * goals.maximize_sustainability

  // Bonus for discount availability
  if (vendor.willing_to_discount) {
    score += 0.1
  }

  // Scale to 0-100 for readability
  return Math.max(0, (score + 1) * 50) // Shift and scale to positive range
}

