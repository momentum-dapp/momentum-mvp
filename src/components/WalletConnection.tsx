'use client';

import { useState, useEffect } from 'react';
import { WalletIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface WalletConnectionProps {
  onWalletCreated: () => void;
}

export default function WalletConnection({ onWalletCreated }: WalletConnectionProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    // Check if wallet is already connected
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err);
      }
    }
  };

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Check if MetaMask or other web3 wallet is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask or another Web3 wallet');
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const walletAddress = accounts[0];
      setAccount(walletAddress);

      // Send wallet address to backend
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
        }),
      });

      const data = await response.json();

      if (data.walletAddress) {
        onWalletCreated();
      } else {
        throw new Error(data.error || 'Failed to connect wallet');
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center p-3 bg-blue-50 rounded-lg">
          <ShieldCheckIcon className="h-5 w-5 text-blue-600 mr-3" />
          <div>
            <p className="text-sm font-medium text-blue-900">Your Wallet, Your Control</p>
            <p className="text-xs text-blue-700">Connect your MetaMask or Web3 wallet</p>
          </div>
        </div>

        <div className="flex items-center p-3 bg-green-50 rounded-lg">
          <WalletIcon className="h-5 w-5 text-green-600 mr-3" />
          <div>
            <p className="text-sm font-medium text-green-900">Secure & Non-Custodial</p>
            <p className="text-xs text-green-700">You always control your funds</p>
          </div>
        </div>
      </div>

      {account ? (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900 mb-1">Connected Wallet</p>
          <p className="text-xs text-gray-600 font-mono break-all">{account}</p>
        </div>
      ) : (
        <button
          onClick={handleConnectWallet}
          disabled={isConnecting}
          className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Connecting Wallet...
            </>
          ) : (
            <>
              <WalletIcon className="h-4 w-4 mr-2" />
              Connect Wallet
            </>
          )}
        </button>
      )}

      <div className="text-center">
        <p className="text-xs text-gray-500">
          By connecting your wallet, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
