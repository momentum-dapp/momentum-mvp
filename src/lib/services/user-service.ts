import { supabase, supabaseAdmin } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

export class UserService {
  /**
   * Create or get a user by wallet address
   * Uses PostgreSQL's INSERT ... ON CONFLICT to handle race conditions atomically
   * This is the ONLY reliable way to prevent duplicates with concurrent requests
   */
  static async createUser(userData: UserInsert): Promise<User | null> {
    try {
      // Normalize wallet address to lowercase before storing
      const normalizedData = {
        ...userData,
        wallet_address: userData.wallet_address?.toLowerCase(),
      };
      
      console.log('[UserService] createUser called for:', normalizedData.wallet_address);
      
      // Use INSERT ... ON CONFLICT (upsert) to atomically handle duplicates
      // This is handled entirely by PostgreSQL - no race conditions possible
      const { data, error } = await (supabaseAdmin as any)
        .from('users')
        .upsert(
          normalizedData,
          { 
            onConflict: 'wallet_address',
            // When conflict occurs, don't update anything, just return the existing row
            ignoreDuplicates: false
          }
        )
        .select()
        .single();

      if (error) {
        console.error('[UserService] Upsert error:', error);
        console.error('[UserService] Error details:', JSON.stringify(error, null, 2));
        return null;
      }

      if (!data) {
        console.error('[UserService] No data returned from upsert');
        return null;
      }

      console.log('[UserService] Upsert successful for user:', data.id);
      return data;
    } catch (error) {
      console.error('[UserService] Unexpected error in createUser:', error);
      return null;
    }
  }

  /**
   * Get user by wallet address
   */
  static async getUserByWalletAddress(walletAddress: string): Promise<User | null> {
    try {
      // Normalize wallet address to lowercase for case-insensitive comparison
      const normalizedAddress = walletAddress.toLowerCase();
      console.log('[UserService] Querying for wallet:', normalizedAddress);
      
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('wallet_address', normalizedAddress)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // User not found (this is expected for new users)
          console.log('[UserService] User not found in database for:', normalizedAddress);
          return null;
        }
        console.error('[UserService] Error fetching user:', error);
        return null;
      }

      if (!data) {
        console.log('[UserService] No data returned for:', normalizedAddress);
        return null;
      }

      const user = data as User;
      console.log('[UserService] Found user:', user.id);
      return user;
    } catch (error) {
      console.error('[UserService] Unexpected error fetching user:', error);
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
      // Normalize wallet address to lowercase for case-insensitive comparison
      const normalizedAddress = walletAddress.toLowerCase();
      
      const { data, error } = await (supabaseAdmin as any)
        .from('users')
        .update(updates)
        .eq('wallet_address', normalizedAddress)
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
      // Normalize wallet address to lowercase for case-insensitive comparison
      const normalizedAddress = walletAddress.toLowerCase();
      
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('wallet_address', normalizedAddress);

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
