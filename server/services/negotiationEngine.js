/**
 * Realistic Negotiation Engine
 * Implements human-like negotiation with fair bargaining, reasoning, and settlements
 */

import { calculateFairMarketPrice, getProductPriceRange } from '../constants/productPrices.js'

/**
 * Analyze negotiation position and generate reasoning
 */
export function analyzeNegotiationPosition(agentType, request, quote, chatHistory, competingQuotes, guidelines = {}) {
  const isBuyer = agentType === 'BUYER'
  
  // Get product price range from constants
  const productRange = getProductPriceRange(request.productName)
  
  // Calculate fair market price based on product min/max (consistent, doesn't change)
  let fairMarketPrice = null
  if (productRange) {
    // Fair price is midpoint of product's min/max range, multiplied by quantity
    fairMarketPrice = ((productRange.min + productRange.max) / 2) * request.quantity
  } else {
    // Fallback: use midpoint between budget and original quote if product not found
    const maxBudget = request.maxPrice
    const originalPrice = quote.sellerPrice
    fairMarketPrice = (maxBudget + originalPrice) / 2
  }
  
  // Calculate acceptable price ranges based on product min/max
  const originalPrice = quote.sellerPrice
  const maxBudget = request.maxPrice
  
  // Buyer's acceptable range: from product min to max budget (or product max if lower)
  const productMinPrice = productRange ? productRange.min * request.quantity : maxBudget * 0.5
  const productMaxPrice = productRange ? productRange.max * request.quantity : maxBudget
  const minAcceptablePrice = Math.max(productMinPrice, maxBudget * 0.5) // At least 50% of budget
  const maxAcceptablePrice = Math.min(productMaxPrice, maxBudget) // Not more than budget or product max
  
  // Seller's acceptable range: from product min (their minimum) to original quote (their maximum)
  // Seller should move DOWN from original quote, not UP
  const sellerMinPrice = productRange ? productRange.min * request.quantity : originalPrice * 0.7 // Won't go below 70% of original
  const sellerMaxPrice = originalPrice // Original quote is their starting point (maximum)
  
  // Extract previous offers from chat history
  const previousOffers = extractOffers(chatHistory, agentType)
  const lastOffer = previousOffers[previousOffers.length - 1]
  const otherPartyLastOffer = extractOffers(chatHistory, isBuyer ? 'SELLER' : 'BUYER').slice(-1)[0]
  
  // Calculate negotiation progress
  const progress = calculateProgress(originalPrice, lastOffer, otherPartyLastOffer, fairMarketPrice)
  
  // Analyze competing quotes for leverage
  const leverage = analyzeLeverage(competingQuotes, originalPrice, isBuyer)
  
  // Determine negotiation strategy
  const strategy = determineStrategy(
    progress,
    leverage,
    chatHistory.length,
    isBuyer,
    lastOffer,
    otherPartyLastOffer
  )
  
  return {
    agentType,
    originalPrice,
    maxBudget,
    minAcceptablePrice, // Buyer's minimum
    maxAcceptablePrice, // Buyer's maximum (budget)
    sellerMinPrice, // Seller's minimum (won't go below)
    sellerMaxPrice, // Seller's maximum (original quote)
    fairMarketPrice, // This is now consistent based on product min/max
    lastOffer,
    otherPartyLastOffer,
    progress,
    leverage,
    strategy,
    previousOffers,
    guidelines: guidelines.user || null,
    productRange // Include for reference
  }
}

/**
 * Extract offers from chat history
 */
function extractOffers(chatHistory, agentType) {
  const offers = []
  const agentMessages = chatHistory.filter(m => 
    m.senderType === `AGENT_${agentType}` || 
    m.senderType?.startsWith(`AGENT_${agentType}`)
  )
  
  for (const msg of agentMessages) {
    const price = extractPriceFromMessage(msg.content)
    if (price) {
      offers.push({
        price,
        message: msg.content,
        timestamp: msg.timestamp || new Date()
      })
    }
  }
  
  return offers
}

/**
 * Extract price from message
 */
