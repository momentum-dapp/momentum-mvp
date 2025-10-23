'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount, useDisconnect } from 'wagmi';

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
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data when wallet is connected
  useEffect(() => {
    async function fetchUser() {
      if (!address || !isConnected) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
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
          
          // Create session
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ walletAddress: address }),
          });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, [address, isConnected]);

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

