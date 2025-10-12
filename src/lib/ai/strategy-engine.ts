import { STRATEGIES } from '@/lib/contracts/addresses';
import { analyzeMarketSentiment } from './openai';

export interface PortfolioAllocation {
  WBTC: number;
  BIG_CAPS: number;
  MID_LOWER_CAPS: number;
  STABLECOINS: number;
}

export interface RebalanceRecommendation {
  shouldRebalance: boolean;
  newAllocations: PortfolioAllocation;
  reasoning: string;
  confidence: number;
}

export interface MarketConditions {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  volatility: 'low' | 'medium' | 'high';
  trend: 'up' | 'down' | 'sideways';
}

export class StrategyEngine {
  private static instance: StrategyEngine;
  private marketConditions: MarketConditions | null = null;
  private lastMarketUpdate: Date | null = null;

  private constructor() {}

  public static getInstance(): StrategyEngine {
    if (!StrategyEngine.instance) {
      StrategyEngine.instance = new StrategyEngine();
    }
    return StrategyEngine.instance;
  }

  /**
   * Get current market conditions (cached for 5 minutes)
   */
  async getMarketConditions(): Promise<MarketConditions> {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    if (!this.marketConditions || !this.lastMarketUpdate || this.lastMarketUpdate < fiveMinutesAgo) {
      try {
        const sentiment = await analyzeMarketSentiment();
        
        // Simulate additional market indicators (in production, this would come from real market data)
        this.marketConditions = {
          sentiment: sentiment.sentiment,
          volatility: this.calculateVolatility(sentiment.confidence),
          trend: this.determineTrend(sentiment.sentiment),
        };
        
        this.lastMarketUpdate = now;
      } catch (error) {
        console.error('Failed to update market conditions:', error);
        // Fallback to neutral conditions
        this.marketConditions = {
          sentiment: 'neutral',
          volatility: 'medium',
          trend: 'sideways',
        };
      }
    }

    return this.marketConditions;
  }

  /**
   * Calculate recommended portfolio allocations based on risk level and market conditions
   */
  async calculateOptimalAllocations(
    riskLevel: 'low' | 'medium' | 'high',
    currentAllocations?: PortfolioAllocation
  ): Promise<PortfolioAllocation> {
    const marketConditions = await this.getMarketConditions();
    
    // In bearish market, move to 100% stablecoins regardless of risk level
    if (marketConditions.sentiment === 'bearish') {
      return {
        WBTC: 0,
        BIG_CAPS: 0,
        MID_LOWER_CAPS: 0,
        STABLECOINS: 100,
      };
    }

    // Get base strategy allocations
    const baseStrategy = STRATEGIES[riskLevel];
    let allocations: PortfolioAllocation = { 
      WBTC: baseStrategy.allocations.WBTC,
      BIG_CAPS: baseStrategy.allocations.BIG_CAPS,
      MID_LOWER_CAPS: baseStrategy.allocations.MID_LOWER_CAPS,
      STABLECOINS: baseStrategy.allocations.STABLECOINS,
    };

    // Adjust based on market conditions
    if (marketConditions.sentiment === 'bullish' && marketConditions.volatility === 'low') {
      // Increase risk in favorable conditions
      allocations = this.increaseBullishExposure(allocations, riskLevel);
    } else if (marketConditions.volatility === 'high') {
      // Reduce risk in high volatility
      allocations = this.reduceVolatilityExposure(allocations);
    }

    return allocations;
  }

