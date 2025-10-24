# Token Mapping for Momentum Portfolio

## Overview

This document maps tokens to the 4 asset categories used in portfolio strategies.

## Asset Categories

### 1. WBTC Allocation (Bitcoin Exposure)

Tokens that provide Bitcoin exposure:

| Token | Symbol | Decimals | Description | Testnet Address |
|-------|--------|----------|-------------|-----------------|
| Wrapped Bitcoin | WBTC | 8 | Standard wrapped BTC | `$MOCK_WBTC` |
| Coinbase Wrapped BTC | cbBTC | 8 | Coinbase's BTC wrapper | `$MOCK_CBBTC` |

**Usage in Strategies:**
- Low Risk: 70%
- Medium Risk: 50%
- High Risk: 30%

---

### 2. BIG_CAPS Allocation (Major Cryptocurrencies)

Large market cap, established cryptocurrencies:

| Token | Symbol | Decimals | Description | Testnet Address |
|-------|--------|----------|-------------|-----------------|
| Wrapped Ether | WETH | 18 | Ethereum wrapper | `$MOCK_WETH` |
| Coinbase Wrapped Staked ETH | cbETH | 18 | Staked ETH from Coinbase | `$MOCK_CBETH` |

**Usage in Strategies:**
- Low Risk: 20%
- Medium Risk: 30%
- High Risk: 25%

---

### 3. MID_LOWER_CAPS Allocation (Emerging Cryptocurrencies)

Mid to lower market cap tokens with higher risk/reward:

| Token | Symbol | Decimals | Description | Testnet Address |
|-------|--------|----------|-------------|-----------------|
| Aerodrome Finance | AERO | 18 | Base native DEX token | `$MOCK_AERO` |
| Brett | BRETT | 18 | Base meme coin | `$MOCK_BRETT` |
| Degen | DEGEN | 18 | Degen ecosystem token | `$MOCK_DEGEN` |
| Toshi | TOSHI | 18 | Base community token | `$MOCK_TOSHI` |

**Usage in Strategies:**
- Low Risk: 0%
- Medium Risk: 15%
- High Risk: 40%

---

### 4. STABLECOINS Allocation (Stable Value)

USD-pegged stablecoins for stability:

| Token | Symbol | Decimals | Description | Testnet Address |
|-------|--------|----------|-------------|-----------------|
| USD Coin | USDC | 6 | Primary stablecoin (Circle) | `$MOCK_USDC` |
| Dai | DAI | 18 | Decentralized stablecoin | `$MOCK_DAI` |

**Usage in Strategies:**
- Low Risk: 10%
- Medium Risk: 5%
- High Risk: 5%
- Bearish Market: 100% (emergency)

---

## Frontend Configuration

### Token Config JSON

Use this structure in your frontend:

```typescript
// src/config/tokens.ts
export const TOKENS = {
  WBTC_CATEGORY: [
    {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      address: process.env.NEXT_PUBLIC_MOCK_WBTC,
      decimals: 8,
      icon: '/tokens/wbtc.svg',
    },
    {
      symbol: 'cbBTC',
      name: 'Coinbase Wrapped BTC',
      address: process.env.NEXT_PUBLIC_MOCK_CBBTC,
      decimals: 8,
      icon: '/tokens/cbbtc.svg',
    },
  ],
  BIG_CAPS: [
    {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: process.env.NEXT_PUBLIC_MOCK_WETH,
      decimals: 18,
      icon: '/tokens/weth.svg',
    },
    {
      symbol: 'cbETH',
      name: 'Coinbase Wrapped Staked ETH',
      address: process.env.NEXT_PUBLIC_MOCK_CBETH,
      decimals: 18,
      icon: '/tokens/cbeth.svg',
    },
  ],
  MID_LOWER_CAPS: [
    {
      symbol: 'AERO',
      name: 'Aerodrome Finance',
      address: process.env.NEXT_PUBLIC_MOCK_AERO,
      decimals: 18,
      icon: '/tokens/aero.svg',
    },
    {
      symbol: 'BRETT',
      name: 'Brett',
      address: process.env.NEXT_PUBLIC_MOCK_BRETT,
      decimals: 18,
      icon: '/tokens/brett.svg',
    },
    {
      symbol: 'DEGEN',
      name: 'Degen',
      address: process.env.NEXT_PUBLIC_MOCK_DEGEN,
      decimals: 18,
      icon: '/tokens/degen.svg',
    },
    {
      symbol: 'TOSHI',
      name: 'Toshi',
      address: process.env.NEXT_PUBLIC_MOCK_TOSHI,
      decimals: 18,
      icon: '/tokens/toshi.svg',
    },
  ],
  STABLECOINS: [
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: process.env.NEXT_PUBLIC_MOCK_USDC,
      decimals: 6,
      icon: '/tokens/usdc.svg',
      isPrimary: true,
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: process.env.NEXT_PUBLIC_MOCK_DAI,
      decimals: 18,
      icon: '/tokens/dai.svg',
      isPrimary: false,
    },
  ],
};

// Helper to get all tokens
export const getAllTokens = () => {
  return [
    ...TOKENS.WBTC_CATEGORY,
    ...TOKENS.BIG_CAPS,
    ...TOKENS.MID_LOWER_CAPS,
    ...TOKENS.STABLECOINS,
  ];
};

// Helper to get tokens by category
export const getTokensByCategory = (category: string) => {
  return TOKENS[category as keyof typeof TOKENS] || [];
};
```

