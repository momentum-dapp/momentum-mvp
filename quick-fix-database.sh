#!/bin/bash

# Quick fix script to update the database schema
# This makes clerk_id nullable for wallet-based authentication

echo "🔧 Updating database schema for wallet authentication..."
echo ""
echo "Please run this SQL command in your Supabase SQL Editor:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ALTER TABLE users ALTER COLUMN clerk_id DROP NOT NULL;"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Steps:"
echo "1. Go to https://supabase.com/dashboard"
echo "2. Select your project"
echo "3. Go to SQL Editor"
echo "4. Paste the command above"
echo "5. Click Run"
echo ""
echo "After running, try connecting your wallet again!"

