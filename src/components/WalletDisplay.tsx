'use client';

import { useState, useEffect } from 'react';
import { 
  WalletIcon, 
  ClipboardDocumentIcon, 
  CheckIcon,
  QrCodeIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import QRCode from 'qrcode';

interface WalletDisplayProps {
  className?: string;
}

export default function WalletDisplay({ className = '' }: WalletDisplayProps) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    fetchWalletAddress();
  }, []);

  const fetchWalletAddress = async () => {
    try {
      const response = await fetch('/api/wallet');
      const data = await response.json();
      
      if (data.walletAddress) {
        setWalletAddress(data.walletAddress);
        // Generate QR code
        const qrUrl = await QRCode.toDataURL(data.walletAddress, {
          width: 200,
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#ffffff'
          }
        });
        setQrCodeUrl(qrUrl);
      }
    } catch (error) {
      console.error('Error fetching wallet address:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!walletAddress) return;
    
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!walletAddress) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="text-center">
          <WalletIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Wallet Not Found
          </h3>
          <p className="text-gray-600 mb-4">
            Your custody wallet is being created. Please refresh the page in a moment.
          </p>
          <button
            onClick={fetchWalletAddress}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <WalletIcon className="h-6 w-6 text-indigo-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Your Custody Wallet</h3>
        </div>
        <button
          onClick={() => setShowQR(!showQR)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Show QR Code"
        >
          <QrCodeIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Wallet Address */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Wallet Address
        </label>
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <span className="font-mono text-sm text-gray-900">
              {formatAddress(walletAddress)}
            </span>
          </div>
          <button
            onClick={copyToClipboard}
            className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            title="Copy full address"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <ClipboardDocumentIcon className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Click to copy full address: {walletAddress}
        </p>
      </div>

      {/* QR Code */}
      {showQR && qrCodeUrl && (
        <div className="mb-4 text-center">
          <img 
            src={qrCodeUrl} 
            alt="Wallet QR Code" 
            className="mx-auto border border-gray-200 rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-2">
            Scan this QR code to get the wallet address
          </p>
        </div>
      )}

      {/* Security & Trust Indicators */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-green-900 mb-2">
              🛡️ Institutional-Grade Security
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-green-800">
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2"></div>
                Multi-sig protection
              </div>
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2"></div>
                $100M+ insurance
              </div>
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2"></div>
                SOC 2 Type II certified
              </div>
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2"></div>
                Cold storage backup
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              How to Deposit Funds
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Send crypto to the wallet address above</li>
              <li>• Supported networks: Base, Base Sepolia</li>
              <li>• Supported tokens: ETH, USDC, WBTC, and other ERC-20 tokens</li>
              <li>• Funds will appear in your portfolio automatically</li>
              <li>• Minimum deposit: $10 equivalent</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Network Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Network:</span>
          <span className="font-medium text-gray-900 flex items-center">
            <img 
              src="/84532.svg" 
              alt="Base" 
              className="w-4 h-4 mr-1"
            />
            Base Sepolia
          </span>
        </div>
      </div>
    </div>
  );
}
