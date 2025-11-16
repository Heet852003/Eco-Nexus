// Shared TypeScript types for Carbon Marketplace

export interface User {
  id: string
  email: string
  name: string
  role: 'buyer' | 'seller' | 'admin'
  createdAt: string
  reliabilityScore?: number
}

export interface Product {
  id: string
  name: string
  category: string
  basePrice: number
  avgCarbonScore: number
}

export interface BuyerRequest {
  id: string
  buyerId: string
  productId: string
  productName: string
  quantity: number
  desiredCarbonScore: number
  maxPrice?: number
  status: 'pending' | 'quoted' | 'negotiating' | 'accepted' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
  aiRecommendation?: AIRecommendation
  quotes?: SellerQuote[]
}

export interface SellerQuote {
  id: string
  requestId: string
  sellerId: string
  sellerName: string
  price: number
  carbonScore: number
  deliveryDays: number
  reliabilityScore: number
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  aiJustification?: string
}

export interface AIRecommendation {
  fairPrice: number
  recommendedCarbonRange: {
    min: number
    max: number
  }
  marketJustification: string
  sustainabilityReasoning: string
  confidence: number
}

export interface SellerRanking {
  sellerId: string
  sellerName: string
  matchScore: number
  priceFairness: number
  carbonAlignment: number
  reliability: number
  aiConfidence: number
  reasoning: string
}

export interface ChatMessage {
  id: string
  transactionId: string
  senderId: string
  senderName: string
  message: string
  timestamp: string
  aiHint?: string
}

export interface Transaction {
  id: string
  requestId: string
  buyerId: string
  sellerId: string
  productId: string
  productName: string
  quantity: number
  price: number
  carbonScore: number
  status: 'pending' | 'committed' | 'completed' | 'failed'
  blockchainSignature?: string
  blockchainTxHash?: string
  sccTokensMinted?: number
  createdAt: string
  completedAt?: string
}

export interface CarbonScoreHistory {
  id: string
  sellerId: string
  transactionId: string
  carbonScore: number
  carbonSaved: number
  timestamp: string
}

export interface SellerReliability {
  sellerId: string
  successfulTransactions: number
  avgRating: number
  carbonSavings: number
  reliabilityScore: number
  lastUpdated: string
}

export interface Analytics {
  totalCarbonSaved: number
  totalTransactions: number
  totalSccTokensMinted: number
  topSellers: Array<{
    sellerId: string
    sellerName: string
    carbonSaved: number
    transactions: number
  }>
  dailySummary: Array<{
    date: string
    transactions: number
    carbonSaved: number
    tokensMinted: number
  }>
}

export interface NegotiationHint {
  suggestion: string
  reasoning: string
  confidence: number
}

