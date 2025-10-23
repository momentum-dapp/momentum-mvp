"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Sun, Moon, Book, Github, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { useAccount, useDisconnect } from 'wagmi'
import { useWalletAuth } from '@/contexts/WalletAuthContext'

const menuItems: { name: string; href: string }[] = [];

export default function Navigation() {
    const { theme, setTheme } = useTheme()
    const pathname = usePathname()
    const router = useRouter()
    const { address, isConnected } = useAccount()
    const { disconnect } = useDisconnect()
    const { isAuthenticated } = useWalletAuth()
    const buttonBaseStyles = "rounded-full hover:rounded-full";

    const handleSignOut = async () => {
        try {
            // Delete session
            await fetch('/api/auth/session', {
                method: 'DELETE',
            });
            
            // Disconnect wallet
            disconnect();
            
            // Redirect to home
            router.push('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    return (
        <header>
            <nav className="fixed z-20 w-full bg-gradient-to-b from-gray-900 to-gray-800 shadow-sm border-b border-gray-700/50 backdrop-blur-lg">
                <div className="mx-auto max-w-7xl px-6 lg:px-12">
                    <motion.div
                        key={1}
                        className="relative flex flex-wrap items-center justify-between gap-6 py-2 duration-200 lg:gap-0"
                    >
                        <div className="flex w-full items-center justify-between gap-12 lg:w-auto">
                            <Link href="/dashboard" aria-label="home" className="flex items-center space-x-2">
                                <div className="text-2xl font-bold text-white flex items-center">
                                    <img src="/momentum-logos.png" alt="" className="w-16 h-12 object-contain" />
                                </div>
                            </Link>
                            <div className="hidden lg:block items-center justify-between">
                                <ul className="flex gap-8 text-sm">
                                    {menuItems.map((item, index) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <li key={index} className="relative group">
                                                <Link
                                                    href={item.href}
                                                    className={`text-gray-300 hover:text-white transition-colors block duration-150 px-1`}
                                                >
                                                    <span className="relative">
                                                        {item.name}
                                                        <span
                                                            className={`absolute left-0 -bottom-1 w-full h-[2px] bg-purple-400 transition-transform origin-left duration-200 ${isActive ? 'scale-x-100' : 'scale-x-0'}`}
                                                        />
                                                    </span>
                                                </Link>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        </div>
                        <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit lg:w-fit lg:gap-6 lg:space-y-0 items-center justify-end">
                            {/* GitHub Icon */}
                            <a
                                href="https://github.com/momentum-dapp/momentum-mvp"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="GitHub"
                                className="rounded-full p-2 hover:bg-gray-700/50 transition-colors"
                            >
                                <Github className="w-5 h-5 text-gray-300" />
                            </a>
                            {/* Docs Icon */}
                            <Link href="https://github.com/orgs/MomentumFi/repositories" target="_blank" aria-label="Docs" className="rounded-full p-2 hover:bg-gray-700/50 transition-colors">
                                <Book className="w-5 h-5 text-gray-300" />
                            </Link>
                            {/* Toggle Dark Mode */}
                            <button
                                aria-label="Toggle Dark Mode"
                                className="rounded-full p-2 hover:bg-gray-700/50 transition-colors"
                                onClick={() => setTheme(theme === "" ? "" : "dark")}
                            >
                                <Moon className="w-5 h-5 text-gray-300" />
                            </button>
                            
                            {/* Wallet Connection Status */}
                            {isAuthenticated && isConnected && address ? (
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-700/50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                            <span className="text-sm font-mono text-gray-300">
                                                {formatAddress(address)}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSignOut}
                                        className="rounded-full p-2 hover:bg-red-500/20 transition-colors"
                                        aria-label="Sign Out"
                                    >
                                        <LogOut className="w-5 h-5 text-gray-300 hover:text-red-400" />
                                    </button>
                                </div>
                            ) : (
                                <Link href="/sign-in">
                                    <button className={`${buttonBaseStyles} bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-6 py-3 transition-all duration-300 ease-in-out shadow hover:from-purple-700 hover:to-pink-700 hover:shadow-lg`}>
                                        Connect Wallet
                                    </button>
                                </Link>
                            )}
                        </div>
                    </motion.div>
                </div>
            </nav>
        </header>
    )
}
