import { supabase, supabaseAdmin } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Portfolio = Database['public']['Tables']['portfolios']['Row'];
type PortfolioInsert = Database['public']['Tables']['portfolios']['Insert'];
type PortfolioUpdate = Database['public']['Tables']['portfolios']['Update'];

export class PortfolioService {
  /**
   * Create a new portfolio for a user
   */
  static async createPortfolio(portfolioData: PortfolioInsert): Promise<Portfolio | null> {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('portfolios')
        .insert(portfolioData)
        .select()
        .single();

      if (error) {
        console.error('Error creating portfolio:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error creating portfolio:', error);
      return null;
    }
  }

  /**
   * Get user's active portfolio
   */
  static async getUserPortfolio(userId: string): Promise<Portfolio | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('portfolios')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Portfolio not found
          return null;
        }
        console.error('Error fetching portfolio:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error fetching portfolio:', error);
      return null;
    }
  }

  /**
   * Update portfolio allocations
   */
  static async updatePortfolio(portfolioId: string, updates: PortfolioUpdate): Promise<Portfolio | null> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      const { data, error } = await (supabaseAdmin as any)
        .from('portfolios')
        .update(updateData)
        .eq('id', portfolioId)
        .select()
        .single();

      if (error) {
        console.error('Error updating portfolio:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error updating portfolio:', error);
      return null;
    }
  }

  /**
   * Update portfolio strategy
   */
  static async updateStrategy(
    portfolioId: string, 
    strategy: 'low' | 'medium' | 'high',
    allocations: {
      wbtc: number;
      bigCaps: number;
      midLowerCaps: number;
      stablecoins: number;
    }
  ): Promise<Portfolio | null> {
    return this.updatePortfolio(portfolioId, {
      strategy,
      wbtc_allocation: allocations.wbtc,
      big_caps_allocation: allocations.bigCaps,
      mid_lower_caps_allocation: allocations.midLowerCaps,
      stablecoins_allocation: allocations.stablecoins,
      last_rebalanced: new Date().toISOString(),
    });
  }

  /**
   * Update portfolio total value
   */
  static async updateTotalValue(portfolioId: string, totalValue: number): Promise<Portfolio | null> {
    return this.updatePortfolio(portfolioId, {
      total_value: totalValue,
    });
  }

  /**
   * Get all active portfolios (for batch operations)
   */
  static async getAllActivePortfolios(): Promise<Portfolio[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('portfolios')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching active portfolios:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error fetching active portfolios:', error);
      return [];
    }
  }

  /**
   * Deactivate portfolio
   */
  static async deactivatePortfolio(portfolioId: string): Promise<boolean> {
    try {
      const { error } = await (supabaseAdmin as any)
        .from('portfolios')
        .update({ is_active: false })
        .eq('id', portfolioId);

      if (error) {
        console.error('Error deactivating portfolio:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error deactivating portfolio:', error);
      return false;
    }
  }
}
