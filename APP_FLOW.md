# Momentum MVP - App Flow

This document outlines the updated user flow for the Momentum MVP application.

## User Flow

### 1. Login (SSO)
- Users land on the home page
- If not authenticated, they see a sign-in button
- If authenticated, they are automatically redirected to the dashboard
- Uses Clerk for authentication

### 2. Create Wallet (if new user)
- After login, users are redirected to the dashboard
- If no wallet exists, they see a wallet creation flow
- Uses WalletConnection component to create a smart wallet
- Once wallet is created, they can proceed to portfolio creation

### 3. Dashboard Page
- Shows wallet balance, wallet address, and portfolio overview
- Displays portfolio value and performance metrics
- Navigation includes: Overview, Transactions, AI Advisor, AI Assistant, Settings

### 4. User Chooses AI Advisor Page
- Users can access the AI Advisor from the dashboard navigation
- Dedicated page at `/ai-advisor` for portfolio strategy consultation
- Clean, focused interface for AI interaction

### 5. User Asks AI About Portfolio Management Strategy
- AI asks clarifying questions about:
  - Investment experience level
  - Risk tolerance
  - Investment timeline
  - Financial goals
- AI provides educational content about cryptocurrency investments
- Conversation is guided to understand user preferences

### 6. AI Gives Three Options (Low, Medium, High) with Strategy Details
- AI presents three investment strategies:
  - **Low Risk**: WBTC 70%, Big Caps 20%, Stablecoins 10%
  - **Medium Risk**: WBTC 50%, Big Caps 30%, Mid/Lower Caps 15%, Stablecoins 5%
  - **High Risk**: WBTC 30%, Big Caps 25%, Mid/Lower Caps 40%, Stablecoins 5%
- Each strategy shows:
  - Risk level
  - Expected return
  - Detailed allocation breakdown
  - Description of the approach

### 7. User Chooses the Strategy
- User selects their preferred strategy from the three options
- Selection is highlighted with visual feedback
- User can review the allocation before confirming

### 8. AI Executes Strategy Immediately via Uniswap DEX
- Upon confirmation, AI immediately executes the strategy
- Tokens are swapped on Uniswap to match the selected allocation
- Transaction hash is provided for tracking
- User is redirected back to dashboard to monitor progress
- Portfolio is automatically rebalanced based on the selected strategy

## Technical Implementation

### Key Components
- `AIAdvisor.tsx`: Main AI consultation interface
- `AIAdvisorPage`: Dedicated page for AI consultation
- `execute-strategy` API: Handles strategy execution via Uniswap
- Updated dashboard flow with AI Advisor integration

### API Endpoints
- `/api/chat`: AI conversation handling
- `/api/execute-strategy`: Strategy execution and token swapping
- `/api/wallet`: Wallet management
- `/api/portfolio`: Portfolio management

### Features
- Real-time AI conversation
- Strategy visualization and selection
- Automatic token swapping via Uniswap
- Portfolio tracking and monitoring
- Responsive design for all devices

## User Experience
- Seamless flow from login to portfolio execution
- Clear visual feedback at each step
- Educational AI guidance throughout the process
- Immediate execution of chosen strategy
- Easy monitoring of portfolio performance
