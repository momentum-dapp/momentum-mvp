import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { PortfolioService } from '@/lib/services/portfolio-service';
import { SmartContractService } from '@/lib/contracts/smart-contract-service';
import { STRATEGIES } from '@/lib/contracts/addresses';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { strategy } = await request.json();

    if (!strategy || !['low', 'medium', 'high'].includes(strategy)) {
      return NextResponse.json({ error: 'Invalid strategy' }, { status: 400 });
    }

    // Get or create portfolio
    let portfolio = await PortfolioService.getUserPortfolio(user.id);
    
    if (!portfolio) {
      // Create new portfolio with the selected strategy
      const strategyConfig = STRATEGIES[strategy as keyof typeof STRATEGIES];
      portfolio = await PortfolioService.createPortfolio({
        user_id: user.id,
        strategy: strategy as 'low' | 'medium' | 'high',
        wbtc_allocation: strategyConfig.allocations.WBTC,
        big_caps_allocation: strategyConfig.allocations.BIG_CAPS,
        mid_lower_caps_allocation: strategyConfig.allocations.MID_LOWER_CAPS,
        stablecoins_allocation: strategyConfig.allocations.STABLECOINS,
      });

      if (!portfolio) {
        return NextResponse.json({ error: 'Failed to create portfolio' }, { status: 500 });
      }
    }

    // Execute strategy on smart contract
    // Note: In production, you would use the actual private key from secure storage
    const mockPrivateKey = process.env.SMART_WALLET_PRIVATE_KEY || '0x1234567890123456789012345678901234567890123456789012345678901234';
    
    const contractResult = await SmartContractService.executeStrategy(
      user.wallet_address as `0x${string}`,
      strategy,
      mockPrivateKey
    );

    if (!contractResult.success) {
      return NextResponse.json({ 
        error: 'Smart contract execution failed',
        details: contractResult.error 
      }, { status: 500 });
    }

    // Update portfolio in database
    const updatedPortfolio = await PortfolioService.updateStrategy(portfolio.id, strategy, {
      wbtc: STRATEGIES[strategy as keyof typeof STRATEGIES].allocations.WBTC,
      bigCaps: STRATEGIES[strategy as keyof typeof STRATEGIES].allocations.BIG_CAPS,
      midLowerCaps: STRATEGIES[strategy as keyof typeof STRATEGIES].allocations.MID_LOWER_CAPS,
      stablecoins: STRATEGIES[strategy as keyof typeof STRATEGIES].allocations.STABLECOINS,
    });

    if (!updatedPortfolio) {
      console.error('Failed to update portfolio in database');
    }

    // Store transaction record
    // Note: This would typically be done in a transaction service
    console.log(`Strategy execution transaction: ${contractResult.txHash}`);

    return NextResponse.json({
      success: true,
      message: 'Strategy executed successfully on blockchain',
      transactionHash: contractResult.txHash,
      allocation: STRATEGIES[strategy as keyof typeof STRATEGIES].allocations,
      strategy,
      portfolio: updatedPortfolio ? {
        id: updatedPortfolio.id,
        strategy: updatedPortfolio.strategy,
        totalValue: updatedPortfolio.total_value,
        allocations: {
          WBTC: updatedPortfolio.wbtc_allocation,
          BIG_CAPS: updatedPortfolio.big_caps_allocation,
          MID_LOWER_CAPS: updatedPortfolio.mid_lower_caps_allocation,
          STABLECOINS: updatedPortfolio.stablecoins_allocation,
        },
        lastRebalanced: updatedPortfolio.last_rebalanced,
      } : null
    });

  } catch (error) {
    console.error('Error executing strategy:', error);
    return NextResponse.json(
      { error: 'Failed to execute strategy' },
      { status: 500 }
    );
  }
}
