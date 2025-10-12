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
      color: 'border-green-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50 hover:bg-green-100',
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
      color: 'border-blue-500',
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
      color: 'border-purple-500',
      textColor: 'text-purple-700',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm h-[700px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
              <SparklesIcon className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Portfolio Advisor</h3>
              <p className="text-sm text-gray-500">Get personalized investment recommendations</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-xs lg:max-w-md ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-2' : 'mr-2'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' ? 'bg-indigo-600' : 'bg-gray-100'
                  }`}>
                    {message.role === 'user' ? (
                      <UserIcon className="h-4 w-4 text-white" />
                    ) : (
                      <CpuChipIcon className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                </div>
                
                <div className={`px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-indigo-200' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Strategy Selection */}
          {showStrategies && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 mb-4">
                  Based on our conversation, here are three investment strategies I recommend:
                </p>
              </div>
              
              <div className="grid gap-4">
                {strategies.map((strategy) => (
                  <div
                    key={strategy.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedStrategy?.id === strategy.id
                        ? `${strategy.color} ${strategy.bgColor}`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleStrategySelect(strategy)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className={`font-semibold ${strategy.textColor}`}>
                            {strategy.name}
                          </h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${strategy.bgColor} ${strategy.textColor}`}>
                            {strategy.riskLevel}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {strategy.description}
                        </p>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Expected Return: {strategy.expectedReturn}
                        </p>
                        <div className="text-xs text-gray-500">
                          Allocation: WBTC {strategy.allocation.WBTC}% • Major Caps {strategy.allocation.BIG_CAPS}% • 
                          Emerging {strategy.allocation.MID_LOWER_CAPS}% • Stablecoins {strategy.allocation.STABLECOINS}%
                        </div>
                      </div>
                      {selectedStrategy?.id === strategy.id && (
                        <CheckCircleIcon className="h-5 w-5 text-green-500 ml-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedStrategy && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleConfirmStrategy}
                    disabled={isLoading}
                    className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span>Execute Strategy</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-500">AI is analyzing...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell me about your investment goals..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 resize-none min-h-[40px] max-h-[120px]"
              disabled={isLoading}
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
