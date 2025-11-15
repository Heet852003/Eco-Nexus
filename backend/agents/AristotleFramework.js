/**
 * Aristotle AI Agent Framework
 * Implements Aristotelian reasoning principles for agent decision-making:
 * - Logical Analysis (Logos)
 * - Ethical Consideration (Ethos)
 * - Practical Wisdom (Phronesis)
 * - Structured Reasoning
 */

/**
 * Apply Aristotelian reasoning to evaluate options
 * @param {Array} options - Options to evaluate
 * @param {Object} criteria - Evaluation criteria
 * @returns {Object} Reasoning result with analysis
 */
export function applyAristotelianReasoning(options, criteria) {
  const analysis = {
    logical: analyzeLogically(options, criteria),
    ethical: analyzeEthically(options, criteria),
    practical: analyzePractically(options, criteria),
    recommendation: null
  }

  // Synthesize all three dimensions
  analysis.recommendation = synthesizeRecommendation(analysis, options)
  
  return analysis
}

/**
 * Logical Analysis (Logos) - Objective facts and data
 */
function analyzeLogically(options, criteria) {
  const scores = options.map(option => {
    let logicalScore = 0
    
    // Cost analysis
    if (criteria.minimize_cost) {
      const minCost = Math.min(...options.map(o => o.price))
      logicalScore += (1 - (option.price - minCost) / (Math.max(...options.map(o => o.price)) - minCost)) * criteria.minimize_cost
    }
    
    // Carbon analysis
    if (criteria.minimize_carbon) {
      const minCarbon = Math.min(...options.map(o => o.carbon))
      logicalScore += (1 - (option.carbon - minCarbon) / (Math.max(...options.map(o => o.carbon)) - minCarbon)) * criteria.minimize_carbon
    }
    
    // Delivery analysis
    if (criteria.minimize_delivery) {
      const minDelivery = Math.min(...options.map(o => o.delivery))
      logicalScore += (1 - (option.delivery - minDelivery) / (Math.max(...options.map(o => o.delivery)) - minDelivery)) * criteria.minimize_delivery
    }
    
    // Sustainability analysis
    if (criteria.maximize_sustainability) {
      const maxSustainability = Math.max(...options.map(o => o.sustainability_score))
      logicalScore += (option.sustainability_score / maxSustainability) * criteria.maximize_sustainability
    }
    
    return {
      option,
      logicalScore,
      reasoning: `Logical analysis shows ${option.name} scores ${logicalScore.toFixed(2)} based on objective metrics`
    }
  })
  
  return scores.sort((a, b) => b.logicalScore - a.logicalScore)
}

/**
 * Ethical Analysis (Ethos) - Values, sustainability, responsibility
 */
function analyzeEthically(options, criteria) {
  const scores = options.map(option => {
    let ethicalScore = 0
    
    // Sustainability is an ethical consideration
    ethicalScore += option.sustainability_score / 10 * 0.4
    
    // Lower carbon is more ethical
    const minCarbon = Math.min(...options.map(o => o.carbon))
    const maxCarbon = Math.max(...options.map(o => o.carbon))
    ethicalScore += (1 - (option.carbon - minCarbon) / (maxCarbon - minCarbon)) * 0.4
    
    // Willingness to discount shows ethical business practices
    if (option.willing_to_discount) {
      ethicalScore += 0.2
    }
    
    return {
      option,
      ethicalScore,
      reasoning: `Ethical analysis: ${option.name} demonstrates ${option.sustainability_score >= 8 ? 'strong' : 'moderate'} commitment to sustainability`
    }
  })
  
  return scores.sort((a, b) => b.ethicalScore - a.ethicalScore)
}

/**
 * Practical Analysis (Phronesis) - Practical wisdom, balance, trade-offs
 */
function analyzePractically(options, criteria) {
  const scores = options.map(option => {
    // Practical wisdom considers balance and real-world constraints
    let practicalScore = 0
    
    // Balance between all factors
    const balance = calculateBalance(option, options)
    practicalScore += balance * 0.5
    
    // Delivery time practicality
    if (option.delivery <= 2) {
      practicalScore += 0.3 // Fast delivery is practical
    } else if (option.delivery <= 4) {
      practicalScore += 0.15
    }
    
    // Cost practicality
    const avgPrice = options.reduce((sum, o) => sum + o.price, 0) / options.length
    if (option.price <= avgPrice) {
      practicalScore += 0.2
    }
    
    return {
      option,
      practicalScore,
      reasoning: `Practical analysis: ${option.name} offers ${balance > 0.7 ? 'well-balanced' : 'acceptable'} trade-offs for operational needs`
    }
  })
  
  return scores.sort((a, b) => b.practicalScore - a.practicalScore)
}

