import { callLLM } from '../services/llm.js'
import { applyAristotelianReasoning, generateAristotelianReasoning } from './AristotleFramework.js'

/**
 * Buyer Agent using Aristotle AI Agent Framework
 * Handles user goals, negotiation with Seller Agents, and generates recommendations
 */
export class BuyerAgent {
  constructor(goals) {
    this.goals = goals || {
      minimize_cost: 0.3,
      minimize_carbon: 0.3,
      minimize_delivery: 0.2,
      maximize_sustainability: 0.2,
      prefer_local: false
    }
    this.name = 'Buyer Agent'
    this.role = 'procurement_decision_maker'
    this.agentId = 'buyer-agent-001'
  }

  /**
   * Evaluate vendors using Aristotle reasoning framework
   * @param {Array<SellerAgent>} sellerAgents - Array of Seller Agent instances
   * @returns {Promise<Object>} Recommendation with reasoning
   */
  async evaluateVendors(sellerAgents) {
    try {
      // Step 1: Collect proposals from all Seller Agents
      const proposals = await Promise.all(
        sellerAgents.map(agent => agent.getProposal(this.goals))
      )

      // Step 2: Extract vendor data for analysis
      const vendorOptions = proposals.map(p => p.vendor)

      // Step 3: Apply Aristotelian reasoning framework
      const aristotelianAnalysis = applyAristotelianReasoning(vendorOptions, this.goals)

      // Step 4: Get enhanced LLM reasoning (optional, uses Aristotle + LLM)
      const enhancedReasoning = await this.generateEnhancedReasoning(
        aristotelianAnalysis,
        proposals
      )

      // Step 5: Select winner from Aristotle analysis
      const winner = aristotelianAnalysis.recommendation.winner

      // Step 6: Calculate metrics
      const metrics = this.calculateMetrics(vendorOptions, winner)

      // Step 7: Build comparison with negotiation details
      const comparison = proposals.map((proposal, index) => {
        const analysis = aristotelianAnalysis.logical.find(a => a.option.id === proposal.vendor.id)
        return {
          vendor: proposal.vendor.name,
          score: analysis ? analysis.logicalScore : 0,
          negotiation_notes: proposal.negotiationNotes || null,
          seller_agent: proposal.sellerAgent.name
        }
      })

      // Step 8: Generate structured recommendation
      return {
        winner: {
          id: winner.id,
          name: winner.name,
          price: winner.price,
          carbon: winner.carbon,
          delivery: winner.delivery,
          sustainability_score: winner.sustainability_score
        },
        carbon_saved: metrics.carbonSaved,
        cost_saved: metrics.costSaved,
        scc_tokens: metrics.sccTokens,
        reasoning: enhancedReasoning,
        comparison: comparison,
        negotiation_details: {
          total_vendors: sellerAgents.length,
          negotiation_rounds: 1,
          buyer_goals: this.goals,
          aristotelian_analysis: {
            logical_winner: aristotelianAnalysis.logical[0]?.option.name,
            ethical_winner: aristotelianAnalysis.ethical[0]?.option.name,
            practical_winner: aristotelianAnalysis.practical[0]?.option.name,
            final_score: aristotelianAnalysis.recommendation.score
          }
        }
      }
    } catch (error) {
      console.error('Buyer Agent evaluation error:', error)
      throw new Error(`Buyer Agent failed: ${error.message}`)
    }
  }

  /**
   * Generate enhanced reasoning using Aristotle framework + LLM
   * Combines structured Aristotelian analysis with LLM insights
   */
  async generateEnhancedReasoning(aristotelianAnalysis, proposals) {
    try {
      // Get base Aristotelian reasoning
      const baseReasoning = generateAristotelianReasoning(aristotelianAnalysis, this.goals)
      
      // Build context for LLM enhancement
      const context = this.buildLLMContext(aristotelianAnalysis, proposals)
      
      // Use LLM to enhance with additional insights
      const prompt = this.buildEnhancedPrompt(context, baseReasoning)
      const llmReasoning = await callLLM(prompt)
      
      // Combine both reasonings
      return `${baseReasoning}\n\nADDITIONAL INSIGHTS: ${llmReasoning}`
    } catch (error) {
      console.error('Enhanced reasoning generation error:', error)
      // Fallback to base Aristotelian reasoning
      return generateAristotelianReasoning(aristotelianAnalysis, this.goals)
    }
  }

