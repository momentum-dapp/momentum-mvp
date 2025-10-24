# Quick Start - Using the Vault

## 🚀 5-Minute Setup

### 1. Prerequisites (2 minutes)
```bash
# Ensure you have test tokens
cd contracts
forge script script/MintMockTokens.s.sol --broadcast --rpc-url base-sepolia
```

### 2. Start the App (30 seconds)
```bash
cd /Users/chidx/Documents/Learn/momentum-mvp
npm run dev
```

### 3. Make Your First Deposit (2 minutes)

1. **Open app**: http://localhost:3000/portfolio
2. **Connect wallet**: Click "Connect Wallet" → Choose Coinbase or WalletConnect
3. **Switch network**: Ensure you're on "Base Sepolia"
4. **Click "Deposit Funds"**
5. **Select token**: Choose "USDC"
6. **Enter amount**: Type `10`
7. **Click "Deposit USDC"**
8. **Approve in wallet**: Confirm the approval transaction (first time only)
9. **Deposit in wallet**: Confirm the deposit transaction
10. **Success!**: See "Deposit confirmed!" message

### 4. Make Your First Withdrawal (1 minute)

1. **Click "Withdraw Funds"**
2. **Enter amount**: Type `5`
3. **Click "Withdraw USDC"**
4. **Confirm in wallet**: Confirm the withdrawal transaction
5. **Success!**: See "Withdrawal confirmed!" message

## 📊 What Just Happened?

### Your Deposit Journey
```
Your Wallet (10 USDC)
       ↓
[Approve vault to spend USDC] ← Wallet confirmation needed
       ↓
[Transfer USDC to vault] ← Wallet confirmation needed
       ↓
Vault (10 USDC) ← Your balance tracked on-chain
       ↓
Database Record ← Transaction history saved
       ↓
UI Updated ← You see new balance
```

### Your Withdrawal Journey
```
Vault (10 USDC) ← Your on-chain balance
       ↓
[Transfer USDC from vault] ← Wallet confirmation needed
       ↓
Your Wallet (5 USDC received)
       ↓
Database Record ← Transaction history saved
       ↓
UI Updated ← You see new balance
```

## 🎯 Key Features

✅ **Real blockchain transactions** - Not simulated, actual Base Sepolia
✅ **Automatic approvals** - System handles ERC20 approvals
✅ **Transaction tracking** - Every transaction recorded
✅ **Balance updates** - Real-time balance sync
✅ **Error handling** - Clear messages if something goes wrong

## 🔍 How to Verify

### Check Your Vault Balance
```bash
cast call 0x27325be0cf6c908c282b64565ba05b8c7d0642de \
  "getUserBalance(address,address)(uint256)" \
  YOUR_WALLET_ADDRESS \
  0x4fd923620866ee5377cb072fd8a2c449a397b264 \
  --rpc-url https://sepolia.base.org
```

### View on Explorer
Visit: https://sepolia.basescan.org/address/0x27325be0cf6c908c282b64565ba05b8c7d0642de

## 💡 Pro Tips

**First Deposit?**
- You'll need to approve the vault to spend your tokens (one-time per token)
- This requires 2 wallet confirmations
- Subsequent deposits only need 1 confirmation

**Want to Withdraw?**
- Currently only USDC withdrawals are shown in the UI
- You can withdraw any amount up to your vault balance
- Only requires 1 wallet confirmation

**Transaction Taking Long?**
- Base Sepolia transactions usually confirm in 2-5 seconds
- Check your wallet for pending transactions
- Verify you have enough ETH for gas

## 🆘 Common Issues

### "Token not whitelisted"
**Fix**: Run the whitelist script
```bash
cd contracts
forge script script/WhitelistTokens.s.sol --broadcast --rpc-url base-sepolia
```

### "Insufficient balance"
**Fix**: Check you have enough tokens
```bash
# Check your USDC balance
cast call 0x4fd923620866ee5377cb072fd8a2c449a397b264 \
  "balanceOf(address)(uint256)" \
  YOUR_WALLET_ADDRESS \
  --rpc-url https://sepolia.base.org
```

### "Transaction failed"
**Fix**: 
1. Check console for detailed error
2. Verify network is Base Sepolia
3. Ensure you have ETH for gas
4. Try again with a smaller amount

## 📱 Supported Tokens

Currently supported on Base Sepolia:
- **USDC**: `0x4fd923620866ee5377cb072fd8a2c449a397b264`
- **WETH**: `0x7b6caad71a1618dfb66392be6f8cb71010349dff`
- **WBTC**: `0x34cef345900425a72c1421d47ebadd78d7dc8772`

## 🔐 Security Notes

- Your funds are stored in a secure, upgradeable smart contract
- Only you can deposit and withdraw your funds
- The vault uses OpenZeppelin's security standards
- All transactions are recorded on the blockchain
- You maintain full custody through your wallet

## 📈 What's Next?

After depositing:
1. Your funds will be automatically allocated to your portfolio strategy
2. The AI oracle will monitor market conditions
3. Periodic rebalancing will optimize your holdings
4. You can withdraw anytime

## 🛠️ For Developers

Want to integrate this into your own code?

```typescript
import { VaultService } from '@/lib/web3/vault-service';

// Initialize
const vaultService = new VaultService(walletClient, publicClient);

// Deposit
await vaultService.deposit({
  tokenAddress: '0x4fd923620866ee5377cb072fd8a2c449a397b264', // USDC
  amount: '100', // 100 USDC
  decimals: 6,
  userAddress: userAddress,
});

// Withdraw
await vaultService.withdraw({
  tokenAddress: '0x4fd923620866ee5377cb072fd8a2c449a397b264', // USDC
  amount: '50', // 50 USDC
  decimals: 6,
  userAddress: userAddress,
});
```

## 📚 More Resources

- **Full Guide**: [VAULT_DEPOSIT_WITHDRAW_GUIDE.md](VAULT_DEPOSIT_WITHDRAW_GUIDE.md)
- **Testing**: [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **Implementation**: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)

## ✅ Success!

If you've made it this far:
- ✅ You have real funds in the vault on Base Sepolia
- ✅ Your transaction is recorded on the blockchain
- ✅ You can withdraw anytime
- ✅ You're ready to use the full Momentum platform

**Welcome to decentralized portfolio management! 🎉**

