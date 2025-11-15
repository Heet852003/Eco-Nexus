import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface Vendor {
  id: string
  name: string
  price: number
  carbon: number
  delivery: number
  sustainability_score: number
  willing_to_discount: boolean
  description?: string
}

export interface NegotiationResult {
  winner: {
    id: string
    name: string
    price: number
    carbon: number
    delivery: number
    sustainability_score: number
  }
  carbon_saved: number
  cost_saved: number
  scc_tokens: number
  reasoning: string
  comparison: Array<{
    vendor: string
    score: number
  }>
}

export interface Analytics {
  total_carbon_saved: number
  total_cost_saved: number
  total_scc_tokens: number
  decisions_count: number
  monthly_data?: Array<{
    month: string
    carbon_saved: number
    cost_saved: number
    tokens_earned: number
  }>
}

/**
 * Fetch all available vendors
 */
export async function getVendors(): Promise<Vendor[]> {
  const response = await api.get('/api/vendors/list')
  return response.data
}

/**
 * Trigger multi-agent negotiation
 */
export async function negotiate(): Promise<NegotiationResult> {
  const response = await api.post('/api/agents/negotiate')
  return response.data
}

/**
 * Get final recommendation
 */
export async function getRecommendation(): Promise<NegotiationResult> {
  const response = await api.get('/api/recommendation')
  return response.data
}

/**
 * Mint SCC tokens on Solana
 */
export async function rewardTokens(amount: number, walletAddress: string): Promise<{ txHash: string }> {
  const response = await api.post('/api/solana/reward', {
    amount,
    walletAddress,
  })
  return response.data
}

/**
 * Get analytics from Snowflake
 */
export async function getAnalytics(): Promise<Analytics> {
  const response = await api.get('/api/analytics/report')
  return response.data
}

