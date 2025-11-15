import express from 'express'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const router = express.Router()

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * GET /api/vendors/list
 * Returns list of all available vendors
 */
router.get('/list', (req, res) => {
  try {
    // Read vendor data from JSON file
    const vendorsPath = join(__dirname, '../data/vendors.json')
    const vendorsData = JSON.parse(readFileSync(vendorsPath, 'utf8'))
    
    res.json(vendorsData.vendors)
  } catch (error) {
    console.error('Error reading vendors:', error)
    res.status(500).json({ 
      error: 'Failed to fetch vendors',
      message: error.message 
    })
  }
})

/**
 * GET /api/vendors/:id
 * Returns a specific vendor by ID
 */
router.get('/:id', (req, res) => {
  try {
    const vendorsPath = join(__dirname, '../data/vendors.json')
    const vendorsData = JSON.parse(readFileSync(vendorsPath, 'utf8'))
    const vendor = vendorsData.vendors.find(v => v.id === req.params.id)
    
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' })
    }
    
    res.json(vendor)
  } catch (error) {
    console.error('Error reading vendor:', error)
    res.status(500).json({ 
      error: 'Failed to fetch vendor',
      message: error.message 
    })
  }
})

export default router

