"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import Link from "next/link"


const stats = [
    {
        number: "99",
        suffix: "%",
        label: "Strategy Accuracy",
        description: "AI-driven rebalancing signals with high precision",
        icon: "✅",
    },
    {
        number: "1000",
        suffix: "+",
        label: "Successful Rebalances",
        description: "Portfolios optimized across multiple market cycles",
        icon: "🔄",
    },
    {
        number: "15.7",
        suffix: "%",
        label: "Average Yield Boost",
        description: "Higher returns with momentum-based strategies",
        icon: "📈",
    },
    {
        number: "3",
        suffix: "+",
        label: "Assets Supported",
        description: "ckBTC, ckETH, and ckUSDT cross-chain swaps",
        icon: "🌐",
    },
]

function AnimatedCounter({ target, suffix, duration = 2000 }: { target: number; suffix: string; duration?: number }) {
    const [count, setCount] = useState(0)
    const [hasAnimated, setHasAnimated] = useState(false)
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true })

    useEffect(() => {
        if (isInView && !hasAnimated) {
            setHasAnimated(true)
            let startTime: number
            const animate = (currentTime: number) => {
                if (!startTime) startTime = currentTime
                const progress = Math.min((currentTime - startTime) / duration, 1)

                const easeOutQuart = 1 - Math.pow(1 - progress, 4)
                setCount(Math.floor(easeOutQuart * target))

                if (progress < 1) {
                    requestAnimationFrame(animate)
                }
            }
            requestAnimationFrame(animate)
        }
    }, [isInView, target, duration, hasAnimated])

    return (
        <span ref={ref}>
            {count}
            {suffix}
        </span>
    )
}

export default function Stats2() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    return (
        <section ref={ref} className="py-24 px-6 relative">
            {/* Background Effects */}
            {/* <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl transform -translate-x-1/2" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl" />
            </div> */}

            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-purple-400 font-semibold text-lg mb-4 block"
                    >
                        Proven Worldwide
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="text-4xl lg:text-6xl font-bold mb-6"
                    >
                        Performance That{" "}
                        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Speak</span>
                    </motion.h2>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.9 }}
                            transition={{ duration: 0.6, delay: 0.1 * index }}
                            whileHover={{ y: -10, scale: 1.05 }}
                            className="group relative"
                        >
                            <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-800 hover:border-purple-600/50 transition-all duration-300 text-center relative overflow-hidden">
                                {/* Background Glow */}
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                {/* Icon */}
                                <motion.div whileHover={{ scale: 1.2, rotate: 10 }} className="text-4xl mb-4 relative z-10">
                                    {stat.icon}
                                </motion.div>

                                {/* Number */}
                                <motion.div className="text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent relative z-10">
                                    <AnimatedCounter target={Number(stat.number)} suffix={stat.suffix} />
                                </motion.div>

                                {/* Label */}
                                <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-purple-400 transition-colors relative z-10">
                                    {stat.label}
                                </h3>

                                {/* Description */}
                                <p className="text-gray-400 text-sm relative z-10">{stat.description}</p>

                                {/* Animated Border */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="text-center mt-16"
                >
                    <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                        Join thousands of users who are already earning rewards with MomentumFI. Start your journey today!
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(147, 51, 234, 0.3)" }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-4 rounded-full text-white font-semibold text-lg transition-all duration-300"
                    >
                        <Link href="https://base.org/" target="_blank">
                            Join the Network
                        </Link>
                    </motion.button>
                </motion.div>
            </div>
        </section>
    )
}
