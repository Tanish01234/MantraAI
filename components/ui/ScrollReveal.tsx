"use client"

import { motion, useInView, UseInViewOptions } from "framer-motion"
import { useRef, ReactNode } from "react"

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  threshold?: number
  once?: boolean
  direction?: "up" | "down" | "left" | "right" | "none"
  distance?: number
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  duration = 0.5,
  threshold = 0.1,
  once = true,
  direction = "up",
  distance = 30,
}: ScrollRevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { amount: threshold, once })

  const getInitial = () => {
    switch (direction) {
      case "up": return { opacity: 0, y: distance }
      case "down": return { opacity: 0, y: -distance }
      case "left": return { opacity: 0, x: distance }
      case "right": return { opacity: 0, x: -distance }
      case "none": return { opacity: 0 }
      default: return { opacity: 0, y: distance }
    }
  }

  const getAnimate = () => {
    switch (direction) {
      case "up":
      case "down": return { opacity: 1, y: 0 }
      case "left":
      case "right": return { opacity: 1, x: 0 }
      case "none": return { opacity: 1 }
      default: return { opacity: 1, y: 0 }
    }
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={getInitial()}
      animate={isInView ? getAnimate() : getInitial()}
      transition={{
        duration,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98], // Smooth custom easing
      }}
    >
      {children}
    </motion.div>
  )
}
