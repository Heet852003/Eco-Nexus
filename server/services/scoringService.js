/**
 * Scoring Service for Carbon Marketplace
 * Calculates reliability scores, seller match scores, etc.
 */

// Scoring weights (can be moved to config file)
const RELIABILITY_WEIGHTS = {
  successfulTransactions: 2.0,
  avgRating: 1.5,
  carbonSavings: 0.75,
}

const SCORING_WEIGHTS = {
  priceFairness: 0.3,
  carbonAlignment: 0.3,
  reliability: 0.25,
  aiConfidence: 0.15,
}

/**
 * Calculate seller reliability score
 */
export function calculateReliabilityScore(sellerData) {
  const {
    successfulTransactions = 0,
    avgRating = 0,
    carbonSavings = 0
  } = sellerData

  const score = 
    (successfulTransactions * RELIABILITY_WEIGHTS.successfulTransactions) +
    (avgRating * RELIABILITY_WEIGHTS.avgRating) +
    (carbonSavings * RELIABILITY_WEIGHTS.carbonSavings)

  // Normalize to 0-100
  return Math.min(100, Math.max(0, score))
}

/**
 * Calculate seller match score for a buyer request
 */
export function calculateSellerMatchScore(request, quote, sellerReliability) {
  const priceFairness = calculatePriceFairness(request, quote)
  const carbonAlignment = calculateCarbonAlignment(request, quote)
  const reliability = sellerReliability || quote.reliabilityScore || 50
  const aiConfidence = 75 // Default, can be enhanced with AI

  const matchScore = 
    (priceFairness * SCORING_WEIGHTS.priceFairness) +
    (carbonAlignment * SCORING_WEIGHTS.carbonAlignment) +
    (reliability * SCORING_WEIGHTS.reliability) +
    (aiConfidence * SCORING_WEIGHTS.aiConfidence)

  return {
    matchScore: Math.min(100, Math.max(0, matchScore)),
    priceFairness,
    carbonAlignment,
    reliability,
    aiConfidence
  }
}

/**
 * Calculate price fairness score (0-100)
 */
function calculatePriceFairness(request, quote) {
  if (!request.maxPrice) return 75 // Neutral if no max price set
  
  const priceRatio = quote.price / request.maxPrice
  
  if (priceRatio <= 0.8) return 100 // Excellent (20%+ below max)
  if (priceRatio <= 0.9) return 90  // Very good
  if (priceRatio <= 1.0) return 80  // Good (at or below max)
  if (priceRatio <= 1.1) return 60  // Acceptable (10% over)
  if (priceRatio <= 1.2) return 40  // Poor (20% over)
  return 20 // Very poor (more than 20% over)
}

/**
 * Calculate carbon alignment score (0-100)
 */
function calculateCarbonAlignment(request, quote) {
  const diff = Math.abs(quote.carbonScore - request.desiredCarbonScore)
  
  if (diff <= 0.5) return 100 // Excellent match
  if (diff <= 1.0) return 80  // Very good
  if (diff <= 1.5) return 60  // Good
  if (diff <= 2.0) return 40  // Acceptable
  return 20 // Poor match
}

/**
 * Update seller reliability after transaction
 */
export function updateSellerReliability(sellerId, transactionSuccess, rating, carbonSaved) {
  // This would typically update a database
  // For now, return the calculation
  return {
    sellerId,
    successfulTransactions: transactionSuccess ? 1 : 0,
    avgRating: rating,
    carbonSavings: carbonSaved,
    reliabilityScore: calculateReliabilityScore({
      successfulTransactions: transactionSuccess ? 1 : 0,
      avgRating: rating,
      carbonSavings: carbonSaved
    })
  }
}

/**
 * Calculate Overall Analytics Score
 * Based on: Quantity purchased, Green credits (carbon), Reliability score
 */
export function calculateOverallScore(analyticsData) {
  const {
    quantityPurchased = 0,
    greenCredits = 0, // Total carbon saved
    reliabilityScore = 50,
    totalTransactions = 0
  } = analyticsData

  // Normalize values
  const quantityScore = Math.min(100, (quantityPurchased / 100) * 100) // Max 100 for 100+ units
  const carbonScore = Math.min(100, (greenCredits / 1000) * 100) // Max 100 for 1000+ credits
  const reliabilityScoreNormalized = reliabilityScore // Already 0-100
  const transactionScore = Math.min(100, (totalTransactions / 10) * 100) // Max 100 for 10+ transactions

  // Weighted average
  const overallScore = (
    quantityScore * 0.25 +
    carbonScore * 0.35 +
    reliabilityScoreNormalized * 0.25 +
    transactionScore * 0.15
  )

  return {
    overallScore: Math.round(Math.min(100, Math.max(0, overallScore))),
    breakdown: {
      quantityScore: Math.round(quantityScore),
      carbonScore: Math.round(carbonScore),
      reliabilityScore: Math.round(reliabilityScoreNormalized),
      transactionScore: Math.round(transactionScore)
    }
  }
}

