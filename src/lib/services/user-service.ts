import { supabase, supabaseAdmin } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

export class UserService {
  /**
   * Create a new user in the database
   */
  static async createUser(userData: UserInsert): Promise<User | null> {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error creating user:', error);
      return null;
    }
  }

  /**
   * Get user by wallet address
   */
  static async getUserByWalletAddress(walletAddress: string): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // User not found
          return null;
        }
        console.error('Error fetching user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error fetching user:', error);
      return null;
    }
  }

  /**
   * Get user by Clerk ID (legacy support)
   */
  static async getUserByClerkId(clerkId: string): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('clerk_id', clerkId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // User not found
          return null;
        }
        console.error('Error fetching user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error fetching user:', error);
      return null;
    }
  }

  /**
   * Update user information by wallet address
   */
  static async updateUser(walletAddress: string, updates: UserUpdate): Promise<User | null> {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('users')
        .update(updates)
        .eq('wallet_address', walletAddress)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error updating user:', error);
      return null;
    }
  }

  /**
   * Get or create user by wallet address
   */
  static async getOrCreateUser(walletAddress: string, email?: string): Promise<User | null> {
    // First try to get existing user
    let user = await this.getUserByWalletAddress(walletAddress);
    
    if (!user) {
      // Create new user if doesn't exist
      user = await this.createUser({
        wallet_address: walletAddress,
        email: email,
      });
    }

    return user;
  }

  /**
   * Set user's wallet address (legacy support)
   */
  static async setWalletAddress(clerkId: string, walletAddress: string): Promise<User | null> {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('users')
        .update({ wallet_address: walletAddress })
        .eq('clerk_id', clerkId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error updating user:', error);
      return null;
    }
  }

  /**
   * Delete user by wallet address
   */
  static async deleteUser(walletAddress: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('wallet_address', walletAddress);

      if (error) {
        console.error('Error deleting user:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error deleting user:', error);
      return false;
    }
  }
}
