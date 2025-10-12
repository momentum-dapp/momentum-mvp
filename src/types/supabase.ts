export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_id: string;
          email: string;
          wallet_address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_id: string;
          email: string;
          wallet_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_id?: string;
          email?: string;
          wallet_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      portfolios: {
        Row: {
          id: string;
          user_id: string;
          strategy: 'low' | 'medium' | 'high';
          total_value: number;
          wbtc_allocation: number;
          big_caps_allocation: number;
          mid_lower_caps_allocation: number;
          stablecoins_allocation: number;
          last_rebalanced: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          strategy: 'low' | 'medium' | 'high';
          total_value?: number;
          wbtc_allocation: number;
          big_caps_allocation: number;
          mid_lower_caps_allocation: number;
          stablecoins_allocation: number;
          last_rebalanced?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          strategy?: 'low' | 'medium' | 'high';
          total_value?: number;
          wbtc_allocation?: number;
          big_caps_allocation?: number;
          mid_lower_caps_allocation?: number;
          stablecoins_allocation?: number;
          last_rebalanced?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          portfolio_id: string | null;
          type: 'deposit' | 'withdrawal' | 'rebalance' | 'swap';
          amount: number;
          asset: string;
          tx_hash: string;
          status: 'pending' | 'confirmed' | 'failed';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          portfolio_id?: string | null;
          type: 'deposit' | 'withdrawal' | 'rebalance' | 'swap';
          amount: number;
          asset: string;
          tx_hash: string;
          status?: 'pending' | 'confirmed' | 'failed';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          portfolio_id?: string | null;
          type?: 'deposit' | 'withdrawal' | 'rebalance' | 'swap';
          amount?: number;
          asset?: string;
          tx_hash?: string;
          status?: 'pending' | 'confirmed' | 'failed';
          created_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          created_at?: string;
        };
      };
      market_data: {
        Row: {
          id: string;
          asset: string;
          price: number;
          change_24h: number;
          market_cap: number;
          last_updated: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          asset: string;
          price: number;
          change_24h: number;
          market_cap: number;
          last_updated: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          asset?: string;
          price?: number;
          change_24h?: number;
          market_cap?: number;
          last_updated?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
