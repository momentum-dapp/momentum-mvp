import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { generateChatResponse, ChatMessage } from '@/lib/ai/openai';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, message } = await request.json();

    if (!message && !messages) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Handle single message or conversation history
    const chatMessages: ChatMessage[] = messages || [
      { role: 'user' as const, content: message }
    ];

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
