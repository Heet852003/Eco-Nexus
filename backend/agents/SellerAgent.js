/**
 * Seller Agent using Aristotle AI Agent Framework
 * Represents a vendor with negotiation capabilities
 */
export class SellerAgent {
  constructor(vendorData) {
    this.vendor = vendorData
    this.name = `Seller Agent: ${vendorData.name}`
    this.role = 'vendor_representative'
    this.agentId = `seller-agent-${vendorData.id}`
    
    // Negotiation parameters
    this.negotiationParams = {
      minPrice: vendorData.price * (vendorData.willing_to_discount ? 0.85 : 0.95), // 5-15% discount possible
      maxPrice: vendorData.price,
      flexibility: vendorData.willing_to_discount ? 'high' : 'low',
      sustainabilityCommitment: vendorData.sustainability_score >= 8 ? 'strong' : 'moderate',
      deliveryFlexibility: vendorData.delivery <= 2 ? 'fast' : 'standard',
      competitiveAdvantages: this.identifyAdvantages(vendorData)
    }
  }

  /**
   * Get proposal for buyer goals
   * @param {Object} buyerGoals - Buyer's goals and preferences
   * @returns {Promise<Object>} Proposal with vendor data and negotiation notes
   */
  async getProposal(buyerGoals) {
    // Adjust proposal based on buyer goals
    const adjustedVendor = this.adjustProposal(buyerGoals)
    
    // Generate negotiation notes
    const negotiationNotes = this.generateNegotiationNotes(buyerGoals, adjustedVendor)
    
    return {
      vendor: adjustedVendor,
      sellerAgent: {
        name: this.name,
        agentId: this.agentId,
        role: this.role
      },
      negotiationNotes: negotiationNotes,
      proposalDetails: {
        originalPrice: this.vendor.price,
        proposedPrice: adjustedVendor.price,
        priceAdjustment: this.vendor.price - adjustedVendor.price,
        sustainabilityCommitment: this.negotiationParams.sustainabilityCommitment,
        deliveryCommitment: `Delivery within ${adjustedVendor.delivery} days guaranteed`
      }
    }
  }

  /**
   * Adjust proposal based on buyer goals
   * Seller agents can offer better terms if it aligns with buyer priorities
   */
  adjustProposal(buyerGoals) {
    const adjusted = { ...this.vendor }
    
    // If buyer prioritizes cost and we can discount
    if (buyerGoals.minimize_cost > 0.3 && this.negotiationParams.flexibility === 'high') {
      // Offer slight discount
      adjusted.price = Math.max(
        this.negotiationParams.minPrice,
        this.vendor.price * 0.95 // 5% discount
      )
    }
    
    // If buyer prioritizes sustainability and we're strong
    if (buyerGoals.maximize_sustainability > 0.3 && this.vendor.sustainability_score >= 8) {
      // Emphasize sustainability (no price change, but note it)
      adjusted.sustainability_highlight = true
    }
    
    // If buyer prioritizes delivery and we're fast
    if (buyerGoals.minimize_delivery > 0.3 && this.vendor.delivery <= 2) {
      // Emphasize speed
      adjusted.delivery_highlight = true
    }
    
    return adjusted
  }

  /**
   * Generate negotiation notes using seller agent perspective
   */
  generateNegotiationNotes(buyerGoals, adjustedVendor) {
    const notes = []
    
    // Price negotiation
    if (adjustedVendor.price < this.vendor.price) {
      notes.push(`Offering ${((this.vendor.price - adjustedVendor.price) / this.vendor.price * 100).toFixed(1)}% discount to align with cost priorities`)
    }
    
    // Sustainability emphasis
    if (this.vendor.sustainability_score >= 8) {
      notes.push(`Strong sustainability credentials (${this.vendor.sustainability_score}/10) with carbon-neutral operations`)
    }
    
    // Delivery emphasis
    if (this.vendor.delivery <= 2) {
      notes.push(`Fast delivery (${this.vendor.delivery} days) to meet urgent needs`)
    }
    
    // Competitive advantages
    if (this.negotiationParams.competitiveAdvantages.length > 0) {
      notes.push(`Key advantages: ${this.negotiationParams.competitiveAdvantages.join(', ')}`)
    }
    
    return notes.length > 0 ? notes.join('. ') : 'Standard competitive offering'
  }

  /**
   * Identify competitive advantages
   */
  identifyAdvantages(vendorData) {
    const advantages = []
    
    if (vendorData.price < 12) {
      advantages.push('competitive pricing')
    }
    if (vendorData.carbon < 20) {
      advantages.push('low carbon footprint')
    }
    if (vendorData.delivery <= 2) {
      advantages.push('fast delivery')
    }
    if (vendorData.sustainability_score >= 8) {
      advantages.push('high sustainability')
    }
    if (vendorData.willing_to_discount) {
      advantages.push('flexible pricing')
    }
    
    return advantages.length > 0 ? advantages : ['reliable service']
  }

  /**
   * Get agent information
   */
  getInfo() {
    return {
      agentId: this.agentId,
      name: this.name,
      role: this.role,
      vendor: {
        id: this.vendor.id,
        name: this.vendor.name
      },
      negotiationParams: this.negotiationParams
    }
  }

  /**
   * Respond to counter-proposal (for future multi-round negotiations)
   */
  respondToCounterProposal(counterProposal, buyerGoals) {
    // This can be extended for multi-round negotiations
    return this.getProposal(buyerGoals)
  }
}

