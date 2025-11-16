// TypeScript types for Carbon Marketplace (copied from shared for client use)

export interface User {
  id: string
  email: string
  name: string
  roles: {
    isBuyer: boolean
    isSeller: boolean
  }
  createdAt?: string
  reliabilityScore?: number
  sustainabilityScore?: number
  carbonSavings?: number
  totalTransactions?: number
}

export interface Product {
  id: string
  name: string
  category: string
  basePrice: number
}

export interface BuyerRequest {
  id: string
  buyerId: string
  productId: string
  productName: string
  quantity: number
  maxPrice?: number
  notes?: string
  status: 'pending' | 'quoted' | 'negotiating' | 'accepted' | 'completed' | 'cancelled' | 'OPEN' | 'COMPLETED' | 'CLOSED'
  createdAt: string
  updatedAt: string
  aiRecommendation?: AIRecommendation
  quotes?: SellerQuote[]
  quoteCount?: number
  transaction?: {
    id: string
    status: string
    blockchainSignature?: string
  }
}

export interface SellerQuote {
  id: string
  requestId: string
  sellerId: string
  sellerName: string
  price: number
  deliveryDays: number
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
  quoteId?: string
  buyerId: string
  sellerId: string
  productId: string
  productName: string
  quantity: number
  price: number
  finalPrice?: number
  status: 'pending' | 'committed' | 'completed' | 'failed' | 'PENDING' | 'COMMITTED' | 'COMPLETED' | 'FAILED'
  blockchainSignature?: string
  blockchainTxHash?: string
  solanaSignature?: string
  sccTokensMinted?: number
  createdAt: string
  completedAt?: string
}

export interface Analytics {
  totalTransactions: number
  topSellers: Array<{
    sellerId: string
    sellerName: string
    transactions: number
  }>
  dailySummary: Array<{
    date: string
    transactions: number
  }>
}

