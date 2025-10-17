"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Cpu } from "lucide-react"

const features = [
    {
        icon: <Cpu className="h-10 w-10 text-green-500" />,
        title: "Automated Rebalancing",
        description:
            "Optimize your portfolio automatically based on real-time market momentum detection and AI-driven strategies.",
        gradient: "from-purple-600 to-pink-600",
    },
    {
        icon: "🔒",
        title: "Secure & Transparent",
        description:
            "All actions are recorded on-chain with open-source agent logic, ensuring full transparency and user control.",
        gradient: "from-blue-600 to-cyan-600",
    },
    {
        icon: "⚡",
        title: "Real-time Market Analysis",
        description: "Monitor market trends in real-time with advanced indicators like MA, RSI, and volume breakouts for informed decisions.",
        gradient: "from-green-600 to-emerald-600",
    },
    {
        icon: "🌐",
        title: "Cross-Chain Swap Integration",
        description: "Seamlessly rebalance assets across ckBTC, ckETH, and ckUSDT using ICP’s Chain Fusion for smooth DEX swaps.",
        gradient: "from-orange-600 to-red-600",
    },
    {
        icon: "🧠",
        title: "AI-Powered Decision Making",
        description: "Leverage AI modules for trend analysis, risk evaluation, and strategic planning to maximize portfolio performance.",
        gradient: "from-indigo-600 to-purple-600",
    },
    {
        icon: "📊",
        title: "Flexible User Modes",
        description: "Choose Manual, Semi-Auto, or Auto mode for rebalancing, giving you the flexibility to control your investments.",
        gradient: "from-yellow-600 to-orange-600",
    },
]

export default function Features2() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    return (
        <section ref={ref} className="py-24 px-6 relative">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
            </div>

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
                        Core Features
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="text-4xl lg:text-6xl font-bold mb-6"
                    >
                        Why Choose{" "}
                        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            MomentumFI
                        </span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="text-xl text-gray-300 max-w-3xl mx-auto"
                    >
                        Discover the advanced features that make MomentumFI the leading platform for profiting through
                        resource sharing.
                    </motion.p>
                </motion.div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                            transition={{ duration: 0.6, delay: 0.1 * index }}
                            whileHover={{ y: -10, scale: 1.02 }}
                            className="group relative"
                        >
                            <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-800 hover:border-purple-600/50 transition-all duration-300 h-full">
                                {/* Icon */}
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-2xl mb-6 group-hover:shadow-lg transition-all duration-300`}
                                >
                                    {feature.icon}
                                </motion.div>

                                {/* Content */}
                                <h3 className="text-2xl font-bold mb-4 group-hover:text-purple-400 transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-300 leading-relaxed">{feature.description}</p>

                                {/* Hover Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
