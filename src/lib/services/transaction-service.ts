import { supabaseAdmin } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];

export class TransactionService {
  /**
   * Create a new transaction record
   */
  static async createTransaction(transactionData: TransactionInsert): Promise<Transaction | null> {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      if (error) {
        console.error('Error creating transaction:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error creating transaction:', error);
      return null;
    }
  }

  /**
   * Get user's transaction history
   */
  static async getUserTransactions(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Transaction[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error fetching transactions:', error);
      return [];
    }
  }

  /**
   * Update transaction status
   */
  static async updateTransactionStatus(
    transactionId: string,
    status: 'pending' | 'confirmed' | 'failed'
  ): Promise<Transaction | null> {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('transactions')
        .update({ status })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating transaction status:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error updating transaction status:', error);
      return null;
    }
  }

  /**
   * Get transaction by hash
   */
  static async getTransactionByHash(txHash: string): Promise<Transaction | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('tx_hash', txHash)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching transaction by hash:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error fetching transaction by hash:', error);
      return null;
    }
  }

  /**
   * Get pending transactions
   */
  static async getPendingTransactions(): Promise<Transaction[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching pending transactions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error fetching pending transactions:', error);
      return [];
    }
  }

  /**
   * Get user's total deposits by asset
   */
  static async getUserTotalDeposits(userId: string, asset: string): Promise<number> {
    try {
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('asset', asset)
        .eq('type', 'deposit')
        .eq('status', 'confirmed');

      if (error) {
        console.error('Error fetching user deposits:', error);
        return 0;
      }

      return (data as any)?.reduce((total: number, tx: any) => total + tx.amount, 0) || 0;
    } catch (error) {
      console.error('Unexpected error fetching user deposits:', error);
      return 0;
    }
  }

  /**
   * Get user's total withdrawals by asset
   */
  static async getUserTotalWithdrawals(userId: string, asset: string): Promise<number> {
    try {
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('asset', asset)
        .eq('type', 'withdrawal')
        .eq('status', 'confirmed');

      if (error) {
        console.error('Error fetching user withdrawals:', error);
        return 0;
      }

      return (data as any)?.reduce((total: number, tx: any) => total + tx.amount, 0) || 0;
    } catch (error) {
      console.error('Unexpected error fetching user withdrawals:', error);
      return 0;
    }
  }
}
