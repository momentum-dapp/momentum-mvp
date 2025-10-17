"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"

const steps = [
    {
        number: "01",
        title: "Connect Your Wallet",
        description: "Link your Plug Wallet or Internet Identity to the MomentumFi dashboard to get started securely.",
        icon: "📥",
    },
    {
        number: "02",
        title: "Monitor Market Trends",
        description:
            "MomentumFi’s AI agent fetches real-time market data and analyzes trends using indicators like MA, RSI, and volume breakout.",
        icon: "🔗",
    },
    {
        number: "03",
        title: "Receive Rebalancing Signals",
        description:
            "Get strategic rebalancing recommendations tailored to your portfolio risk profile directly on your dashboard.",
        icon: "💰",
    },
    {
        number: "04",
        title: "Execute or Automate Rebalancing",
        description:
            "Choose Manual, Semi-Auto, or Auto mode to rebalance your portfolio seamlessly across ckBTC, ckETH, and ckUSDT.",
        icon: "🏦",
    },
]

export default function HowItWorks() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    return (
        <section ref={ref} className="py-24 px-6 relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(147, 51, 234, 0.3) 1px, transparent 0)`,
                        backgroundSize: "50px 50px",
                    }}
                />
            </div>

            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-20"
                >
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-purple-400 font-semibold text-lg mb-4 block"
                    >
                        Simple Process
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="text-4xl lg:text-6xl font-bold mb-6"
                    >
                        How It{" "}
                        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Works</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="text-xl text-gray-300 max-w-3xl mx-auto"
                    >
                        Get started with MomentumFI in just four simple steps and begin earning rewards immediately.
                    </motion.p>
                </motion.div>

                {/* Steps */}
                <div className="relative">
                    {/* Connection Line */}
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600/20 via-purple-600/50 to-purple-600/20 transform -translate-y-1/2" />
                    <div className="grid lg:grid-cols-4 gap-8 lg:gap-4">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 50 }}
                                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                                transition={{ duration: 0.8, delay: 0.2 * index }}
                                className="relative group h-full"
                            >
                                {/* Step Card */}
                                <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-800 hover:border-purple-600/50 transition-all duration-300 text-center relative z-10 h-full min-h-[400px] flex flex-col justify-between">
                                    <div className="flex flex-col items-center">
                                        {/* Step Number */}
                                        <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-2xl font-bold mb-6 relative"
                                        >
                                            {step.number}
                                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                                        </motion.div>

                                        {/* Icon */}
                                        <motion.div whileHover={{ scale: 1.2, rotate: 10 }} className="text-4xl mb-6">
                                            {step.icon}
                                        </motion.div>

                                        {/* Title */}
                                        <h3 className="text-2xl font-bold mb-4 group-hover:text-purple-400 transition-colors">
                                            {step.title}
                                        </h3>
                                    </div>

                                    {/* Description */}
                                    <div className="flex-1 flex items-center">
                                        <p className="text-gray-300 leading-relaxed text-center">{step.description}</p>
                                    </div>
                                </div>

                                {/* Arrow (Desktop only) */}
                                {index < steps.length - 1 && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                                        transition={{ duration: 0.6, delay: 0.3 * index }}
                                        className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-20"
                                    >
                                        <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center">
                                            <span className="text-purple-400">→</span>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
