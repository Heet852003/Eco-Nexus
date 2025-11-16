/**
 * Negotiation Chat Component
 * Real-time chat between buyer and seller for quote negotiation
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { 
  createNegotiationThread, 
  getNegotiationThread, 
  sendNegotiationMessage,
  getNegotiationMessages,
  triggerAgentNegotiation,
  updateNegotiationGuidelines,
  extractNegotiatedTerms
} from '@/lib/api'
import { MessageCircle, Send, Bot, User, Lightbulb, Sparkles, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { logger } from '@/lib/logger'

interface ChatMessage {
  id: string
  senderId: string | null
  senderType: 'BUYER' | 'SELLER' | 'AGENT' | 'AGENT_BUYER' | 'AGENT_SELLER'
  senderName: string
  content: string
  timestamp: string
  aiHint?: string
}

interface NegotiationChatProps {
  requestId: string
  quoteId: string
  buyerId: string
  sellerId: string
  sellerName: string
  threadId?: string // Optional: if thread already exists
  onClose?: () => void
}

export default function NegotiationChat({
  requestId,
  quoteId,
  buyerId,
  sellerId,
  sellerName,
  threadId: initialThreadId,
  onClose
}: NegotiationChatProps) {
  const { user } = useAuth()
  const [threadId, setThreadId] = useState<string | null>(initialThreadId || null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [agentNegotiating, setAgentNegotiating] = useState(false)
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false)
  const [guidelines, setGuidelines] = useState('')
  const [threadGuidelines, setThreadGuidelines] = useState<{ buyerGuidelines: string | null, sellerGuidelines: string | null }>({ buyerGuidelines: null, sellerGuidelines: null })
  const [autoNegotiate, setAutoNegotiate] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isBuyer = user?.id === buyerId
  const isSeller = user?.id === sellerId

  useEffect(() => {
    if (!user || (!isBuyer && !isSeller)) return

    if (initialThreadId) {
      // Thread ID provided, load it directly
      setThreadId(initialThreadId)
      loadMessages(initialThreadId)
      setLoading(false)
    } else {
      // No thread ID, need to find or create
      initializeThread()
    }
  }, [user, requestId, quoteId, initialThreadId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const startAgentNegotiation = async (threadId: string, maxRounds: number = 3) => {
    if (agentNegotiating) return
    
    setAgentNegotiating(true)
    let rounds = 0
    let agreementReached = false
    
    try {
      while (rounds < maxRounds && !agreementReached) {
        rounds++
        logger.log(`🔄 Starting negotiation round ${rounds}/${maxRounds}`)
        
        const result = await triggerAgentNegotiation(threadId)
        
        if (result.buyerAgentMessage && result.sellerAgentMessage) {
          await loadMessages(threadId)
          
          if (result.agreementReached) {
            agreementReached = true
            
            // Wait a bit for confirmation messages to be generated
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            // Reload messages to get confirmation messages
            await loadMessages(threadId)
            
            toast.success(`✅ Agreement reached after ${rounds} rounds!`)
            logger.log('✅ Agents reached an agreement!')
            break
          } else {
            logger.log(`📊 Round ${rounds} completed, continuing...`)
            // Wait 2 seconds before next round
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        } else {
          logger.error('❌ Failed to get agent messages')
          break
        }
      }
      
      if (!agreementReached && rounds >= maxRounds) {
        toast('ℹ️ Maximum rounds reached. Agents are still negotiating.', { icon: '⏱️' })
        logger.log(`⏱️ Reached maximum rounds (${maxRounds})`)
      }
    } catch (error: any) {
      logger.error('Failed to start agent negotiation:', error)
      const errorMsg = error.response?.data?.error || error.response?.data?.details || 'Failed to start agent negotiation'
      if (errorMsg.includes('guidelines')) {
        toast.error('Both parties must provide guidelines first')
        setShowGuidelinesModal(true)
      } else {
        toast.error(errorMsg)
      }
    } finally {
      setAgentNegotiating(false)
    }
  }

  const initializeThread = async () => {
    try {
      setLoading(true)
      // Try to get existing thread or create new one
      let thread
      try {
        // First try to find existing thread by quoteId
        const existingThread = await getNegotiationThread(quoteId)
        if (existingThread?.thread) {
          thread = existingThread.thread
        }
      } catch (error) {
        // Thread doesn't exist, create it if buyer
        if (isBuyer) {
          try {
            thread = await createNegotiationThread(requestId, quoteId)
          } catch (createError: any) {
            // If creation fails, might already exist, try to get it again
            const existingThread = await getNegotiationThread(quoteId)
            if (existingThread?.thread) {
              thread = existingThread.thread
            } else {
              throw createError
            }
          }
        } else {
          // Seller can't create thread, but can join if it exists
          // Try one more time to find it
          try {
            const existingThread = await getNegotiationThread(quoteId)
            if (existingThread?.thread) {
              thread = existingThread.thread
            } else {
              toast.error('Buyer must start the negotiation first')
              return
            }
          } catch (e) {
            toast.error('Buyer must start the negotiation first')
            return
          }
        }
      }

      if (thread) {
        setThreadId(thread.id)
        setThreadGuidelines({
          buyerGuidelines: thread.buyerGuidelines || null,
          sellerGuidelines: thread.sellerGuidelines || null
        })
        await loadMessages(thread.id)
        
        // Check if both guidelines are set and auto-start negotiation
        if (thread.buyerGuidelines && thread.sellerGuidelines && !autoNegotiate) {
          setAutoNegotiate(true)
          // Auto-start agent negotiation after a short delay
          setTimeout(async () => {
            if (thread.id) {
              await startAgentNegotiation(thread.id)
            }
          }, 1000)
        }
      }
    } catch (error: any) {
      logger.error('Failed to initialize thread:', error)
      toast.error(error.response?.data?.error || 'Failed to start negotiation')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (threadId: string) => {
    try {
      const data = await getNegotiationThread(threadId)
      if (data?.messages) {
        setMessages(data.messages)
      }
      if (data?.thread) {
        setThreadGuidelines({
          buyerGuidelines: data.thread.buyerGuidelines || null,
          sellerGuidelines: data.thread.sellerGuidelines || null
        })
      }
    } catch (error: any) {
      logger.error('Failed to load messages:', error)
    }
  }

  const handleSaveGuidelines = async () => {
    if (!threadId || !guidelines.trim()) {
      toast.error('Please enter your guidelines')
      return
    }

    try {
      await updateNegotiationGuidelines(threadId, guidelines.trim())
      toast.success('Guidelines saved!')
      setShowGuidelinesModal(false)
      setGuidelines('')
      await loadMessages(threadId)
      
      // Check if both guidelines are now set and auto-start
      const data = await getNegotiationThread(threadId)
      if (data?.thread?.buyerGuidelines && data?.thread?.sellerGuidelines) {
        setTimeout(() => {
          startAgentNegotiation(threadId)
        }, 500)
      }
    } catch (error: any) {
      logger.error('Failed to save guidelines:', error)
      toast.error(error.response?.data?.error || 'Failed to save guidelines')
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !threadId || sending) return

    setSending(true)
    try {
      const response = await sendNegotiationMessage(threadId, newMessage)
      if (response.message) {
        setMessages(prev => [...prev, response.message])
        if (response.agentMessage) {
          setMessages(prev => [...prev, response.agentMessage])
        }
        setNewMessage('')
        // Reload messages to ensure we have the latest
        setTimeout(() => {
          loadMessages(threadId)
        }, 500)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  // Auto-refresh messages every 3 seconds when chat is open
  useEffect(() => {
    if (!threadId) return

    const interval = setInterval(async () => {
      const oldMessageCount = messages.length
      await loadMessages(threadId)
      
      // Check if new agent messages were added
      const data = await getNegotiationThread(threadId)
      if (data?.messages) {
        const newMessageCount = data.messages.length
        const agentMessages = data.messages.filter((m: ChatMessage) => 
          m.senderType === 'AGENT_BUYER' || m.senderType === 'AGENT_SELLER'
        )
        
        // If we have agent messages and both guidelines are set, agents can continue negotiating
        if (agentMessages.length >= 2 && 
            threadGuidelines.buyerGuidelines && 
            threadGuidelines.sellerGuidelines &&
            !agentNegotiating &&
            newMessageCount > oldMessageCount) {
          // Check if last two messages are from different agents (one round complete)
          const lastTwo = data.messages.slice(-2)
          if (lastTwo.length === 2 && 
              ((lastTwo[0].senderType === 'AGENT_BUYER' && lastTwo[1].senderType === 'AGENT_SELLER') ||
               (lastTwo[0].senderType === 'AGENT_SELLER' && lastTwo[1].senderType === 'AGENT_BUYER'))) {
            // Agents completed a round, can continue
            // Auto-continue after a short delay (optional - can be disabled)
            // setTimeout(() => {
            //   startAgentNegotiation(threadId)
            // }, 2000)
          }
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [threadId, messages.length, threadGuidelines, agentNegotiating])

  const getMessageAlignment = (senderType: string) => {
    if (senderType === 'AGENT' || senderType === 'AGENT_BUYER' || senderType === 'AGENT_SELLER') return 'center'
    if (senderType === 'BUYER' && isBuyer) return 'right'
    if (senderType === 'SELLER' && isSeller) return 'right'
    return 'left'
  }

  const getMessageColor = (senderType: string) => {
    if (senderType === 'AGENT_BUYER') return 'bg-purple-700 border-purple-600'
    if (senderType === 'AGENT_SELLER') return 'bg-cyan-700 border-cyan-600'
    if (senderType === 'AGENT') return 'bg-gray-700 border-gray-600'
    if (senderType === 'BUYER') return 'bg-primary-600 border-primary-500'
    return 'bg-blue-600 border-blue-500'
  }

  const isAgentMessage = (senderType: string) => {
    return senderType === 'AGENT' || senderType === 'AGENT_BUYER' || senderType === 'AGENT_SELLER'
  }

  if (loading) {
    return (
      <div className="glass rounded-xl p-8 border border-primary-500/20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading negotiation...</p>
        </div>
      </div>
    )
  }

  if (!threadId) {
    return (
      <div className="glass rounded-xl p-8 border border-primary-500/20 text-center">
        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400 mb-4">
          {isBuyer ? 'Start negotiation with seller' : 'Waiting for buyer to start negotiation'}
        </p>
        {isBuyer && (
          <button
            onClick={initializeThread}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition"
          >
            Start Negotiation
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="glass rounded-xl border border-primary-500/20 flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">Negotiation Chat</h3>
            {agentNegotiating && (
              <div className="flex items-center gap-2 text-sm text-purple-400">
                <Bot className="w-4 h-4 animate-pulse" />
                <span>Agents negotiating...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-400">
            {isBuyer ? `Negotiating with ${sellerName}` : `Negotiating with buyer`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(!threadGuidelines.buyerGuidelines || !threadGuidelines.sellerGuidelines) && (
            <button
              onClick={() => setShowGuidelinesModal(true)}
              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition text-sm flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Set Guidelines
            </button>
          )}
          {threadGuidelines.buyerGuidelines && threadGuidelines.sellerGuidelines && !agentNegotiating && (
            <button
              onClick={() => threadId && startAgentNegotiation(threadId)}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-500 transition text-sm flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              Start Agent Negotiation
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const alignment = getMessageAlignment(message.senderType)
            const isOwnMessage = 
              (message.senderType === 'BUYER' && isBuyer) ||
              (message.senderType === 'SELLER' && isSeller)

            return (
              <div
                key={message.id}
                className={`flex ${alignment === 'right' ? 'justify-end' : alignment === 'center' ? 'justify-center' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 border ${
                    isAgentMessage(message.senderType)
                      ? getMessageColor(message.senderType)
                      : isOwnMessage
                      ? 'bg-primary-600 border-primary-500'
                      : 'bg-blue-600 border-blue-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {isAgentMessage(message.senderType) ? (
                      <Bot className="w-4 h-4 text-white" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                    <span className="text-xs font-semibold text-white">
                      {message.senderName}
                    </span>
                    <span className="text-xs text-gray-300">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-white text-sm">{message.content}</p>
                  {message.aiHint && (
                    <p className="text-xs text-gray-300 mt-2 italic flex items-start gap-2">
                      <Lightbulb className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>{message.aiHint}</span>
                    </p>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 bg-dark-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            disabled={sending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            {agentNegotiating 
              ? '🤖 Agents are negotiating automatically...' 
              : threadGuidelines.buyerGuidelines && threadGuidelines.sellerGuidelines
              ? '💡 Agents can negotiate automatically'
              : '💡 Set guidelines to enable agent negotiation'}
          </p>
          {threadGuidelines.buyerGuidelines && 
           threadGuidelines.sellerGuidelines && 
           !agentNegotiating && 
           messages.some(m => m.senderType === 'AGENT_BUYER' || m.senderType === 'AGENT_SELLER') && (
            <button
              onClick={() => threadId && startAgentNegotiation(threadId)}
              className="px-3 py-1 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition flex items-center gap-1"
            >
              <Bot className="w-3 h-3" />
              Continue Negotiation
            </button>
          )}
        </div>
      </div>

      {/* Guidelines Modal */}
      {showGuidelinesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Set Agent Guidelines</h3>
              <button
                onClick={() => {
                  setShowGuidelinesModal(false)
                  setGuidelines('')
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Provide instructions for your agent on how to negotiate. For example: "Try to get at least 10% discount" or "Prioritize faster delivery over price".
            </p>
            <textarea
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              placeholder="Enter your negotiation guidelines..."
              className="w-full px-4 py-3 bg-dark-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500 mb-4 min-h-[120px]"
            />
            <div className="flex items-center gap-4 mb-4 text-sm">
              <div className="flex-1">
                <p className="text-gray-400 mb-1">Buyer Guidelines:</p>
                <p className={`font-semibold ${threadGuidelines.buyerGuidelines ? 'text-green-400' : 'text-gray-500'}`}>
                  {threadGuidelines.buyerGuidelines ? '✓ Set' : 'Not set'}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-gray-400 mb-1">Seller Guidelines:</p>
                <p className={`font-semibold ${threadGuidelines.sellerGuidelines ? 'text-green-400' : 'text-gray-500'}`}>
                  {threadGuidelines.sellerGuidelines ? '✓ Set' : 'Not set'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveGuidelines}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition"
              >
                Save Guidelines
              </button>
              <button
                onClick={() => {
                  setShowGuidelinesModal(false)
                  setGuidelines('')
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