### Environment Variables for Frontend

Add to `.env.local`:

```env
# Mock Token Addresses (Base Sepolia)
NEXT_PUBLIC_MOCK_WETH=0x...
NEXT_PUBLIC_MOCK_USDC=0x...
NEXT_PUBLIC_MOCK_CBETH=0x...
NEXT_PUBLIC_MOCK_CBBTC=0x...
NEXT_PUBLIC_MOCK_WBTC=0x...
NEXT_PUBLIC_MOCK_DAI=0x...
NEXT_PUBLIC_MOCK_AERO=0x...
NEXT_PUBLIC_MOCK_BRETT=0x...
NEXT_PUBLIC_MOCK_DEGEN=0x...
NEXT_PUBLIC_MOCK_TOSHI=0x...
```

## Portfolio Allocation Examples

### Low Risk Portfolio (Conservative)
```
WBTC:         70% (WBTC + cbBTC)
BIG_CAPS:     20% (WETH + cbETH)
MID_LOWER:     0% (None)
STABLECOINS:  10% (USDC primary)
```

### Medium Risk Portfolio (Balanced)
```
WBTC:         50% (WBTC + cbBTC)
BIG_CAPS:     30% (WETH + cbETH)
MID_LOWER:    15% (AERO, BRETT, DEGEN, TOSHI)
STABLECOINS:   5% (USDC primary)
```

### High Risk Portfolio (Aggressive)
```
WBTC:         30% (WBTC + cbBTC)
BIG_CAPS:     25% (WETH + cbETH)
MID_LOWER:    40% (AERO, BRETT, DEGEN, TOSHI)
STABLECOINS:   5% (USDC primary)
```

### Bearish Emergency (Market Crash)
```
WBTC:          0%
BIG_CAPS:      0%
MID_LOWER:     0%
STABLECOINS: 100% (All in USDC)
```

## Rebalancing Logic

When AI triggers rebalancing, the smart contracts will:

1. **Read target allocations** (custom or template)
2. **Calculate current holdings** from vault balances
3. **Compute deltas** between target and current
4. **Execute swaps** via Uniswap V3:
   - Sell tokens with excess allocation
   - Buy tokens with deficit allocation
5. **Update balances** with actual swap results

### Example Rebalance Flow

**Current holdings:**
```
User has 100% USDC ($10,000)
Target: 50% WBTC, 30% WETH, 20% USDC
```

**Swaps executed:**
```
1. Swap $5,000 USDC → WBTC (via Uniswap)
2. Swap $3,000 USDC → WETH (via Uniswap)
3. Keep $2,000 USDC
```

**Result:**
```
WBTC: ~0.15 BTC ($5,000)
WETH: ~1.5 ETH ($3,000)
USDC: $2,000
```

## Display in UI

### Portfolio Overview Card
```typescript
{TOKENS.WBTC_CATEGORY.map(token => (
  <TokenRow key={token.symbol}>
    <img src={token.icon} />
    <span>{token.symbol}</span>
    <span>{formatBalance(balance, token.decimals)}</span>
    <span>{formatUSD(value)}</span>
  </TokenRow>
))}
```

### Allocation Chart
```typescript
const chartData = [
  { name: 'WBTC', value: allocation.WBTC, color: '#F7931A' },
  { name: 'BIG_CAPS', value: allocation.BIG_CAPS, color: '#627EEA' },
  { name: 'MID_LOWER', value: allocation.MID_LOWER_CAPS, color: '#8247E5' },
  { name: 'STABLE', value: allocation.STABLECOINS, color: '#2775CA' },
];
```

## Testing Strategy

Test rebalancing between different categories:

1. **Start:** 100% USDC
2. **Rebalance to:** Medium risk (50% WBTC, 30% BIG_CAPS, 15% MID_LOWER, 5% STABLE)
3. **Verify:** Each token balance matches target allocation
4. **Test emergency:** Switch to 100% USDC in bearish market
5. **Restore:** Back to original strategy

## Notes

- **USDC is primary stablecoin** - Use for all stable allocations
- **DAI is backup** - Only use if USDC unavailable
- **Token selection within category** - Can be equal weighted or AI-optimized
- **Rebalancing frequency** - Minimum 1 hour cooldown between rebalances
- **Slippage tolerance** - Default 1%, max 10%

## Mainnet Differences

When deploying to Base Mainnet:

- Replace mock token addresses with real token addresses
- Verify token contracts on Basescan
- Check Uniswap V3 pool liquidity
- Test small amounts first
- Monitor gas costs

## References

- **Base Sepolia Explorer:** https://sepolia.basescan.org
- **Uniswap V3 Interface:** https://app.uniswap.org
- **Base Bridge:** https://bridge.base.org

