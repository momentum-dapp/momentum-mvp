import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OpenAI API key');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = 'gpt-4o-mini';

export const SYSTEM_PROMPT = `You are MomentumAI, an expert financial advisor specializing in cryptocurrency portfolio management. You help users make informed investment decisions based on their risk tolerance and market conditions.

Your primary responsibilities:
1. Analyze user preferences and risk tolerance through conversation
2. Recommend one of three investment strategies: Low Risk, Medium Risk, or High Risk
3. Explain market conditions and their impact on portfolio allocations
4. Provide educational content about cryptocurrency investments
5. Guide users through the portfolio selection process

Investment Strategies:
- Low Risk: WBTC 70%, Big Caps 20%, Stablecoins 10% (Conservative approach focusing on Bitcoin with some exposure to major cryptocurrencies)
- Medium Risk: WBTC 50%, Big Caps 30%, Mid/Lower Caps 15%, Stablecoins 5% (Balanced approach with diversified exposure)
- High Risk: WBTC 30%, Big Caps 25%, Mid/Lower Caps 40%, Stablecoins 5% (Aggressive approach with significant exposure to smaller cap cryptocurrencies)

Market Conditions:
- Bearish Market: All strategies automatically shift to 100% Stablecoins to preserve capital
- Market Recovery: Strategies gradually return to original allocations based on market sentiment

Asset Categories:
- WBTC: Bitcoin exposure through Wrapped Bitcoin
- Big Caps: ETH and major L1/L2 cryptocurrencies (market cap > $10B)
- Mid/Lower Caps: Smaller L1/L2 cryptocurrencies (market cap < $10B)
- Stablecoins: USD-pegged stablecoins (USDC, USDT, DAI)

Guidelines:
- Always ask clarifying questions to understand user's investment goals, time horizon, and risk tolerance
- Explain the reasoning behind your recommendations
- Be educational and help users understand cryptocurrency markets
- Never provide specific financial advice or guarantee returns
- Always remind users that cryptocurrency investments carry risks
- Keep responses conversational and accessible to both beginners and experienced investors
- When you have enough information to make a recommendation, end your response with "Based on our conversation, I recommend the [Low/Medium/High] Risk strategy for your portfolio." This will trigger the strategy selection interface.`;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  reasoning: string;
}

export async function generateChatResponse(
  messages: ChatMessage[],
  userId: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_completion_tokens: 500,
      temperature: 0.7,
      user: userId,
    });

    return response.choices[0]?.message?.content || 'I apologize, but I encountered an error. Please try again.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate AI response');
  }
}

export async function assessRiskTolerance(
  conversationHistory: ChatMessage[],
  userId: string
): Promise<RiskAssessment> {
  const assessmentPrompt = `Based on the conversation history, assess the user's risk tolerance and recommend an appropriate investment strategy.

Consider factors like:
- Investment experience level
- Risk tolerance statements
- Investment timeline
- Financial goals
- Comfort with volatility

Respond with a JSON object containing:
- riskLevel: "low", "medium", or "high"
- confidence: number between 0-100
- reasoning: brief explanation for the recommendation

Conversation history:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are a risk assessment AI. Respond only with valid JSON.' },
        { role: 'user', content: assessmentPrompt },
      ],
      max_completion_tokens: 200,
      temperature: 0.3,
      user: userId,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content');
    }

    return JSON.parse(content) as RiskAssessment;
  } catch (error) {
    console.error('Risk assessment error:', error);
    // Fallback to medium risk if assessment fails
    return {
      riskLevel: 'medium',
      confidence: 50,
      reasoning: 'Unable to assess risk tolerance from conversation. Defaulting to medium risk strategy.',
    };
  }
}

export async function analyzeMarketSentiment(): Promise<{
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  reasoning: string;
}> {
  const marketPrompt = `Analyze the current cryptocurrency market sentiment based on recent trends, news, and market indicators. 

Consider factors like:
- Bitcoin and major cryptocurrency price movements
- Market volatility
- Regulatory developments
- Institutional adoption
- Technical indicators

Respond with a JSON object containing:
- sentiment: "bullish", "bearish", or "neutral"
- confidence: number between 0-100
- reasoning: brief explanation of the market analysis`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are a cryptocurrency market analyst. Respond only with valid JSON based on general market knowledge.' },
        { role: 'user', content: marketPrompt },
      ],
      max_completion_tokens: 200,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Market sentiment analysis error:', error);
    // Fallback to neutral sentiment
    return {
      sentiment: 'neutral',
      confidence: 50,
      reasoning: 'Unable to analyze current market conditions. Maintaining neutral stance.',
    };
  }
}
