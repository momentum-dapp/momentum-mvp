'use client';

import { useState } from 'react';
import { WalletIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface WalletConnectionProps {
  onWalletCreated: () => void;
}

export default function WalletConnection({ onWalletCreated }: WalletConnectionProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateWallet = async () => {
    setIsCreating(true);
    setError(null);

    try {
      // In a real implementation, this would use the user's actual signature
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature: 'mock_signature', // This would be a real signature in production
        }),
      });

      const data = await response.json();

      if (data.walletAddress) {
        onWalletCreated();
      } else {
        throw new Error(data.error || 'Failed to create wallet');
      }
    } catch (error) {
      console.error('Wallet creation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create wallet');
    } finally {
      setIsCreating(false);
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
            <p className="text-sm font-medium text-blue-900">Secure Smart Wallet</p>
            <p className="text-xs text-blue-700">Gasless transactions powered by ZeroDev</p>
          </div>
        </div>

        <div className="flex items-center p-3 bg-green-50 rounded-lg">
          <WalletIcon className="h-5 w-5 text-green-600 mr-3" />
          <div>
            <p className="text-sm font-medium text-green-900">Automatic Creation</p>
            <p className="text-xs text-green-700">No manual setup required</p>
          </div>
        </div>
      </div>

      <button
        onClick={handleCreateWallet}
        disabled={isCreating}
        className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        {isCreating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Creating Wallet...
          </>
        ) : (
          <>
            <WalletIcon className="h-4 w-4 mr-2" />
            Create Smart Wallet
          </>
        )}
      </button>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          By creating a wallet, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
