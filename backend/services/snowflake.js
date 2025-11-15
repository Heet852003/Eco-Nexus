import snowflake from 'snowflake-sdk'

// Snowflake connection configuration
const SNOWFLAKE_CONFIG = {
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USER,
  password: process.env.SNOWFLAKE_PASSWORD,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH',
  database: process.env.SNOWFLAKE_DATABASE || 'ECO_NEXUS',
  schema: process.env.SNOWFLAKE_SCHEMA || 'PUBLIC'
}

let connection = null

/**
 * Get or create Snowflake connection
 */
function getConnection() {
  return new Promise((resolve, reject) => {
    // Check if Snowflake is configured
    if (!SNOWFLAKE_CONFIG.account || !SNOWFLAKE_CONFIG.username || !SNOWFLAKE_CONFIG.password) {
      reject(new Error('Snowflake not configured - missing credentials'))
      return
    }

    if (connection) {
      resolve(connection)
      return
    }

    snowflake.createConnection(SNOWFLAKE_CONFIG, (err, conn) => {
      if (err) {
        console.error('Snowflake connection error:', err)
        reject(err)
        return
      }

      conn.connect((err, conn) => {
        if (err) {
          console.error('Snowflake connect error:', err)
          reject(err)
          return
        }

        connection = conn
        console.log('Connected to Snowflake')
        resolve(conn)
      })
    })
  })
}

/**
 * Execute a SQL query on Snowflake
 */
function executeQuery(query) {
  return new Promise((resolve, reject) => {
    getConnection()
      .then(conn => {
        conn.execute({
          sqlText: query,
          complete: (err, stmt, rows) => {
            if (err) {
              reject(err)
              return
            }
            resolve(rows)
          }
        })
      })
      .catch(reject)
  })
}

/**
 * Store a decision in Snowflake
 */
export async function storeDecision(decisionData) {
  try {
    const query = `
      INSERT INTO decisions (
        decision_id, vendor_id, vendor_name, price, carbon, 
        delivery_days, sustainability_score, cost_saved, 
        carbon_saved, scc_tokens, created_at
      ) VALUES (
        '${decisionData.decision_id}',
        '${decisionData.vendor_id}',
        '${decisionData.vendor_name}',
        ${decisionData.price},
        ${decisionData.carbon},
        ${decisionData.delivery_days},
        ${decisionData.sustainability_score},
        ${decisionData.cost_saved},
        ${decisionData.carbon_saved},
        ${decisionData.scc_tokens},
        CURRENT_TIMESTAMP()
      )
    `

    await executeQuery(query)
    console.log('Decision stored in Snowflake')
  } catch (error) {
    console.error('Error storing decision:', error)
    // Don't throw - allow app to continue if Snowflake fails
  }
}

/**
 * Get analytics report from Snowflake
 */
export async function getAnalyticsReport() {
  try {
    const query = `
      SELECT 
        SUM(carbon_saved) as total_carbon_saved,
        SUM(cost_saved) as total_cost_saved,
        SUM(scc_tokens) as total_scc_tokens,
        COUNT(*) as decisions_count
      FROM decisions
    `

    const rows = await executeQuery(query)
    
    if (!rows || rows.length === 0) {
      return {
        total_carbon_saved: 0,
        total_cost_saved: 0,
        total_scc_tokens: 0,
        decisions_count: 0,
        monthly_data: []
      }
    }

    const totals = rows[0]

    // Get monthly breakdown
    const monthlyQuery = `
      SELECT 
        TO_CHAR(created_at, 'Mon') as month,
        SUM(carbon_saved) as carbon_saved,
        SUM(cost_saved) as cost_saved,
        SUM(scc_tokens) as tokens_earned
      FROM decisions
      GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `

    let monthlyData = []
    try {
      monthlyData = await executeQuery(monthlyQuery)
    } catch (error) {
      console.warn('Monthly data query failed:', error)
    }

    return {
      total_carbon_saved: parseFloat(totals.TOTAL_CARBON_SAVED || 0),
      total_cost_saved: parseFloat(totals.TOTAL_COST_SAVED || 0),
      total_scc_tokens: parseFloat(totals.TOTAL_SCC_TOKENS || 0),
      decisions_count: parseInt(totals.DECISIONS_COUNT || 0),
      monthly_data: monthlyData.map(row => ({
        month: row.MONTH,
        carbon_saved: parseFloat(row.CARBON_SAVED || 0),
        cost_saved: parseFloat(row.COST_SAVED || 0),
        tokens_earned: parseFloat(row.TOKENS_EARNED || 0)
      }))
    }
  } catch (error) {
    console.error('Error fetching analytics:', error)
    throw error
  }
}

