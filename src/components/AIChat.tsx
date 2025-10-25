'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  PaperAirplaneIcon,
  SparklesIcon,
  UserIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Portfolio {
  id: string;
  strategy: 'low' | 'medium' | 'high';
  totalValue: number;
  allocations: {
    WBTC: number;
    BIG_CAPS: number;
    MID_LOWER_CAPS: number;
    STABLECOINS: number;
  };
  lastRebalanced: string;
  isActive: boolean;
}

interface AIChatProps {
  onPortfolioCreated?: (portfolio: Portfolio) => void;
}

export default function AIChat({ onPortfolioCreated }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm MomentumAI, your personal cryptocurrency investment advisor. I'll help you create a portfolio strategy that matches your risk tolerance and investment goals. To get started, could you tell me about your experience with cryptocurrency investing?",
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showStrategySelection, setShowStrategySelection] = useState(false);
  const [existingPortfolio, setExistingPortfolio] = useState<Portfolio | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check for existing portfolio on mount
  useEffect(() => {
    const checkExistingPortfolio = async () => {
      try {
        const response = await fetch('/api/portfolio');
        if (response.ok) {
          const data = await response.json();
          if (data.portfolio) {
            setExistingPortfolio(data.portfolio);
          }
        }
      } catch (error) {
        console.error('Error checking for existing portfolio:', error);
      }
    };

    checkExistingPortfolio();
  }, []);

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
          setTimeout(() => setShowStrategySelection(true), 1000);
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

  const handleStrategySelection = async (strategy: 'low' | 'medium' | 'high') => {
    setIsLoading(true);
    
    try {
      const isUpdate = !!existingPortfolio;
      const endpoint = '/api/portfolio';
      const method = isUpdate ? 'PUT' : 'POST';

      // Create or update portfolio with selected strategy
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ strategy }),
      });

      const data = await response.json();
      
      if ((data.success || data.portfolio) && data.portfolio) {
        const actionWord = isUpdate ? 'updated' : 'created';
        const successMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Excellent! I've ${actionWord} your ${strategy} risk portfolio. Your portfolio is now set up with the following allocation:\n\n• WBTC: ${data.portfolio.allocations.WBTC}%\n• Major Cryptocurrencies: ${data.portfolio.allocations.BIG_CAPS}%\n• Emerging Cryptocurrencies: ${data.portfolio.allocations.MID_LOWER_CAPS}%\n• Stablecoins: ${data.portfolio.allocations.STABLECOINS}%${isUpdate ? '\n\nYour portfolio strategy has been updated successfully!' : '\n\nYou can now start depositing funds and I\'ll automatically rebalance your portfolio based on market conditions.'} Would you like me to explain how the automatic rebalancing works?`,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, successMessage]);
        setShowStrategySelection(false);
        setExistingPortfolio(data.portfolio);
        
        if (onPortfolioCreated) {
          onPortfolioCreated(data.portfolio);
        }
      } else {
        throw new Error(data.error || `Failed to ${isUpdate ? 'update' : 'create'} portfolio`);
      }
    } catch (error) {
      console.error('Error with portfolio:', error);
      const isUpdate = !!existingPortfolio;
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I encountered an error while ${isUpdate ? 'updating' : 'creating'} your portfolio. ${error instanceof Error ? error.message : 'Please try again or contact support if the issue persists.'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const strategies = [
    {
      id: 'low',
      name: 'Conservative Strategy',
      description: 'Lower risk with stable returns',
      allocation: 'WBTC 70%, Major Caps 20%, Stablecoins 10%',
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      textColor: 'text-green-700',
    },
    {
      id: 'medium',
      name: 'Balanced Strategy',
      description: 'Moderate risk with balanced growth',
      allocation: 'WBTC 50%, Major Caps 30%, Emerging 15%, Stablecoins 5%',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      textColor: 'text-blue-700',
    },
    {
      id: 'high',
      name: 'Aggressive Strategy',
      description: 'Higher risk with growth potential',
      allocation: 'WBTC 30%, Major Caps 25%, Emerging 40%, Stablecoins 5%',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      textColor: 'text-purple-700',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
            <SparklesIcon className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">MomentumAI Assistant</h3>
            <p className="text-sm text-gray-500">Your personal investment advisor</p>
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
        {showStrategySelection && (
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900 mb-3">
                {existingPortfolio 
                  ? `Update your investment strategy (Current: ${existingPortfolio.strategy} risk):`
                  : 'Choose your investment strategy:'}
              </p>
            </div>
            
            {strategies.map((strategy) => {
              const isCurrentStrategy = existingPortfolio?.strategy === strategy.id;
              return (
                <button
                  key={strategy.id}
                  onClick={() => handleStrategySelection(strategy.id as 'low' | 'medium' | 'high')}
                  disabled={isLoading}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-colors disabled:opacity-50 ${strategy.color} ${isCurrentStrategy ? 'ring-2 ring-indigo-500' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium ${strategy.textColor}`}>
                          {strategy.name}
                        </h4>
                        {isCurrentStrategy && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {strategy.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {strategy.allocation}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
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
              <span className="text-sm text-gray-500">AI is thinking...</span>
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
  );
}
