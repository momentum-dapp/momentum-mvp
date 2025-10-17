"use client"

import { motion } from "framer-motion"

export default function AnimatedGradient() {
    return (
        <div className="flex ">
            <motion.button
                className="group relative flex items-center gap-3 px-6 py-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 cursor-default"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                {/* NEW Badge */}
                <div className="bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">NEW</div>

                {/* Main Text */}
                <span className="text-gray-300 font-medium text-sm group-hover:text-white transition-colors duration-300">
                    Welcome To <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        MomentumFI
                    </span>
                </span>

                {/* Animated Arrow */}
                <motion.div
                    className="text-gray-400 group-hover:text-white transition-colors duration-300"
                    animate={{ x: 0 }}
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    <motion.span
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                        className="text-purple-400"
                    >
                        →
                    </motion.span>
                </motion.div>

                {/* Subtle glow effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600/0 via-purple-600/0 to-purple-600/0 group-hover:from-purple-600/10 group-hover:via-purple-600/5 group-hover:to-purple-600/10 transition-all duration-300 pointer-events-none" />
            </motion.button>
        </div>
    )
}
