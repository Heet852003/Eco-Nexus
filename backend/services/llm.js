import axios from 'axios'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

/**
 * Call OpenRouter LLM API for reasoning
 * Uses free models available on OpenRouter
 * 
 * @param {string} prompt - The prompt to send to the LLM
 * @returns {Promise<string>} LLM response text
 */
export async function callLLM(prompt) {
  // If no API key, return a default response
  if (!OPENROUTER_API_KEY) {
    console.warn('OpenRouter API key not set, using default reasoning')
    return 'AI reasoning unavailable. Vendor selected based on optimized scoring algorithm that balances cost, carbon footprint, delivery time, and sustainability score.'
  }

  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: 'meta-llama/llama-3.2-3b-instruct:free', // Free model on OpenRouter
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant helping businesses make sustainable procurement decisions. Provide clear, concise reasoning.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://eco-nexus-scos.vercel.app', // Optional: for OpenRouter analytics
          'X-Title': 'Eco-Nexus SCOS' // Optional: for OpenRouter analytics
        }
      }
    )

    const reasoning = response.data.choices[0]?.message?.content?.trim()
    
    if (!reasoning) {
      throw new Error('Empty response from LLM')
    }

    return reasoning
  } catch (error) {
    console.error('LLM API error:', error.response?.data || error.message)
    
    // Fallback to default reasoning
    return 'AI reasoning temporarily unavailable. Vendor selected based on optimized scoring algorithm that balances cost, carbon footprint, delivery time, and sustainability score.'
  }
}

