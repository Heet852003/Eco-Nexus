/**
 * ML Model Service for Sustainability Score Prediction
 * Uses Python script to run the trained model
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const MODEL_PATH = join(__dirname, '../../../vendor_sustainability_with_history.joblib')
const PYTHON_SCRIPT_PATH = join(__dirname, 'predict_sustainability.py')

/**
 * Predict vendor/seller sustainability score using ML model
 * @param {Object} params - Prediction parameters
 * @param {string} params.productName - Product name
 * @param {number} params.vendorPriceToday - Seller's price
 * @param {number} params.vendorDeliveryDays - Delivery days
 * @param {number} params.localFlagNumeric - Local flag (0 or 1)
 * @param {number} params.pastSustainabilityAvg - Average of past sustainability scores
 * @returns {Promise<number>} Predicted sustainability score (0-100)
 */
export async function predictVendorSustainability(params) {
  try {
    const { productName, vendorPriceToday, vendorDeliveryDays, localFlagNumeric, pastSustainabilityAvg } = params

    console.log('🔍 ML Model Prediction Called with:', {
      productName,
      vendorPriceToday,
      vendorDeliveryDays,
      localFlagNumeric,
      pastSustainabilityAvg
    })

    // Validate inputs
    if (vendorPriceToday === undefined || vendorDeliveryDays === undefined || 
        localFlagNumeric === undefined || pastSustainabilityAvg === undefined) {
      throw new Error('Missing required parameters for sustainability prediction')
    }

    // Check if model file exists
    console.log('🔍 Checking model file at:', MODEL_PATH)
    if (!existsSync(MODEL_PATH)) {
      console.warn('⚠️ ML model file not found at:', MODEL_PATH)
      console.warn('⚠️ Using fallback calculation')
      const fallbackScore = calculateFallbackSustainability(params)
      console.log('📊 Fallback score:', fallbackScore)
      return fallbackScore
    }

    console.log('✅ Model file found, calling Python script...')
    // Call Python script to run the model
    const command = `python "${PYTHON_SCRIPT_PATH}" "${MODEL_PATH}" ${vendorPriceToday} ${vendorDeliveryDays} ${localFlagNumeric} ${pastSustainabilityAvg}`
    console.log('🔍 Executing command:', command)
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: __dirname,
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    })

    console.log('📊 Python stdout:', stdout)
    if (stderr) {
      console.log('📊 Python stderr:', stderr)
    }

    if (stderr && !stderr.includes('Warning') && !stderr.includes('INFO')) {
      console.error('❌ Python script error:', stderr)
      // Fallback to calculation if Python fails
      const fallbackScore = calculateFallbackSustainability(params)
      console.log('📊 Fallback score due to Python error:', fallbackScore)
      return fallbackScore
    }

    const score = parseFloat(stdout.trim())
    console.log('📊 Parsed score from model:', score)
    
    if (isNaN(score) || score < 0 || score > 100) {
      console.warn('⚠️ Invalid score from model:', score, 'using fallback')
      const fallbackScore = calculateFallbackSustainability(params)
      console.log('📊 Fallback score:', fallbackScore)
      return fallbackScore
    }

    const finalScore = Math.round(score * 100) / 100 // Round to 2 decimal places
    console.log('✅ Final predicted score:', finalScore)
    return finalScore
  } catch (error) {
    console.error('❌ Error predicting sustainability score:', error)
    console.error('Error stack:', error.stack)
    // Fallback to calculation
    const fallbackScore = calculateFallbackSustainability(params)
    console.log('📊 Fallback score due to error:', fallbackScore)
    return fallbackScore
  }
}

/**
 * Fallback sustainability calculation if ML model is unavailable
 */
function calculateFallbackSustainability(params) {
  const { vendorPriceToday, vendorDeliveryDays, localFlagNumeric, pastSustainabilityAvg } = params
  
  // Simple formula: base score adjusted by factors
  let score = pastSustainabilityAvg || 50
  
  // Price factor (lower price = better sustainability)
  const priceFactor = Math.max(0, 1 - (vendorPriceToday / 200)) * 5
  score += priceFactor
  
  // Delivery factor (faster delivery = better)
  const deliveryFactor = Math.max(0, (10 - vendorDeliveryDays) / 10) * 3
  score += deliveryFactor
  
  // Local factor (local = better)
  const localFactor = localFlagNumeric * 2
  score += localFactor
  
  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(score * 100) / 100))
}

/**
 * Calculate buyer sustainability score change based on transaction
 * Formula: Buyer score increases/decreases based on seller's sustainability score
 * 
 * @param {number} buyerCurrentScore - Current buyer sustainability score
 * @param {number} sellerSustainabilityScore - Seller's sustainability score from transaction
 * @param {number} transactionValue - Transaction value (price * quantity)
 * @returns {number} New buyer sustainability score
 */
export function calculateBuyerSustainabilityChange(buyerCurrentScore, sellerSustainabilityScore, transactionValue) {
  // Base change: difference between seller score and buyer score
  // If seller is more sustainable, buyer score increases
  // If seller is less sustainable, buyer score decreases
  const scoreDifference = sellerSustainabilityScore - buyerCurrentScore
  
  // Normalize transaction value (assume max transaction value of $10,000)
  const normalizedValue = Math.min(transactionValue / 10000, 1)
  
  // Calculate change: score difference weighted by transaction value
  // Higher value transactions have more impact
  const change = scoreDifference * 0.1 * normalizedValue
  
  // Apply change with damping (max change per transaction is ±5 points)
  const dampedChange = Math.max(-5, Math.min(5, change))
  
  const newScore = buyerCurrentScore + dampedChange
  
  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(newScore * 100) / 100))
}

