import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { TransactionService } from '@/lib/services/transaction-service';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type');
    const asset = searchParams.get('asset');

    // Get user's transactions
    const transactions = await TransactionService.getUserTransactions(user.id, limit, offset);

    // Filter by type and asset if specified
    let filteredTransactions = transactions;
    if (type) {
      filteredTransactions = filteredTransactions.filter(tx => tx.type === type);
    }
    if (asset) {
      filteredTransactions = filteredTransactions.filter(tx => tx.asset === asset);
    }

    return NextResponse.json({
      transactions: filteredTransactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        asset: tx.asset,
        txHash: tx.tx_hash,
        status: tx.status,
        createdAt: tx.created_at,
        portfolioId: tx.portfolio_id,
      })),
      pagination: {
        limit,
        offset,
        hasMore: transactions.length === limit,
      }
    });

  } catch (error) {
    console.error('Transactions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, amount, asset, txHash, portfolioId } = await request.json();

    if (!type || !amount || !asset || !txHash) {
      return NextResponse.json({ 
        error: 'Missing required fields: type, amount, asset, txHash' 
      }, { status: 400 });
    }

    if (!['deposit', 'withdrawal', 'rebalance', 'swap'].includes(type)) {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
    }

    // Get user from database, create if doesn't exist
    let dbUser = await UserService.getUserByClerkId(user.id);
    if (!dbUser) {
      // Create user if they don't exist (fallback for cases where webhook didn't fire)
      dbUser = await UserService.createUser({
        clerk_id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
      });
      
      if (!dbUser) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
    }

    // Create transaction record
    const transaction = await TransactionService.createTransaction({
      user_id: dbUser.id,
      portfolio_id: portfolioId || null,
      type: type as 'deposit' | 'withdrawal' | 'rebalance' | 'swap',
      amount: parseFloat(amount),
      asset,
      tx_hash: txHash,
      status: 'pending',
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        asset: transaction.asset,
        txHash: transaction.tx_hash,
        status: transaction.status,
        createdAt: transaction.created_at,
        portfolioId: transaction.portfolio_id,
      }
    });

  } catch (error) {
    console.error('Transaction creation API error:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}