  /**
   * Determine if portfolio needs rebalancing
   */
  async shouldRebalance(
    currentAllocations: PortfolioAllocation,
    targetAllocations: PortfolioAllocation,
    threshold: number = 5
  ): Promise<RebalanceRecommendation> {
    const deviations = this.calculateDeviations(currentAllocations, targetAllocations);
    const maxDeviation = Math.max(...Object.values(deviations));
    
    const shouldRebalance = maxDeviation > threshold;
    
    if (!shouldRebalance) {
      return {
        shouldRebalance: false,
        newAllocations: currentAllocations,
        reasoning: `Portfolio is within acceptable deviation threshold (${maxDeviation.toFixed(1)}% max deviation)`,
        confidence: 95,
      };
    }

    const marketConditions = await this.getMarketConditions();
    let reasoning = `Portfolio deviation exceeds threshold (${maxDeviation.toFixed(1)}% max deviation). `;
    
    if (marketConditions.sentiment === 'bearish') {
      reasoning += 'Moving to defensive position due to bearish market conditions.';
    } else {
      reasoning += `Rebalancing to maintain target allocation for ${this.getMarketDescription(marketConditions)} market.`;
    }

    return {
      shouldRebalance: true,
      newAllocations: targetAllocations,
      reasoning,
      confidence: Math.min(95, 70 + maxDeviation),
    };
  }

  /**
   * Generate rebalancing strategy for multiple users
   */
  async generateBatchRebalancing(
    portfolios: Array<{
      userId: string;
      riskLevel: 'low' | 'medium' | 'high';
      currentAllocations: PortfolioAllocation;
    }>
  ): Promise<Array<{
    userId: string;
    recommendation: RebalanceRecommendation;
  }>> {
    const results = [];
    
    for (const portfolio of portfolios) {
      const targetAllocations = await this.calculateOptimalAllocations(
        portfolio.riskLevel,
        portfolio.currentAllocations
      );
      
      const recommendation = await this.shouldRebalance(
        portfolio.currentAllocations,
        targetAllocations
      );
      
      results.push({
        userId: portfolio.userId,
        recommendation,
      });
    }
    
    return results;
  }

  // Private helper methods
  private calculateVolatility(confidence: number): 'low' | 'medium' | 'high' {
    if (confidence > 80) return 'low';
    if (confidence > 50) return 'medium';
    return 'high';
  }

  private determineTrend(sentiment: 'bullish' | 'bearish' | 'neutral'): 'up' | 'down' | 'sideways' {
    switch (sentiment) {
      case 'bullish': return 'up';
      case 'bearish': return 'down';
      default: return 'sideways';
    }
  }

  private increaseBullishExposure(
    allocations: PortfolioAllocation,
    riskLevel: 'low' | 'medium' | 'high'
  ): PortfolioAllocation {
    // Slightly increase allocation to growth assets in bullish conditions
    const adjustment = riskLevel === 'high' ? 5 : riskLevel === 'medium' ? 3 : 2;
    
    return {
      WBTC: Math.min(100, allocations.WBTC + adjustment),
      BIG_CAPS: Math.min(100, allocations.BIG_CAPS + adjustment),
      MID_LOWER_CAPS: allocations.MID_LOWER_CAPS,
      STABLECOINS: Math.max(0, allocations.STABLECOINS - adjustment * 2),
    };
  }

  private reduceVolatilityExposure(allocations: PortfolioAllocation): PortfolioAllocation {
    // Increase stablecoin allocation in high volatility
    const stablecoinIncrease = 10;
    const reduction = stablecoinIncrease / 3;
    
    return {
      WBTC: Math.max(0, allocations.WBTC - reduction),
      BIG_CAPS: Math.max(0, allocations.BIG_CAPS - reduction),
      MID_LOWER_CAPS: Math.max(0, allocations.MID_LOWER_CAPS - reduction),
      STABLECOINS: Math.min(100, allocations.STABLECOINS + stablecoinIncrease),
    };
  }

  private calculateDeviations(
    current: PortfolioAllocation,
    target: PortfolioAllocation
  ): PortfolioAllocation {
    return {
      WBTC: Math.abs(current.WBTC - target.WBTC),
      BIG_CAPS: Math.abs(current.BIG_CAPS - target.BIG_CAPS),
      MID_LOWER_CAPS: Math.abs(current.MID_LOWER_CAPS - target.MID_LOWER_CAPS),
      STABLECOINS: Math.abs(current.STABLECOINS - target.STABLECOINS),
    };
  }

  private getMarketDescription(conditions: MarketConditions): string {
    return `${conditions.sentiment} ${conditions.volatility}-volatility`;
  }
}
