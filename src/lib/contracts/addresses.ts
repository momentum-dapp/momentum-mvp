// Contract addresses from deployment on Base Sepolia (Chain ID: 84532)
export const CONTRACT_ADDRESSES = {
  // Vault Proxy Address
  VAULT: (process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS || '0x27325be0cf6c908c282b64565ba05b8c7d0642de') as `0x${string}`,
  // Portfolio Manager Proxy Address
  PORTFOLIO: (process.env.NEXT_PUBLIC_PORTFOLIO_CONTRACT_ADDRESS || '0x7e2372c80993ff043cffa5e5d15bf7eb6a319161') as `0x${string}`,
  // AI Oracle Proxy Address
  AI_ORACLE: '0x6404e06bbed4d5c90dc0ca5bf400f48ca2127fac' as `0x${string}`,
} as const

// Asset configurations for Base Sepolia (Test tokens from deployment)
export const ASSETS = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x4fd923620866ee5377cb072fd8a2c449a397b264' as `0x${string}`, // Base Sepolia Mock
    decimals: 6,
  },
  WETH: {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: '0x7b6caad71a1618dfb66392be6f8cb71010349dff' as `0x${string}`, // Base Sepolia Mock
    decimals: 18,
  },
  WBTC: {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: '0x34cef345900425a72c1421d47ebadd78d7dc8772' as `0x${string}`, // Base Sepolia Mock
    decimals: 8,
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    decimals: 18,
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
