import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CtaSection() {
    return (
        <>
            {/* CTA Section */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-2xl p-8 border border-purple-600/20 mb-12">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">Ready to Optimize Your Portfolio?</h2>
                    <p className="text-xl text-blue-100 mb-12">
                        Join thousands of users who trust MomentumFi for intelligent DeFi portfolio management
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Link href="/dashboard">
                            <Button
                                size="lg"
                                className="bg-white text-blue-600 hover:bg-gray-50 shadow-xl text-lg px-8 py-4 h-auto font-semibold"
                            >
                                Start Trading Now
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Button
                            size="lg"
                            variant="outline"
                            className="border-2 border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4 h-auto font-semibold"
                        >
                            Learn More
                        </Button>
                    </div>
                </div>
            </section></>
    )
}