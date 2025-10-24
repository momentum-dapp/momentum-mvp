import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { generateChatResponse, ChatMessage } from '@/lib/ai/openai';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, message, currentPortfolio } = await request.json();

    if (!message && !messages) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Handle single message or conversation history
    const chatMessages: ChatMessage[] = messages || [
      { role: 'user' as const, content: message }
    ];

    // Add portfolio context to the system message if available
    if (currentPortfolio) {
      const portfolioContext = `User's current portfolio: ${currentPortfolio.strategy} risk strategy, $${currentPortfolio.totalValue.toLocaleString()} total value. Allocations: WBTC ${currentPortfolio.allocations.WBTC}%, Major Caps ${currentPortfolio.allocations.BIG_CAPS}%, Emerging ${currentPortfolio.allocations.MID_LOWER_CAPS}%, Stablecoins ${currentPortfolio.allocations.STABLECOINS}%.`;
      
      chatMessages.unshift({
        role: 'system' as const,
        content: `You are a professional AI portfolio advisor. ${portfolioContext} Provide personalized advice based on their current portfolio. You can recommend strategy changes, rebalancing, or answer questions about their investments.`
      });
    }

    const response = await generateChatResponse(chatMessages, user.wallet_address || user.id);

    return NextResponse.json({ 
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
