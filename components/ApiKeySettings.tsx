import React, { useState, useEffect } from 'react';

interface ApiKeySettingsProps {
  onApiKeySet: (apiKey: string) => void;
  currentApiKey?: string;
}

const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ onApiKeySet, currentApiKey }) => {
  const [apiKey, setApiKey] = useState(currentApiKey || '');
  const [showSettings, setShowSettings] = useState(false);

  // Show settings modal only if no API key is provided
  useEffect(() => {
    if (!currentApiKey) {
      setShowSettings(true);
    } else {
      setShowSettings(false);
    }
  }, [currentApiKey]);

  const handleSave = () => {
    if (apiKey.trim()) {
      // Store in localStorage for persistence
      localStorage.setItem('gemini_api_key', apiKey.trim());
      onApiKeySet(apiKey.trim());
      setShowSettings(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    onApiKeySet('');
    setShowSettings(true);
  };

  if (!showSettings) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowSettings(true)}
          className="bg-gray-800 text-yellow-400 px-3 py-1 rounded border border-green-700 hover:bg-gray-700 text-sm"
        >
          ⚙️ API Settings
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded border-2 border-green-700 max-w-md w-full mx-4">
        <h3 className="text-yellow-400 text-lg font-bold mb-4">🔑 Google Gemini API Key Required</h3>
        
        <div className="text-green-400 text-sm mb-4">
          <p className="mb-2">To use Night City Adventures, you need a Google Gemini API key:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">Google AI Studio</a></li>
            <li>Create a new API key</li>
            <li>Paste it below</li>
          </ol>
        </div>

        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your Gemini API key..."
          className="w-full bg-black text-green-400 border border-green-700 rounded px-3 py-2 mb-4 focus:outline-none focus:border-yellow-400"
        />

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="flex-1 bg-green-700 text-black px-4 py-2 rounded font-bold hover:bg-green-600 disabled:bg-gray-600 disabled:text-gray-400"
          >
            Save & Connect
          </button>
          {currentApiKey && (
            <button
              onClick={handleClear}
              className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Clear
            </button>
          )}
          {currentApiKey && (
            <button
              onClick={() => setShowSettings(false)}
              className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>🔒 Your API key is stored locally on your device and never sent to our servers.</p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySettings;
