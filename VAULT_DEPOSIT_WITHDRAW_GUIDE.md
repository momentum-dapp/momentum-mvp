# Vault Deposit/Withdraw Implementation Guide

This guide explains the real fund deposit and withdrawal mechanism implemented for the Momentum Vault.

## Overview

The implementation enables users to deposit and withdraw ERC20 tokens to/from the MomentumVault smart contract on Base Sepolia. The system handles:
- Token approvals
- Vault deposits
- Vault withdrawals
- Transaction monitoring
- Database recording
- Error handling

## Architecture

### Smart Contracts
- **MomentumVault**: Main vault contract that holds user funds
  - Address: `0x27325be0cf6c908c282b64565ba05b8c7d0642de`
  - Supports whitelisted ERC20 tokens
  - Tracks user balances per token

### Supported Tokens (Base Sepolia)
- **USDC**: `0x4fd923620866ee5377cb072fd8a2c449a397b264`
- **WETH**: `0x7b6caad71a1618dfb66392be6f8cb71010349dff`
- **WBTC**: `0x34cef345900425a72c1421d47ebadd78d7dc8772`

## Implementation Components

### 1. Vault ABI (`src/lib/contracts/vaultABI.ts`)
Contains complete contract ABIs for:
- MomentumVault contract functions
- ERC20 token functions (approve, balanceOf, allowance)

### 2. Contract Addresses (`src/lib/contracts/addresses.ts`)
Centralized configuration for:
- Deployed contract addresses
- Token addresses with metadata
- Chain configuration (Base Sepolia - Chain ID: 84532)

### 3. Vault Service (`src/lib/web3/vault-service.ts`)
Core service class that handles all vault interactions:
- `deposit()`: Two-step deposit (approve + deposit)
- `withdraw()`: Single-step withdrawal
- `checkAllowance()`: Check ERC20 allowances
- `approveToken()`: Approve vault to spend tokens
- Balance checking for both wallet and vault

### 4. Web3Actions Component (`src/components/Web3Actions.tsx`)
User interface component that:
- Displays available tokens and balances
- Handles deposit/withdraw form
- Shows transaction status and errors
- Records transactions in database

## User Flow

### Deposit Flow
1. **User selects token and amount**
   - Component fetches wallet balances
   - Shows available tokens with balance > 0

2. **Click "Deposit"**
   - VaultService checks token whitelist status
   - Checks current allowance for vault

3. **Token Approval (if needed)**
   - If allowance < amount, requests approval
   - User confirms in wallet
   - Waits for approval confirmation

4. **Deposit Transaction**
   - Calls vault.deposit(token, amount)
   - User confirms in wallet
   - Waits for deposit confirmation

5. **Database Recording**
   - Records transaction in Supabase
   - Includes txHash, amount, asset, status

6. **UI Update**
   - Refreshes balances
   - Shows success message
   - Closes deposit form

### Withdraw Flow
1. **User selects amount to withdraw**
   - Only USDC withdrawals shown (vault base asset)
   - Shows vault balance

2. **Click "Withdraw"**
   - VaultService checks vault balance
   - Validates sufficient balance

3. **Withdrawal Transaction**
   - Calls vault.withdraw(token, amount)
   - User confirms in wallet
   - Waits for withdrawal confirmation

4. **Database Recording**
   - Records transaction in Supabase
   - Includes txHash, amount, asset, status

5. **UI Update**
   - Refreshes balances
   - Shows success message
   - Closes withdraw form

## Key Features

### ✅ Real On-Chain Transactions
- All transactions execute on Base Sepolia blockchain
- Uses wagmi/viem for Web3 interactions
- Proper transaction confirmation waiting

### ✅ Token Approval Handling
- Automatically checks if approval needed
- Requests approval only when necessary
- Shows approval status to user

### ✅ Transaction Status Monitoring
- Real-time status updates
- Shows: "Preparing...", "Approving...", "Depositing...", "Confirmed!"
- Transaction hash returned and recorded

### ✅ Error Handling
- Validates token whitelist status
- Checks sufficient balances
- Handles wallet rejections
- Shows user-friendly error messages

### ✅ Database Integration
- Records all transactions in Supabase
- Stores: txHash, approvalHash, amount, asset, status
- Links to portfolio ID

## Usage

### Prerequisites
1. **Wallet Connection**
   - User must have wallet connected via WalletConnect/Coinbase
   - Wallet must be on Base Sepolia network

2. **Test Tokens**
   - User needs test tokens (USDC, WETH, WBTC)
   - Mint test tokens using: `cd contracts && forge script script/MintMockTokens.s.sol --broadcast --rpc-url base-sepolia`

3. **Token Whitelist**
   - Tokens must be whitelisted in vault
   - Contact vault owner to whitelist new tokens

