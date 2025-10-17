import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { generateChatResponse, ChatMessage } from '@/lib/ai/openai';

export async function POST(request: NextRequest) {
  try {
    // Check if Clerk is configured
    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
      console.warn('Clerk not configured, returning mock response');
      // Return mock response when Clerk is not configured
      return NextResponse.json({ 
        response: "I'm a mock AI assistant. Please configure your environment variables to enable full functionality.",
        timestamp: new Date().toISOString()
      });
    }

    const user = await currentUser();
    
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

    const response = await generateChatResponse(chatMessages, user.id);

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
