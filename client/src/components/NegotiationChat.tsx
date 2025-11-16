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
  getNegotiationMessages 
} from '@/lib/api'
import { MessageCircle, Send, Bot, User } from 'lucide-react'
import toast from 'react-hot-toast'

interface ChatMessage {
  id: string
  senderId: string | null
  senderType: 'BUYER' | 'SELLER' | 'AGENT'
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
        await loadMessages(thread.id)
      }
    } catch (error: any) {
      console.error('Failed to initialize thread:', error)
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
    } catch (error: any) {
      console.error('Failed to load messages:', error)
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

    const interval = setInterval(() => {
      loadMessages(threadId)
    }, 3000)

    return () => clearInterval(interval)
  }, [threadId])

  const getMessageAlignment = (senderType: string) => {
    if (senderType === 'AGENT') return 'center'
    if (senderType === 'BUYER' && isBuyer) return 'right'
    if (senderType === 'SELLER' && isSeller) return 'right'
    return 'left'
  }

  const getMessageColor = (senderType: string) => {
    if (senderType === 'AGENT') return 'bg-gray-700 border-gray-600'
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
    <div className="glass rounded-xl border border-primary-500/20 flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Negotiation Chat</h3>
          <p className="text-sm text-gray-400">
            {isBuyer ? `Negotiating with ${sellerName}` : `Negotiating with buyer`}
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

            return (
              <div
                key={message.id}
                className={`flex ${alignment === 'right' ? 'justify-end' : alignment === 'center' ? 'justify-center' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 border ${
                    message.senderType === 'AGENT'
                      ? 'bg-gray-700 border-gray-600'
                      : isOwnMessage
                      ? 'bg-primary-600 border-primary-500'
                      : 'bg-blue-600 border-blue-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.senderType === 'AGENT' ? (
                      <Bot className="w-4 h-4 text-gray-300" />
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
        <p className="text-xs text-gray-500 mt-2">
          AI assistant will provide negotiation hints
        </p>
      </div>
    </div>
  )
}

