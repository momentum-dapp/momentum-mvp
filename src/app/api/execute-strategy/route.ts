import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { strategy } = await request.json();

    if (!strategy || !['low', 'medium', 'high'].includes(strategy)) {
      return NextResponse.json({ error: 'Invalid strategy' }, { status: 400 });
    }

    // Simulate strategy execution with Uniswap
    // In a real implementation, this would:
    // 1. Connect to the user's wallet
    // 2. Execute token swaps on Uniswap V3
    // 3. Update the portfolio allocation
    // 4. Store the transaction details

    const strategyConfigs = {
      low: {
        WBTC: 70,
        BIG_CAPS: 20,
        MID_LOWER_CAPS: 0,
        STABLECOINS: 10
      },
      medium: {
        WBTC: 50,
        BIG_CAPS: 30,
        MID_LOWER_CAPS: 15,
        STABLECOINS: 5
      },
      high: {
        WBTC: 30,
        BIG_CAPS: 25,
        MID_LOWER_CAPS: 40,
        STABLECOINS: 5
      }
    };

    const allocation = strategyConfigs[strategy as keyof typeof strategyConfigs];

    // Simulate transaction execution
    const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    // In a real implementation, you would:
    // 1. Execute the actual swaps on Uniswap
    // 2. Update the database with the new portfolio state
    // 3. Store transaction details

    return NextResponse.json({
      success: true,
      message: 'Strategy executed successfully',
      transactionHash,
      allocation,
      strategy
    });

  } catch (error) {
    console.error('Error executing strategy:', error);
    return NextResponse.json(
      { error: 'Failed to execute strategy' },
      { status: 500 }
    );
  }
}
