"use client"

import { useState, useEffect } from "react"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function LandingNavbar() {
    const { scrollY } = useScroll()
    const [hidden, setHidden] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() || 0
        if (latest > previous && latest > 150) {
            setHidden(true)
        } else {
            setHidden(false)
        }
        setScrolled(latest > 50)
    })

    return (
        <motion.nav
            variants={{
                visible: { y: 0 },
                hidden: { y: "-100%" },
            }}
            animate={hidden ? "hidden" : "visible"}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                scrolled
                    ? "bg-[rgba(255,255,255,0.8)] dark:bg-[rgba(15,8,33,0.8)] backdrop-blur-md border-b border-[var(--border-subtle)] py-4"
                    : "bg-transparent py-6"
            )}
        >
            <div className="container mx-auto px-4 flex items-center justify-between">
                <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
                    MentraAI
                </Link>

                <div className="hidden md:flex items-center gap-8">
                    <Link href="#features" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                        Features
                    </Link>
                    <Link href="#how-it-works" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                        How it Works
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/auth/login" className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors hidden sm:block">
                        Login
                    </Link>
                    <Link href="/auth/signup">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn-aurora px-6 py-2.5 text-sm"
                        >
                            <span>Get Started</span>
                        </motion.button>
                    </Link>
                </div>
            </div>
        </motion.nav>
    )
}