### Depositing Funds
```typescript
// User flow in Web3Actions component:
1. Click "Deposit Funds"
2. Select token (USDC, WETH, or WBTC)
3. Enter amount
4. Click "Deposit [TOKEN]"
5. Approve token spend in wallet (if needed)
6. Confirm deposit transaction in wallet
7. Wait for confirmation
```

### Withdrawing Funds
```typescript
// User flow in Web3Actions component:
1. Click "Withdraw Funds"
2. Select USDC (only option)
3. Enter amount
4. Click "Withdraw USDC"
5. Confirm withdrawal transaction in wallet
6. Wait for confirmation
```

## Technical Details

### Gas Optimization
- Approval only requested when necessary
- Uses `safeTransferFrom` for security
- Single transaction for withdrawal (no approval needed)

### Security Features
- ReentrancyGuard on vault functions
- Pausable contract for emergency stops
- Whitelisted tokens only
- User balances tracked separately

### Transaction Confirmation
```typescript
// Vault service waits for 1 confirmation
await publicClient.waitForTransactionReceipt({ 
  hash: txHash,
  confirmations: 1,
});
```

## Environment Variables Required

Add to `.env.local`:
```bash
# Contract addresses (defaults provided in code)
NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS=0x27325be0cf6c908c282b64565ba05b8c7d0642de
NEXT_PUBLIC_PORTFOLIO_CONTRACT_ADDRESS=0x7e2372c80993ff043cffa5e5d15bf7eb6a319161

# RPC URL
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
```

## Testing

### Test Deposit
1. Ensure you have test USDC tokens
2. Connect wallet on Base Sepolia
3. Navigate to Portfolio page
4. Click "Deposit Funds"
5. Select USDC, enter amount (e.g., "10")
6. Approve and confirm transactions
7. Verify balance updated in UI

### Test Withdraw
1. Ensure you have deposited USDC in vault
2. Click "Withdraw Funds"
3. Enter amount to withdraw
4. Confirm transaction
5. Verify USDC received in wallet

### Verify On-Chain
Check transactions on Base Sepolia explorer:
- Vault: https://sepolia.basescan.org/address/0x27325be0cf6c908c282b64565ba05b8c7d0642de
- Your wallet transactions

## Troubleshooting

### "Token not whitelisted" Error
- Solution: Token needs to be whitelisted by vault owner
- Contact admin or run whitelist script

### "Insufficient balance" Error
- Solution: Check you have enough tokens in wallet (for deposit) or vault (for withdraw)
- Verify balances displayed in UI

### Transaction Stuck/Pending
- Solution: Check Base Sepolia network status
- Increase gas price if needed
- Wait for network congestion to clear

### Wallet Rejection
- Solution: User cancelled transaction
- Try again with correct amount

## Future Enhancements

### Planned Features
- [ ] Native ETH deposits (wrap to WETH automatically)
- [ ] Batch deposits/withdrawals
- [ ] Gas estimation display
- [ ] Transaction history in UI
- [ ] Multi-asset withdrawals
- [ ] Deposit with permit (EIP-2612) for gasless approvals

### Advanced Features
- [ ] Zap-in: Swap any token to USDC on deposit
- [ ] Zap-out: Swap USDC to any token on withdraw
- [ ] Automatic portfolio rebalancing after deposit
- [ ] Scheduled deposits/withdrawals

## Code Examples

### Using VaultService Directly
```typescript
import { VaultService } from '@/lib/web3/vault-service';

// Initialize
const vaultService = new VaultService(walletClient, publicClient);

// Deposit 100 USDC
const result = await vaultService.deposit({
  tokenAddress: '0x4fd923620866ee5377cb072fd8a2c449a397b264',
  amount: '100',
  decimals: 6,
  userAddress: userAddress,
});

console.log('Deposit hash:', result.depositHash);
if (result.approvalHash) {
  console.log('Approval hash:', result.approvalHash);
}

// Withdraw 50 USDC
const withdrawHash = await vaultService.withdraw({
  tokenAddress: '0x4fd923620866ee5377cb072fd8a2c449a397b264',
  amount: '50',
  decimals: 6,
  userAddress: userAddress,
});

console.log('Withdraw hash:', withdrawHash);
```

### Checking Balances
```typescript
// Get vault balance
const vaultBalance = await vaultService.getUserBalance(
  userAddress,
  tokenAddress
);
console.log('Vault balance:', vaultService.formatBalance(vaultBalance, 6));

// Get wallet balance
const walletBalance = await vaultService.getWalletBalance(
  userAddress,
  tokenAddress
);
console.log('Wallet balance:', vaultService.formatBalance(walletBalance, 6));
```

## Support

For issues or questions:
1. Check transaction on Base Sepolia explorer
2. Review console logs for detailed error messages
3. Verify wallet connection and network
4. Check token balances and allowances

## References

- [MomentumVault Contract](contracts/src/MomentumVault.sol)
- [Base Sepolia Explorer](https://sepolia.basescan.org/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)

