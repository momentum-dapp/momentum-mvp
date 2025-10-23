import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { PortfolioService } from '@/lib/services/portfolio-service';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Get user's portfolio
    const portfolio = await PortfolioService.getUserPortfolio(user.id);
    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // For now, we'll generate mock performance data based on the portfolio
    // In a real implementation, this would come from historical data
    const performanceData = generateMockPerformanceData(portfolio.total_value, days);

    return NextResponse.json({
      performance: performanceData,
      portfolio: {
        id: portfolio.id,
        totalValue: portfolio.total_value,
        strategy: portfolio.strategy,
      }
    });

  } catch (error) {
    console.error('Portfolio performance API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}

function generateMockPerformanceData(initialValue: number, days: number) {
  const data = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    
    // Generate realistic price movement with some volatility
    const volatility = 0.02; // 2% daily volatility
    const trend = 0.001; // Slight upward trend
    const randomChange = (Math.random() - 0.5) * volatility;
    const dailyChange = trend + randomChange;
    
    const previousValue: number = i === days ? initialValue : data[data.length - 1].value;
    const value: number = previousValue * (1 + dailyChange);
    const change: number = i === days ? 0 : previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0;
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: isNaN(value) || !isFinite(value) ? initialValue : Math.round(value * 100) / 100,
      change: isNaN(change) || !isFinite(change) ? 0 : Math.round(change * 100) / 100,
    });
  }
  
  return data;
}
