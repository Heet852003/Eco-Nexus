import { 
  Connection, 
  Keypair, 
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js'
import { 
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
const connection = new Connection(SOLANA_RPC_URL, 'confirmed')

// Cache for mint address (create once, reuse)
let mintAddress = null
let payerKeypair = null

/**
 * Initialize or load payer keypair for Solana transactions
 */
function getPayerKeypair() {
  if (payerKeypair) {
    return payerKeypair
  }

  const keypairPath = join(__dirname, '../.solana/keypair.json')
  
  try {
    if (existsSync(keypairPath)) {
      // Load existing keypair
      const keypairData = JSON.parse(readFileSync(keypairPath, 'utf8'))
      payerKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData))
    } else {
      // Generate new keypair
      payerKeypair = Keypair.generate()
      // Save for future use
      const keypairDir = dirname(keypairPath)
      if (!existsSync(keypairDir)) {
        mkdirSync(keypairDir, { recursive: true })
      }
      writeFileSync(keypairPath, JSON.stringify(Array.from(payerKeypair.secretKey)))
      console.log('Generated new Solana keypair:', payerKeypair.publicKey.toString())
    }
  } catch (error) {
    console.error('Error loading keypair:', error)
    // Generate new one as fallback
    payerKeypair = Keypair.generate()
  }

  return payerKeypair
}

/**
 * Get or create the SCC token mint
 */
async function getOrCreateMint() {
  if (mintAddress) {
    return new PublicKey(mintAddress)
  }

  const mintPath = join(__dirname, '../.solana/mint.json')
  
  try {
    if (existsSync(mintPath)) {
      // Load existing mint
      const mintData = JSON.parse(readFileSync(mintPath, 'utf8'))
      mintAddress = mintData.mintAddress
      return new PublicKey(mintAddress)
    } else {
      // Create new mint
      const payer = getPayerKeypair()
      
      // Request airdrop for devnet (free)
      try {
        const signature = await connection.requestAirdrop(
          payer.publicKey,
          1 * LAMPORTS_PER_SOL
        )
        await connection.confirmTransaction(signature)
        console.log('Airdrop received for mint creation')
      } catch (error) {
        console.warn('Airdrop failed (may already have funds):', error.message)
      }

      // Create mint
      const mint = await createMint(
        connection,
        payer,
        payer.publicKey,
        null,
        9 // 9 decimals (standard for SPL tokens)
      )

      mintAddress = mint.toString()
      
      // Save mint address
      writeFileSync(mintPath, JSON.stringify({ mintAddress }))
      console.log('Created new SCC token mint:', mintAddress)

      return mint
    }
  } catch (error) {
    console.error('Error getting/creating mint:', error)
    throw new Error(`Failed to get/create token mint: ${error.message}`)
  }
}

/**
 * Mint SCC tokens to a wallet address
 * 
 * @param {number} amount - Amount of tokens to mint
 * @param {string} walletAddress - Optional wallet address (uses payer if not provided)
 * @returns {Promise<Object>} Transaction hash and wallet address
 */
export async function mintSCCToken(amount, walletAddress = null) {
  try {
    const payer = getPayerKeypair()
    const mint = await getOrCreateMint()
    
    // Use provided wallet or default to payer
    const recipientPublicKey = walletAddress 
      ? new PublicKey(walletAddress)
      : payer.publicKey

    // Get or create associated token account
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      recipientPublicKey
    )

    // Convert amount to token units (9 decimals)
    const amountInSmallestUnit = Math.floor(amount * Math.pow(10, 9))

    // Mint tokens
    const signature = await mintTo(
      connection,
      payer,
      mint,
      tokenAccount.address,
      payer,
      amountInSmallestUnit
    )

    console.log(`Minted ${amount} SCC tokens to ${recipientPublicKey.toString()}`)
    console.log(`Transaction: https://solscan.io/tx/${signature}?cluster=devnet`)

    return {
      txHash: signature,
      walletAddress: recipientPublicKey.toString(),
      amount: amount
    }
  } catch (error) {
    console.error('Error minting tokens:', error)
    throw new Error(`Failed to mint tokens: ${error.message}`)
  }
}

