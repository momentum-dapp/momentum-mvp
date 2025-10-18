import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { UserService } from '@/lib/services/user-service';
import { createSmartWallet } from '@/lib/web3/smart-wallet';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  // Get the body
  const payload = await request.text();

  // Create a new Svix instance with your secret.
  const wh = new Webhook(webhookSecret);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the webhook
  const eventType = evt.type;
  
  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;
      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error handling webhook ${eventType}:`, error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleUserCreated(userData: any) {
  console.log('Creating user and wallet for:', userData.id);
  
  try {
    // Create user in database
    const user = await UserService.createUser({
      clerk_id: userData.id,
      email: userData.email_addresses[0]?.email_address || '',
    });

    if (!user) {
      throw new Error('Failed to create user in database');
    }

    // Automatically create custody wallet for new user
    const mockSigner = { userId: userData.id }; // Mock signer for wallet creation
    const smartWallet = await createSmartWallet(mockSigner);

    // Update user with wallet address
    const updatedUser = await UserService.setWalletAddress(userData.id, smartWallet.address);

    if (!updatedUser) {
      throw new Error('Failed to save wallet address');
    }

    console.log(`Successfully created user ${userData.id} with wallet ${smartWallet.address}`);
  } catch (error) {
    console.error('Error in handleUserCreated:', error);
    throw error;
  }
}

async function handleUserUpdated(userData: any) {
  console.log('Updating user:', userData.id);
  
  try {
    await UserService.updateUser(userData.id, {
      email: userData.email_addresses[0]?.email_address || '',
    });
  } catch (error) {
    console.error('Error in handleUserUpdated:', error);
    throw error;
  }
}

async function handleUserDeleted(userData: any) {
  console.log('Deleting user:', userData.id);
  
  try {
    await UserService.deleteUser(userData.id);
  } catch (error) {
    console.error('Error in handleUserDeleted:', error);
    throw error;
  }
}