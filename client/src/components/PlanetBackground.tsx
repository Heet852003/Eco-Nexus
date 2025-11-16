'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function PlanetBackground() {
  const [windowWidth, setWindowWidth] = useState(1920)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth)
      const handleResize = () => setWindowWidth(window.innerWidth)
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className="absolute inset-0 flex items-start justify-center pointer-events-none">
      <motion.div
        initial={{ scale: 0, opacity: 0, rotate: 0 }}
        animate={{ scale: 1, opacity: 1, rotate: 360 }}
        transition={{ 
          scale: { duration: 1.5, ease: "easeOut" },
          opacity: { duration: 1.5 },
          rotate: { duration: 120, repeat: Infinity, ease: "linear" }
        }}
        className="relative w-[180vw] h-[180vw] max-w-[2500px] max-h-[2500px]"
        style={{ transform: 'translateY(-50%)' }}
      >
        {/* Outer atmospheric glow - multiple layers */}
        <motion.div
          animate={{
            scale: [1, 1.02, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-full bg-gradient-radial from-green-400/40 via-green-500/20 to-transparent blur-[100px]"
        />
        
        <motion.div
          animate={{
            scale: [1, 1.03, 1],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          className="absolute inset-0 rounded-full bg-gradient-radial from-emerald-300/30 via-green-400/15 to-transparent blur-[80px]"
        />

        {/* Planet base with gradient */}
        <div className="absolute inset-0 m-auto w-full h-full rounded-full bg-gradient-to-br from-gray-900 via-green-950 to-black border-4 border-green-500/30 shadow-2xl overflow-hidden">
          
          {/* Continent/land masses - Layer 1 */}
          <motion.div
            animate={{ x: [0, -200, 0] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <div className="absolute top-[10%] left-[5%] w-[35%] h-[25%] bg-green-600/40 rounded-[60%_40%_70%_30%] blur-md border border-green-500/20" />
            <div className="absolute top-[12%] left-[8%] w-[28%] h-[20%] bg-green-500/30 rounded-[55%_45%_65%_35%] blur-[6px]" />
            <div className="absolute top-[40%] left-[60%] w-[30%] h-[35%] bg-emerald-600/40 rounded-[50%_50%_60%_40%] blur-md border border-green-500/20" />
            <div className="absolute top-[43%] left-[63%] w-[24%] h-[28%] bg-emerald-500/30 rounded-[48%_52%_58%_42%] blur-[6px]" />
            <div className="absolute bottom-[15%] left-[20%] w-[20%] h-[15%] bg-green-700/50 rounded-[70%_30%_60%_40%] blur-md" />
            <div className="absolute bottom-[18%] left-[45%] w-[15%] h-[12%] bg-green-600/45 rounded-[65%_35%_70%_30%] blur-md" />
            <div className="absolute top-[55%] left-[15%] w-[12%] h-[10%] bg-green-500/35 rounded-full blur-[8px]" />
            <div className="absolute top-[25%] left-[85%] w-[10%] h-[8%] bg-emerald-600/40 rounded-full blur-[8px]" />
            <div className="absolute top-[5%] left-[45%] w-[28%] h-[20%] bg-green-700/45 rounded-[65%_35%_55%_45%] blur-md border border-green-500/25" />
            <div className="absolute top-[30%] left-[10%] w-[25%] h-[22%] bg-emerald-700/40 rounded-[50%_50%_60%_40%] blur-md" />
          </motion.div>

          {/* Continent/land masses - Layer 2 */}
          <motion.div
            animate={{ x: [0, -160, 0] }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <div className="absolute top-[20%] right-[10%] w-[32%] h-[30%] bg-green-500/35 rounded-[45%_55%_50%_50%] blur-md border border-green-400/15" />
            <div className="absolute top-[23%] right-[13%] w-[26%] h-[24%] bg-green-600/25 rounded-[43%_57%_48%_52%] blur-[6px]" />
            <div className="absolute bottom-[25%] left-[35%] w-[40%] h-[28%] bg-emerald-700/45 rounded-[60%_40%_55%_45%] blur-md" />
            <div className="absolute bottom-[28%] left-[38%] w-[34%] h-[22%] bg-emerald-600/35 rounded-[58%_42%_53%_47%] blur-[6px]" />
            <div className="absolute top-[8%] right-[35%] w-[22%] h-[18%] bg-green-600/38 rounded-[55%_45%_60%_40%] blur-md" />
            <div className="absolute bottom-[35%] right-[15%] w-[28%] h-[25%] bg-emerald-600/42 rounded-[50%_50%_55%_45%] blur-md border border-green-500/20" />
          </motion.div>

          {/* Atmospheric effects overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-green-900/20" />
          
          {/* Cloud layer */}
          <motion.div
            animate={{ x: [0, 200, 0] }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 opacity-30"
          >
            <div className="absolute top-[30%] left-[10%] w-[25%] h-[8%] bg-white/10 rounded-full blur-xl" />
            <div className="absolute top-[50%] left-[60%] w-[30%] h-[10%] bg-white/8 rounded-full blur-xl" />
            <div className="absolute bottom-[35%] left-[25%] w-[20%] h-[6%] bg-white/12 rounded-full blur-xl" />
            <div className="absolute top-[15%] right-[20%] w-[22%] h-[7%] bg-white/9 rounded-full blur-xl" />
            <div className="absolute top-[45%] right-[10%] w-[18%] h-[5%] bg-white/11 rounded-full blur-xl" />
          </motion.div>

          {/* Polar ice caps */}
          <div className="absolute top-0 inset-x-0 h-[15%] bg-gradient-to-b from-cyan-200/20 to-transparent rounded-t-full blur-[6px]" />
          <div className="absolute bottom-0 inset-x-0 h-[15%] bg-gradient-to-t from-cyan-200/20 to-transparent rounded-b-full blur-[6px]" />

          {/* Lighting effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/50 rounded-full" />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/30 rounded-full" />
          <div className="absolute inset-0 rounded-full shadow-[inset_0_0_120px_rgba(34,197,94,0.4)]" />
        </div>

        {/* Orbital rings */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 m-auto w-[102%] h-[102%]"
        >
          <div className="absolute inset-0 rounded-full border-2 border-green-500/20 border-dashed" />
        </motion.div>

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 m-auto w-[108%] h-[108%]"
        >
          <div className="absolute inset-0 rounded-full border border-green-400/10 border-dotted" />
        </motion.div>

        {/* Floating particles */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.cos((i / 30) * Math.PI * 2) * (windowWidth * 0.4),
              y: Math.sin((i / 30) * Math.PI * 2) * (windowWidth * 0.4),
              opacity: 0
            }}
            animate={{
              x: Math.cos((i / 30) * Math.PI * 2) * (windowWidth * 0.45),
              y: Math.sin((i / 30) * Math.PI * 2) * (windowWidth * 0.45),
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
            className="absolute top-1/2 left-1/2 w-2 h-2 bg-green-400 rounded-full blur-[1px]"
          />
        ))}
      </motion.div>
    </div>
  )
}

