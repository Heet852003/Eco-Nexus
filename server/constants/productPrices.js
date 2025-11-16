/**
 * Product Price Ranges (Min, Max) in USD
 * Based on market data for fair price calculation
 */
export const PRODUCT_PRICE_RANGES = {
  'Ballpoint Pen': { min: 10.00, max: 15.00 },
  'Binder Clips': { min: 1.00, max: 2.00 },
  'Keyboard': { min: 150.00, max: 175.00 },
  'Webcam': { min: 120.00, max: 150.00 },
  'Coffee Mug': { min: 30.00, max: 40.00 },
  'Cutlery Set': { min: 15.00, max: 20.00 },
  'Cardboard': { min: 4.00, max: 8.00 },
  'Paper': { min: 2.00, max: 4.00 },
  'Stapler': { min: 10.00, max: 15.00 },
  'Paper Shredder': { min: 200.00, max: 240.00 },
}

/**
 * Get product price range by name (case-insensitive)
 */
export function getProductPriceRange(productName) {
  if (!productName) return null
  
  // Try exact match first
  if (PRODUCT_PRICE_RANGES[productName]) {
    return PRODUCT_PRICE_RANGES[productName]
  }
  
  // Try case-insensitive match
  const normalizedName = productName.trim()
  for (const [key, value] of Object.entries(PRODUCT_PRICE_RANGES)) {
    if (key.toLowerCase() === normalizedName.toLowerCase()) {
      return value
    }
  }
  
  return null
}

/**
 * Calculate fair market price for a product
 * Returns midpoint of min/max range, or null if product not found
 */
export function calculateFairMarketPrice(productName, quantity = 1) {
  const range = getProductPriceRange(productName)
  if (!range) {
    return null
  }
  
  // Fair price is midpoint of min/max range
  const fairPricePerUnit = (range.min + range.max) / 2
  return fairPricePerUnit * quantity
}

