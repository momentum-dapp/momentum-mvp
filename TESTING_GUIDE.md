# Testing Guide - Vault Deposit/Withdraw

## Quick Start Testing

### Step 1: Get Test Tokens

First, you need test tokens on Base Sepolia:

```bash
cd contracts

# Mint USDC tokens
forge script script/MintMockTokens.s.sol --broadcast --rpc-url base-sepolia

# Check your balance
cast balance YOUR_WALLET_ADDRESS --rpc-url https://sepolia.base.org
```

### Step 2: Whitelist Tokens (if needed)

Ensure tokens are whitelisted in the vault:

```bash
# Check if token is whitelisted
cast call 0x27325be0cf6c908c282b64565ba05b8c7d0642de \
  "whitelistedTokens(address)(bool)" \
  0x4fd923620866ee5377cb072fd8a2c449a397b264 \
  --rpc-url https://sepolia.base.org

# If returns false, whitelist it (requires vault owner)
forge script script/WhitelistTokens.s.sol --broadcast --rpc-url base-sepolia
```

### Step 3: Test Deposit Flow

1. **Start the app**
   ```bash
   npm run dev
   ```

2. **Connect wallet**
   - Navigate to http://localhost:3000/portfolio
   - Connect wallet using WalletConnect or Coinbase
   - Ensure you're on Base Sepolia network

3. **Execute deposit**
   - Click "Deposit Funds"
   - Select USDC
   - Enter amount: `10`
   - Click "Deposit USDC"
   
4. **Approve transaction (first time)**
   - Wallet will prompt for approval
   - Approve spending USDC
   - Wait for confirmation (~2-5 seconds)

5. **Deposit transaction**
   - Wallet will prompt for deposit
   - Confirm deposit
   - Wait for confirmation (~2-5 seconds)

6. **Verify success**
   - Should see "Deposit confirmed!" message
   - Balance should update
   - Check transaction on explorer

### Step 4: Test Withdraw Flow

1. **Execute withdrawal**
   - Click "Withdraw Funds"
   - Select USDC
   - Enter amount: `5`
   - Click "Withdraw USDC"

2. **Confirm transaction**
   - Wallet will prompt for withdrawal
   - Confirm withdrawal
   - Wait for confirmation (~2-5 seconds)

3. **Verify success**
   - Should see "Withdrawal confirmed!" message
   - Vault balance should decrease
   - Wallet balance should increase

## Manual Testing Checklist

### ✅ Deposit Tests

#### Test 1: First Deposit (with approval)
- [ ] Connect wallet
- [ ] Select USDC token
- [ ] Enter amount: 10
- [ ] Click Deposit
- [ ] Approve transaction appears
- [ ] Confirm approval
- [ ] Approval confirmed message
- [ ] Deposit transaction appears
- [ ] Confirm deposit
- [ ] Deposit confirmed message
- [ ] Balance updated in UI
- [ ] Transaction recorded in database

**Expected**: 2 transactions (approve + deposit)

#### Test 2: Second Deposit (no approval needed)
- [ ] Select USDC token
- [ ] Enter amount: 5
- [ ] Click Deposit
- [ ] Only deposit transaction appears
- [ ] Confirm deposit
- [ ] Deposit confirmed message
- [ ] Balance updated in UI

**Expected**: 1 transaction (deposit only)

#### Test 3: Deposit Different Token (WETH)
- [ ] Select WETH token
- [ ] Enter amount: 0.1
- [ ] Click Deposit
- [ ] Approve transaction (if first time)
- [ ] Deposit transaction
- [ ] Confirm both
- [ ] Balance updated

**Expected**: WETH balance in vault

#### Test 4: Deposit Error - Insufficient Balance
- [ ] Select USDC token
- [ ] Enter amount: 1000000 (more than you have)
- [ ] Click Deposit
- [ ] Should show error message
- [ ] No transaction executed

**Expected**: Error message shown

