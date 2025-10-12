export interface User {
  id: string;
  email: string;
  walletAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Portfolio {
  id: string;
  userId: string;
  strategy: 'low' | 'medium' | 'high';
  totalValue: number;
  allocations: PortfolioAllocation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioAllocation {
  assetType: 'WBTC' | 'BIG_CAPS' | 'MID_LOWER_CAPS' | 'STABLECOINS';
  percentage: number;
  currentValue: number;
}

export interface Transaction {
  id: string;
  userId: string;
  portfolioId: string;
  type: 'deposit' | 'withdrawal' | 'rebalance' | 'swap';
  amount: number;
  asset: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface MarketData {
  asset: string;
  price: number;
  change24h: number;
  marketCap: number;
  lastUpdated: Date;
}