export function extractPriceFromMessage(message) {
  // Look for $XX.XX or $XX patterns
  const pricePattern = /\$(\d+(?:\.\d{2})?)/g
  const matches = message.match(pricePattern)
  if (matches && matches.length > 0) {
    // Get the last price mentioned (most recent offer)
    const lastMatch = matches[matches.length - 1]
    return parseFloat(lastMatch.replace('$', ''))
  }
  return null
}

/**
 * Calculate negotiation progress
 */
function calculateProgress(originalPrice, lastOffer, otherPartyOffer, fairPrice) {
  if (!lastOffer && !otherPartyOffer) {
    return {
      stage: 'initial',
      convergence: 0,
      direction: 'none'
    }
  }
  
  const myPrice = lastOffer?.price || originalPrice
  const theirPrice = otherPartyOffer?.price || originalPrice
  
  // Calculate how close we are to fair price
  const myDistance = Math.abs(myPrice - fairPrice)
  const theirDistance = Math.abs(theirPrice - fairPrice)
  const totalRange = Math.abs(originalPrice - fairPrice) * 2
  
  const convergence = totalRange > 0 
    ? Math.max(0, 100 - ((myDistance + theirDistance) / totalRange * 100))
    : 0
  
  // Determine direction
  let direction = 'none'
  if (lastOffer && otherPartyOffer) {
    const diff = Math.abs(myPrice - theirPrice)
    if (diff < originalPrice * 0.05) {
      direction = 'converging'
    } else if (myPrice < theirPrice) {
      direction = 'buyer_lower'
    } else {
      direction = 'seller_higher'
    }
  }
  
  // Determine stage
  let stage = 'initial'
  if (convergence > 80) {
    stage = 'near_settlement'
  } else if (convergence > 50) {
    stage = 'negotiating'
  } else if (convergence > 20) {
    stage = 'early'
  }
  
  return { stage, convergence, direction, myPrice, theirPrice }
}

/**
 * Analyze leverage from competing quotes
 */
function analyzeLeverage(competingQuotes, currentPrice, isBuyer) {
  if (!competingQuotes || competingQuotes.length === 0) {
    return {
      hasLeverage: false,
      strength: 'none',
      message: ''
    }
  }
  
  const betterQuotes = competingQuotes.filter(q => 
    isBuyer ? q.sellerPrice < currentPrice : q.sellerPrice > currentPrice
  )
  
  if (betterQuotes.length === 0) {
    return {
      hasLeverage: false,
      strength: 'none',
      message: ''
    }
  }
  
  const bestAlternative = isBuyer
    ? Math.min(...competingQuotes.map(q => q.sellerPrice))
    : Math.max(...competingQuotes.map(q => q.sellerPrice))
  
  const priceDiff = Math.abs(bestAlternative - currentPrice)
  const percentDiff = (priceDiff / currentPrice) * 100
  
  let strength = 'weak'
  let message = ''
  
  if (percentDiff > 15) {
    strength = 'strong'
    message = isBuyer
      ? `There are ${betterQuotes.length} better offers available (best: $${bestAlternative.toFixed(2)})`
      : `There are ${betterQuotes.length} competing offers (best: $${bestAlternative.toFixed(2)})`
  } else if (percentDiff > 5) {
    strength = 'moderate'
    message = isBuyer
      ? `There are ${betterQuotes.length} similar offers available`
      : `There are ${betterQuotes.length} competing offers in similar range`
  } else {
    strength = 'weak'
    message = `There are ${betterQuotes.length} alternative options`
  }
  
  return {
    hasLeverage: true,
    strength,
    message,
    bestAlternative,
    betterQuotesCount: betterQuotes.length
  }
}

/**
 * Determine negotiation strategy
 */
