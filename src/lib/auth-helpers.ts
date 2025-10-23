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
      return null;
    }

    const user = await UserService.getUserByWalletAddress(walletAddress);
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

