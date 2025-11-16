/**
 * AI Service using OpenRouter API with Aristotle Framework
 */

import axios from 'axios'
import dotenv from 'dotenv'
import { calculateFairMarketPrice, getProductPriceRange } from '../constants/productPrices.js'

dotenv.config()

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions'
const LLM_MODEL = process.env.LLM_MODEL || 'meta-llama/llama-3.2-3b-instruct:free'

/**
 * Call OpenRouter API
 */
export async function callLLM(messages, temperature = 0.7) {
  try {
    // Check if API key is configured
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'your-openrouter-api-key' || OPENROUTER_API_KEY.trim() === '') {
      const errorMsg = 'OpenRouter API key not configured. Please set OPENROUTER_API_KEY in your .env file. Get your key from https://openrouter.ai/keys'
      console.error('❌', errorMsg)
      throw new Error(errorMsg)
    }

    // Validate API key format (should start with 'sk-' for OpenRouter)
    if (!OPENROUTER_API_KEY.startsWith('sk-') && !OPENROUTER_API_KEY.startsWith('sk-or-')) {
      console.warn('⚠️ OpenRouter API key format may be incorrect. Keys usually start with "sk-or-"')
    }

    console.log(`🔑 Using OpenRouter API with model: ${LLM_MODEL}`)
    console.log(`📝 Sending ${messages.length} messages to LLM...`)

    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: LLM_MODEL,
        messages,
        temperature,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
          'X-Title': 'Eco-Nexus Marketplace',
        },
        timeout: 30000, // 30 second timeout
      }
    )

    if (!response.data) {
      throw new Error('No data in API response')
    }

    if (!response.data.choices || response.data.choices.length === 0) {
      throw new Error('No response from AI model - empty choices array')
    }

    const content = response.data.choices[0].message.content
    if (!content || content.trim() === '') {
      throw new Error('Empty response from AI model')
    }

    console.log(`✅ LLM response received (${content.length} chars)`)
    return content
  } catch (error) {
    // Enhanced error logging
    if (error.response) {
      // API returned an error response
      const status = error.response.status
      const errorData = error.response.data

      console.error('❌ OpenRouter API Error Response:')
      console.error(`   Status: ${status}`)
      console.error(`   Error:`, errorData)

      if (status === 401) {
        throw new Error('OpenRouter API key is invalid or expired. Please check your OPENROUTER_API_KEY in .env file')
      } else if (status === 429) {
        throw new Error('OpenRouter API rate limit exceeded. Please wait a moment and try again, or upgrade your plan at https://openrouter.ai')
      } else if (status === 400) {
        throw new Error(`OpenRouter API request error: ${errorData?.error?.message || JSON.stringify(errorData)}`)
      } else {
        throw new Error(`OpenRouter API error (${status}): ${errorData?.error?.message || errorData?.message || 'Unknown error'}`)
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('❌ No response from OpenRouter API')
      console.error('   Request timeout or network error')
      throw new Error('Failed to connect to OpenRouter API. Check your internet connection and try again.')
    } else {
      // Error setting up the request
      console.error('❌ Error setting up OpenRouter API request:', error.message)
      throw error
    }
  }
}

/**
 * Parse JSON from LLM response
 */
function parseJSONResponse(text) {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1])
    }
    // Try direct JSON parse
    return JSON.parse(text)
  } catch (e) {
    // Fallback: return structured object
    return { error: 'Failed to parse AI response', raw: text }
  }
}

/**
 * Price Recommendation using real-world product price ranges
 * Uses product min/max values, NOT user inputs
 */
