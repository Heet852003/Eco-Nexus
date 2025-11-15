# Eco-Nexus SCOS API Documentation

## Base URL

- Local: `http://localhost:3001`
- Production: Your deployed backend URL

## Endpoints

### Health Check

**GET** `/health`

Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Eco-Nexus SCOS API is running"
}
```

---

### Vendors

#### List All Vendors

**GET** `/api/vendors/list`

Returns all available vendors.

**Response:**
```json
[
  {
    "id": "vendor-1",
    "name": "GreenTech Solutions",
    "price": 12.5,
    "carbon": 18,
    "delivery": 2,
    "sustainability_score": 9,
    "willing_to_discount": true,
    "description": "Leading provider of eco-friendly technology solutions..."
  }
]
```

#### Get Vendor by ID

**GET** `/api/vendors/:id`

Returns a specific vendor.

**Parameters:**
- `id` (path) - Vendor ID

**Response:**
```json
{
  "id": "vendor-1",
  "name": "GreenTech Solutions",
  "price": 12.5,
  "carbon": 18,
  "delivery": 2,
  "sustainability_score": 9,
  "willing_to_discount": true,
  "description": "..."
}
```

---

### Agents & Negotiation

#### Trigger Negotiation

**POST** `/api/agents/negotiate`

Triggers multi-agent negotiation between Buyer Agent and Seller Agents using Aristotle AI Agent Framework.

**Request Body (optional):**
```json
{
  "goals": {
    "minimize_cost": 0.3,
    "minimize_carbon": 0.3,
    "minimize_delivery": 0.2,
    "maximize_sustainability": 0.2,
    "prefer_local": false
  }
}
```

**Response:**
```json
{
  "winner": {
    "id": "vendor-1",
    "name": "GreenTech Solutions",
    "price": 12.5,
    "carbon": 18,
    "delivery": 2,
    "sustainability_score": 9
  },
  "carbon_saved": 5.2,
  "cost_saved": 2.5,
  "scc_tokens": 15.5,
  "reasoning": "Using Aristotelian reasoning framework: LOGICAL ANALYSIS (Logos)... ETHICAL CONSIDERATION (Ethos)... PRACTICAL WISDOM (Phronesis)...",
  "comparison": [
    {
      "vendor": "GreenTech Solutions",
      "score": 85.5,
      "negotiation_notes": "Offering 5% discount to align with cost priorities. Strong sustainability credentials...",
      "seller_agent": "Seller Agent: GreenTech Solutions"
    }
  ],
  "negotiation_details": {
    "total_vendors": 5,
    "negotiation_rounds": 1,
    "buyer_goals": {
      "minimize_cost": 0.3,
      "minimize_carbon": 0.3,
      "minimize_delivery": 0.2,
      "maximize_sustainability": 0.2
    },
    "aristotelian_analysis": {
      "logical_winner": "GreenTech Solutions",
      "ethical_winner": "GreenTech Solutions",
      "practical_winner": "CarbonFree Logistics",
      "final_score": 0.82
    }
  }
}
```

#### Get Agent Information

**GET** `/api/agents/info`

Returns information about Buyer and Seller Agents configuration.

**Response:**
```json
{
  "framework": "Aristotle AI Agent Framework",
  "agents": {
    "buyer": {
      "agentId": "buyer-agent-001",
      "name": "Buyer Agent",
      "role": "procurement_decision_maker",
      "goals": {
        "minimize_cost": 0.3,
        "minimize_carbon": 0.3,
        "minimize_delivery": 0.2,
        "maximize_sustainability": 0.2
      }
    },
    "sellers": [
      {
        "agentId": "seller-agent-vendor-1",
        "name": "Seller Agent: GreenTech Solutions",
        "role": "vendor_representative",
        "vendor": {
          "id": "vendor-1",
          "name": "GreenTech Solutions"
        },
        "negotiationParams": {
          "minPrice": 10.625,
          "maxPrice": 12.5,
          "flexibility": "high",
          "sustainabilityCommitment": "strong"
        }
      }
    ]
  },
  "description": "Multi-agent negotiation system using Aristotelian reasoning principles"
}
```

---

### Recommendation

#### Get Final Recommendation

**GET** `/api/recommendation`

Returns the latest negotiation result/recommendation.

**Response:**
Same as `/api/agents/negotiate` response.

---

### Solana

#### Mint SCC Tokens

**POST** `/api/solana/reward`

Mints SCC tokens on Solana Devnet as a reward.

**Request Body:**
```json
{
  "amount": 15.5,
  "walletAddress": "optional_wallet_address"
}
```

**Response:**
```json
{
  "success": true,
  "message": "SCC tokens minted successfully",
  "txHash": "transaction_hash",
  "amount": 15.5,
  "walletAddress": "wallet_address"
}
```

#### Get Token Balance

**GET** `/api/solana/balance/:address`

Gets SCC token balance for a wallet (mock implementation).

**Parameters:**
- `address` (path) - Solana wallet address

**Response:**
```json
{
  "address": "wallet_address",
  "balance": 0,
  "tokenSymbol": "SCC",
  "message": "Balance query not fully implemented"
}
```

---

### Analytics

#### Get Analytics Report

**GET** `/api/analytics/report`

Fetches analytics data from Snowflake (or returns mock data if not configured).

**Response:**
```json
{
  "total_carbon_saved": 125.5,
  "total_cost_saved": 2450.75,
  "total_scc_tokens": 1250.5,
  "decisions_count": 12,
  "monthly_data": [
    {
      "month": "Jan",
      "carbon_saved": 20,
      "cost_saved": 400,
      "tokens_earned": 200
    }
  ]
}
```

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "error": "Invalid request",
  "message": "Error details"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "Error details"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider adding rate limiting middleware.

---

## Authentication

Currently no authentication is required. For production, add JWT or API key authentication.

---

## CORS

CORS is enabled for all origins in development. For production, configure allowed origins in `server.js`.

