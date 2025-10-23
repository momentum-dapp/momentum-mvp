import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'wallet_session';

// Get current session
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME);

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const sessionData = JSON.parse(session.value);
    
    return NextResponse.json({ 
      authenticated: true,
      walletAddress: sessionData.walletAddress 
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

// Create session
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

    const sessionData = {
      walletAddress,
      createdAt: Date.now(),
    };

    const response = NextResponse.json({ 
      authenticated: true,
      walletAddress 
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

// Delete session (logout)
export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({ 
      authenticated: false,
      message: 'Logged out successfully' 
    });

    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);

    return response;
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}

