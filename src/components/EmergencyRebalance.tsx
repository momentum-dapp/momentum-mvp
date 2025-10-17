'use client';

import { useState } from 'react';
import { 
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface EmergencyRebalanceProps {
  onRebalanceComplete: () => void;
  className?: string;
}

export default function EmergencyRebalance({ onRebalanceComplete, className = '' }: EmergencyRebalanceProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleEmergencyRebalance = async () => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/emergency-rebalance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(`Emergency rebalance completed. Transaction: ${data.transactionHash}`);
        onRebalanceComplete();
        setShowConfirmation(false);
        
        // Show success notification
        alert('Emergency rebalance to stablecoin completed successfully!');
      } else {
        throw new Error(data.error || 'Emergency rebalance failed');
      }
    } catch (error) {
      console.error('Emergency rebalance failed:', error);
      alert(`Emergency rebalance failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (showConfirmation) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 border-2 border-red-200 ${className}`}>
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Confirm Emergency Rebalance
          </h3>
          <p className="text-gray-600 mb-6">
            This will immediately convert your entire portfolio to stablecoins (USDC). 
            This action cannot be undone and may incur transaction fees.
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h4 className="text-sm font-semibold text-red-900 mb-1">
                  Warning
                </h4>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• All current allocations will be converted to USDC</li>
                  <li>• You may lose potential gains from other assets</li>
                  <li>• Gas fees will apply for the transaction</li>
                  <li>• This action is irreversible</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => setShowConfirmation(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={handleEmergencyRebalance}
              disabled={isProcessing}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  Confirm Emergency Rebalance
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 border border-orange-200 ${className}`}>
      <div className="flex items-center mb-4">
        <ShieldCheckIcon className="h-6 w-6 text-orange-600 mr-3" />
        <h3 className="text-lg font-semibold text-gray-900">Emergency Controls</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-orange-900 mb-1">
                Emergency Rebalance
              </h4>
              <p className="text-sm text-orange-800">
                Instantly convert your entire portfolio to stablecoins (USDC) to protect against market volatility.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowConfirmation(true)}
          className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center justify-center"
        >
          <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
          Emergency Rebalance to Stablecoin
        </button>

        <p className="text-xs text-gray-500 text-center">
          Use only in emergency situations. This action will convert all assets to USDC immediately.
        </p>
      </div>
    </div>
  );
}
