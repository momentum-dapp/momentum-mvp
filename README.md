# Momentum MVP

AI-powered portfolio management platform built on Base blockchain with automatic rebalancing capabilities.

## 🚀 Features

- **AI-Driven Investment Strategies**: GPT-4o-mini powered chatbot for personalized portfolio recommendations
- **Smart Wallet Integration**: Gasless transactions using ZeroDev Account Abstraction
- **Automatic Rebalancing**: Dynamic portfolio adjustments based on market conditions
- **Three Risk Strategies**: Conservative, Balanced, and Aggressive investment approaches
- **Real-time Portfolio Tracking**: Live balance updates and transaction history
- **Secure Authentication**: Google OAuth via Clerk with robust user management

## 🛠 Tech Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Wagmi & RainbowKit** for Web3 integration
- **React Query** for data fetching

### Backend
- **Next.js API Routes** for serverless functions
- **Supabase** for PostgreSQL database
- **Clerk** for authentication
- **OpenAI GPT-4o-mini** for AI advisory

### Smart Contracts
- **Solidity 0.8.23** with Foundry framework
- **UUPS Upgradeable** proxy pattern
- **OpenZeppelin** security standards
- **Base Sepolia** testnet deployment

### Infrastructure
- **Vercel** for deployment
- **ZeroDev** for smart wallet management
- **Alchemy** for blockchain RPC

## 📁 Project Structure

```
momentum-mvp/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # Backend API routes
│   │   ├── dashboard/         # Dashboard pages
│   │   └── page.tsx           # Landing page
│   ├── components/            # React components
│   ├── lib/                   # Utilities & helpers
│   │   ├── contracts/         # ABIs & addresses
│   │   ├── web3/             # Web3 utilities
│   │   ├── ai/               # AI utilities
│   │   └── services/         # Database services
│   └── types/                # TypeScript types
├── contracts/                 # Smart contracts (Foundry)
│   ├── src/                  # Solidity files
│   ├── test/                 # Contract tests
│   └── script/               # Deployment scripts
└── __tests__/                # Frontend tests
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd momentum-mvp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory with the following variables:
   ```bash
   # Clerk Authentication (Required)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
   CLERK_SECRET_KEY=your_clerk_secret_key_here
   
   # Clerk URLs (Optional - defaults to Clerk's hosted pages)
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
   
   # Supabase (Required for database)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   
   # OpenAI (Required for AI features)
   OPENAI_API_KEY=your_openai_api_key_here
   ```
   
   **Note**: If Clerk environment variables are not configured, the app will run without authentication features enabled.

4. **Set up the database**
   - Create a Supabase project
   - Run the SQL schema from `database-schema.sql`

5. **Install Foundry (for smart contracts)**
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

6. **Build smart contracts**
   ```bash
   npm run contracts:build
   ```

7. **Run the development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🧪 Testing

### Frontend Tests
```bash
npm test
```

### Smart Contract Tests
```bash
npm run contracts:test
```

### Type Checking
```bash
npm run type-check
```

## 📱 Investment Strategies

### Conservative Strategy (Low Risk)
- **WBTC**: 70% - Bitcoin exposure through Wrapped Bitcoin
- **Big Caps**: 20% - Major cryptocurrencies (ETH, major L1/L2s)
- **Stablecoins**: 10% - USD-pegged stablecoins

### Balanced Strategy (Medium Risk)
- **WBTC**: 50% - Bitcoin exposure
- **Big Caps**: 30% - Major cryptocurrencies
- **Mid/Lower Caps**: 15% - Emerging cryptocurrencies
- **Stablecoins**: 5% - Stable assets

### Aggressive Strategy (High Risk)
- **WBTC**: 30% - Bitcoin exposure
- **Big Caps**: 25% - Major cryptocurrencies
- **Mid/Lower Caps**: 40% - Emerging cryptocurrencies
- **Stablecoins**: 5% - Stable assets

### Market Condition Adjustments
- **Bearish Market**: All strategies automatically shift to 100% Stablecoins
- **Market Recovery**: Gradual return to original allocations based on AI analysis

## 🔐 Security Features

- **UUPS Upgradeable Contracts**: Secure upgrade mechanism
- **Access Control**: Role-based permissions
- **Emergency Pause**: Circuit breaker functionality
- **Row Level Security**: Database-level access control
- **Smart Wallet**: Gasless transactions with account abstraction

## 🚀 Deployment

### Vercel Deployment
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Smart Contract Deployment
```bash
# Deploy to Base Sepolia
cd contracts
forge script script/Deploy.s.sol --rpc-url base-sepolia --broadcast --verify
```

## 📊 API Endpoints

### Authentication
- `POST /api/webhooks/clerk` - Clerk webhook handler

### Portfolio Management
- `GET /api/portfolio` - Get user portfolio
- `POST /api/portfolio` - Create portfolio
- `PUT /api/portfolio` - Update portfolio

### Transactions
- `GET /api/transactions` - Get transaction history
- `POST /api/transactions` - Create transaction record

### AI Services
- `POST /api/chat` - AI chatbot interaction
- `POST /api/ai/risk-assessment` - Risk tolerance analysis
- `GET /api/ai/market-sentiment` - Market sentiment analysis

### Wallet Management
- `GET /api/wallet` - Get wallet information
- `POST /api/wallet` - Create smart wallet

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract standards
- Clerk for authentication infrastructure
- Supabase for database and real-time capabilities
- ZeroDev for smart wallet infrastructure
- Base blockchain for fast and low-cost transactions

## ⚠️ Disclaimer

This is an MVP (Minimum Viable Product) for demonstration purposes. Do not use with real funds without proper security audits and testing. Cryptocurrency investments carry significant risks.