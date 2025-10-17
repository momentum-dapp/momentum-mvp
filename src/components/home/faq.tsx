"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState } from "react"

const faqs = [
    {
        question: "What is MomentumFi?",
        answer:
            "MomentumFi is an AI-powered DeFi protocol that automatically rebalances your crypto portfolio across ckBTC, ckETH, and ckUSDT based on real-time market momentum detection.",
    },
    {
        question: "How does the AI agent work?",
        answer:
            "The AI agent fetches market data hourly, analyzes trends (MA, RSI, volume breakout), evaluates risk, plans rebalancing strategies, and executes swaps via DEX if auto-mode is enabled.",
    },
    {
        question: "Is my data secure and private?",
        answer:
            "Yes. All agent actions are recorded on-chain within ICP Canisters, with open-source logic for full transparency and granular user control.",
    },
    {
        question: "What assets are supported?",
        answer:
            "Currently, MomentumFi supports rebalancing between ckBTC, ckETH, and ckUSDT, with future plans to expand to more assets.",
    },
    {
        question: "Can I choose how my portfolio is rebalanced?",
        answer:
            "Yes. You can select Manual, Semi-Auto, or Auto mode for rebalancing to suit your investment preferences and risk profile.",
    },
    {
        question: "What technology does MomentumFi use?",
        answer:
            "MomentumFi integrates Eliza OS, OpenAI GPT-4, ICP Canisters (Motoko/Rust), Plug Wallet, and Chain Fusion for seamless cross-chain swaps and smart contract executions.",
    },
]

export default function FAQ() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <section ref={ref} className="py-24 px-6 relative">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-pink-600/5 rounded-full blur-3xl" />
            </div>

            <div className="max-w-4xl mx-auto">
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
                        Got Questions?
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="text-4xl lg:text-6xl font-bold mb-6"
                    >
                        Frequently Asked{" "}
                        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Questions
                        </span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="text-xl text-gray-300"
                    >
                        Everything you need to know about MomentumFI and how it works.
                    </motion.p>
                </motion.div>

                {/* FAQ Items */}
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                            transition={{ duration: 0.6, delay: 0.1 * index }}
                            className="group"
                        >
                            <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800 hover:border-purple-600/50 transition-all duration-300 overflow-hidden">
                                <motion.button
                                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                    className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-800/30 transition-colors"
                                    whileHover={{ x: 5 }}
                                >
                                    <h3 className="text-xl font-semibold text-white group-hover:text-purple-400 transition-colors">
                                        {faq.question}
                                    </h3>
                                    <motion.div
                                        animate={{ rotate: openIndex === index ? 45 : 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center text-purple-400 flex-shrink-0 ml-4"
                                    >
                                        +
                                    </motion.div>
                                </motion.button>

                                <AnimatePresence>
                                    {openIndex === index && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-8 pb-6">
                                                <motion.p
                                                    initial={{ y: -10, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    exit={{ y: -10, opacity: 0 }}
                                                    transition={{ duration: 0.3, delay: 0.1 }}
                                                    className="text-gray-300 leading-relaxed"
                                                >
                                                    {faq.answer}
                                                </motion.p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom CTA */}
                {/* <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="text-center mt-16"
                >
                    <p className="text-gray-300 text-lg mb-6">Still have questions? We're here to help!</p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-purple-600/50 px-8 py-3 rounded-full text-white font-medium transition-all duration-300"
                    >
                        Contact Support
                    </motion.button>
                </motion.div> */}
            </div>
        </section>
    )
}
