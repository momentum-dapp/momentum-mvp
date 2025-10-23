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

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    // Check if user already exists
    let user = await UserService.getUserByWalletAddress(walletAddress);

    if (!user) {
      // Create new user
      user = await UserService.createUser({
        wallet_address: walletAddress,
      });

      if (!user) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
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

