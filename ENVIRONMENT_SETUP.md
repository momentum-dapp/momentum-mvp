# Environment Setup Guide

To fix the 404 errors and get the application running properly, you need to create a `.env.local` file in the root directory with the following environment variables:

## Required Environment Variables

Create a file named `.env.local` in the root directory (`/Users/chidx/Documents/Learn/momentum-mvp/.env.local`) with the following content:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# OpenAI API Key (for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# Web3 Configuration
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id_here
```

## How to Get These Values

### Clerk Authentication
1. Go to [clerk.com](https://clerk.com)
2. Create an account and a new application
3. Copy the publishable key and secret key from your dashboard

### Supabase Configuration
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > API
4. Copy the URL, anon key, and service role key

### OpenAI API Key
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key in your account settings

### WalletConnect Project ID
1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Create a new project and copy the project ID

## Current Status

The application has been updated to handle missing environment variables gracefully:
- API routes will return mock data when environment variables are not configured
- The middleware will skip authentication when Clerk is not configured
- No more 404 errors should occur

Once you add the environment variables, the application will use real authentication and database connections.