  /**
   * Build context for LLM enhancement
   */
  buildLLMContext(aristotelianAnalysis, proposals) {
    const top3 = aristotelianAnalysis.logical.slice(0, 3).map((item, index) => ({
      rank: index + 1,
      name: item.option.name,
      price: item.option.price,
      carbon: item.option.carbon,
      delivery: item.option.delivery,
      sustainability: item.option.sustainability_score,
      logicalScore: item.logicalScore,
      ethicalScore: aristotelianAnalysis.ethical.find(e => e.option.id === item.option.id)?.ethicalScore || 0,
      practicalScore: aristotelianAnalysis.practical.find(p => p.option.id === item.option.id)?.practicalScore || 0,
      negotiationNotes: proposals.find(p => p.vendor.id === item.option.id)?.negotiationNotes || null
    }))

    return {
      topCandidates: top3,
      buyerGoals: this.goals,
      winner: aristotelianAnalysis.recommendation.winner,
      winnerScore: aristotelianAnalysis.recommendation.score
    }
  }

  /**
   * Build enhanced prompt for LLM
   */
  buildEnhancedPrompt(context, baseReasoning) {
    const candidatesList = context.topCandidates.map(c => 
      `${c.rank}. ${c.name}:
   - Price: $${c.price}, Carbon: ${c.carbon}kg, Delivery: ${c.delivery} days, Sustainability: ${c.sustainability}/10
   - Scores: Logical ${c.logicalScore.toFixed(2)}, Ethical ${c.ethicalScore.toFixed(2)}, Practical ${c.practicalScore.toFixed(2)}
   ${c.negotiationNotes ? `- Negotiation: ${c.negotiationNotes}` : ''}`
    ).join('\n\n')

    return `You are enhancing a procurement decision that has been analyzed using Aristotelian reasoning framework.

Base Analysis:
${baseReasoning}

Top Candidates:
${candidatesList}

Buyer Goals:
- Minimize Cost: ${context.buyerGoals.minimize_cost * 100}%
- Minimize Carbon: ${context.buyerGoals.minimize_carbon * 100}%
- Minimize Delivery: ${context.buyerGoals.minimize_delivery * 100}%
- Maximize Sustainability: ${context.buyerGoals.maximize_sustainability * 100}%

Winner: ${context.winner.name} (Score: ${context.winnerScore.toFixed(2)})

Provide 1-2 additional insights about:
1. Any subtle trade-offs or considerations not captured in the base analysis
2. Strategic implications for long-term sustainability goals
3. Potential risks or opportunities with the selected vendor

Keep it concise (2-3 sentences). Return only the insights, no formatting.`
  }

  /**
   * Calculate metrics for recommendation
   */
  calculateMetrics(vendorOptions, winner) {
    const avgPrice = vendorOptions.reduce((sum, v) => sum + v.price, 0) / vendorOptions.length
    const avgCarbon = vendorOptions.reduce((sum, v) => sum + v.carbon, 0) / vendorOptions.length
    
    const costSaved = Math.max(0, avgPrice - winner.price)
    const carbonSaved = Math.max(0, avgCarbon - winner.carbon)
    
    // Calculate SCC tokens
    const baseTokens = winner.sustainability_score * 1.5
    const costBonus = costSaved * 0.5
    const carbonBonus = carbonSaved * 2
    const sccTokens = baseTokens + costBonus + carbonBonus

    return {
      costSaved,
      carbonSaved,
      sccTokens
    }
  }

  /**
   * Get agent information
   */
  getInfo() {
    return {
      agentId: this.agentId,
      name: this.name,
      role: this.role,
      goals: this.goals
    }
  }
}