/**
 * Calculate balance score (how well-rounded an option is)
 */
function calculateBalance(option, allOptions) {
  const metrics = {
    price: normalize(option.price, allOptions.map(o => o.price), true), // lower is better
    carbon: normalize(option.carbon, allOptions.map(o => o.carbon), true),
    delivery: normalize(option.delivery, allOptions.map(o => o.delivery), true),
    sustainability: normalize(option.sustainability_score, allOptions.map(o => o.sustainability_score), false) // higher is better
  }
  
  // Balance = how close all metrics are to optimal (1.0)
  const avgDistance = (
    Math.abs(1 - metrics.price) +
    Math.abs(1 - metrics.carbon) +
    Math.abs(1 - metrics.delivery) +
    Math.abs(1 - metrics.sustainability)
  ) / 4
  
  return 1 - avgDistance // Higher = more balanced
}

/**
 * Normalize a value to 0-1 scale
 */
function normalize(value, allValues, lowerIsBetter = true) {
  const min = Math.min(...allValues)
  const max = Math.max(...allValues)
  
  if (max === min) return 1
  
  if (lowerIsBetter) {
    return 1 - (value - min) / (max - min)
  } else {
    return (value - min) / (max - min)
  }
}

/**
 * Synthesize recommendation from all three analyses
 */
function synthesizeRecommendation(analysis, options) {
  // Weighted combination: 40% logical, 30% ethical, 30% practical
  const combinedScores = options.map(option => {
    const logical = analysis.logical.find(a => a.option.id === option.id)?.logicalScore || 0
    const ethical = analysis.ethical.find(a => a.option.id === option.id)?.ethicalScore || 0
    const practical = analysis.practical.find(a => a.option.id === option.id)?.practicalScore || 0
    
    const combined = logical * 0.4 + ethical * 0.3 + practical * 0.3
    
    return {
      option,
      combinedScore: combined,
      breakdown: {
        logical: logical * 0.4,
        ethical: ethical * 0.3,
        practical: practical * 0.3
      }
    }
  })
  
  const winner = combinedScores.sort((a, b) => b.combinedScore - a.combinedScore)[0]
  
  return {
    winner: winner.option,
    score: winner.combinedScore,
    breakdown: winner.breakdown,
    reasoning: `Synthesized recommendation: ${winner.option.name} achieves the best balance of logical optimization (${(winner.breakdown.logical * 100).toFixed(1)}%), ethical considerations (${(winner.breakdown.ethical * 100).toFixed(1)}%), and practical wisdom (${(winner.breakdown.practical * 100).toFixed(1)}%)`
  }
}

/**
 * Generate structured reasoning text using Aristotle framework
 */
export function generateAristotelianReasoning(analysis, buyerGoals) {
  const winner = analysis.recommendation.winner
  const logical = analysis.logical[0]
  const ethical = analysis.ethical[0]
  const practical = analysis.practical[0]
  
  return `Using Aristotelian reasoning framework:

LOGICAL ANALYSIS (Logos): ${winner.name} demonstrates strong objective performance with a logical score of ${logical.logicalScore.toFixed(2)}, excelling in ${buyerGoals.minimize_cost > buyerGoals.minimize_carbon ? 'cost efficiency' : 'carbon reduction'}.

ETHICAL CONSIDERATION (Ethos): The vendor shows ${ethical.ethicalScore >= 0.7 ? 'strong' : 'moderate'} commitment to sustainability (ethical score: ${ethical.ethicalScore.toFixed(2)}), aligning with responsible procurement principles.

PRACTICAL WISDOM (Phronesis): ${practical.practicalScore >= 0.7 ? 'Well-balanced' : 'Acceptable'} trade-offs across all operational dimensions (practical score: ${practical.practicalScore.toFixed(2)}), ensuring both immediate needs and long-term sustainability goals are met.

SYNTHESIS: ${winner.name} represents the optimal choice, balancing economic efficiency, environmental responsibility, and operational practicality.`
}

