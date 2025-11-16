/**
 * Snowflake Analytics Service for Carbon Marketplace
 */

import snowflake from 'snowflake-sdk'

const SNOWFLAKE_CONFIG = {
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USER,
  password: process.env.SNOWFLAKE_PASSWORD,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH',
  database: process.env.SNOWFLAKE_DATABASE || 'ECO_NEXUS',
  schema: process.env.SNOWFLAKE_SCHEMA || 'PUBLIC'
}

let connection = null

function getConnection() {
  return new Promise((resolve, reject) => {
    if (!SNOWFLAKE_CONFIG.account || !SNOWFLAKE_CONFIG.username || !SNOWFLAKE_CONFIG.password) {
      reject(new Error('Snowflake not configured'))
      return
    }

    if (connection) {
      resolve(connection)
      return
    }

    snowflake.createConnection(SNOWFLAKE_CONFIG, (err, conn) => {
      if (err) {
        reject(err)
        return
      }

      conn.connect((err, conn) => {
        if (err) {
          reject(err)
          return
        }

        connection = conn
        resolve(conn)
      })
    })
  })
}

function executeQuery(query) {
  return new Promise((resolve, reject) => {
    getConnection()
      .then(conn => {
        conn.execute({
          sqlText: query,
          complete: (err, stmt, rows) => {
            if (err) reject(err)
            else resolve(rows)
          }
        })
      })
      .catch(reject)
  })
}

/**
 * Store carbon savings record
 */
export async function storeCarbonSavings(data) {
  try {
    const query = `
      INSERT INTO CARBON_SAVINGS (
        transaction_id, seller_id, buyer_id, product_id,
        carbon_score, carbon_saved, price, quantity, created_at
      ) VALUES (
        '${data.transactionId}',
        '${data.sellerId}',
        '${data.buyerId}',
        '${data.productId}',
        ${data.carbonScore},
        ${data.carbonSaved},
        ${data.price},
        ${data.quantity},
        CURRENT_TIMESTAMP()
      )
    `
    await executeQuery(query)
  } catch (error) {
    console.error('Error storing carbon savings:', error)
  }
}

/**
 * Store transaction record
 */
export async function storeTransaction(data) {
  try {
    const query = `
      INSERT INTO TRANSACTIONS (
        transaction_id, request_id, buyer_id, seller_id,
        product_id, product_name, quantity, price,
        blockchain_signature, blockchain_tx_hash,
        status, created_at, completed_at
      ) VALUES (
        '${data.transactionId}',
        '${data.requestId}',
        '${data.buyerId}',
        '${data.sellerId}',
        '${data.productId}',
        '${data.productName.replace(/'/g, "''")}',
        ${data.quantity},
        ${data.price},
        '${data.blockchainSignature || ''}',
        '${data.blockchainTxHash || ''}',
        '${data.status}',
        CURRENT_TIMESTAMP(),
        ${data.completedAt ? `'${data.completedAt}'` : 'NULL'}
      )
    `
    await executeQuery(query)
  } catch (error) {
    console.error('Error storing transaction:', error)
  }
}

/**
 * Update seller rating
 */
export async function updateSellerRating(sellerId, rating, carbonSaved) {
  try {
    const query = `
      INSERT INTO SELLER_RATINGS (
        seller_id, rating, carbon_saved, updated_at
      ) VALUES (
        '${sellerId}',
        ${rating},
        ${carbonSaved},
        CURRENT_TIMESTAMP()
      )
      ON CONFLICT (seller_id) DO UPDATE SET
        rating = (rating + ${rating}) / 2,
        carbon_saved = carbon_saved + ${carbonSaved},
        updated_at = CURRENT_TIMESTAMP()
    `
    await executeQuery(query)
  } catch (error) {
    console.error('Error updating seller rating:', error)
  }
}

/**
 * Get carbon analytics
 */
export async function getCarbonAnalytics() {
  try {
    const query = `
      SELECT 
        SUM(carbon_saved) as total_carbon_saved,
        COUNT(*) as total_transactions,
        AVG(carbon_score) as avg_carbon_score
      FROM TRANSACTIONS
      WHERE status IN ('completed', 'committed')
    `
    const rows = await executeQuery(query)
    const row = rows[0] || {}
    return {
      total_carbon_saved: parseFloat(row.TOTAL_CARBON_SAVED || row.total_carbon_saved || 0),
      total_transactions: parseInt(row.TOTAL_TRANSACTIONS || row.total_transactions || 0),
      avg_carbon_score: parseFloat(row.AVG_CARBON_SCORE || row.avg_carbon_score || 0)
    }
  } catch (error) {
    console.error('Error fetching carbon analytics:', error)
    return {
      total_carbon_saved: 0,
      total_transactions: 0,
      avg_carbon_score: 0
    }
  }
}

/**
 * Get dashboard analytics
 */
export async function getDashboardAnalytics() {
  try {
    // Top sellers
    const topSellersQuery = `
      SELECT 
        seller_id,
        COUNT(*) as transactions,
        SUM(carbon_saved) as carbon_saved
      FROM CARBON_SAVINGS
      GROUP BY seller_id
      ORDER BY carbon_saved DESC
      LIMIT 10
    `
    
    // Daily summary
    const dailySummaryQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as transactions,
        SUM(carbon_saved) as carbon_saved
      FROM TRANSACTIONS
      WHERE status IN ('completed', 'committed')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `

    const [topSellers, dailySummary] = await Promise.all([
      executeQuery(topSellersQuery).catch(() => []),
      executeQuery(dailySummaryQuery).catch(() => [])
    ])

    return {
      topSellers: topSellers.map(row => ({
        sellerId: row.SELLER_ID,
        sellerName: row.SELLER_NAME || 'Unknown',
        carbonSaved: parseFloat(row.CARBON_SAVED || 0),
        transactions: parseInt(row.TRANSACTIONS || 0)
      })),
      dailySummary: dailySummary.map(row => ({
        date: row.DATE,
        transactions: parseInt(row.TRANSACTIONS || 0),
        carbonSaved: parseFloat(row.CARBON_SAVED || 0),
      }))
    }
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error)
    return {
      topSellers: [],
      dailySummary: []
    }
  }
}

/**
 * Store analytics score in Snowflake
 */
export async function storeAnalyticsScore(data) {
  try {
    const query = `
      INSERT INTO USER_ANALYTICS (
        user_id, user_type, overall_score, quantity_score, carbon_score,
        reliability_score, transaction_score, quantity_purchased, green_credits,
        total_transactions, updated_at
      ) VALUES (
        '${data.userId}',
        '${data.userType}',
        ${data.overallScore},
        ${data.quantityScore},
        ${data.carbonScore},
        ${data.reliabilityScore},
        ${data.transactionScore},
        ${data.quantityPurchased},
        ${data.greenCredits},
        ${data.totalTransactions},
        CURRENT_TIMESTAMP()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        overall_score = ${data.overallScore},
        quantity_score = ${data.quantityScore},
        carbon_score = ${data.carbonScore},
        reliability_score = ${data.reliabilityScore},
        transaction_score = ${data.transactionScore},
        quantity_purchased = ${data.quantityPurchased},
        green_credits = ${data.greenCredits},
        total_transactions = ${data.totalTransactions},
        updated_at = CURRENT_TIMESTAMP()
    `
    await executeQuery(query)
  } catch (error) {
    console.error('Error storing analytics score:', error)
  }
}

