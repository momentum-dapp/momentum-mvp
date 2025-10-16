"use client"


import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sun, Moon, Book, Github } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

const menuItems = [
    { name: 'Home', href: '/' },
    { name: 'Earn', href: '/earn' },
    { name: 'Portofolio', href: '/portofolio' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Docs', href: '/docs' },
]

export default function Navigation() {
    const { theme, setTheme } = useTheme()
    const [scrolled, setScrolled] = useState(false)
    const pathname = usePathname()
    const buttonBaseStyles = "rounded-full hover:rounded-full";

    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 40)
        }
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <header>
            <nav className="fixed z-20 w-full pt-2">
                <div className={`mx-auto max-w-7xl rounded-3xl px-6 transition-all duration-300 lg:px-12 ${scrolled ? 'bg-background/50 backdrop-blur-2xl' : ''}`}>
                    <motion.div
                        key={1}
                        className={`relative flex flex-wrap items-center justify-between gap-6 py-3 duration-200 lg:gap-0 ${scrolled ? 'lg:py-4' : 'lg:py-6'}`}
                    >
                        <div className="flex w-full items-center justify-between gap-12 lg:w-auto">
                            <Link href="/" aria-label="home" className="flex items-center space-x-2">
                                <div className="text-2xl font-bold text-white flex items-center">
                                    <img src="/logo.png" alt="" className="w-20" />
                                    <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                        MomentumFI
                                    </span>
                                </div>
                            </Link>
                            {/* Menu mobile button bisa ditambah di sini jika ingin */}
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
                                                            className={`absolute left-0 -bottom-1 w-full h-[2px] bg-[#FDCC92] transition-transform origin-left duration-200 ${isActive ? 'scale-x-100' : 'scale-x-0'}`}
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
                                href="https://github.com/orgs/momentum-dapp/repositories"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="GitHub"
                                className="rounded-full p-2 hover:bg-gray-700 transition-colors"
                            >
                                <Github className="w-5 h-5 text-gray-300" />
                            </a>
                            {/* Docs Icon */}
                            <Link href="https://github.com/orgs/MomentumFi/repositories" target="_blank" aria-label="Docs" className="rounded-full p-2 hover:bg-gray-700 transition-colors">
                                <Book className="w-5 h-5 text-gray-300" />
                            </Link>
                            {/* Toggle Dark Mode */}
                            <button
                                aria-label="Toggle Dark Mode"
                                className="rounded-full p-2 hover:bg-gray-700 transition-colors"
                                onClick={() => setTheme(theme === "" ? "" : "dark")}
                            >
                                <Moon className="w-5 h-5 text-gray-300" />
                            </button>
                            {/* <Connect /> */}
                            <SignedOut>
                                <SignInButton>
                                    <button className={`${buttonBaseStyles} bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-semibold px-6 py-3 transition-all duration-300 ease-in-out shadow hover:brightness-110 hover:shadow-lg dark:from-indigo-400 dark:to-pink-400`}>
                                        Sign In
                                    </button>
                                </SignInButton>
                            </SignedOut>
                            <SignedIn>
                                <UserButton />
                            </SignedIn>
                        </div>
                    </motion.div>
                </div>
            </nav>
        </header>
    )
}
