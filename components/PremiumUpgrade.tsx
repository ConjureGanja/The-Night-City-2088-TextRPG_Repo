import React, { useState } from 'react';
import { UsageTracker } from '../services/usageTracker';

interface PremiumUpgradeProps {
  isVisible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  remainingMessages: number;
}

const PremiumUpgrade: React.FC<PremiumUpgradeProps> = ({ 
  isVisible, 
  onClose, 
  onUpgrade, 
  remainingMessages 
}) => {
  const [isActivating, setIsActivating] = useState(false);

  if (!isVisible) return null;

  const handleUpgrade = async () => {
    setIsActivating(true);
    
    // Simulate payment processing (replace with real payment integration)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Activate premium demo (30 days)
    UsageTracker.activatePremiumDemo();
    
    setIsActivating(false);
    onUpgrade();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-yellow-400 rounded-lg p-6 max-w-md w-full mx-4 relative">
        {/* Cyberpunk styling */}
        <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <div className="absolute top-2 right-6 w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-yellow-400 mb-2">
            ⚡ UPGRADE TO PREMIUM ⚡
          </h2>
          <div className="text-red-400 text-sm mb-4">
            {remainingMessages === 0 ? 
              "DAILY LIMIT REACHED - ACCESS DENIED" : 
              `${remainingMessages} messages remaining today`
            }
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-black border border-green-700 rounded p-3">
            <h3 className="text-green-400 font-bold mb-2">🆓 FREE TIER</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• 10 messages per day</li>
              <li>• Basic terminal interface</li>
              <li>• Limited story progression</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-yellow-900 to-yellow-800 border border-yellow-400 rounded p-3">
            <h3 className="text-yellow-400 font-bold mb-2">👑 PREMIUM CORP ACCESS</h3>
            <ul className="text-yellow-100 text-sm space-y-1">
              <li>• ♾️ Unlimited messages</li>
              <li>• 🖼️ AI-generated scene images</li>
              <li>• 💾 Save/load game states</li>
              <li>• 🎨 Premium cyberpunk themes</li>
              <li>• 🚀 Priority response times</li>
              <li>• 🛡️ No ads, ever</li>
            </ul>
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-yellow-400 mb-1">$2.99</div>
          <div className="text-gray-400 text-sm">per month • cancel anytime</div>
          <div className="text-green-400 text-xs mt-1">💥 30-day free trial!</div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleUpgrade}
            disabled={isActivating}
            className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold py-3 px-4 rounded hover:from-yellow-500 hover:to-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isActivating ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2">⚡</span>
                Activating Premium...
              </span>
            ) : (
              "🚀 START FREE TRIAL"
            )}
          </button>
          
          <button
            onClick={onClose}
            className="bg-gray-700 text-gray-300 px-4 py-3 rounded hover:bg-gray-600 transition-colors"
          >
            Later
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>🔒 Secure payment • 📱 Works on all devices</p>
          <p className="mt-1">
            Demo Mode: This will activate a 30-day trial for testing
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumUpgrade;
