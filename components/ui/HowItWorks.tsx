"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

const steps = [
    {
        id: 1,
        title: "Upload Your Material",
        description: "Simply upload your class notes, PDFs, or even photos of your textbook. We support Hinglish too!",
        icon: "📂",
        color: "var(--accent-primary)",
    },
    {
        id: 2,
        title: "AI Analysis",
        description: "Our AI breaks down complex topics into simple, bite-sized explanations that are easy to digest.",
        icon: "🧠",
        color: "var(--accent-secondary)",
    },
    {
        id: 3,
        title: "Interactive Learning",
        description: "Chat with your AI mentor, ask doubts in Hinglish, and get instant clarity on any concept.",
        icon: "💬",
        color: "var(--accent-tertiary)",
    },
    {
        id: 4,
        title: "Ace Your Exams",
        description: "Generate quizzes, flashcards, and mock tests to ensure you're 100% ready for the big day.",
        icon: "🏆",
        color: "var(--accent-warm)",
    },
]

export function HowItWorks() {
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    })

    return (
        <section ref={containerRef} id="how-it-works" className="relative bg-[var(--bg-base)]">
            <div className="container mx-auto px-4 pt-20 pb-10">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        How <span className="text-gradient">MentraAI</span> Works
                    </h2>
                    <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
                        From confusion to clarity in 4 simple steps.
                    </p>
                </div>

                <div className="relative">
                    {steps.map((step, index) => {
                        return (
                            <Card
                                key={step.id}
                                step={step}
                                index={index}
                                total={steps.length}
                                progress={scrollYProgress}
                            />
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

function Card({ step, index, total, progress }: any) {
    const targetScale = 1 - (total - index) * 0.05
    const range = [index * 0.25, 1]

    const scale = useTransform(progress, range, [1, targetScale])

    return (
        <div className="h-screen sticky top-0 flex items-center justify-center">
            <motion.div
                style={{
                    scale,
                    top: `calc(10vh + ${index * 25}px)`
                }}
                className="relative w-full max-w-4xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[32px] p-8 md:p-16 shadow-2xl origin-top"
            >
                <div className="flex flex-col md:flex-row gap-10 items-center">
                    <div className="flex-1">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 text-white shadow-lg"
                            style={{ backgroundColor: step.color }}
                        >
                            {step.icon}
                        </div>
                        <h3 className="text-3xl font-bold mb-4">
                            {step.id}. {step.title}
                        </h3>
                        <p className="text-xl text-[var(--text-secondary)] leading-relaxed">
                            {step.description}
                        </p>
                    </div>
                    <div className="flex-1 w-full aspect-video rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-surface)] opacity-50" />
                        <span className="text-6xl opacity-20 group-hover:scale-110 transition-transform duration-500">
                            {step.icon}
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
