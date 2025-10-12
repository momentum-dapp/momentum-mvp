import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { UserService } from '@/lib/services/user-service';
import { PortfolioService } from '@/lib/services/portfolio-service';
import { STRATEGIES } from '@/lib/contracts/addresses';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database, create if doesn't exist
    let dbUser = await UserService.getUserByClerkId(user.id);
    if (!dbUser) {
      // Create user if they don't exist (fallback for cases where webhook didn't fire)
      dbUser = await UserService.createUser({
        clerk_id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
      });
      
      if (!dbUser) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
    }

    // Get user's portfolio
    const portfolio = await PortfolioService.getUserPortfolio(dbUser.id);

    if (!portfolio) {
      return NextResponse.json({ 
        hasPortfolio: false,
        message: 'No active portfolio found'
      });
    }

    return NextResponse.json({
      hasPortfolio: true,
      portfolio: {
        id: portfolio.id,
        strategy: portfolio.strategy,
        totalValue: portfolio.total_value,
        allocations: {
          WBTC: portfolio.wbtc_allocation,
          BIG_CAPS: portfolio.big_caps_allocation,
          MID_LOWER_CAPS: portfolio.mid_lower_caps_allocation,
          STABLECOINS: portfolio.stablecoins_allocation,
        },
        lastRebalanced: portfolio.last_rebalanced,
        isActive: portfolio.is_active,
        createdAt: portfolio.created_at,
        updatedAt: portfolio.updated_at,
      }
    });

  } catch (error) {
    console.error('Portfolio API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}

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

    // Get user from database, create if doesn't exist
    let dbUser = await UserService.getUserByClerkId(user.id);
    if (!dbUser) {
      // Create user if they don't exist (fallback for cases where webhook didn't fire)
      dbUser = await UserService.createUser({
        clerk_id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
      });
      
      if (!dbUser) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
    }

    // Check if user already has an active portfolio
    const existingPortfolio = await PortfolioService.getUserPortfolio(dbUser.id);
    if (existingPortfolio) {
      return NextResponse.json({ error: 'User already has an active portfolio' }, { status: 400 });
    }

    // Get strategy allocations
    const strategyConfig = STRATEGIES[strategy as keyof typeof STRATEGIES];

    // Create new portfolio
    const portfolio = await PortfolioService.createPortfolio({
      user_id: dbUser.id,
      strategy: strategy as 'low' | 'medium' | 'high',
      wbtc_allocation: strategyConfig.allocations.WBTC,
      big_caps_allocation: strategyConfig.allocations.BIG_CAPS,
      mid_lower_caps_allocation: strategyConfig.allocations.MID_LOWER_CAPS,
      stablecoins_allocation: strategyConfig.allocations.STABLECOINS,
    });

    if (!portfolio) {
      return NextResponse.json({ error: 'Failed to create portfolio' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      portfolio: {
        id: portfolio.id,
        strategy: portfolio.strategy,
        totalValue: portfolio.total_value,
        allocations: {
          WBTC: portfolio.wbtc_allocation,
          BIG_CAPS: portfolio.big_caps_allocation,
          MID_LOWER_CAPS: portfolio.mid_lower_caps_allocation,
          STABLECOINS: portfolio.stablecoins_allocation,
        },
        lastRebalanced: portfolio.last_rebalanced,
        isActive: portfolio.is_active,
        createdAt: portfolio.created_at,
      }
    });

  } catch (error) {
    console.error('Portfolio creation API error:', error);
    return NextResponse.json(
      { error: 'Failed to create portfolio' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { strategy, allocations } = await request.json();

    // Get user from database
    const dbUser = await UserService.getUserByClerkId(user.id);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's portfolio
    const portfolio = await PortfolioService.getUserPortfolio(dbUser.id);
    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    let updatedPortfolio;

    if (strategy) {
      // Update strategy
      if (!['low', 'medium', 'high'].includes(strategy)) {
        return NextResponse.json({ error: 'Invalid strategy' }, { status: 400 });
      }

      const strategyConfig = STRATEGIES[strategy as keyof typeof STRATEGIES];
      updatedPortfolio = await PortfolioService.updateStrategy(portfolio.id, strategy, {
        wbtc: strategyConfig.allocations.WBTC,
        bigCaps: strategyConfig.allocations.BIG_CAPS,
        midLowerCaps: strategyConfig.allocations.MID_LOWER_CAPS,
        stablecoins: strategyConfig.allocations.STABLECOINS,
      });
    } else if (allocations) {
      // Update custom allocations
      const total = allocations.WBTC + allocations.BIG_CAPS + allocations.MID_LOWER_CAPS + allocations.STABLECOINS;
      if (total !== 100) {
        return NextResponse.json({ error: 'Allocations must sum to 100%' }, { status: 400 });
      }

      updatedPortfolio = await PortfolioService.updatePortfolio(portfolio.id, {
        wbtc_allocation: allocations.WBTC,
        big_caps_allocation: allocations.BIG_CAPS,
        mid_lower_caps_allocation: allocations.MID_LOWER_CAPS,
        stablecoins_allocation: allocations.STABLECOINS,
        last_rebalanced: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({ error: 'Strategy or allocations required' }, { status: 400 });
    }

    if (!updatedPortfolio) {
      return NextResponse.json({ error: 'Failed to update portfolio' }, { status: 500 });
    }

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
    console.error('Portfolio update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update portfolio' },
      { status: 500 }
    );
  }
}