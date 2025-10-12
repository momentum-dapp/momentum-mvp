## Project Overview
Momentum is an AI-powered portfolio management platform built on Base blockchain. 
Users sign in with Google, deposit crypto into a secure smart contract vault, and enable AI-driven automatic rebalancing.

## Application Flow

1. **User Login via SSO (Google)**
   - User authenticates using Google OAuth through Clerk
   - Secure authentication flow with session management

2. **Automatic Wallet Creation**
   - After successful login, if user is new, the system automatically creates a smart wallet
   - Wallet is created using ZeroDev Account Abstraction for gasless transactions
   - Wallet address is linked to user's Google account

3. **Fund Deposit**
   - User can now deposit crypto funds to their automatically created wallet
   - Deposits are secured through smart contract vaults
   - Real-time balance tracking and transaction history

4. **AI Chatbot Interaction**
   - User interacts with AI chatbot to discuss investment strategies
   - Chatbot powered by OpenAI GPT-4o-mini for intelligent financial advice

5. **Strategy Selection**
   - AI chatbot presents user with 3 investment strategy options based on asset composition:
   
   **Asset Types:**
   - **WBTC**: Bitcoin exposure through Wrapped Bitcoin
   - **Big Caps**: ETH and major L1/L2 cryptocurrencies (market cap > $10B)
   - **Mid/Lower Caps**: Smaller L1/L2 cryptocurrencies (market cap < $10B)
   - **Stablecoins**: USD-pegged stablecoins (USDC, USDT, DAI)
   
   **Strategy Compositions:**
   - **Low Risk Strategy**: WBTC 70%, Big Caps 20%, Stablecoins 10%
   - **Medium Risk Strategy**: WBTC 50%, Big Caps 30%, Mid/Lower Caps 15%, Stablecoins 5%
   - **High Risk Strategy**: WBTC 30%, Big Caps 25%, Mid/Lower Caps 40%, Stablecoins 5%
   
   **Market Condition Adjustments:**
   - **Bearish Market**: All strategies automatically shift to 100% Stablecoins to preserve capital
   - **Market Recovery**: Strategies gradually return to original allocations based on market sentiment analysis

6. **Strategy Implementation**
   - User selects their preferred risk strategy
   - Selection is recorded and stored in user profile

7. **Automatic Asset Management**
   - AI chatbot automatically manages the user's portfolio based on selected strategy
   - Continuous monitoring and rebalancing of assets
   - Real-time adjustments based on market conditions and strategy parameters

### Tech Stack Summary

Frontend: Next.js 14, TypeScript, Tailwind CSS, Wagmi, RainbowKit
Backend: Next.js API Routes, Supabase PostgreSQL
Smart Contracts: Solidity 0.8.23, Foundry, UUPS Upgradeable Pattern
AI: OpenAI GPT-4o-mini
Authentication: Clerk (Google OAuth)
Smart Wallets: ZeroDev (Account Abstraction)
DEX Integration: Uniswap V3 (for token swaps and liquidity)
Blockchain: Base Sepolia Testnet
Deployment: Vercel

### Project Structure

momentum-mvp/
├── app/                    # Next.js App Router
│   ├── api/               # Backend API routes
│   ├── dashboard/         # Dashboard pages
│   └── page.tsx           # Landing page
├── components/            # React components
├── lib/                   # Utilities & helpers
│   ├── contracts/        # ABIs & addresses
│   ├── web3/            # Web3 utilities
│   └── ai/              # AI utilities
├── contracts/            # Smart contracts (Foundry)
│   ├── src/             # Solidity files
│   ├── test/            # Contract tests
│   └── script/          # Deployment scripts
├── types/               # TypeScript types
└── public/              # Static assets