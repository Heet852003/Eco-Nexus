/**
 * API Client for Carbon Marketplace
 */

import axios from 'axios'
import type { 
  User, 
  BuyerRequest, 
  SellerQuote, 
  Transaction, 
  ChatMessage,
  AIRecommendation,
  SellerRanking,
  Analytics
} from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export async function register(email: string, name: string, password: string) {
  const response = await api.post('/api/auth/register', { email, name, password })
  if (response.data.token && typeof window !== 'undefined') {
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
  }
  return response.data
}

export async function login(email: string, password: string) {
  const response = await api.post('/api/auth/login', { email, password })
  if (response.data.token && typeof window !== 'undefined') {
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
  }
  return response.data
}

// Buyer
export async function createBuyerRequest(data: {
  productId: string
  quantity: number
  maxPrice: number
}) {
  const response = await api.post('/api/buyer/request', data)
  return response.data as BuyerRequest
}

export async function getBuyerRequests() {
  const response = await api.get('/api/buyer/requests')
  return response.data as BuyerRequest[]
}

export async function getBuyerRequest(id: string) {
  const response = await api.get(`/api/buyer/request/${id}`)
  return response.data as BuyerRequest
}

export async function acceptQuote(requestId: string, quoteId: string) {
  const response = await api.post('/api/buyer/accept-quote', { requestId, quoteId })
  return response.data as Transaction
}

export async function getTransaction(transactionId: string) {
  const response = await api.get(`/api/transaction/${transactionId}`)
  return response.data as Transaction
}

export async function getBuyerTransactions() {
  const response = await api.get('/api/buyer/transactions')
  return response.data as Transaction[]
}

export async function getSellerTransactions() {
  const response = await api.get('/api/seller/transactions')
  return response.data as Transaction[]
}

export async function commitTransactionToBlockchain(transactionId: string, buyerWalletAddress?: string) {
  const response = await api.post('/api/blockchain/commit', { transactionId, buyerWalletAddress })
  return response.data
}

export async function updateBuyerRequest(requestId: string, data: {
  quantity?: number
  maxPrice?: number
  notes?: string
}) {
  const response = await api.put(`/api/buyer/request/${requestId}`, data)
  return response.data as BuyerRequest
}

// Seller
export async function getSellerRequests(params?: { productId?: string }) {
  const queryString = params?.productId ? `?productId=${params.productId}` : ''
  const response = await api.get(`/api/seller/requests${queryString}`)
  return response.data as BuyerRequest[]
}

export async function submitQuote(data: {
  requestId: string
  price: number
  deliveryDays: number
  localFlag?: boolean
}) {
  // Map frontend field names to backend expected names
  const response = await api.post('/api/seller/quote', {
    requestId: data.requestId,
    sellerPrice: data.price,
    deliveryDays: data.deliveryDays,
    localFlag: data.localFlag || false
  })
  return response.data as SellerQuote
}

export async function updateSellerQuote(quoteId: string, data: {
  price?: number
  deliveryDays?: number
}) {
  // Map frontend field names to backend expected names
  const response = await api.put(`/api/seller/quote/${quoteId}`, {
    sellerPrice: data.price,
    deliveryDays: data.deliveryDays
  })
  return response.data as SellerQuote
}

// Chat (Legacy - use negotiation instead)
export async function sendMessage(transactionId: string, message: string) {
  const response = await api.post('/api/chat/send', { transactionId, message })
  return response.data as ChatMessage
}

export async function getMessages(transactionId: string) {
  const response = await api.get(`/api/chat/${transactionId}`)
  return response.data as ChatMessage[]
}

// Negotiation Chat
export async function createNegotiationThread(requestId: string, quoteId: string) {
  const response = await api.post('/api/negotiation/thread', { requestId, quoteId })
  return response.data
}

export async function getNegotiationThread(threadIdOrQuoteId: string) {
  // If it's a quoteId, we need to find the thread first
  // For now, assume it's a threadId
  const response = await api.get(`/api/negotiation/thread/${threadIdOrQuoteId}`)
  return response.data
}

export async function sendNegotiationMessage(threadId: string, content: string) {
  const response = await api.post('/api/negotiation/message', { threadId, content })
  return response.data
}

export async function getNegotiationMessages(threadId: string) {
  const response = await api.get(`/api/negotiation/thread/${threadId}`)
  return response.data?.messages || []
}

export async function triggerAgentNegotiation(threadId: string) {
  const response = await api.post('/api/negotiation/agent-negotiate', { threadId })
  return response.data
}

export async function updateNegotiationGuidelines(threadId: string, guidelines: string) {
  const response = await api.post('/api/negotiation/guidelines', { threadId, guidelines })
  return response.data
}

export async function extractNegotiatedTerms(threadId: string) {
  const response = await api.post('/api/negotiation/extract-terms', { threadId })
  return response.data
}

export async function getUserNegotiationThreads() {
  const response = await api.get('/api/negotiation/user-threads')
  return response.data
}

// AI
export async function recommendPrice(productId: string, quantity: number, desiredCarbonScore: number) {
  const response = await api.post('/api/ai/recommend-price', { productId, quantity, desiredCarbonScore })
  return response.data as AIRecommendation
}

export async function rankSellers(requestId: string) {
  const response = await api.post('/api/ai/rank-sellers', { requestId })
  return response.data as { rankings: SellerRanking[] }
}

export async function getNegotiationHints(transactionId: string) {
  const response = await api.post('/api/ai/negotiation-hints', { transactionId })
  return response.data
}

// Blockchain
export async function commitTransaction(transactionId: string, buyerWalletAddress?: string) {
  const response = await api.post('/api/blockchain/commit', { transactionId, buyerWalletAddress })
  return response.data
}

// Analytics
export async function getCarbonAnalytics() {
  const response = await api.get('/api/analytics/carbon')
  return response.data
}

export async function getDashboard() {
  const response = await api.get('/api/analytics/dashboard')
  return response.data
}

export async function getReportAnalytics() {
  const response = await api.get('/api/analytics/report')
  return response.data
}

// User
export async function updateUserRoles(isBuyer?: boolean, isSeller?: boolean) {
  const response = await api.post('/api/user/update-roles', { isBuyer, isSeller })
  if (response.data.user && typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(response.data.user))
  }
  return response.data
}

// Legacy function for backward compatibility - now uses roles
// This enables the target role while keeping the other role enabled (user can have both)
export async function updateUserRole(role: 'buyer' | 'seller') {
  // Enable the target role, but don't disable the other role
  // This allows users to have both buyer and seller capabilities
  if (role === 'buyer') {
    return updateUserRoles(true, undefined) // Enable buyer, keep seller as-is
  } else {
    return updateUserRoles(undefined, true) // Enable seller, keep buyer as-is
  }
}

export async function getUserProfile() {
  const response = await api.get('/api/user/profile')
  return response.data
}

