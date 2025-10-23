import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { PortfolioService } from '@/lib/services/portfolio-service';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { allocations } = await request.json();

    if (!allocations) {
      return NextResponse.json({ error: 'Allocations required' }, { status: 400 });
    }

    // Validate allocations sum to 100
    const total = allocations.WBTC + allocations.BIG_CAPS + allocations.MID_LOWER_CAPS + allocations.STABLECOINS;
    if (total !== 100) {
      return NextResponse.json({ error: 'Allocations must sum to 100%' }, { status: 400 });
    }

    // Get user's portfolio
    const portfolio = await PortfolioService.getUserPortfolio(user.id);
    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Update portfolio with custom allocations
    const updatedPortfolio = await PortfolioService.updatePortfolio(portfolio.id, {
      wbtc_allocation: allocations.WBTC,
      big_caps_allocation: allocations.BIG_CAPS,
      mid_lower_caps_allocation: allocations.MID_LOWER_CAPS,
      stablecoins_allocation: allocations.STABLECOINS,
      last_rebalanced: new Date().toISOString(),
    });

    if (!updatedPortfolio) {
      return NextResponse.json({ error: 'Failed to update allocations' }, { status: 500 });
    }

    // TODO: Call smart contract to set custom allocations on-chain
    // This will be done when contracts are deployed
    // const contractService = new SmartContractService();
    // await contractService.setUserCustomAllocations(userAddress, allocations);

    return NextResponse.json({
      success: true,
      portfolio: {
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
        updatedAt: updatedPortfolio.updated_at,
      }
    });

  } catch (error) {
    console.error('Allocations update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update allocations' },
      { status: 500 }
    );
  }
}

