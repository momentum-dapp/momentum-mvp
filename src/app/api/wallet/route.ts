import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // User is authenticated via wallet, so wallet_address is always available
    return NextResponse.json({ 
      hasWallet: true,
      walletAddress: user.wallet_address
    });

  } catch (error) {
    console.error('Wallet fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // User is already authenticated via wallet
    // This endpoint can be used to update email or other user info
    const { email } = await request.json();

    if (email) {
      // Update user email if provided
      const { UserService } = await import('@/lib/services/user-service');
      await UserService.updateUser(user.wallet_address!, { email });
    }

    return NextResponse.json({
      walletAddress: user.wallet_address,
      message: 'User information updated successfully'
    });

  } catch (error) {
    console.error('Wallet connection error:', error);
    return NextResponse.json(
      { error: 'Failed to connect wallet' },
      { status: 500 }
    );
  }
}
