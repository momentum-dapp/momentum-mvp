import { NextRequest } from 'next/server';
import { UserService } from './services/user-service';

/**
 * Get the current authenticated user from the request
 * Returns the user from database based on wallet address in headers
 */
export async function getCurrentUser(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');
    
    if (!walletAddress) {
      console.log('No x-wallet-address header found');
      return null;
    }

    console.log('Looking for user with wallet address:', walletAddress);
    let user = await UserService.getUserByWalletAddress(walletAddress);
    
    // If user doesn't exist, create them automatically
    if (!user) {
      console.log('User not found, creating new user with wallet:', walletAddress);
      user = await UserService.createUser({
        wallet_address: walletAddress,
      });
      
      if (!user) {
        console.error('Failed to create user');
        return null;
      }
      
      console.log('Created new user:', user.id);
    }
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Helper to check if user is authenticated
 */
export async function requireAuth(request: NextRequest) {
  const user = await getCurrentUser(request);
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

