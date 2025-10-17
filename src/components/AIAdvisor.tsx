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
  currentPortfolio?: {
    id: string;
    strategy: 'low' | 'medium' | 'high';
    totalValue: number;
    allocations: {
      WBTC: number;
      BIG_CAPS: number;
      MID_LOWER_CAPS: number;
      STABLECOINS: number;
    };
  } | null;
}

export default function AIAdvisor({ onStrategySelected, currentPortfolio }: AIAdvisorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: currentPortfolio 
        ? `Hello! I'm your AI Portfolio Advisor. I can see you currently have a ${currentPortfolio.strategy} risk strategy with a portfolio value of $${currentPortfolio.totalValue.toLocaleString()}.\n\nYour current allocation:\n• WBTC: ${currentPortfolio.allocations.WBTC}%\n• Major Cryptocurrencies: ${currentPortfolio.allocations.BIG_CAPS}%\n• Emerging Cryptocurrencies: ${currentPortfolio.allocations.MID_LOWER_CAPS}%\n• Stablecoins: ${currentPortfolio.allocations.STABLECOINS}%\n\nI can help you:\n1. Analyze your current strategy performance\n2. Recommend strategy adjustments\n3. Execute strategy changes\n\nWhat would you like to discuss about your portfolio?`
        : "Hello! I'm your AI Portfolio Advisor. I'll analyze your risk tolerance and investment goals to recommend the perfect portfolio strategy for you.\n\nLet's start with a few questions:\n\n1. What's your experience with cryptocurrency investing?\n2. What's your investment timeline?\n3. How would you describe your risk tolerance?",
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
          currentPortfolio: currentPortfolio,
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
          (data.response.toLowerCase().includes('recommend') || data.response.toLowerCase().includes('suggest'))) {
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
        const isStrategyChange = currentPortfolio && currentPortfolio.strategy !== selectedStrategy.id;
        const actionText = isStrategyChange ? 'changed' : 'executed';
        const transactionText = isStrategyChange ? 'rebalancing' : 'implementing';
        
        const successMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Perfect! I've ${actionText} your strategy to ${selectedStrategy.name}. I'm now ${transactionText} your portfolio via smart contract:\n\n• WBTC: ${selectedStrategy.allocation.WBTC}%\n• Major Cryptocurrencies: ${selectedStrategy.allocation.BIG_CAPS}%\n• Emerging Cryptocurrencies: ${selectedStrategy.allocation.MID_LOWER_CAPS}%\n• Stablecoins: ${selectedStrategy.allocation.STABLECOINS}%\n\n${isStrategyChange ? 'Your portfolio has been rebalanced' : 'Your portfolio is now being managed'} automatically. Transaction hash: ${data.transactionHash}\n\nYou can monitor your portfolio performance in the dashboard.`,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, successMessage]);
        setShowStrategies(false);

        // Call the callback to update parent component if provided
        if (onStrategySelected) {
          onStrategySelected(selectedStrategy);
        }
      } else {
        throw new Error(data.error || 'Failed to execute strategy');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100/50 min-h-[700px] flex flex-col overflow-hidden">
        {/* Simplified Header */}
        <div className="p-4 sm:p-6 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <SparklesIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI Consultation</h3>
                <p className="text-sm text-gray-600">
                  {currentPortfolio 
                    ? 'Optimize your portfolio strategy'
                    : 'Get personalized investment recommendations'
                  }
                </p>
              </div>
            </div>
            {currentPortfolio && (
              <div className="text-right">
                <div className="text-sm text-gray-500">Current Strategy</div>
                <div className="font-medium text-gray-900 capitalize">
                  {currentPortfolio.strategy} Risk
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-2xl sm:max-w-3xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-3 sm:ml-4' : 'mr-3 sm:mr-4'}`}>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${message.role === 'user'
                    ? 'bg-indigo-600'
                    : 'bg-white border border-gray-200 shadow-sm'
                    }`}>
                    {message.role === 'user' ? (
                      <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    ) : (
                      <CpuChipIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                    )}
                  </div>
                </div>

                <div className={`px-4 py-3 sm:px-6 sm:py-4 rounded-xl shadow-sm ${message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-800 border border-gray-100'
                  }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <p className={`text-xs mt-2 sm:mt-3 ${message.role === 'user' ? 'text-indigo-100' : 'text-gray-400'
                    }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Strategy Selection */}
          {showStrategies && (
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <SparklesIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {currentPortfolio ? 'Strategy Options' : 'Recommended Investment Strategies'}
                </h4>
                <p className="text-gray-600 text-sm sm:text-base mx-auto max-w-lg">
                  {currentPortfolio 
                    ? 'Choose a new strategy or rebalance your current one:'
                    : 'Three tailored strategies for your investment profile:'
                  }
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {strategies.map((strategy) => (
                  <div
                    key={strategy.id}
                    className={`
                      group 
                      p-4 sm:p-5 
                      rounded-xl 
                      border 
                      cursor-pointer 
                      transition-all
                      duration-200
                      bg-white
                      hover:shadow-md
                      hover:border-indigo-300
                      flex flex-col
                      ${selectedStrategy?.id === strategy.id
                        ? "border-indigo-500 shadow-md ring-2 ring-indigo-100"
                        : "border-gray-200"
                      }
                      ${currentPortfolio?.strategy === strategy.id
                        ? "bg-green-50 border-green-300"
                        : ""
                      }
                    `}
                    onClick={() => handleStrategySelect(strategy)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h5 className={`text-base sm:text-lg font-semibold ${selectedStrategy?.id === strategy.id ? "text-indigo-600" : "text-gray-800"}`}>
                        {strategy.name}
                        {currentPortfolio?.strategy === strategy.id && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Current
                          </span>
                        )}
                      </h5>
                      <span className={`
                        text-xs font-medium rounded-full px-2 py-1
                        ${selectedStrategy?.id === strategy.id
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-600"
                        }
                      `}>
                        {strategy.riskLevel}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{strategy.description}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-gray-500">Expected Return:</span>
                      <span className="font-semibold text-green-600">{strategy.expectedReturn}</span>
                    </div>
                    <div className="text-xs rounded-lg bg-gray-50 border border-gray-100 p-3">
                      <div className="font-semibold text-gray-700 mb-2">Portfolio Allocation</div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">WBTC</span>
                          <span className="font-medium">{strategy.allocation.WBTC}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Major Caps</span>
                          <span className="font-medium">{strategy.allocation.BIG_CAPS}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Emerging</span>
                          <span className="font-medium">{strategy.allocation.MID_LOWER_CAPS}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Stablecoins</span>
                          <span className="font-medium">{strategy.allocation.STABLECOINS}%</span>
                        </div>
                      </div>
                    </div>
                    {selectedStrategy?.id === strategy.id && (
                      <div className="mt-3 flex justify-end">
                        <span className="inline-flex items-center bg-green-500 rounded-full w-6 h-6 justify-center shadow-sm">
                          <CheckCircleIcon className="h-4 w-4 text-white" />
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
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>
                      {currentPortfolio && currentPortfolio.strategy !== selectedStrategy.id 
                        ? 'Change Strategy' 
                        : currentPortfolio 
                          ? 'Rebalance Portfolio'
                          : 'Execute Strategy'
                      }
                    </span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-700">AI is analyzing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 sm:p-6 bg-white border-t border-gray-100">
          <div className="flex space-x-3 sm:space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={currentPortfolio 
                  ? "Ask me about your portfolio or request strategy changes..."
                  : "Tell me about your investment goals and risk tolerance..."
                }
                className="w-full px-4 py-3 sm:px-6 sm:py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 resize-none min-h-[48px] sm:min-h-[56px] max-h-[120px] placeholder-gray-400 shadow-sm bg-white transition-all duration-200"
                disabled={isLoading}
                rows={1}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-3 sm:px-6 sm:py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm self-end"
            >
              <PaperAirplaneIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}