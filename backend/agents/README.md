# Aristotle AI Agent Framework - Agent System

This directory contains the multi-agent negotiation system using the Aristotle AI Agent Framework.

## Architecture

### Buyer Agent (`BuyerAgent.js`)
- **Role**: Procurement decision maker
- **Responsibilities**:
  - Manages user goals and preferences
  - Negotiates with multiple Seller Agents
  - Applies Aristotelian reasoning (Logical, Ethical, Practical)
  - Generates recommendations with structured reasoning
  - Integrates with LLM for enhanced insights

### Seller Agents (`SellerAgent.js`)
- **Role**: Vendor representatives
- **Responsibilities**:
  - Manages vendor JSON data
  - Handles negotiation parameters
  - Generates proposals based on buyer goals
  - Provides negotiation notes and competitive advantages

### Aristotle Framework (`AristotleFramework.js`)
- **Purpose**: Implements Aristotelian reasoning principles
- **Components**:
  - **Logical Analysis (Logos)**: Objective data and facts
  - **Ethical Analysis (Ethos)**: Values, sustainability, responsibility
  - **Practical Analysis (Phronesis)**: Practical wisdom and balance
  - **Synthesis**: Combines all three dimensions for final recommendation

## How It Works

1. **Initialization**:
   - Buyer Agent is created with user goals
   - Seller Agents are created from vendor JSON data

2. **Proposal Collection**:
   - Each Seller Agent generates a proposal based on buyer goals
   - Proposals include adjusted pricing and negotiation notes

3. **Aristotelian Analysis**:
   - Buyer Agent applies three-dimensional analysis:
     - Logical: Objective metrics (cost, carbon, delivery, sustainability)
     - Ethical: Sustainability commitment and values
     - Practical: Balance and trade-offs

4. **LLM Enhancement** (Optional):
   - Aristotle framework provides base reasoning
   - LLM adds additional insights and strategic considerations

5. **Recommendation Generation**:
   - Synthesized recommendation with structured JSON
   - Includes winner, savings, tokens, reasoning, and comparison

## Usage

```javascript
import { BuyerAgent } from './BuyerAgent.js'
import { SellerAgent } from './SellerAgent.js'

// Create Buyer Agent
const buyerAgent = new BuyerAgent({
  minimize_cost: 0.3,
  minimize_carbon: 0.3,
  minimize_delivery: 0.2,
  maximize_sustainability: 0.2
})

// Create Seller Agents
const sellerAgents = vendors.map(vendor => new SellerAgent(vendor))

// Evaluate and get recommendation
const recommendation = await buyerAgent.evaluateVendors(sellerAgents)
```

## API Integration

The agents are integrated via `/api/agents/negotiate` endpoint:

```bash
POST /api/agents/negotiate
{
  "goals": {
    "minimize_cost": 0.3,
    "minimize_carbon": 0.3,
    "minimize_delivery": 0.2,
    "maximize_sustainability": 0.2
  }
}
```

Returns structured JSON with:
- `winner`: Selected vendor details
- `carbon_saved`: Carbon footprint savings
- `cost_saved`: Cost savings
- `scc_tokens`: Tokens earned
- `reasoning`: Aristotelian + LLM reasoning
- `comparison`: All vendors with scores
- `negotiation_details`: Agent information and analysis breakdown

## Aristotelian Reasoning Principles

### 1. Logical Analysis (Logos)
- Evaluates objective facts and data
- Considers cost, carbon, delivery, sustainability metrics
- Uses weighted scoring based on buyer priorities

### 2. Ethical Analysis (Ethos)
- Considers values and ethical implications
- Prioritizes sustainability and environmental responsibility
- Evaluates vendor commitment to green practices

### 3. Practical Analysis (Phronesis)
- Applies practical wisdom
- Balances competing objectives
- Considers real-world constraints and trade-offs

### 4. Synthesis
- Combines all three dimensions (40% logical, 30% ethical, 30% practical)
- Generates final recommendation with comprehensive reasoning

## Benefits

1. **Structured Reasoning**: Clear, explainable decision-making process
2. **Multi-dimensional Analysis**: Considers logic, ethics, and practicality
3. **LLM Integration**: Enhanced insights while maintaining structure
4. **Extensible**: Easy to add new agents or reasoning dimensions
5. **Structured JSON**: Consistent API responses for frontend integration

## Future Enhancements

- Multi-round negotiations
- Dynamic goal adjustment
- Learning from past decisions
- Real-time proposal updates
- Agent-to-agent direct communication

