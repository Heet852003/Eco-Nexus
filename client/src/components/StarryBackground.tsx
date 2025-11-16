/**
 * Starry Background Component
 * Creates an animated starry night sky effect
 */

'use client'

import { useEffect, useRef } from 'react'

export default function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Create stars
    const stars: Array<{ x: number; y: number; radius: number; opacity: number; speed: number }> = []
    const numStars = 200

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5,
        opacity: Math.random(),
        speed: Math.random() * 0.5
      })
    }

    // Animation loop
    const animate = () => {
      ctx.fillStyle = '#0a0a0f'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      stars.forEach((star) => {
        star.opacity += star.speed * 0.01
        if (star.opacity > 1) star.opacity = 0

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.fill()
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ background: '#0a0a0f' }}
    />
  )
}

