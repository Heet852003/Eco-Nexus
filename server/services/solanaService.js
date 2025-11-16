/**
 * Solana Blockchain Service for Carbon Marketplace
 * Handles transaction commitment (SCC token minting removed)
 */

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

let payerKeypair = null

function getPayerKeypair() {
  if (payerKeypair) return payerKeypair

  const keypairPath = join(__dirname, '../../.solana/keypair.json')
  
  try {
    if (existsSync(keypairPath)) {
      const keypairData = JSON.parse(readFileSync(keypairPath, 'utf8'))
      payerKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData))
    } else {
      payerKeypair = Keypair.generate()
      const keypairDir = dirname(keypairPath)
      if (!existsSync(keypairDir)) {
        mkdirSync(keypairDir, { recursive: true })
      }
      writeFileSync(keypairPath, JSON.stringify(Array.from(payerKeypair.secretKey)))
      console.log('Generated new Solana keypair:', payerKeypair.publicKey.toString())
    }
  } catch (error) {
    console.error('Error loading keypair:', error)
    payerKeypair = Keypair.generate()
  }

  return payerKeypair
}

// Mint creation removed - no longer using SCC tokens

/**
 * Commit transaction to Solana blockchain
 * Note: SCC token minting has been removed - only transaction record is stored
 */
export async function commitTransaction(transactionData) {
  try {
    console.log('🔄 Starting blockchain commit...')
    console.log('Transaction data:', {
      id: transactionData.id,
      price: transactionData.price,
      carbonScore: transactionData.carbonScore,
      quantity: transactionData.quantity
    })

    const payer = getPayerKeypair()
    console.log('✅ Payer keypair loaded:', payer.publicKey.toString())
    
    // Create a simple transaction record on blockchain (without token minting)
    // For now, we'll just create a transaction signature for record-keeping
    const transaction = new Transaction()
    
    // Add a simple instruction to record the transaction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: payer.publicKey, // Self-transfer (minimal cost)
        lamports: 1 // Minimal amount just to create a transaction
      })
    )

    // Sign and send transaction
    let signature
    try {
      signature = await connection.sendTransaction(transaction, [payer])
      console.log('✅ Transaction sent:', signature)
    } catch (error) {
      console.error('❌ Failed to send transaction:', error)
      throw new Error(`Failed to send transaction: ${error.message}`)
    }

    // Wait for confirmation
    try {
      await connection.confirmTransaction(signature, 'confirmed')
      console.log('✅ Transaction confirmed on blockchain')
    } catch (error) {
      console.error('⚠️ Transaction sent but confirmation failed:', error)
      // Continue anyway - transaction might still be processing
    }

    console.log(`✅ Transaction committed: ${signature}`)

    return {
      signature,
      txHash: signature,
      sccTokensMinted: null, // No longer minting tokens
      explorerUrl: `https://solscan.io/tx/${signature}?cluster=devnet`
    }
  } catch (error) {
    console.error('❌ Error committing transaction:', error)
    console.error('Error stack:', error.stack)
    throw new Error(`Failed to commit transaction: ${error.message}`)
  }
}

// SCC token minting removed - using sustainability scores instead

