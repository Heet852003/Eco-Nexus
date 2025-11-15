# Aristotle AI Agent Framework Integration

## Overview

Eco-Nexus SCOS uses the **Aristotle AI Agent Framework** for multi-agent negotiation. This framework implements Aristotelian reasoning principles to make structured, explainable procurement decisions.

## Framework Components

### 1. Buyer Agent
- **Purpose**: Represents the buyer's interests and decision-making
- **Capabilities**:
  - Manages user goals and preferences
  - Negotiates with multiple Seller Agents
  - Applies Aristotelian reasoning (Logical, Ethical, Practical)
  - Generates recommendations with structured reasoning
  - Integrates with LLM for enhanced insights

### 2. Seller Agents
- **Purpose**: Represent vendors in negotiations
- **Capabilities**:
  - Manage vendor JSON data
  - Handle negotiation parameters (pricing, discounts, terms)
  - Generate proposals based on buyer goals
  - Provide competitive advantages and negotiation notes

### 3. Aristotle Framework
- **Purpose**: Implements structured reasoning principles
- **Three Dimensions**:
  1. **Logical Analysis (Logos)**: Objective facts and data
  2. **Ethical Analysis (Ethos)**: Values and sustainability
  3. **Practical Analysis (Phronesis)**: Practical wisdom and balance

## How It Works

### Step 1: Initialization
```javascript
// Buyer Agent with goals
const buyerAgent = new BuyerAgent({
  minimize_cost: 0.3,
  minimize_carbon: 0.3,
  minimize_delivery: 0.2,
  maximize_sustainability: 0.2
})

// Seller Agents from vendor data
const sellerAgents = vendors.map(vendor => new SellerAgent(vendor))
```

### Step 2: Proposal Collection
- Each Seller Agent generates a proposal
- Proposals are adjusted based on buyer goals
- Includes negotiation notes and competitive advantages

### Step 3: Aristotelian Analysis
The Buyer Agent applies three-dimensional analysis:

#### Logical Analysis (Logos) - 40% weight
- Evaluates objective metrics: cost, carbon, delivery, sustainability
- Uses weighted scoring based on buyer priorities
- Provides data-driven evaluation

#### Ethical Analysis (Ethos) - 30% weight
- Considers sustainability commitment
- Evaluates environmental responsibility
- Assesses vendor values and practices

#### Practical Analysis (Phronesis) - 30% weight
- Applies practical wisdom
- Balances competing objectives
- Considers real-world constraints

### Step 4: Synthesis
- Combines all three dimensions
- Generates final recommendation
- Provides comprehensive reasoning

### Step 5: LLM Enhancement (Optional)
- Aristotle framework provides base reasoning
- LLM adds strategic insights
- Combines structured analysis with AI insights

## API Usage

### Negotiation Endpoint

```bash
POST /api/agents/negotiate
Content-Type: application/json

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

### Response Structure

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
  "reasoning": "Using Aristotelian reasoning framework...",
  "comparison": [
    {
      "vendor": "GreenTech Solutions",
      "score": 85.5,
      "negotiation_notes": "...",
      "seller_agent": "Seller Agent: GreenTech Solutions"
    }
  ],
  "negotiation_details": {
    "total_vendors": 5,
    "negotiation_rounds": 1,
    "buyer_goals": {...},
    "aristotelian_analysis": {
      "logical_winner": "...",
      "ethical_winner": "...",
      "practical_winner": "...",
      "final_score": 0.82
    }
  }
}
```

## Benefits

1. **Structured Reasoning**: Clear, explainable decision-making
2. **Multi-dimensional**: Considers logic, ethics, and practicality
3. **Transparent**: Shows how each dimension contributes
4. **Extensible**: Easy to add new agents or reasoning dimensions
5. **LLM Integration**: Enhanced insights while maintaining structure

## Example Reasoning Output

```
Using Aristotelian reasoning framework:

LOGICAL ANALYSIS (Logos): GreenTech Solutions demonstrates strong objective 
performance with a logical score of 0.85, excelling in cost efficiency.

ETHICAL CONSIDERATION (Ethos): The vendor shows strong commitment to 
sustainability (ethical score: 0.78), aligning with responsible procurement 
principles.

PRACTICAL WISDOM (Phronesis): Well-balanced trade-offs across all operational 
dimensions (practical score: 0.72), ensuring both immediate needs and long-term 
sustainability goals are met.

SYNTHESIS: GreenTech Solutions represents the optimal choice, balancing economic 
efficiency, environmental responsibility, and operational practicality.

ADDITIONAL INSIGHTS: [LLM-generated strategic considerations]
```

## Files

- `backend/agents/BuyerAgent.js` - Buyer Agent implementation
- `backend/agents/SellerAgent.js` - Seller Agent implementation
- `backend/agents/AristotleFramework.js` - Framework core logic
- `backend/agents/negotiation.js` - Orchestration layer
- `backend/routes/agents.js` - API endpoints

## Future Enhancements

- Multi-round negotiations
- Dynamic goal adjustment
- Learning from past decisions
- Real-time proposal updates
- Agent-to-agent direct communication
- Custom reasoning dimensions

