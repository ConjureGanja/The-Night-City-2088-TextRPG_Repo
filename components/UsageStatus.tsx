import React from 'react';
import { UsageTracker } from '../services/usageTracker';

interface UsageStatusProps {
  onUpgradeClick: () => void;
}

const UsageStatus: React.FC<UsageStatusProps> = ({ onUpgradeClick }) => {
  const status = UsageTracker.getUsageStatus();
  const features = UsageTracker.getPremiumFeatures();

  if (status.isPremium) {
    return (
      <div className="fixed top-4 left-4 bg-gradient-to-r from-yellow-900 to-yellow-800 border border-yellow-400 rounded px-3 py-2 z-40">
        <div className="flex items-center space-x-2">
          <span className="text-yellow-400">👑</span>
          <span className="text-yellow-100 text-sm font-bold">CORP ACCESS</span>
          <span className="text-green-400 text-xs">♾️ UNLIMITED</span>
        </div>
      </div>
    );
  }

  const isLowUsage = status.messagesRemaining <= 2;
  const isOutOfMessages = status.messagesRemaining === 0;

  return (
    <div className="fixed top-4 left-4 z-40">
      <div className={`border rounded px-3 py-2 ${
        isOutOfMessages 
          ? 'bg-red-900 border-red-500' 
          : isLowUsage 
            ? 'bg-yellow-900 border-yellow-500' 
            : 'bg-gray-900 border-green-700'
      }`}>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-xs">Daily Usage:</span>
          <span className={`text-sm font-bold ${
            isOutOfMessages ? 'text-red-400' : isLowUsage ? 'text-yellow-400' : 'text-green-400'
          }`}>
            {status.messagesUsed}/{status.dailyLimit}
          </span>
        </div>
        
        {status.messagesRemaining <= 3 && !isOutOfMessages && (
          <div className="text-xs text-yellow-400 mt-1">
            {status.messagesRemaining} messages left today
          </div>
        )}
        
        {isOutOfMessages && (
          <div className="mt-2">
            <button
              onClick={onUpgradeClick}
              className="bg-yellow-600 text-black text-xs px-2 py-1 rounded hover:bg-yellow-500 transition-colors font-bold"
            >
              🚀 Go Premium
            </button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-1 w-full bg-gray-800 rounded-full h-1">
        <div 
          className={`h-1 rounded-full transition-all ${
            isOutOfMessages ? 'bg-red-500' : isLowUsage ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ 
            width: `${(status.messagesUsed / status.dailyLimit) * 100}%` 
          }}
        />
      </div>
    </div>
  );
};

export default UsageStatus;
