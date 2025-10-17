'use client';

import { useState, useRef, useEffect } from 'react';
import {
  PaperAirplaneIcon,
  SparklesIcon,
  UserIcon,
  CpuChipIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Strategy {
  id: 'low' | 'medium' | 'high';
  name: string;
  description: string;
  riskLevel: string;
  expectedReturn: string;
  allocation: {
    WBTC: number;
    BIG_CAPS: number;
    MID_LOWER_CAPS: number;
    STABLECOINS: number;
  };
  color: string;
  textColor: string;
  bgColor: string;
}

interface AIAdvisorProps {
  onStrategySelected?: (strategy: Strategy) => void;
}

export default function AIAdvisor({ onStrategySelected }: AIAdvisorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI Portfolio Advisor. I'll analyze your risk tolerance and investment goals to recommend the perfect portfolio strategy for you.\n\nLet's start with a few questions:\n\n1. What's your experience with cryptocurrency investing?\n2. What's your investment timeline?\n3. How would you describe your risk tolerance?",
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showStrategies, setShowStrategies] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const strategies: Strategy[] = [
    {
      id: 'low',
      name: 'Conservative Strategy',
      description: 'Lower risk with stable returns, ideal for risk-averse investors',
      riskLevel: 'Low Risk',
      expectedReturn: '5-8% APY',
      allocation: {
        WBTC: 70,
        BIG_CAPS: 20,
        MID_LOWER_CAPS: 0,
        STABLECOINS: 10
      },
      color: 'border-emerald-400',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50 hover:bg-emerald-100',
    },
    {
      id: 'medium',
      name: 'Balanced Strategy',
      description: 'Moderate risk with balanced growth potential',
      riskLevel: 'Medium Risk',
      expectedReturn: '8-15% APY',
      allocation: {
        WBTC: 50,
        BIG_CAPS: 30,
        MID_LOWER_CAPS: 15,
        STABLECOINS: 5
      },
      color: 'border-blue-400',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
    },
    {
      id: 'high',
      name: 'Aggressive Strategy',
      description: 'Higher risk with maximum growth potential',
      riskLevel: 'High Risk',
      expectedReturn: '15-25% APY',
      allocation: {
        WBTC: 30,
        BIG_CAPS: 25,
        MID_LOWER_CAPS: 40,
        STABLECOINS: 5
      },
      color: 'border-violet-400',
      textColor: 'text-violet-700',
      bgColor: 'bg-violet-50 hover:bg-violet-100',
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      const data = await response.json();

      if (data.response) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Check if we should show strategy selection
        if (data.response.toLowerCase().includes('strategy') &&
          data.response.toLowerCase().includes('recommend')) {
          setTimeout(() => setShowStrategies(true), 1000);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStrategySelect = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
  };

  const handleConfirmStrategy = async () => {
    if (!selectedStrategy) return;

    setIsLoading(true);

    try {
      // Execute the strategy immediately
      const response = await fetch('/api/execute-strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ strategy: selectedStrategy.id }),
      });

      const data = await response.json();

      if (data.success) {
        const successMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Perfect! I've executed your ${selectedStrategy.name} strategy. I'm now swapping tokens on Uniswap to implement your portfolio allocation:\n\n• WBTC: ${selectedStrategy.allocation.WBTC}%\n• Major Cryptocurrencies: ${selectedStrategy.allocation.BIG_CAPS}%\n• Emerging Cryptocurrencies: ${selectedStrategy.allocation.MID_LOWER_CAPS}%\n• Stablecoins: ${selectedStrategy.allocation.STABLECOINS}%\n\nYour portfolio is now being rebalanced automatically. You can monitor the progress in your dashboard.`,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, successMessage]);
        setShowStrategies(false);

        // Call the callback to update parent component if provided
        if (onStrategySelected) {
          onStrategySelected(selectedStrategy);
        }
      } else {
        throw new Error('Failed to execute strategy');
      }
    } catch (error) {
      console.error('Error executing strategy:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I encountered an error while executing your strategy. Please try again or contact support if the issue persists.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6">
      <div className="mt-20 bg-white rounded-3xl shadow-2xl border border-gray-100/50 h-[800px] flex flex-col overflow-hidden backdrop-blur-sm">
        {/* Header */}
        <div className="relative p-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-4 left-4 w-32 h-32 bg-blue-400/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-4 right-4 w-24 h-24 bg-purple-400/10 rounded-full blur-xl"></div>
          </div>
          <div className="relative flex items-center">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mr-6 border border-white/20">
              <SparklesIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-1">AI Portfolio Advisor</h3>
              <p className="text-slate-200 text-base opacity-90">
                Get personalized investment recommendations tailored for you
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-br from-slate-50/50 to-gray-50/80">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-3xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-4' : 'mr-4'}`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${message.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-white'
                    : 'bg-white border-2 border-gray-200/50 shadow-md'
                    }`}>
                    {message.role === 'user' ? (
                      <UserIcon className="h-6 w-6 text-white" />
                    ) : (
                      <CpuChipIcon className="h-6 w-6 text-slate-600" />
                    )}
                  </div>
                </div>

                <div className={`px-6 py-4 rounded-2xl shadow-lg backdrop-blur-sm ${message.role === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white border border-blue-400/30'
                  : 'bg-white/90 text-slate-800 border border-gray-200/50'
                  }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {message.content}
                  </p>
                  <p className={`text-xs mt-3 ${message.role === 'user' ? 'text-blue-100' : 'text-slate-400'
                    }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Strategy Selection */}
          {showStrategies && (
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 space-y-3">
              <div className="text-center mb-2">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <SparklesIcon className="h-8 w-8 text-blue-500" />
                </div>
                <h4 className="text-xl font-semibold text-slate-900 mb-1">
                  Recommended Investment Strategies
                </h4>
                <p className="text-slate-500 text-base mx-auto max-w-lg">
                  Three tailored strategies for your investment profile:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {strategies.map((strategy) => (
                  <div
                    key={strategy.id}
                    className={`
                      group 
                      p-5 
                      rounded-xl 
                      border 
                      cursor-pointer 
                      transition
                      duration-200
                      bg-white
                      hover:shadow-lg
                      hover:border-blue-300
                      flex flex-col
                      ${selectedStrategy?.id === strategy.id
                        ? "border-blue-500 shadow-lg ring-2 ring-blue-100"
                        : "border-gray-200"
                      }
                    `}
                    onClick={() => handleStrategySelect(strategy)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className={`text-lg font-bold ${selectedStrategy?.id === strategy.id ? "text-blue-600" : "text-slate-800"}`}>
                        {strategy.name}
                      </h5>
                      <span className={`
                        text-xs font-semibold rounded-full px-3 py-1
                        ${selectedStrategy?.id === strategy.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-blue-600"
                        }
                      `}>
                        {strategy.riskLevel}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-2">{strategy.description}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-slate-500">Expected Return:</span>
                      <span className="font-semibold text-emerald-600">{strategy.expectedReturn}</span>
                    </div>
                    <div className="text-xs rounded-lg bg-gray-50 border border-gray-100 p-3">
                      <div className="font-semibold text-slate-700 mb-2">Portfolio Allocation</div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-600">WBTC</span>
                          <span className="font-medium">{strategy.allocation.WBTC}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Major Caps</span>
                          <span className="font-medium">{strategy.allocation.BIG_CAPS}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Emerging</span>
                          <span className="font-medium">{strategy.allocation.MID_LOWER_CAPS}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Stablecoins</span>
                          <span className="font-medium">{strategy.allocation.STABLECOINS}%</span>
                        </div>
                      </div>
                    </div>
                    {selectedStrategy?.id === strategy.id && (
                      <div className="mt-3 flex justify-end">
                        <span className="inline-flex items-center bg-emerald-500 rounded-full w-7 h-7 justify-center shadow">
                          <CheckCircleIcon className="h-5 w-5 text-white" />
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {selectedStrategy && (
                <div className="flex justify-center pt-4 border-t border-gray-100">
                  <button
                    onClick={handleConfirmStrategy}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-7 py-3 rounded-xl font-semibold shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Execute Strategy</span>
                    <ArrowRightIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-4 bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-gray-200/50">
                <div className="flex space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-base text-slate-700 font-semibold">AI is analyzing your preferences...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 bg-white/95 backdrop-blur-sm border-t border-gray-200/50">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tell me about your investment goals and risk tolerance..."
                className="w-full px-6 py-4 border-2 border-gray-200/60 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 resize-none min-h-[56px] max-h-[120px] placeholder-slate-400 shadow-lg bg-white/90 backdrop-blur-sm font-medium transition-all duration-200"
                disabled={isLoading}
                rows={1}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl self-end hover:scale-105"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}