function determineStrategy(progress, leverage, roundNumber, isBuyer, lastOffer, otherPartyOffer) {
  const strategies = []
  
  // Early stage: be more flexible
  if (progress.stage === 'initial' || progress.stage === 'early') {
    strategies.push({
      type: 'opening',
      approach: 'flexible',
      message: 'Start with a reasonable opening offer that shows willingness to negotiate'
    })
  }
  
  // Near settlement: be more willing to compromise
  if (progress.stage === 'near_settlement') {
    strategies.push({
      type: 'settlement',
      approach: 'compromise',
      message: 'We are close to agreement. Consider making a final reasonable offer to close the deal.'
    })
  }
  
  // Use leverage if available
  if (leverage.hasLeverage && leverage.strength === 'strong') {
    strategies.push({
      type: 'leverage',
      approach: 'assertive',
      message: leverage.message + '. Use this to negotiate better terms.'
    })
  }
  
  // If other party made a reasonable offer, consider accepting
  if (otherPartyOffer && progress.convergence > 70) {
    const offerDiff = Math.abs((lastOffer?.price || (isBuyer ? progress.maxBudget : progress.originalPrice)) - otherPartyOffer.price)
    const percentDiff = (offerDiff / otherPartyOffer.price) * 100
    
    if (percentDiff < 5) {
      strategies.push({
        type: 'accept',
        approach: 'cooperative',
        message: 'The other party\'s offer is very close to your position. Consider accepting or making a small final counter-offer.'
      })
    }
  }
  
  // If we've been negotiating for a while, show willingness to move
  if (roundNumber > 3 && progress.convergence < 50) {
    strategies.push({
      type: 'movement',
      approach: 'flexible',
      message: 'We\'ve been negotiating for several rounds. Consider making a more significant move to show good faith.'
    })
  }
  
  // Default strategy
  if (strategies.length === 0) {
    strategies.push({
      type: 'standard',
      approach: 'balanced',
      message: 'Continue negotiating with a balanced approach, considering both parties\' interests.'
    })
  }
  
  return {
    primary: strategies[0],
    secondary: strategies.slice(1),
    recommendedApproach: strategies[0].approach
  }
}

/**
 * Generate justification for an offer
 */
export function generateJustification(agentType, offerPrice, analysis, request, quote) {
  const isBuyer = agentType === 'BUYER'
  const justifications = []
  
  // Price justification
  if (offerPrice) {
    const originalPrice = quote.sellerPrice
    const diff = Math.abs(offerPrice - originalPrice)
    const percentDiff = (diff / originalPrice) * 100
    
    if (isBuyer) {
      if (offerPrice < originalPrice) {
        justifications.push({
          type: 'price',
          reason: `My offer of $${offerPrice.toFixed(2)} is ${percentDiff.toFixed(1)}% below your original quote of $${originalPrice.toFixed(2)}.`,
          fairness: 'This is a reasonable starting point for negotiation.'
        })
      } else {
        justifications.push({
          type: 'price',
          reason: `I'm offering $${offerPrice.toFixed(2)}, which is close to your original quote.`,
          fairness: 'This shows my commitment to reaching a fair agreement.'
        })
      }
    } else {
      if (offerPrice > originalPrice) {
        justifications.push({
          type: 'price',
          reason: `My price of $${offerPrice.toFixed(2)} reflects the quality and sustainability of the product.`,
          fairness: 'This is a fair market price for the value provided.'
        })
      } else {
        justifications.push({
          type: 'price',
          reason: `I'm willing to offer $${offerPrice.toFixed(2)}, which is a competitive price.`,
          fairness: 'This demonstrates my commitment to working with you.'
        })
      }
    }
  }
  
  // Market justification
  if (analysis.leverage.hasLeverage) {
    justifications.push({
      type: 'market',
      reason: analysis.leverage.message,
      fairness: 'This reflects current market conditions and competitive pricing.'
    })
  }
  
  // Fairness justification
  if (analysis.fairMarketPrice) {
    const distanceToFair = Math.abs(offerPrice - analysis.fairMarketPrice)
    const percentFromFair = (distanceToFair / analysis.fairMarketPrice) * 100
    
    if (percentFromFair < 10) {
      justifications.push({
        type: 'fairness',
        reason: `This offer is close to the fair market price of $${analysis.fairMarketPrice.toFixed(2)}.`,
        fairness: 'It represents a balanced and fair agreement for both parties.'
      })
    }
  }
  
  // Guidelines justification
  if (analysis.guidelines) {
    justifications.push({
      type: 'guidelines',
      reason: 'This offer aligns with the negotiation guidelines we established.',
      fairness: 'It respects both parties\' stated preferences and constraints.'
    })
  } else if (analysis.guidelines === null && (analysis.userGuidelines || analysis.otherGuidelines)) {
    // Fallback if guidelines not in analysis object
    justifications.push({
      type: 'guidelines',
      reason: 'This offer considers the negotiation guidelines.',
      fairness: 'It aims to respect both parties\' preferences.'
    })
  }
  
  return justifications
}

