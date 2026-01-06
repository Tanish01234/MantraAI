"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ScrollReveal } from "./ScrollReveal"

export function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20">
            {/* Background Elements */}
            {/* Background Elements - Removed to use global AnimatedBackground */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Local background removed to prevent conflict with global AnimatedBackground */}
            </div>

            <div className="container mx-auto px-4 relative z-10 text-center">
                <div className="max-w-5xl mx-auto glass-panel p-8 md:p-12 rounded-[2.5rem] shadow-2xl animate-fade-in relative z-10">
                    <ScrollReveal direction="down" distance={30}>
                        <div className="inline-block mb-8 px-6 py-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 backdrop-blur-md shadow-sm">
                            <span className="text-sm font-semibold bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent tracking-wide">
                                ✨ The Future of Learning is Here
                            </span>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal delay={0.1}>
                        <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-10 leading-tight">
                            Master Your <br />
                            <span className="text-gradient drop-shadow-lg">Future</span>
                        </h1>
                    </ScrollReveal>

                    <ScrollReveal delay={0.2}>
                        <p className="text-xl md:text-2xl text-[var(--text-secondary)] max-w-3xl mx-auto mb-14 leading-relaxed font-medium">
                            Your personal AI mentor for exams, career guidance, and life skills.
                            Explained simply in <span className="text-[var(--text-primary)] font-bold">Hinglish</span>.
                        </p>
                    </ScrollReveal>

                    <ScrollReveal delay={0.3}>
                        <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
                            <Link href="/auth/login">
                                <motion.button
                                    whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(99, 102, 241, 0.5)" }}
                                    whileTap={{ scale: 0.95 }}
                                    className="btn-aurora text-xl px-12 py-5 min-w-[200px] font-extrabold tracking-wide shadow-xl"
                                >
                                    <span>Get Started</span>
                                </motion.button>
                            </Link>
                            <Link href="/auth/signup">
                                <motion.button
                                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-12 py-5 min-w-[200px] rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)]/30 backdrop-blur-md text-[var(--text-primary)] font-extrabold text-xl transition-all shadow-lg hover:shadow-xl hover:border-[var(--accent-primary)]"
                                >
                                    Join Free
                                </motion.button>
                            </Link>
                        </div>
                    </ScrollReveal>
                </div>

                {/* Floating UI Elements */}
                <motion.div
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-20 right-[10%] hidden lg:block"
                >
                    <div className="glass-panel p-4 rounded-2xl shadow-lg max-w-[200px]">
                        <div className="text-sm font-medium mb-1">Physics Exam</div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full w-[85%] bg-[var(--accent-primary)]" />
                        </div>
                        <div className="text-xs text-right mt-1 text-[var(--text-muted)]">85% Ready</div>
                    </div>
                </motion.div>

                <motion.div
                    animate={{ y: [0, 20, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-40 left-[10%] hidden lg:block"
                >
                    <div className="glass-panel p-4 rounded-2xl shadow-lg flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--accent-secondary)] flex items-center justify-center text-white text-xl">
                            🎓
                        </div>
                        <div>
                            <div className="text-sm font-bold">Career Path</div>
                            <div className="text-xs text-[var(--text-muted)]">Software Engineer</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
