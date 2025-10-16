"use client";
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link'
import { motion } from "framer-motion"
import { ScrollProgress } from '@/components/home/scroll-progress'
import { ArrowRight } from "lucide-react"
import AnimatedGradient from '@/components/home/animated-gradien'
import DashboardPreview from '@/components/home/dashboard-preview'
import LogoCloud from '@/components/home/logo-cloud'
import Stats2 from '@/components/home/stats2'
import Features2 from '@/components/home/features2'
import HowItWorks from '@/components/home/how-it-works'
import FAQ from '@/components/home/faq'
import CtaSection from '@/components/home/cta-section'

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Wait for Clerk to load
    if (isLoaded && user) {
      router.push('/dashboard');
    }
  }, [user, isLoaded, router]);

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Don't render content if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <>
      {/* <Navigation /> */}
      <ScrollProgress />
      <main className="relative min-h-screen flex items-center justify-center px-6">
        <section className="w-full">
          <div className="mt-20 max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
            {/* Main Content */}
            <div className="mt-20 text-center flex flex-col items-center justify-center max-w-4xl">
              {/* New Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center space-x-2 mb-8"
              >
                <AnimatedGradient />
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-5xl lg:text-7xl font-bold leading-tight mb-6"
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="block"
                >
                  AI-Powered
                </motion.span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
                >
                  for Auto-Rebalancing Portofolio.
                </motion.span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
              >
                Leverage AI-driven automatic rebalancing on Base blockchain.
                Secure, intelligent, and optimized for your investment strategy.
              </motion.p>

              {/* CTA Button */}
              <Link href="/dashboard" className="flex justify-center">
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.1 }}
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(147, 51, 234, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-full text-white font-semibold text-lg transition-all duration-300 flex items-center justify-center"
                >
                  Launch App
                  <ArrowRight className="ml-2 h-5 w-5" />
                </motion.button>
              </Link>

              {/* Earn Effortlessly Text
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 1.3 }}
                        className="absolute bottom-8 left-8 hidden lg:block"
                    >
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-gray-400 text-sm">Earn Effortlessly</span>
                        </div>
                    </motion.div> */}
            </div>

            {/* Right Content - Dashboard Preview
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="relative"
            >

              <Link href={"/dashboard"} className="block">
                <DashboardPreview />
              </Link>
            </motion.div> */}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex justify-center mt-16"
          >
            <LogoCloud />
          </motion.div>

          <Stats2 />
          <Features2 />
          <HowItWorks />
          <FAQ />
          <CtaSection />
        </section >
      </main >
    </>
  );
}