/**
 * Check if settlement is reached
 * Also checks if one party's demand is met (buyer's maxPrice or seller's minimum)
 */
export function checkSettlement(buyerMessage, sellerMessage, analysis) {
  // Check for explicit agreement keywords
  const agreementKeywords = [
    'accept', 'agreed', 'deal', 'accepted', 'agreement',
    'we have a deal', 'i accept', 'sounds good', 'agreed to',
    'final price', 'final terms', 'we agree', 'mutually agreed',
    'let\'s proceed', 'confirmed', 'settled'
  ]
  
  const buyerLower = buyerMessage.toLowerCase()
  const sellerLower = sellerMessage.toLowerCase()
  
  const buyerAgrees = agreementKeywords.some(keyword => buyerLower.includes(keyword))
  const sellerAgrees = agreementKeywords.some(keyword => sellerLower.includes(keyword))
  
  // Extract prices
  const buyerPrice = extractPriceFromMessage(buyerMessage)
  const sellerPrice = extractPriceFromMessage(sellerMessage)
  
  // Check if buyer's demand is met (seller's price is within buyer's budget)
  let buyerDemandMet = false
  if (sellerPrice && analysis && analysis.maxBudget) {
    // Buyer accepts if seller's price is within their budget
    buyerDemandMet = sellerPrice <= analysis.maxBudget
    if (buyerDemandMet) {
      console.log(`✅ Buyer's demand met: Seller's price $${sellerPrice.toFixed(2)} is within buyer's budget of $${analysis.maxBudget.toFixed(2)}`)
    }
  }
  
  // Check if seller's demand is met (buyer's price is at or above seller's minimum)
  let sellerDemandMet = false
  if (buyerPrice && analysis && analysis.sellerMinPrice) {
    // Seller accepts if buyer's price is at or above their minimum
    sellerDemandMet = buyerPrice >= analysis.sellerMinPrice
    if (sellerDemandMet) {
      console.log(`✅ Seller's demand met: Buyer's price $${buyerPrice.toFixed(2)} is at or above seller's minimum of $${analysis.sellerMinPrice.toFixed(2)}`)
    }
  }
  
  // Check price convergence
  let priceSettlement = false
  if (buyerPrice && sellerPrice) {
    const diff = Math.abs(buyerPrice - sellerPrice)
    const percentDiff = (diff / Math.max(buyerPrice, sellerPrice)) * 100
    
    // Consider settled if prices are within 2% or $5
    priceSettlement = percentDiff < 2 || diff < 5
  }
  
  // Check if both parties explicitly agree
  const explicitAgreement = buyerAgrees && sellerAgrees
  
  // Check if we're very close to fair price
  const nearFairPrice = analysis && analysis.progress && analysis.progress.convergence > 85
  
  // Settlement is reached if:
  // 1. Both parties explicitly agree
  // 2. Prices converge AND near fair price
  // 3. Buyer's demand is met (seller's price within budget)
  // 4. Seller's demand is met (buyer's price at/above minimum)
  const isSettled = explicitAgreement || 
                    (priceSettlement && nearFairPrice) ||
                    buyerDemandMet ||
                    sellerDemandMet
  
  // Determine settlement reason
  let reason = 'no_settlement'
  if (explicitAgreement) {
    reason = 'explicit_agreement'
  } else if (buyerDemandMet) {
    reason = 'buyer_demand_met'
  } else if (sellerDemandMet) {
    reason = 'seller_demand_met'
  } else if (priceSettlement && nearFairPrice) {
    reason = 'price_convergence'
  } else if (priceSettlement) {
    reason = 'price_close'
  }
  
  return {
    settled: isSettled,
    reason: reason,
    buyerPrice,
    sellerPrice,
    priceDiff: buyerPrice && sellerPrice ? Math.abs(buyerPrice - sellerPrice) : null,
    buyerDemandMet,
    sellerDemandMet,
    finalPrice: buyerPrice || sellerPrice || null // Use whichever price is available
  }
}

