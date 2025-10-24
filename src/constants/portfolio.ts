/**
 * Centralized Portfolio Constants
 * These constants ensure consistency across all portfolio-related components
 * All values are mocked for demo purposes
 */

import { STRATEGIES } from '@/lib/contracts/addresses';

// Re-export STRATEGIES for centralized access
export { STRATEGIES };

// Mock portfolio base value for demo
export const MOCK_PORTFOLIO_BASE_VALUE = 12500.75;

// Strategy-based performance metrics for demo
export const STRATEGY_PERFORMANCE = {
  high: {
    performance24h: 3.2,
    performance7d: 15.8,
    performance30d: 34.5,
    performance90d: 58.9,
    sharpeRatio: 1.24,
    totalReturn: 78.4,
    winRate: 68,
  },
  medium: {
    performance24h: 2.1,
    performance7d: 11.2,
    performance30d: 24.8,
    performance90d: 42.1,
    sharpeRatio: 1.42,
    totalReturn: 56.2,
    winRate: 72,
  },
  low: {
    performance24h: 1.5,
    performance7d: 7.5,
    performance30d: 16.3,
    performance90d: 28.7,
    sharpeRatio: 0.98,
    totalReturn: 38.9,
    winRate: 78,
  },
} as const;

// Strategy display names
export const STRATEGY_NAMES = {
  low: 'Conservative Strategy',
  medium: 'Balanced Strategy',
  high: 'Aggressive Strategy',
} as const;

// Asset display names
export const ASSET_NAMES = {
  WBTC: 'Wrapped Bitcoin',
  BIG_CAPS: 'Major Cryptocurrencies',
  MID_LOWER_CAPS: 'Emerging Cryptocurrencies',
  STABLECOINS: 'Stablecoins',
} as const;

// Asset color classes for Tailwind
export const ASSET_COLORS = {
  WBTC: 'bg-orange-500',
  BIG_CAPS: 'bg-blue-500',
  MID_LOWER_CAPS: 'bg-purple-500',
  STABLECOINS: 'bg-green-500',
} as const;

// Performance chart target growth rates for demo
export const CHART_TARGET_GROWTH = {
  '7d': 0.125,  // 12.5% over 7 days
  '30d': 0.283, // 28.3% over 30 days
  '90d': 0.457, // 45.7% over 90 days
} as const;

// Chart volatility settings
export const CHART_VOLATILITY = 0.015; // 1.5% daily volatility
export const CHART_MIN_VALUE_RATIO = 0.95; // Don't drop below 95% of base value

/**
 * Get mocked performance data for a given strategy
 * @param strategy - The portfolio strategy type
 * @returns Performance metrics for the strategy
 */
export function getStrategyPerformance(strategy: 'low' | 'medium' | 'high') {
  return STRATEGY_PERFORMANCE[strategy];
}

/**
 * Calculate mocked wallet balance with 24h growth
 * @param baseValue - The base portfolio value
 * @param strategy - The portfolio strategy type
 * @returns The wallet balance with 24h performance applied
 */
export function calculateMockedWalletBalance(
  baseValue: number,
  strategy: 'low' | 'medium' | 'high'
): number {
  const performance = STRATEGY_PERFORMANCE[strategy];
  return baseValue * (1 + performance.performance24h / 100);
}

/**
 * Get strategy allocations
 * @param strategy - The portfolio strategy type
 * @returns The asset allocations for the strategy
 */
export function getStrategyAllocations(strategy: 'low' | 'medium' | 'high') {
  return STRATEGIES[strategy].allocations;
}

/**
 * Get default mock portfolio allocations for a given strategy
 * @param strategy - The portfolio strategy type
 * @returns Portfolio allocation object
 */
export function getMockPortfolioAllocations(strategy: 'low' | 'medium' | 'high') {
  const allocations = STRATEGIES[strategy].allocations;
  return {
    WBTC: allocations.WBTC,
    BIG_CAPS: allocations.BIG_CAPS,
    MID_LOWER_CAPS: allocations.MID_LOWER_CAPS,
    STABLECOINS: allocations.STABLECOINS,
  };
}

/**
 * Calculate asset value from total portfolio value and percentage
 * @param totalValue - Total portfolio value
 * @param percentage - Asset allocation percentage
 * @returns The value of the asset
 */
export function calculateAssetValue(totalValue: number, percentage: number): number {
  if (isNaN(totalValue) || isNaN(percentage) || totalValue <= 0) {
    return 0;
  }
  return (totalValue * percentage) / 100;
}

/**
 * Get complete mock portfolio with calculated values
 * @param strategy - The portfolio strategy type
 * @returns Complete portfolio with all calculated values
 */
export function getMockPortfolioWithValues(strategy: 'low' | 'medium' | 'high') {
  const allocations = getMockPortfolioAllocations(strategy);
  const totalValue = MOCK_PORTFOLIO_BASE_VALUE;
  
  return {
    id: 'portfolio-1',
    strategy,
    totalValue,
    allocations,
    currentValue: calculateMockedWalletBalance(totalValue, strategy),
    assetValues: {
      WBTC: calculateAssetValue(totalValue, allocations.WBTC),
      BIG_CAPS: calculateAssetValue(totalValue, allocations.BIG_CAPS),
      MID_LOWER_CAPS: calculateAssetValue(totalValue, allocations.MID_LOWER_CAPS),
      STABLECOINS: calculateAssetValue(totalValue, allocations.STABLECOINS),
    },
    lastRebalanced: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
  };
}

