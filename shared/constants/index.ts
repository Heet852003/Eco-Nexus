// Shared constants for Carbon Marketplace
// Products match the ML model training data

export const PRODUCTS = [
  { id: 'prod-1', name: 'Ballpoint Pen', category: 'Office Supplies', basePrice: 2, avgCarbonScore: 6.5 },
  { id: 'prod-2', name: 'Binder Clips', category: 'Office Supplies', basePrice: 5, avgCarbonScore: 7.0 },
  { id: 'prod-3', name: 'Keyboard', category: 'Electronics', basePrice: 50, avgCarbonScore: 5.5 },
  { id: 'prod-4', name: 'Webcam', category: 'Electronics', basePrice: 40, avgCarbonScore: 5.0 },
  { id: 'prod-5', name: 'Coffee Mug', category: 'Kitchenware', basePrice: 8, avgCarbonScore: 7.5 },
  { id: 'prod-6', name: 'Cutlery Set', category: 'Kitchenware', basePrice: 25, avgCarbonScore: 6.0 },
  { id: 'prod-7', name: 'Cardboard', category: 'Packaging', basePrice: 3, avgCarbonScore: 8.0 },
  { id: 'prod-8', name: 'Paper', category: 'Office Supplies', basePrice: 4, avgCarbonScore: 6.5 },
  { id: 'prod-9', name: 'Stapler', category: 'Office Supplies', basePrice: 12, avgCarbonScore: 6.0 },
  { id: 'prod-10', name: 'Paper Shredder', category: 'Office Equipment', basePrice: 80, avgCarbonScore: 4.5 },
] as const

export const CARBON_SCORE_RANGES = {
  excellent: { min: 8.5, max: 10 },
  good: { min: 7.0, max: 8.4 },
  average: { min: 5.5, max: 6.9 },
  poor: { min: 0, max: 5.4 },
} as const

export const SCORING_WEIGHTS = {
  priceFairness: 0.3,
  carbonAlignment: 0.3,
  reliability: 0.25,
  aiConfidence: 0.15,
} as const

export const RELIABILITY_WEIGHTS = {
  successfulTransactions: 2.0,
  avgRating: 1.5,
  carbonSavings: 0.75,
} as const

export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/api/auth/register',
  LOGIN: '/api/auth/login',
  
  // Buyer
  CREATE_REQUEST: '/api/buyer/request',
  GET_REQUESTS: '/api/buyer/requests',
  GET_REQUEST: '/api/buyer/request',
  
  // Seller
  GET_SELLER_REQUESTS: '/api/seller/requests',
  SUBMIT_QUOTE: '/api/seller/quote',
  
  // Chat
  SEND_MESSAGE: '/api/chat/send',
  GET_MESSAGES: '/api/chat',
  
  // AI
  RECOMMEND_PRICE: '/api/ai/recommend-price',
  RANK_SELLERS: '/api/ai/rank-sellers',
  NEGOTIATION_HINTS: '/api/ai/negotiation-hints',
  
  // Blockchain
  COMMIT_TRANSACTION: '/api/blockchain/commit',
  
  // Analytics
  CARBON_ANALYTICS: '/api/analytics/carbon',
  DASHBOARD: '/api/analytics/dashboard',
} as const