export async function recommendPrice(product, quantity, desiredCarbonScore) {
  // Calculate fair price based on product price ranges (real-world values)
  const productRange = getProductPriceRange(product.name)
  let fairPrice = null
  
  console.log(`🔍 Getting recommendation for: ${product.name}, quantity: ${quantity}`)
  console.log(`📊 Product range found:`, productRange)
  
  if (productRange) {
    // Fair price is midpoint of product's min/max range, multiplied by quantity
    fairPrice = ((productRange.min + productRange.max) / 2) * quantity
    console.log(`✅ Calculated fair price from product range: $${fairPrice.toFixed(2)}`)
  } else {
    // Fallback: use basePrice if product not in our price ranges
    console.warn(`⚠️ Product "${product.name}" not found in price ranges, using basePrice fallback`)
    fairPrice = product.basePrice * quantity
    console.log(`⚠️ Using fallback price: $${fairPrice.toFixed(2)} (basePrice: $${product.basePrice} × quantity: ${quantity})`)
  }
  
  // Generate market justification based on real-world price range
  let marketJustification = ''
  let sustainabilityReasoning = ''
  
  if (productRange) {
    marketJustification = `Based on real-world market data, ${product.name} typically ranges from $${productRange.min.toFixed(2)} to $${productRange.max.toFixed(2)} per unit. The fair market price of $${fairPrice.toFixed(2)} (for ${quantity} unit${quantity > 1 ? 's' : ''}) represents the midpoint of this range, reflecting current market conditions and typical pricing.`
    sustainabilityReasoning = `This price recommendation is independent of any user-specified budget and is based solely on established market values for ${product.name}. It provides an objective baseline for fair negotiation.`
  } else {
    marketJustification = `Based on base price calculation for ${product.name}.`
    sustainabilityReasoning = `Standard pricing applied for this product category.`
  }

  // Try to get AI-generated reasoning, but always use the calculated fair price
  try {
    const prompt = `You are providing market analysis for a product recommendation.

Product: ${product.name}
Category: ${product.category}
Quantity: ${quantity}
${productRange ? `Real-world price range: $${productRange.min.toFixed(2)} - $${productRange.max.toFixed(2)} per unit` : `Base price: $${product.basePrice} per unit`}
Fair market price (calculated): $${fairPrice.toFixed(2)} for ${quantity} unit${quantity > 1 ? 's' : ''}
Desired Carbon Score: ${desiredCarbonScore}/10

IMPORTANT: The fair price of $${fairPrice.toFixed(2)} is already calculated and should NOT be changed. This is based on real-world market data.

Provide additional market context and sustainability reasoning as JSON:
{
  "marketJustification": "<enhanced explanation of why this price is fair, based on market data>",
  "sustainabilityReasoning": "<explanation of sustainability factors>",
  "confidence": <number 0-100>
}

Do NOT include a fairPrice field - it's already set to $${fairPrice.toFixed(2)}.`

    const messages = [
      {
        role: 'system',
        content: 'You are an expert carbon marketplace advisor providing market analysis. You provide reasoning and justification, but the fair price is already calculated from real-world data.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]

    const response = await callLLM(messages)
    const parsed = parseJSONResponse(response)
    
    // Use AI-generated reasoning if available, otherwise use our defaults
    if (parsed.marketJustification) {
      marketJustification = parsed.marketJustification
    }
    if (parsed.sustainabilityReasoning) {
      sustainabilityReasoning = parsed.sustainabilityReasoning
    }
  } catch (error) {
    console.error('AI reasoning generation failed, using defaults:', error)
    // Continue with our calculated values
  }
  
  // Always return the calculated fair price (based on product ranges, not user input)
  return {
    fairPrice: fairPrice,
    suggestedPrice: fairPrice, // Same as fairPrice for consistency
    recommendedCarbonRange: {
      min: Math.max(0, desiredCarbonScore - 1),
      max: Math.min(10, desiredCarbonScore + 1),
    },
    marketJustification: marketJustification,
    sustainabilityReasoning: sustainabilityReasoning,
    confidence: 85, // High confidence since it's based on real market data
  }
}

/**
 * Rank Sellers using Aristotle Framework
 */
export async function rankSellers(request, quotes) {
  const prompt = `You are the Recommendation Agent using Aristotelian Reasoning.

Buyer Request:
- Product: ${request.productName}
- Quantity: ${request.quantity}
- Desired Carbon Score: ${request.desiredCarbonScore}
- Max Price: $${request.maxPrice || 'N/A'}

Seller Quotes:
${quotes.map((q, i) => `
${i + 1}. ${q.sellerName}
   - Price: $${q.price}
   - Carbon Score: ${q.carbonScore}/10
   - Reliability Score: ${q.reliabilityScore}/100
   - Delivery: ${q.deliveryDays} days
`).join('\n')}

Using Logos (price fairness), Ethos (seller credibility), and Phronesis (practical deliverability), rank the top 3 sellers.

Return JSON:
{
  "rankings": [
    {
      "sellerId": "<id>",
      "sellerName": "<name>",
      "matchScore": <0-100>,
      "priceFairness": <0-100>,
      "carbonAlignment": <0-100>,
      "reliability": <0-100>,
      "aiConfidence": <0-100>,
      "reasoning": "<explanation>"
    }
  ]
}`

  const messages = [
    {
      role: 'system',
      content: 'You are an expert recommendation system using Aristotelian reasoning.'
    },
    {
      role: 'user',
      content: prompt
    }
  ]

  const response = await callLLM(messages)
  const parsed = parseJSONResponse(response)
  
  // Fallback ranking if AI fails
  if (!parsed.rankings || parsed.rankings.length === 0) {
    return quotes.map(q => ({
      sellerId: q.sellerId,
      sellerName: q.sellerName,
      matchScore: calculateMatchScore(request, q),
      priceFairness: calculatePriceFairness(request, q),
      carbonAlignment: calculateCarbonAlignment(request, q),
      reliability: q.reliabilityScore,
      aiConfidence: 60,
      reasoning: 'Calculated using algorithmic scoring',
    })).sort((a, b) => b.matchScore - a.matchScore).slice(0, 3)
  }

  return parsed.rankings.slice(0, 3)
}

/**
 * Provide Negotiation Hints
 */
export async function getNegotiationHints(transactionId, buyerId, sellerId, chatHistory) {
  const prompt = `You are the Negotiation Co-pilot Agent.

Transaction ID: ${transactionId}
Buyer ID: ${buyerId}
Seller ID: ${sellerId}

Recent Chat History:
${chatHistory.slice(-5).map(m => `${m.senderName}: ${m.message}`).join('\n')}

Analyze the negotiation and provide helpful hints for both parties to reach a fair, sustainable agreement.

Return JSON:
{
  "suggestion": "<actionable suggestion>",
  "reasoning": "<explanation>",
  "confidence": <0-100>
}`

  const messages = [
    {
      role: 'system',
      content: 'You are a negotiation assistant helping parties reach mutually beneficial agreements.'
    },
    {
      role: 'user',
      content: prompt
    }
  ]

  const response = await callLLM(messages)
  return parseJSONResponse(response)
}

// Helper functions for fallback calculations
function calculateMatchScore(request, quote) {
  const priceScore = calculatePriceFairness(request, quote)
  const carbonScore = calculateCarbonAlignment(request, quote)
  return (priceScore * 0.3 + carbonScore * 0.3 + quote.reliabilityScore * 0.4)
}

function calculatePriceFairness(request, quote) {
  if (!request.maxPrice) return 75
  const priceRatio = quote.price / request.maxPrice
  if (priceRatio <= 0.8) return 100
  if (priceRatio <= 1.0) return 80
  if (priceRatio <= 1.2) return 60
  return 40
}

function calculateCarbonAlignment(request, quote) {
  const diff = Math.abs(quote.carbonScore - request.desiredCarbonScore)
  if (diff <= 0.5) return 100
  if (diff <= 1.0) return 80
  if (diff <= 1.5) return 60
  return 40
}

