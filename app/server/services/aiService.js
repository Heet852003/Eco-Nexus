/**
 * AI Service using OpenRouter API with Aristotle Framework
 */

import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions'
const LLM_MODEL = process.env.LLM_MODEL || 'meta-llama/llama-3.2-3b-instruct:free'

/**
 * Call OpenRouter API
 */
async function callLLM(messages, temperature = 0.7) {
  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured')
    }
    
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
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Carbon Marketplace',
        },
      }
    )
    
    if (!response.data.choices || response.data.choices.length === 0) {
      throw new Error('No response from AI model')
    }
    
    return response.data.choices[0].message.content
  } catch (error) {
    console.error('LLM API Error:', error.response?.data || error.message)
    throw new Error(`AI service error: ${error.response?.data?.error?.message || error.message}`)
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
 * Price Recommendation using Aristotle Framework
 */
export async function recommendPrice(product, quantity, desiredCarbonScore) {
  const prompt = `You are the Buyer Agent using Aristotelian Reasoning (Logos, Ethos, Phronesis).

Given:
- Product: ${product.name}
- Category: ${product.category}
- Base Price: $${product.basePrice}
- Quantity: ${quantity}
- Desired Carbon Score: ${desiredCarbonScore}/10

Using Aristotelian principles:
1. LOGOS (Logical Analysis): Analyze market data, price trends, and economic factors
2. ETHOS (Credibility): Consider product authenticity and seller reputation
3. PHRONESIS (Practical Wisdom): Balance cost, sustainability, and value

Provide your recommendation as JSON:
{
  "fairPrice": <number in USD>,
  "recommendedCarbonRange": {
    "min": <number 0-10>,
    "max": <number 0-10>
  },
  "marketJustification": "<explanation>",
  "sustainabilityReasoning": "<explanation>",
  "confidence": <number 0-100>
}`

  const messages = [
    {
      role: 'system',
      content: 'You are an expert carbon marketplace advisor using Aristotelian reasoning principles.'
    },
    {
      role: 'user',
      content: prompt
    }
  ]

  try {
    const response = await callLLM(messages)
    const parsed = parseJSONResponse(response)
    
    // Ensure numeric values
    return {
      fairPrice: parsed.fairPrice || product.basePrice,
      recommendedCarbonRange: {
        min: parsed.recommendedCarbonRange?.min || Math.max(0, desiredCarbonScore - 1),
        max: parsed.recommendedCarbonRange?.max || Math.min(10, desiredCarbonScore + 1),
      },
      marketJustification: parsed.marketJustification || 'Based on market analysis',
      sustainabilityReasoning: parsed.sustainabilityReasoning || 'Sustainability-focused recommendation',
      confidence: parsed.confidence || 75,
    }
  } catch (error) {
    console.error('AI recommendation error:', error)
    // Return fallback recommendation if AI fails
    return {
      fairPrice: product.basePrice * quantity,
      recommendedCarbonRange: {
        min: Math.max(0, desiredCarbonScore - 1),
        max: Math.min(10, desiredCarbonScore + 1),
      },
      marketJustification: 'Based on base price calculation (AI service unavailable)',
      sustainabilityReasoning: 'Standard sustainability metrics applied',
      confidence: 50,
    }
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

