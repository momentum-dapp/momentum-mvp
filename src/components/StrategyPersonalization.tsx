'use client';

import { useState } from 'react';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

interface Portfolio {
  id: string;
  strategy: 'low' | 'medium' | 'high';
  allocations: {
    WBTC: number;
    BIG_CAPS: number;
    MID_LOWER_CAPS: number;
    STABLECOINS: number;
  };
}

interface StrategyPersonalizationProps {
  portfolio: Portfolio;
  onUpdate: (portfolio: Portfolio) => void;
}

export default function StrategyPersonalization({ portfolio, onUpdate }: StrategyPersonalizationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [allocations, setAllocations] = useState(portfolio.allocations);
  const [error, setError] = useState<string | null>(null);

  const handleSliderChange = (asset: keyof typeof allocations, value: number) => {
    const newAllocations = { ...allocations, [asset]: value };
    setAllocations(newAllocations);
  };

  const getTotalAllocation = () => {
    return Object.values(allocations).reduce((sum, val) => sum + val, 0);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    const total = getTotalAllocation();
    if (total !== 100) {
      setError(`Total allocation must equal 100% (currently ${total}%)`);
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/portfolio/allocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ allocations }),
      });

      const data = await response.json();

      if (data.success && data.portfolio) {
        onUpdate(data.portfolio);
        setIsEditing(false);
      } else {
        throw new Error(data.error || 'Failed to update allocations');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update allocations');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setAllocations(portfolio.allocations);
    setIsEditing(false);
    setError(null);
  };

  const getAllocationColor = (key: string) => {
    const colors: Record<string, string> = {
      WBTC: 'bg-orange-500',
      BIG_CAPS: 'bg-blue-500',
      MID_LOWER_CAPS: 'bg-purple-500',
      STABLECOINS: 'bg-green-500',
    };
    return colors[key] || 'bg-gray-500';
  };

  const getAllocationLabel = (key: string) => {
    const labels: Record<string, string> = {
      WBTC: 'Wrapped Bitcoin (WBTC)',
      BIG_CAPS: 'Major Cryptocurrencies',
      MID_LOWER_CAPS: 'Emerging Cryptocurrencies',
      STABLECOINS: 'Stablecoins',
    };
    return labels[key] || key;
  };

  const total = getTotalAllocation();
  const isValid = total === 100;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <AdjustmentsHorizontalIcon className="h-6 w-6 text-indigo-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Personalize Your Strategy</h2>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Customize
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!isEditing && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Current Strategy: <span className="font-medium text-gray-900 capitalize">{portfolio.strategy} Risk</span>
          </div>
        </div>
      )}

      <div className="space-y-6 mt-6">
        {Object.entries(allocations).map(([key, value]) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                {getAllocationLabel(key)}
              </label>
              <span className="text-sm font-semibold text-gray-900">{value}%</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={value}
                onChange={(e) => handleSliderChange(key as keyof typeof allocations, parseInt(e.target.value))}
                disabled={!isEditing}
                className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer 
                  ${isEditing ? 'opacity-100' : 'opacity-50 cursor-not-allowed'}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-700">Total Allocation</span>
          <span className={`text-lg font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
            {total}%
          </span>
        </div>

        {isEditing && (
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={!isValid || isSaving}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {!isValid && isEditing && (
          <p className="mt-2 text-sm text-red-600">
            Please adjust allocations to total exactly 100%
          </p>
        )}
      </div>

      {!isEditing && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> You can customize your portfolio allocation to match your investment goals. 
            The AI will manage your assets according to your personalized strategy.
          </p>
        </div>
      )}
    </div>
  );
}

