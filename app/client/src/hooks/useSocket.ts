/**
 * Socket.io Hook for Real-time Chat
 */

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function useSocket(transactionId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const newSocket = io(SOCKET_URL)
    
    newSocket.on('connect', () => {
      setConnected(true)
      if (transactionId) {
        newSocket.emit('join-transaction', transactionId)
      }
    })

    newSocket.on('disconnect', () => {
      setConnected(false)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [transactionId])

  const sendMessage = (message: string) => {
    if (socket && transactionId) {
      socket.emit('send-message', {
        transactionId,
        message,
        timestamp: new Date().toISOString()
      })
    }
  }

  return {
    socket,
    connected,
    sendMessage
  }
}

