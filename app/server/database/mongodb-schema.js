/**
 * MongoDB Schema Definitions for Carbon Marketplace
 * 
 * These schemas can be used with Mongoose or MongoDB native driver
 */

export const UserSchema = {
  _id: { type: 'ObjectId', required: true },
  email: { type: 'String', required: true, unique: true, index: true },
  name: { type: 'String', required: true },
  passwordHash: { type: 'String', required: true },
  roles: {
    isBuyer: { type: 'Boolean', default: true },
    isSeller: { type: 'Boolean', default: false }
  },
  reliabilityScore: { type: 'Number', default: null },
  carbonSavings: { type: 'Number', default: 0 },
  totalTransactions: { type: 'Number', default: 0 },
  createdAt: { type: 'Date', default: Date.now },
  updatedAt: { type: 'Date', default: Date.now }
}

export const BuyerRequestSchema = {
  _id: { type: 'ObjectId', required: true },
  buyerId: { type: 'String', required: true, index: true },
  productId: { type: 'String', required: true },
  productName: { type: 'String', required: true },
  quantity: { type: 'Number', required: true },
  desiredCarbonScore: { type: 'Number', required: true },
  maxPrice: { type: 'Number', default: null },
  notes: { type: 'String', default: '' },
  status: { 
    type: 'String', 
    enum: ['OPEN', 'QUOTED', 'NEGOTIATING', 'COMPLETED'],
    default: 'OPEN',
    index: true
  },
  aiSuggestedPrice: { type: 'Number', default: null },
  aiSuggestedCarbonScore: { type: 'Number', default: null },
  aiRecommendation: { type: 'Object', default: null },
  createdAt: { type: 'Date', default: Date.now },
  updatedAt: { type: 'Date', default: Date.now }
}

export const SellerQuoteSchema = {
  _id: { type: 'ObjectId', required: true },
  requestId: { type: 'String', required: true, index: true },
  sellerId: { type: 'String', required: true, index: true },
  sellerName: { type: 'String', required: true },
  sellerPrice: { type: 'Number', required: true },
  sellerCarbonScore: { type: 'Number', required: true },
  deliveryDays: { type: 'Number', required: true },
  reliabilityScore: { type: 'Number', default: 50 },
  aiSuggestedPrice: { type: 'Number', default: null },
  aiSuggestedScore: { type: 'Number', default: null },
  aiJustification: { type: 'String', default: null },
  status: {
    type: 'String',
    enum: ['PENDING', 'NEGOTIATING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING',
    index: true
  },
  createdAt: { type: 'Date', default: Date.now }
}

export const NegotiationThreadSchema = {
  _id: { type: 'ObjectId', required: true },
  requestId: { type: 'String', required: true, index: true },
  quoteId: { type: 'String', required: true, index: true },
  buyerId: { type: 'String', required: true, index: true },
  sellerId: { type: 'String', required: true, index: true },
  status: {
    type: 'String',
    enum: ['OPEN', 'CLOSED'],
    default: 'OPEN',
    index: true
  },
  createdAt: { type: 'Date', default: Date.now },
  updatedAt: { type: 'Date', default: Date.now }
}

export const ChatMessageSchema = {
  _id: { type: 'ObjectId', required: true },
  threadId: { type: 'String', required: true, index: true },
  senderId: { type: 'String', default: null }, // null for AGENT messages
  senderType: {
    type: 'String',
    enum: ['BUYER', 'SELLER', 'AGENT'],
    required: true
  },
  senderName: { type: 'String', required: true },
  content: { type: 'String', required: true },
  aiHint: { type: 'String', default: null },
  timestamp: { type: 'Date', default: Date.now, index: true }
}

export const TransactionSchema = {
  _id: { type: 'ObjectId', required: true },
  requestId: { type: 'String', required: true, index: true },
  quoteId: { type: 'String', required: true, index: true },
  buyerId: { type: 'String', required: true, index: true },
  sellerId: { type: 'String', required: true, index: true },
  productId: { type: 'String', required: true },
  productName: { type: 'String', required: true },
  quantity: { type: 'Number', required: true },
  finalPrice: { type: 'Number', required: true },
  finalCarbonScore: { type: 'Number', required: true },
  status: {
    type: 'String',
    enum: ['PENDING', 'COMMITTED', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
    index: true
  },
  solanaSignature: { type: 'String', default: null },
  blockchainTxHash: { type: 'String', default: null },
  sccTokensMinted: { type: 'Number', default: null },
  createdAt: { type: 'Date', default: Date.now },
  completedAt: { type: 'Date', default: null }
}

// MongoDB Indexes for performance
export const MongoDBIndexes = {
  users: [
    { email: 1 }, // Unique index on email
    { 'roles.isBuyer': 1 },
    { 'roles.isSeller': 1 }
  ],
  buyerRequests: [
    { buyerId: 1 },
    { status: 1 },
    { createdAt: -1 },
    { buyerId: 1, status: 1 } // Compound index
  ],
  sellerQuotes: [
    { requestId: 1 },
    { sellerId: 1 },
    { status: 1 },
    { requestId: 1, sellerId: 1 } // Prevent duplicate quotes
  ],
  negotiationThreads: [
    { requestId: 1 },
    { quoteId: 1 },
    { buyerId: 1 },
    { sellerId: 1 },
    { status: 1 }
  ],
  chatMessages: [
    { threadId: 1, timestamp: 1 }, // Compound index for message retrieval
    { threadId: 1 }
  ],
  transactions: [
    { buyerId: 1 },
    { sellerId: 1 },
    { status: 1 },
    { createdAt: -1 }
  ]
}

