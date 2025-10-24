'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useAccount, useDisconnect, useAccountEffect } from 'wagmi';

interface User {
  id: string;
  wallet_address: string;
  email?: string;
  created_at?: string;
}

interface WalletAuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
}

const WalletAuthContext = createContext<WalletAuthContextType | undefined>(undefined);

export function WalletAuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, status } = useAccount();
  const { disconnect } = useDisconnect();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Track if we've already fetched for this address to prevent duplicate calls
  const fetchedAddressRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use useAccountEffect to handle account changes properly
  useAccountEffect({
    onConnect(data) {
      console.log('✅ Wallet connected:', data.address);
      // Clear any reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    },
    onDisconnect() {
      console.log('❌ Wallet disconnected');
      setUser(null);
      fetchedAddressRef.current = null;
      setIsLoading(false);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    },
  });

  // Handle reconnection timeout
  useEffect(() => {
    if (status === 'connecting' || status === 'reconnecting') {
      console.log('⏳ Wagmi status:', status);
      setIsLoading(true);
      
      // Set a timeout to prevent infinite waiting
      reconnectTimeoutRef.current = setTimeout(() => {
        if (status === 'connecting' || status === 'reconnecting') {
          console.log('⚠️ Reconnection timeout - stopping wait');
          setIsLoading(false);
        }
      }, 2000); // 2 second timeout for reconnection
      
      return () => {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };
    }
  }, [status]);

  // Fetch user data when wallet is connected
  useEffect(() => {
    async function fetchUser() {
      // Don't proceed if still connecting/reconnecting
      if (status === 'connecting' || status === 'reconnecting') {
        return;
      }

      // If wallet is disconnected, clear user
      if (!address || !isConnected) {
        if (user !== null) {
          console.log('Clearing user state - no wallet connected');
          setUser(null);
        }
        setIsLoading(false);
        fetchedAddressRef.current = null;
        return;
      }

      // Skip if we're already fetching or have already fetched for this address
      if (isFetchingRef.current || fetchedAddressRef.current === address) {
        setIsLoading(false);
        return;
      }

      try {
        isFetchingRef.current = true;
        setIsLoading(true);
        
        console.log('📡 Fetching user for address:', address);
        
        // Create or get user from database
        const createResponse = await fetch('/api/auth/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ walletAddress: address }),
        });

        if (createResponse.ok) {
          const data = await createResponse.json();
          setUser(data.user);
          fetchedAddressRef.current = address; // Mark this address as fetched
          
          // Create session
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ walletAddress: address }),
          });
          
          console.log('✅ User session created successfully');
        } else {
          console.error('❌ Failed to create/fetch user');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Error fetching user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    }

    fetchUser();
  }, [address, isConnected, status, user]);

  const signIn = async () => {
    // Wallet connection is handled by wagmi/Web3Provider
    // This function is kept for compatibility but actual connection
    // happens through the wallet connection UI
  };

  const signOut = () => {
    disconnect();
    setUser(null);
  };

  return (
    <WalletAuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user && isConnected,
        signIn,
        signOut,
      }}
    >
      {children}
    </WalletAuthContext.Provider>
  );
}

export function useWalletAuth() {
  const context = useContext(WalletAuthContext);
  if (context === undefined) {
    throw new Error('useWalletAuth must be used within a WalletAuthProvider');
  }
  return context;
}

