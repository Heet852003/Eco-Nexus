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
  extractNegotiatedTerms,
  updateSellerQuote,
  updateNegotiationGuidelines
} from '@/lib/api'
import { MessageCircle, Send, Bot, User } from 'lucide-react'
import toast from 'react-hot-toast'

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
  onQuoteUpdated?: (quoteId: string) => void // Callback when quote is updated
}

export default function NegotiationChat({
  requestId,
  quoteId,
  buyerId,
  sellerId,
  sellerName,
  threadId: initialThreadId,
  onClose,
  onQuoteUpdated
}: NegotiationChatProps) {
  const { user } = useAuth()
  const [threadId, setThreadId] = useState<string | null>(initialThreadId || null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [agentNegotiating, setAgentNegotiating] = useState(false)
  const [negotiationComplete, setNegotiationComplete] = useState(false)
  const [currentRound, setCurrentRound] = useState(0)
  const [userControlMode, setUserControlMode] = useState(false) // After round 5, user takes control
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false)
  const [buyerGuidelines, setBuyerGuidelines] = useState('')
  const [sellerGuidelines, setSellerGuidelines] = useState('')
  const [threadGuidelines, setThreadGuidelines] = useState<{ buyerGuidelines?: string, sellerGuidelines?: string }>({})
  const [stoppingCriteria, setStoppingCriteria] = useState({
    maxRounds: 5,
    autoContinueOnYesNo: true
  })
  const autoContinueTriggered = useRef(false)
  const maxRoundsToastShown = useRef(false)
  const userControlToastShown = useRef(false)
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
        // Reset toast flags for new thread
        maxRoundsToastShown.current = false
        userControlToastShown.current = false
        await loadMessages(thread.id)
        // Check if guidelines are needed
        const needsBuyerGuidelines = !thread.buyerGuidelines && isBuyer
        const needsSellerGuidelines = !thread.sellerGuidelines && isSeller
        if (needsBuyerGuidelines || needsSellerGuidelines) {
          setShowGuidelinesModal(true)
        }
      }
    } catch (error: any) {
      console.error('Failed to initialize thread:', error)
      toast.error(error.response?.data?.error || 'Failed to start negotiation')
    } finally {
      setLoading(false)
    }
  }

  const detectYesNoQuestion = (message: string): boolean => {
    const yesNoPatterns = [
      /\b(can you|could you|would you|will you|are you|do you|does|is|are)\b.*\?/i,
      /\b(yes|no|agree|accept|deal|works?)\b.*\?/i,
      /\?.*\b(yes|no)\b/i
    ]
    return yesNoPatterns.some(pattern => pattern.test(message))
  }

  const loadMessages = async (threadId: string) => {
    try {
      const data = await getNegotiationThread(threadId)
      if (data?.thread) {
        setThreadGuidelines({
          buyerGuidelines: data.thread.buyerGuidelines,
          sellerGuidelines: data.thread.sellerGuidelines
        })
      }
      if (data?.messages) {
        setMessages(data.messages)
        // Check if negotiation seems complete (agents have exchanged messages in this round)
        const agentMessages = data.messages.filter((m: ChatMessage) => 
          m.senderType?.startsWith('AGENT_') || m.senderType === 'AGENT'
        )
        // Check if we have both buyer and seller agent messages
        const hasBuyerAgent = agentMessages.some((m: ChatMessage) => m.senderType === 'AGENT_BUYER')
        const hasSellerAgent = agentMessages.some((m: ChatMessage) => m.senderType === 'AGENT_SELLER')
        
        // Count rounds (each round = buyer + seller message pair)
        const roundCount = Math.floor(agentMessages.length / 2)
        setCurrentRound(roundCount)
        
        // Switch to user control after round 5 - only check once
        if (roundCount >= 5 && !userControlMode && !userControlToastShown.current) {
          // Set ref FIRST to prevent duplicate toasts from concurrent calls
          userControlToastShown.current = true
          setUserControlMode(true)
          // Use setTimeout to ensure ref is set before toast shows
          setTimeout(() => {
            toast('Switching to user control after 5 rounds. You can now guide the negotiation.', { icon: '👤' })
          }, 100)
        }
        
        // Check for yes/no questions in the last message (only if not in user control mode)
        if (!userControlMode && stoppingCriteria.autoContinueOnYesNo && agentMessages.length > 0 && !autoContinueTriggered.current) {
          const lastMessage = agentMessages[agentMessages.length - 1]
          if (detectYesNoQuestion(lastMessage.content)) {
            // Auto-continue if yes/no question detected
            autoContinueTriggered.current = true
            setTimeout(() => {
              if (threadId && roundCount < stoppingCriteria.maxRounds && !agentNegotiating) {
                console.log('🤔 Yes/No question detected, auto-continuing negotiation...')
                startAgentNegotiation(threadId)
              }
              // Reset flag after delay
              setTimeout(() => {
                autoContinueTriggered.current = false
              }, 5000)
            }, 2000) // Wait 2 seconds before auto-continuing
          }
        }
        
        // Mark complete if we have both agent types and at least 2 messages
        // OR if max rounds reached - only check once
        if ((hasBuyerAgent && hasSellerAgent) && agentMessages.length >= 2 && !agentNegotiating) {
          if (roundCount >= stoppingCriteria.maxRounds) {
            setNegotiationComplete(true)
            // Only show toast once - check ref before showing
            if (!maxRoundsToastShown.current) {
              // Set ref FIRST to prevent duplicate toasts from concurrent calls
              maxRoundsToastShown.current = true
              // Use setTimeout to ensure ref is set before toast shows
              setTimeout(() => {
                toast(`Maximum negotiation rounds (${stoppingCriteria.maxRounds}) reached`, { icon: 'ℹ️' })
              }, 100)
            }
          } else if (!userControlMode) {
            setNegotiationComplete(true)
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to load messages:', error)
    }
  }

  const startAgentNegotiation = async (threadId: string) => {
    if (agentNegotiating) return
    if (userControlMode) {
      // Don't show toast repeatedly - use a ref to track
      if (!userControlToastShown.current) {
        userControlToastShown.current = true
        toast('User control mode active. Please send messages manually.', { icon: '👤' })
      }
      return
    }
    if (currentRound >= stoppingCriteria.maxRounds) {
      // Don't show toast repeatedly
      if (!maxRoundsToastShown.current) {
        maxRoundsToastShown.current = true
        toast(`Maximum rounds (${stoppingCriteria.maxRounds}) reached`, { icon: '⚠️' })
      }
      return
    }
    
    setAgentNegotiating(true)
    setNegotiationComplete(false)
    try {
      console.log('🔄 Starting agent negotiation for thread:', threadId)
      const result = await triggerAgentNegotiation(threadId)
      console.log('✅ Agent negotiation result:', result)
      
      if (result.buyerAgentMessage && result.sellerAgentMessage) {
        // Reload messages to show agent negotiation
        await loadMessages(threadId)
        toast.success('Agents are negotiating on your behalf!')
      } else {
        console.warn('⚠️ Agent negotiation returned incomplete result:', result)
        toast.error('Agent negotiation started but returned incomplete results')
        // Still reload messages in case some were created
        await loadMessages(threadId)
      }
    } catch (error: any) {
      console.error('❌ Failed to start agent negotiation:', error)
      console.error('Error response:', error.response?.data)
      
      let errorMessage = error.response?.data?.error || 
                        error.response?.data?.details || 
                        error.message || 
                        'Failed to start agent negotiation'
      
      // Show more helpful error messages
      if (errorMessage.includes('guidelines') || errorMessage.includes('Both parties must provide')) {
        errorMessage = 'Both parties must provide guidelines first. Click "Set Agent Guidelines" button to provide your guidelines.'
      } else if (errorMessage.includes('OpenRouter') || errorMessage.includes('API key')) {
        errorMessage = 'OpenRouter API key issue. Please check server/.env file and ensure OPENROUTER_API_KEY is set correctly.'
      } else if (errorMessage.includes('rate limit')) {
        errorMessage = 'API rate limit exceeded. Please wait a moment and try again, or check your OpenRouter account.'
      }
      
      // Show both error and details if available
      const errorDetails = error.response?.data?.details
      if (errorDetails && errorDetails !== errorMessage) {
        toast.error(`${errorMessage}\n${errorDetails}`, { duration: 6000 })
      } else {
        toast.error(errorMessage, { duration: 5000 })
      }
    } finally {
      setAgentNegotiating(false)
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
  // But skip toast notifications if we're in user control mode or max rounds reached
  useEffect(() => {
    if (!threadId) return

    const interval = setInterval(() => {
      // Only refresh if not in user control mode (to avoid triggering toasts)
      // The refs will prevent duplicate toasts anyway, but this reduces unnecessary checks
      loadMessages(threadId)
    }, 3000)

    return () => clearInterval(interval)
  }, [threadId, userControlMode])

  const getMessageAlignment = (senderType: string) => {
    if (senderType === 'AGENT' || senderType?.startsWith('AGENT_')) return 'center'
    if (senderType === 'BUYER' && isBuyer) return 'right'
    if (senderType === 'SELLER' && isSeller) return 'right'
    return 'left'
  }

  const getMessageColor = (senderType: string) => {
    if (senderType === 'AGENT' || senderType?.startsWith('AGENT_')) {
      if (senderType === 'AGENT_BUYER') return 'bg-purple-600 border-purple-500'
      if (senderType === 'AGENT_SELLER') return 'bg-blue-600 border-blue-500'
      return 'bg-gray-700 border-gray-600'
    }
    if (senderType === 'BUYER') return 'bg-primary-600 border-primary-500'
    return 'bg-blue-600 border-blue-500'
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
    <>
      {/* Guidelines Modal */}
      {showGuidelinesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass rounded-xl border border-primary-500/20 p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Set Agent Guidelines</h3>
            <p className="text-sm text-gray-400 mb-4">
              Provide instructions or restrictions for your agent. These will guide the negotiation.
            </p>
            
            {isBuyer && (
              <div className="mb-4">
                <label className="text-sm text-gray-300 mb-2 block">Buyer Agent Guidelines:</label>
                <textarea
                  value={buyerGuidelines || threadGuidelines.buyerGuidelines || ''}
                  onChange={(e) => setBuyerGuidelines(e.target.value)}
                  placeholder="e.g., 'Maximum budget is $30. Do not accept anything above $25. Prioritize fast delivery.'"
                  className="w-full px-3 py-2 bg-dark-800 border border-gray-700 rounded-lg text-white text-sm resize-none"
                  rows={3}
                />
                {threadGuidelines.buyerGuidelines && !buyerGuidelines && (
                  <p className="text-xs text-gray-500 mt-1">Current guidelines shown above</p>
                )}
              </div>
            )}
            
            {isSeller && (
              <div className="mb-4">
                <label className="text-sm text-gray-300 mb-2 block">Seller Agent Guidelines:</label>
                <textarea
                  value={sellerGuidelines || threadGuidelines.sellerGuidelines || ''}
                  onChange={(e) => setSellerGuidelines(e.target.value)}
                  placeholder="e.g., 'Minimum acceptable price is $50. Can offer faster delivery for premium price.'"
                  className="w-full px-3 py-2 bg-dark-800 border border-gray-700 rounded-lg text-white text-sm resize-none"
                  rows={3}
                />
                {threadGuidelines.sellerGuidelines && !sellerGuidelines && (
                  <p className="text-xs text-gray-500 mt-1">Current guidelines shown above</p>
                )}
              </div>
            )}
            
            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400 mb-2">Guidelines Status:</p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Buyer Guidelines:</span>
                  <span className={threadGuidelines.buyerGuidelines ? 'text-green-400' : 'text-yellow-400'}>
                    {threadGuidelines.buyerGuidelines ? '✓ Provided' : '⏳ Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Seller Guidelines:</span>
                  <span className={threadGuidelines.sellerGuidelines ? 'text-green-400' : 'text-yellow-400'}>
                    {threadGuidelines.sellerGuidelines ? '✓ Provided' : '⏳ Pending'}
                  </span>
                </div>
              </div>
              {!threadGuidelines.buyerGuidelines || !threadGuidelines.sellerGuidelines ? (
                <p className="text-xs text-yellow-400 mt-2">
                  ⚠️ Both parties must provide guidelines before negotiation can start
                </p>
              ) : (
                <p className="text-xs text-green-400 mt-2">
                  ✓ Ready to start negotiation
                </p>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!threadId) return
                  
                  const guidelinesToSave = isBuyer 
                    ? (buyerGuidelines || threadGuidelines.buyerGuidelines || '')
                    : (sellerGuidelines || threadGuidelines.sellerGuidelines || '')
                  if (!guidelinesToSave.trim()) {
                    toast.error('Please provide guidelines for your agent')
                    return
                  }
                  
                  try {
                    await updateNegotiationGuidelines(threadId, guidelinesToSave)
                    toast.success('Guidelines saved!')
                    setShowGuidelinesModal(false)
                    // Reload thread to get updated guidelines
                    const data = await getNegotiationThread(threadId)
                    if (data?.thread) {
                      setThreadGuidelines({
                        buyerGuidelines: data.thread.buyerGuidelines,
                        sellerGuidelines: data.thread.sellerGuidelines
                      })
                    }
                  } catch (error: any) {
                    toast.error(error.response?.data?.error || 'Failed to save guidelines')
                  }
                }}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition font-semibold"
              >
                Save Guidelines
              </button>
              <button
                onClick={() => {
                  setShowGuidelinesModal(false)
                }}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass rounded-xl border border-primary-500/20 flex flex-col h-[600px]">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div>
          <h3 className="text-lg font-bold text-white">Agent Negotiation</h3>
          <p className="text-sm text-gray-400">
            {agentNegotiating 
              ? 'AI agents are negotiating on your behalf...' 
              : isBuyer 
                ? `Buyer Agent negotiating with ${sellerName}'s Seller Agent` 
                : `Seller Agent negotiating with buyer's Buyer Agent`}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        )}
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
            const isAgentMessage = message.senderType === 'AGENT' || message.senderType?.startsWith('AGENT_')
            const isBuyerAgent = message.senderType === 'AGENT_BUYER'
            const isSellerAgent = message.senderType === 'AGENT_SELLER'

            return (
              <div
                key={message.id}
                className={`flex ${alignment === 'right' ? 'justify-end' : alignment === 'center' ? 'justify-center' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 border ${
                    isBuyerAgent
                      ? 'bg-purple-600 border-purple-500'
                      : isSellerAgent
                      ? 'bg-blue-600 border-blue-500'
                      : isAgentMessage
                      ? 'bg-gray-700 border-gray-600'
                      : isOwnMessage
                      ? 'bg-primary-600 border-primary-500'
                      : 'bg-blue-600 border-blue-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.senderType === 'AGENT' || message.senderType?.startsWith('AGENT_') ? (
                      <Bot className="w-4 h-4 text-yellow-300" />
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
                    <p className="text-xs text-gray-300 mt-2 italic">
                      💡 {message.aiHint}
                    </p>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* User Message Input - Always Available for Intervention */}
      {threadId && (userControlMode || !agentNegotiating) && (
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
              placeholder={userControlMode ? "You're in control - type your message..." : "Intervene in negotiation (optional)..."}
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
          {userControlMode && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              👤 User Control Mode: Agents disabled. You're handling the negotiation.
            </p>
          )}
        </div>
      )}

      {/* Agent Negotiation Status / User Actions */}
      <div className="p-4 border-t border-gray-700">
        {agentNegotiating ? (
          <div className="text-center py-4">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-400">Agents are negotiating...</p>
          </div>
        ) : userControlMode ? (
          <div className="text-center py-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-3">
              <p className="text-sm text-blue-400 font-semibold mb-1">👤 User Control Mode Active</p>
              <p className="text-xs text-gray-400">After 5 rounds, you're now in control. Use the input above to continue negotiating.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={async () => {
                  if (!threadId) return
                  
                  try {
                    const terms = await extractNegotiatedTerms(threadId)
                    if (terms.priceChanged || terms.deliveryChanged) {
                      await updateSellerQuote(quoteId, {
                        price: terms.negotiatedPrice,
                        deliveryDays: terms.negotiatedDelivery
                      })
                      toast.success(`Quote updated: $${terms.negotiatedPrice} (${terms.negotiatedDelivery} days)`)
                      if (onQuoteUpdated) onQuoteUpdated(quoteId)
                    }
                    toast.success('Negotiated terms accepted!')
                    if (onClose) {
                      setTimeout(() => onClose(), 1000)
                    }
                  } catch (error: any) {
                    toast.error(error.response?.data?.error || 'Failed to accept terms')
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition font-semibold text-sm"
              >
                ✓ Accept Terms
              </button>
              <button
                onClick={() => {
                  toast('Negotiation rejected.', { icon: 'ℹ️' })
                  if (onClose) {
                    setTimeout(() => onClose(), 1000)
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition font-semibold text-sm"
              >
                ✗ Reject
              </button>
            </div>
          </div>
        ) : negotiationComplete ? (
          <div className="space-y-3">
            <div className={`${currentRound >= stoppingCriteria.maxRounds ? 'bg-orange-500/10 border-orange-500/30' : 'bg-green-500/10 border-green-500/30'} border rounded-lg p-3 mb-3`}>
              <p className={`text-sm font-semibold mb-1 ${currentRound >= stoppingCriteria.maxRounds ? 'text-orange-400' : 'text-green-400'}`}>
                {currentRound >= stoppingCriteria.maxRounds ? '⚠️ Maximum Rounds Reached' : '✅ Negotiation Round Complete'}
              </p>
              <p className="text-xs text-gray-400">
                {currentRound >= stoppingCriteria.maxRounds 
                  ? 'Maximum negotiation rounds reached. Please accept or reject the current terms.'
                  : 'Review the terms negotiated by the agents above'}
              </p>
            </div>
            <div className={`grid gap-2 ${currentRound >= stoppingCriteria.maxRounds ? 'grid-cols-2' : 'grid-cols-3'}`}>
              <button
                onClick={async () => {
                  if (!threadId) return
                  
                  try {
                    // Extract negotiated terms from messages
                    const terms = await extractNegotiatedTerms(threadId)
                    console.log('📋 Extracted terms:', terms)
                    
                    // Update the quote with negotiated terms
                    if (terms.priceChanged || terms.deliveryChanged) {
                      await updateSellerQuote(quoteId, {
                        price: terms.negotiatedPrice,
                        deliveryDays: terms.negotiatedDelivery
                      })
                      toast.success(`Quote updated: $${terms.negotiatedPrice} (${terms.negotiatedDelivery} days)`)
                    }
                    
                    toast.success('Negotiated terms accepted! Quote has been updated.')
                    // TODO: Create transaction or trigger accept quote flow
                    
                    // Close the chat box
                    if (onClose) {
                      setTimeout(() => {
                        onClose()
                      }, 1000) // Wait a bit for toast to show
                    }
                  } catch (error: any) {
                    console.error('Failed to accept terms:', error)
                    toast.error(error.response?.data?.error || 'Failed to accept negotiated terms')
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition font-semibold text-sm"
              >
                ✓ Accept
              </button>
              {currentRound < stoppingCriteria.maxRounds && (
                <button
                  onClick={() => {
                    setNegotiationComplete(false)
                    setAgentNegotiating(true)
                    if (threadId) {
                      startAgentNegotiation(threadId)
                    }
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition font-semibold text-sm"
                >
                  🔄 Continue
                </button>
              )}
              <button
                onClick={() => {
                  toast('Negotiation rejected.', { icon: 'ℹ️' })
                  // TODO: Implement reject logic
                  
                  // Close the chat box
                  if (onClose) {
                    setTimeout(() => {
                      onClose()
                    }, 1000) // Wait a bit for toast to show
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition font-semibold text-sm"
              >
                ✗ Reject
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center py-2">
              {(!threadGuidelines.buyerGuidelines || !threadGuidelines.sellerGuidelines) ? (
                <div className="space-y-2">
                  <p className="text-sm text-yellow-400 mb-2">
                    ⚠️ Waiting for both parties to provide guidelines
                  </p>
                  <button
                    onClick={() => setShowGuidelinesModal(true)}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition flex items-center gap-2 mx-auto"
                  >
                    📝 {isBuyer ? (!threadGuidelines.buyerGuidelines ? 'Provide Buyer Guidelines' : 'Update Guidelines') : (!threadGuidelines.sellerGuidelines ? 'Provide Seller Guidelines' : 'Update Guidelines')}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (threadId) {
                        startAgentNegotiation(threadId)
                      }
                    }}
                    disabled={agentNegotiating || currentRound >= stoppingCriteria.maxRounds || userControlMode}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                  >
                    <Bot className="w-4 h-4" />
                    {agentNegotiating ? 'Agents Negotiating...' : 'Start Agent Negotiation'}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    AI agents will negotiate on your behalf
                  </p>
                </>
              )}
            </div>
            
            {/* Stopping Criteria Settings */}
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <p className="text-xs text-gray-400 mb-2">Negotiation Settings</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-300">Max Rounds:</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={stoppingCriteria.maxRounds}
                    onChange={(e) => setStoppingCriteria({
                      ...stoppingCriteria,
                      maxRounds: parseInt(e.target.value) || 5
                    })}
                    className="w-16 px-2 py-1 bg-dark-800 border border-gray-700 rounded text-white text-xs"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-300">Auto-continue on Yes/No:</label>
                  <input
                    type="checkbox"
                    checked={stoppingCriteria.autoContinueOnYesNo}
                    onChange={(e) => setStoppingCriteria({
                      ...stoppingCriteria,
                      autoContinueOnYesNo: e.target.checked
                    })}
                    className="w-4 h-4"
                  />
                </div>
                {currentRound > 0 && (
                  <p className="text-xs text-gray-400 text-center">
                    Round {currentRound} of {stoppingCriteria.maxRounds}
                    {currentRound >= 5 && <span className="block text-blue-400 mt-1">👤 User control active</span>}
                  </p>
                )}
                <button
                  onClick={() => setShowGuidelinesModal(true)}
                  className="w-full mt-2 px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 rounded text-xs text-purple-300 hover:bg-purple-600/30 transition"
                >
                  📝 Set Agent Guidelines
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

