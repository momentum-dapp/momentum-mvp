import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { PortfolioService } from '@/lib/services/portfolio-service';
import { SmartContractService } from '@/lib/contracts/smart-contract-service';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's portfolio
    const portfolio = await PortfolioService.getUserPortfolio(user.id);
    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Execute emergency rebalance on smart contract
    // Note: In production, you would use the actual private key from secure storage
    const mockPrivateKey = process.env.SMART_WALLET_PRIVATE_KEY || '0x1234567890123456789012345678901234567890123456789012345678901234';
    
    const contractResult = await SmartContractService.emergencyRebalanceToStablecoin(
      dbUser.wallet_address as `0x${string}`,
      mockPrivateKey
    );

    if (!contractResult.success) {
      return NextResponse.json({ 
        error: 'Smart contract execution failed',
        details: contractResult.error 
      }, { status: 500 });
    }

    // Update portfolio to 100% stablecoins
    const updatedPortfolio = await PortfolioService.updatePortfolio(portfolio.id, {
      wbtc_allocation: 0,
      big_caps_allocation: 0,
      mid_lower_caps_allocation: 0,
      stablecoins_allocation: 100,
      last_rebalanced: new Date().toISOString(),
    });

    if (!updatedPortfolio) {
      console.error('Failed to update portfolio in database');
    }

    // Store transaction record
    console.log(`Emergency rebalance transaction: ${contractResult.txHash}`);

    return NextResponse.json({
      success: true,
      message: 'Emergency rebalance to stablecoin executed successfully',
      transactionHash: contractResult.txHash,
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
    console.error('Error executing emergency rebalance:', error);
    return NextResponse.json(
      { error: 'Failed to execute emergency rebalance' },
      { status: 500 }
    );
  }
}
