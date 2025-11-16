/**
 * Light Background Component
 * Lightweight gradient background with subtle CSS animations
 */

'use client'

export function LightBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0f1419] to-[#0a0a0a]" />
      
      {/* Subtle green accent gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 via-transparent to-transparent" />
      
      {/* Animated radial glow in center - subtle pulse */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] max-w-[1200px] max-h-[1200px] bg-gradient-radial from-green-500/10 via-green-500/5 to-transparent rounded-full blur-3xl pulse-glow-slow" />
      
      {/* Secondary subtle glow - slower animation */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vh] max-w-[900px] max-h-[900px] bg-gradient-radial from-emerald-400/8 via-transparent to-transparent rounded-full blur-2xl pulse-glow-slower" />
    </div>
  )
}

