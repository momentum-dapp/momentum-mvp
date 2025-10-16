"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useRef } from "react"

export default function DashboardPreview() {
    const [earnings, setEarnings] = useState(1250)
    const [todayEarnings, setTodayEarnings] = useState(500)

    useEffect(() => {
        const interval = setInterval(() => {
            setEarnings((prev) => prev + Math.floor(Math.random() * 5))
            setTodayEarnings((prev) => prev + Math.floor(Math.random() * 2))
        }, 3000)

        return () => clearInterval(interval)
    }, [])

    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return

            const { clientX, clientY } = e
            const { innerWidth, innerHeight } = window

            const x = (clientX / innerWidth - 0.5) * 20
            const y = (clientY / innerHeight - 0.5) * 20

            containerRef.current.style.transform = `translate(${x}px, ${y}px)`
        }

        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [])

    return (
        <motion.div className="relative max-w-2xl mx-auto" whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }}>
            {/* Dashboard Container */}
            <div ref={containerRef} className="mt-20 bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 p-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2 ">
                        <div className="text-lg font-bold flex items-center">
                            <img src="/logo.png" alt="" className="w-10" />
                            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                MomentumFI
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-sm text-purple-400">Invite Friends & Earn Rewards</div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-400">GM, John Doe!</span>
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-bold">JD</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Menu */}
                <div className="mb-6">
                    <div className="text-xs text-gray-500 mb-2">MENU</div>
                    <div className="space-y-1">
                        <div className="bg-purple-600/20 text-purple-400 px-3 py-2 rounded-lg text-sm">📊 Dashboard</div>
                        <div className="text-gray-400 px-3 py-2 text-sm hover:text-white cursor-pointer">🔗 Referral Program</div>
                        <div className="text-gray-400 px-3 py-2 text-sm hover:text-white cursor-pointer">🎁 Rewards</div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* Total Earnings */}
                    <motion.div
                        className="bg-gray-800/50 rounded-xl p-4"
                        animate={{ scale: earnings > 1250 ? [1, 1.02, 1] : 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Total Earnings</span>
                            <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                                <span className="text-purple-400 text-sm">💰</span>
                            </div>
                        </div>
                        <div className="text-purple-400 text-sm">Points</div>
                        <div className="text-xs text-gray-500 mt-1">Boost your points by staying active!</div>
                    </motion.div>

                    {/* Today's Earning */}
                    <motion.div
                        className="bg-gray-800/50 rounded-xl p-4"
                        animate={{ scale: todayEarnings > 500 ? [1, 1.02, 1] : 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Today's Earning</span>
                            <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
                                <span className="text-green-400 text-sm">📈</span>
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-white">{todayEarnings}</div>
                        <div className="text-green-400 text-sm">Points</div>
                        <div className="text-xs text-gray-500 mt-1">Session Duration: 3 hrs 45 mins</div>
                    </motion.div>

                    {/* Device Status */}
                    <div className="bg-gray-800/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Device Status</span>
                            <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                                <span className="text-blue-400 text-sm">💻</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 mb-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-white font-semibold">Connected</span>
                        </div>
                        <div className="text-xs text-gray-500">Last checked: 5 mins ago</div>
                    </div>
                </div>

                {/* Earnings Overview */}
                <div className="mb-6">
                    <div className="text-gray-400 text-sm mb-3">Earnings Overview</div>
                    <div className="text-4xl font-bold text-white mb-2">5,432</div>
                    <div className="text-sm text-gray-400 mb-4">Total Points Earned This Month</div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                        <motion.div
                            className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: "68%" }}
                            transition={{ duration: 2, delay: 1 }}
                        />
                    </div>
                    <div className="text-xs text-gray-500">68% of monthly goal</div>
                </div>

                {/* Track Progress Section */}
                <motion.div
                    className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-xl p-4 border border-purple-600/20"
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center space-x-2 mb-1">
                                <span className="text-purple-400 text-sm">📊</span>
                                <span className="text-white font-semibold">Track Your Progress</span>
                            </div>
                            <div className="text-2xl font-bold text-white mb-1">Refer & Earn</div>
                            <div className="text-gray-400 text-sm">Invite friends and earn bonus rewards</div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white text-sm font-medium"
                        >
                            Start Referring
                        </motion.button>
                    </div>
                </motion.div>
            </div>

            {/* Floating Elements */}
            <motion.div
                className="absolute -top-4 -right-4 w-8 h-8 bg-purple-600/20 rounded-full blur-sm"
                animate={{
                    y: [0, -10, 0],
                    opacity: [0.5, 1, 0.5],
                }}
                transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                }}
            />

            <motion.div
                className="absolute -bottom-4 -left-4 w-6 h-6 bg-pink-600/20 rounded-full blur-sm"
                animate={{
                    y: [0, 10, 0],
                    opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                    duration: 4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                    delay: 1,
                }}
            />
        </motion.div>
    )
}
