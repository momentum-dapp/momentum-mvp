// Contract addresses will be populated after deployment
export const CONTRACT_ADDRESSES = {
  VAULT: process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS || '',
  PORTFOLIO: process.env.NEXT_PUBLIC_PORTFOLIO_CONTRACT_ADDRESS || '',
} as const

// Asset configurations for Base chain
export const ASSETS = {
  WBTC: {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6', // Base mainnet
    decimals: 8,
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // Base mainnet
    decimals: 6,
  },
} as const

// Strategy configurations
export const STRATEGIES = {
  low: {
    name: 'Low Risk Strategy',
    allocations: {
      WBTC: 70,
      BIG_CAPS: 20,
      MID_LOWER_CAPS: 0,
      STABLECOINS: 10,
    },
  },
  medium: {
    name: 'Medium Risk Strategy',
    allocations: {
      WBTC: 50,
      BIG_CAPS: 30,
      MID_LOWER_CAPS: 15,
      STABLECOINS: 5,
    },
  },
  high: {
    name: 'High Risk Strategy',
    allocations: {
      WBTC: 30,
      BIG_CAPS: 25,
      MID_LOWER_CAPS: 40,
      STABLECOINS: 5,
    },
  },
} as const
