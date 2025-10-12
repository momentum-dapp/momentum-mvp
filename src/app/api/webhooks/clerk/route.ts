import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { UserService } from '@/lib/services/user-service';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('Please add CLERK_WEBHOOK_SECRET to your environment variables');
}

type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name?: string;
    last_name?: string;
  };
};

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  
  const svix_id = headersList.get('svix-id');
  const svix_timestamp = headersList.get('svix-timestamp');
  const svix_signature = headersList.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const wh = new Webhook(webhookSecret!);
  let evt: ClerkWebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  const { type, data } = evt;
  const clerkId = data.id;
  const email = data.email_addresses[0]?.email_address;

  try {
    switch (type) {
      case 'user.created':
        if (email) {
          const user = await UserService.createUser({
            clerk_id: data.id,
            email: email,
          });
          
          if (user) {
            console.log('User created successfully:', user.id);
          } else {
            console.error('Failed to create user in database');
          }
        }
        break;

      case 'user.updated':
        if (email) {
          const user = await UserService.getOrCreateUser(clerkId, email);
          
          if (user) {
            console.log('User updated successfully:', user.id);
          } else {
            console.error('Failed to update user in database');
          }
        }
        break;

      case 'user.deleted':
        const deleted = await UserService.deleteUser(clerkId);
        
        if (deleted) {
          console.log('User deleted successfully:', clerkId);
        } else {
          console.error('Failed to delete user from database');
        }
        break;

      default:
        console.log('Unhandled webhook event type:', type);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