### ✅ Withdraw Tests

#### Test 5: Withdraw Partial Amount
- [ ] Click Withdraw Funds
- [ ] Select USDC
- [ ] Enter amount: 5
- [ ] Click Withdraw
- [ ] Confirm transaction
- [ ] Withdrawal confirmed message
- [ ] Vault balance decreased
- [ ] Wallet balance increased

**Expected**: Successful withdrawal

#### Test 6: Withdraw Full Balance
- [ ] Click Withdraw Funds
- [ ] Enter full vault balance
- [ ] Click Withdraw
- [ ] Confirm transaction
- [ ] Vault balance = 0
- [ ] Wallet received all funds

**Expected**: Empty vault balance

#### Test 7: Withdraw Error - Insufficient Vault Balance
- [ ] Click Withdraw Funds
- [ ] Enter amount: 1000000 (more than vault has)
- [ ] Click Withdraw
- [ ] Should show error message
- [ ] No transaction executed

**Expected**: "Insufficient balance in vault" error

### ✅ UI/UX Tests

#### Test 8: Loading States
- [ ] During approval: button shows "Processing..."
- [ ] Button is disabled during transaction
- [ ] Spinner animation visible
- [ ] Status message updates

**Expected**: Clear loading indicators

#### Test 9: Error Display
- [ ] Trigger various errors
- [ ] Error messages displayed in red box
- [ ] Error messages are clear and actionable
- [ ] Can dismiss error and retry

**Expected**: User-friendly error messages

#### Test 10: Transaction Status
- [ ] Shows "Preparing deposit..."
- [ ] Shows "Token approved. Deposit confirmed!" (if approval)
- [ ] Shows "Deposit confirmed!" (if no approval)
- [ ] Shows "Recording transaction..."
- [ ] Auto-closes after 2 seconds

**Expected**: Clear status progression

### ✅ Integration Tests

#### Test 11: Database Recording
- [ ] Complete deposit
- [ ] Check database for transaction record
- [ ] Verify txHash stored
- [ ] Verify approvalHash stored (if applicable)
- [ ] Verify status = 'completed'
- [ ] Verify amount and asset correct

**Expected**: Transaction in database

#### Test 12: Balance Refresh
- [ ] Note initial balances
- [ ] Complete deposit
- [ ] Wallet balance decreased
- [ ] Vault balance increased
- [ ] UI reflects new balances
- [ ] Refresh page - balances still correct

**Expected**: Consistent balances

#### Test 13: Multiple Deposits
- [ ] Deposit 10 USDC
- [ ] Deposit 5 USDC
- [ ] Deposit 0.1 WETH
- [ ] All transactions successful
- [ ] Balances cumulative

**Expected**: All deposits tracked

## Automated Testing Commands

### Check Token Balances

```bash
# Check wallet USDC balance
cast call 0x4fd923620866ee5377cb072fd8a2c449a397b264 \
  "balanceOf(address)(uint256)" \
  YOUR_WALLET_ADDRESS \
  --rpc-url https://sepolia.base.org

# Check vault USDC balance for user
cast call 0x27325be0cf6c908c282b64565ba05b8c7d0642de \
  "getUserBalance(address,address)(uint256)" \
  YOUR_WALLET_ADDRESS \
  0x4fd923620866ee5377cb072fd8a2c449a397b264 \
  --rpc-url https://sepolia.base.org

# Check allowance
cast call 0x4fd923620866ee5377cb072fd8a2c449a397b264 \
  "allowance(address,address)(uint256)" \
  YOUR_WALLET_ADDRESS \
  0x27325be0cf6c908c282b64565ba05b8c7d0642de \
  --rpc-url https://sepolia.base.org
```

### Monitor Transactions

