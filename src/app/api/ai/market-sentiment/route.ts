import { NextResponse } from 'next/server';
import { analyzeMarketSentiment } from '@/lib/ai/openai';

export async function GET() {
  try {
    const sentiment = await analyzeMarketSentiment();

    return NextResponse.json({
      sentiment,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Market sentiment API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze market sentiment' },
      { status: 500 }
    );
  }
}

// Cache the response for 5 minutes
export const revalidate = 300;
