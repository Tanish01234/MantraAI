'use client'

import { motion } from 'framer-motion'

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-[var(--bg-base)]">
      {/* Deep Space Gradient Base */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(99,102,241,0.03)] to-[rgba(236,72,153,0.03)]" />

      {/* Moving Aurora Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-[var(--accent-primary)] rounded-full blur-[120px] opacity-30 mix-blend-screen"
      />

      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-[-20%] right-[-10%] w-[80vw] h-[80vw] bg-[var(--accent-secondary)] rounded-full blur-[120px] opacity-20 mix-blend-screen"
      />

      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
        className="absolute top-[20%] left-[30%] w-[60vw] h-[60vw] bg-[var(--accent-tertiary)] rounded-full blur-[150px] opacity-20 mix-blend-screen"
      />

      {/* Noise Overlay for Texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  )
}

