import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { assessRiskTolerance, ChatMessage } from '@/lib/ai/openai';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationHistory } = await request.json();

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return NextResponse.json({ error: 'Conversation history is required' }, { status: 400 });
    }

    const assessment = await assessRiskTolerance(
      conversationHistory as ChatMessage[],
      user.id
    );

    return NextResponse.json({
      assessment,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Risk assessment API error:', error);
    return NextResponse.json(
      { error: 'Failed to assess risk tolerance' },
      { status: 500 }
    );
  }
}