```bash
# Watch for deposit events
cast logs --address 0x27325be0cf6c908c282b64565ba05b8c7d0642de \
  --rpc-url https://sepolia.base.org \
  'Deposit(address indexed,address indexed,uint256,uint256)'

# Watch for withdrawal events
cast logs --address 0x27325be0cf6c908c282b64565ba05b8c7d0642de \
  --rpc-url https://sepolia.base.org \
  'Withdrawal(address indexed,address indexed,uint256,uint256)'
```

## Performance Testing

### Test Transaction Times

Measure time for each operation:

1. **Approval**: ~2-5 seconds
2. **Deposit (after approval)**: ~2-5 seconds
3. **Deposit (first time)**: ~5-10 seconds total
4. **Withdrawal**: ~2-5 seconds

### Test Gas Costs

Expected gas costs on Base Sepolia:

1. **Approval**: ~46,000 gas
2. **Deposit**: ~80,000 gas
3. **Withdrawal**: ~60,000 gas

## Error Scenarios to Test

### Network Errors
- [ ] Disconnect internet during transaction
- [ ] Switch networks during transaction
- [ ] High network congestion

### Wallet Errors
- [ ] Reject approval transaction
- [ ] Reject deposit transaction
- [ ] Insufficient gas
- [ ] Insufficient balance

### Contract Errors
- [ ] Token not whitelisted
- [ ] Vault paused
- [ ] Invalid amount (0)
- [ ] Amount too large

### UI Errors
- [ ] Invalid input (negative number)
- [ ] Invalid input (letters)
- [ ] Empty input
- [ ] Decimal places exceed token decimals

## Troubleshooting Tests

### Issue: Transactions Not Appearing

**Debug steps:**
1. Check console for errors
2. Verify wallet connected
3. Check network (Base Sepolia)
4. Verify contract addresses
5. Check transaction on explorer

### Issue: Approval Stuck

**Debug steps:**
1. Check transaction on explorer
2. Verify gas price sufficient
3. Try increasing gas
4. Check token contract

### Issue: Balance Not Updating

**Debug steps:**
1. Check transaction confirmed
2. Refresh page
3. Check vault contract directly
4. Verify database record

## Browser Testing

Test in multiple browsers:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Brave

## Mobile Testing

Test on mobile devices:
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Mobile wallets (MetaMask, Coinbase)

## Regression Testing

After any changes, verify:
- [ ] Deposits still work
- [ ] Withdrawals still work
- [ ] Approvals still work
- [ ] Error handling intact
- [ ] UI updates correctly

## Production Readiness Checklist

Before deploying to mainnet:
- [ ] All tests passing
- [ ] No console errors
- [ ] Error handling comprehensive
- [ ] User feedback clear
- [ ] Gas costs reasonable
- [ ] Security review completed
- [ ] Contract addresses updated
- [ ] RPC endpoints updated
- [ ] Environment variables set
- [ ] Database ready
- [ ] Monitoring setup

## Test Data

### Test Wallets
Use test wallets with small amounts:
- Wallet 1: For deposit testing
- Wallet 2: For withdrawal testing
- Wallet 3: For error testing

### Test Amounts
Use realistic amounts:
- Small: 1-10 USDC
- Medium: 50-100 USDC
- Large: 500-1000 USDC
- Decimal: 0.123456 USDC

## Success Criteria

A successful test should:
✅ Execute transaction on-chain
✅ Return transaction hash
✅ Update balances correctly
✅ Record in database
✅ Show clear user feedback
✅ Handle errors gracefully
✅ Complete in reasonable time (<10s)

## Reporting Issues

When reporting issues, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Console errors
5. Transaction hash
6. Wallet address
7. Browser/device info
8. Screenshots/video

## Continuous Testing

Set up monitoring for:
- Transaction success rate
- Average transaction time
- Error frequency
- Gas costs
- User feedback

## Next Steps After Testing

Once all tests pass:
1. Document findings
2. Fix any issues found
3. Optimize gas costs
4. Improve error messages
5. Enhance UI/UX
6. Prepare for mainnet
7. Set up monitoring
8. Create user guide

