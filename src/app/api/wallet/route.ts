import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { UserService } from '@/lib/services/user-service';
import { createSmartWallet } from '@/lib/web3/smart-wallet';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { signature } = await request.json();

    if (!signature) {
      return NextResponse.json({ error: 'Signature required' }, { status: 400 });
    }

    // Get user from database, create if doesn't exist
    let dbUser = await UserService.getUserByClerkId(user.id);
    if (!dbUser) {
      // Create user if they don't exist (fallback for cases where webhook didn't fire)
      dbUser = await UserService.createUser({
        clerk_id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
      });
      
      if (!dbUser) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
    }

    // Check if user already has a wallet
    if (dbUser.wallet_address) {
      return NextResponse.json({ 
        walletAddress: dbUser.wallet_address,
        message: 'Wallet already exists'
      });
    }

    // Create smart wallet using ZeroDev
    const mockSigner = { /* mock signer object */ };
    const smartWallet = await createSmartWallet(mockSigner);

    // Store wallet address in database
    const updatedUser = await UserService.setWalletAddress(user.id, smartWallet.address);

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to save wallet address' }, { status: 500 });
    }

    return NextResponse.json({
      walletAddress: smartWallet.address,
      message: 'Smart wallet created successfully'
    });

  } catch (error) {
    console.error('Wallet creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create wallet' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const walletAddress = await UserService.getWalletAddress(user.id);

    return NextResponse.json({
      walletAddress,
      hasWallet: !!walletAddress
    });

  } catch (error) {
    console.error('Get wallet error:', error);
    return NextResponse.json(
      { error: 'Failed to get wallet information' },
      { status: 500 }
    );
  }
}