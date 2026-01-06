"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface FeatureCardProps {
    icon: string
    title: string
    description: string
    delay?: number
}

export function FeatureCard({ icon, title, description, delay = 0 }: FeatureCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ y: -10 }}
            className="genz-card p-8 h-full flex flex-col items-start group hover:border-[var(--accent-primary)]"
        >
            <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm group-hover:shadow-md">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3 group-hover:text-[var(--accent-primary)] transition-colors">
                {title}
            </h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">
                {description}
            </p>
        </motion.div>
    )
}
