import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user-service';

// Get current user based on wallet address from headers
export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'No wallet address provided' }, { status: 401 });
    }

    // Get user from database
    const user = await UserService.getUserByWalletAddress(walletAddress);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// Create or update user based on wallet address
export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    // Normalize wallet address to lowercase for case-insensitive comparison
    const normalizedAddress = walletAddress.toLowerCase();

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(normalizedAddress)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    console.log('[AUTH] Looking for user with wallet address:', normalizedAddress);

    // Check if user already exists first
    let user = await UserService.getUserByWalletAddress(normalizedAddress);

    if (!user) {
      // User doesn't exist, create new one
      console.log('[AUTH] User not found, creating new user with wallet:', normalizedAddress);
      user = await UserService.createUser({
        wallet_address: normalizedAddress,
      });

      if (!user) {
        console.error('[AUTH] Failed to create user for:', normalizedAddress);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
      console.log('[AUTH] Created new user:', user.id);
    } else {
      console.log('[AUTH] Found existing user:', user.id);
    }

    return NextResponse.json({ 
      user,
      message: user ? 'User retrieved successfully' : 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

