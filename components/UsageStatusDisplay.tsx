import React, { useState, useEffect } from 'react';
import { freemiumApi, UserStatus } from '../services/freemiumService';

interface UsageStatusDisplayProps {
  onUpgradeClick?: () => void;
  className?: string;
}

const UsageStatusDisplay: React.FC<UsageStatusDisplayProps> = ({ 
  onUpgradeClick, 
  className = '' 
}) => {
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const userStatus = await freemiumApi.getUserStatus();
      setStatus(userStatus);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch user status:', err);
      setError('Failed to load usage status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleUpgrade = async () => {
    try {
      const checkoutInfo = await freemiumApi.createCheckoutSession();
      if (checkoutInfo.url) {
        window.open(checkoutInfo.url, '_blank');
      } else if (onUpgradeClick) {
        onUpgradeClick();
      }
    } catch (err) {
      console.error('Failed to create checkout session:', err);
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-800 border border-cyan-400 p-3 rounded ${className}`}>
        <div className="text-cyan-400 text-sm">Loading status...</div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className={`bg-gray-800 border border-red-400 p-3 rounded ${className}`}>
        <div className="text-red-400 text-sm">
          {error || 'Failed to load status'}
        </div>
        <button 
          onClick={fetchStatus}
          className="text-cyan-400 hover:text-cyan-300 text-xs underline mt-1"
        >
          Retry
        </button>
      </div>
    );
  }

  if (status.isPremium) {
    return (
      <div className={`bg-gradient-to-r from-purple-800 to-cyan-800 border border-purple-400 p-3 rounded ${className}`}>
        <div className="flex items-center justify-between">
          <div className="text-purple-200 text-sm font-medium">
            ⭐ Premium Active
          </div>
          <div className="text-purple-200 text-xs">
            Unlimited Access
          </div>
        </div>
      </div>
    );
  }

  const usagePercentage = (status.usageToday / status.limit) * 100;
  const isNearLimit = status.remaining <= 1;
  const isAtLimit = status.remaining === 0;

  return (
    <div className={`bg-gray-800 border border-cyan-400 p-3 rounded ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-cyan-400 text-sm font-medium">
          Free Tier Usage
        </div>
        <div className={`text-xs ${isNearLimit ? 'text-yellow-400' : 'text-cyan-400'}`}>
          {status.usageToday}/{status.limit} used
        </div>
      </div>      {/* Usage bar */}
      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            isAtLimit 
              ? 'bg-red-500' 
              : isNearLimit 
                ? 'bg-yellow-500' 
                : 'bg-cyan-500'
          }`}
          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className={`text-xs ${
          isAtLimit 
            ? 'text-red-400' 
            : isNearLimit 
              ? 'text-yellow-400' 
              : 'text-gray-400'
        }`}>
          {isAtLimit 
            ? 'Daily limit reached' 
            : `${status.remaining} uses remaining today`
          }
        </div>
        
        <button
          onClick={handleUpgrade}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            isAtLimit
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {isAtLimit ? 'Upgrade Now' : 'Go Premium'}
        </button>
      </div>

      {isAtLimit && (
        <div className="mt-2 text-xs text-red-400 bg-red-900/20 p-2 rounded">
          <div className="font-medium">Upgrade to Premium for:</div>
          <ul className="mt-1 text-xs space-y-1">
            <li>• Unlimited daily requests</li>
            <li>• Priority processing</li>
            <li>• Advanced features</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default UsageStatusDisplay;
