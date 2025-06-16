import React, { useState, useEffect } from 'react';
import { audioService, MusicMood } from '../services/audioService';

interface AudioControlsProps {
  isVisible: boolean;
  onToggle: () => void;
}

const AudioControls: React.FC<AudioControlsProps> = ({ isVisible, onToggle }) => {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [masterVolume, setMasterVolume] = useState(0.3);
  const [sfxVolume, setSfxVolume] = useState(0.4);
  const [musicVolume, setMusicVolume] = useState(0.15);
  const [currentMood, setCurrentMood] = useState<MusicMood>(MusicMood.NEUTRAL);

  useEffect(() => {
    setCurrentMood(audioService.getCurrentMood());
    const interval = setInterval(() => {
      setCurrentMood(audioService.getCurrentMood());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAudioToggle = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    audioService.setEnabled(newState);
  };

  const handleMasterVolumeChange = (value: number) => {
    setMasterVolume(value);
    audioService.setMasterVolume(value);
  };

  const handleSfxVolumeChange = (value: number) => {
    setSfxVolume(value);
    audioService.setSfxVolume(value);
  };

  const handleMusicVolumeChange = (value: number) => {
    setMusicVolume(value);
    audioService.setMusicVolume(value);
  };

  const testSound = () => {
    audioService.playUIClick();
  };

  const forceMoodChange = (mood: MusicMood) => {
    audioService.setAmbientMusic(mood);
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-gray-800 hover:bg-gray-700 text-cyan-400 p-3 rounded-full border border-cyan-400 transition-colors z-50"
        title="Audio Controls"
      >
        🎵
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-cyan-400 rounded-lg p-4 shadow-lg z-50 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-cyan-400 font-bold text-sm">AUDIO MATRIX</h3>
        <button
          onClick={onToggle}
          className="text-cyan-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Audio Enable/Disable */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-cyan-400 text-xs">AUDIO SYSTEM</label>
          <button
            onClick={handleAudioToggle}
            className={`px-3 py-1 rounded text-xs transition-all ${
              audioEnabled 
                ? 'bg-green-600 text-white' 
                : 'bg-red-600 text-white'
            }`}
          >
            {audioEnabled ? 'ONLINE' : 'OFFLINE'}
          </button>
        </div>
      </div>

      {audioEnabled && (
        <>
          {/* Volume Controls */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-cyan-400 text-xs block mb-1">
                MASTER VOLUME: {Math.round(masterVolume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={masterVolume}
                onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-cyan"
              />
            </div>

            <div>
              <label className="text-cyan-400 text-xs block mb-1">
                SFX VOLUME: {Math.round(sfxVolume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={sfxVolume}
                onChange={(e) => handleSfxVolumeChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-green"
              />
            </div>

            <div>
              <label className="text-cyan-400 text-xs block mb-1">
                MUSIC VOLUME: {Math.round(musicVolume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={musicVolume}
                onChange={(e) => handleMusicVolumeChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-yellow"
              />
            </div>
          </div>

          {/* Current Mood Display */}
          <div className="mb-4">
            <label className="text-cyan-400 text-xs block mb-2">CURRENT MOOD</label>
            <div className="bg-gray-800 px-3 py-2 rounded border border-gray-600">
              <span className="text-yellow-400 text-sm font-mono uppercase">
                {currentMood.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Test Button */}
          <div className="mb-4">
            <button
              onClick={testSound}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded text-xs transition-colors w-full"
            >
              🔊 TEST AUDIO
            </button>
          </div>

          {/* Manual Mood Controls (for testing) */}
          <div className="border-t border-gray-600 pt-3">
            <label className="text-cyan-400 text-xs block mb-2">FORCE MOOD (DEBUG)</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.values(MusicMood).map((mood) => (
                <button
                  key={mood}
                  onClick={() => forceMoodChange(mood)}
                  className={`px-2 py-1 rounded transition-all ${
                    currentMood === mood 
                      ? 'bg-cyan-400 text-black' 
                      : 'bg-gray-700 text-cyan-400 hover:bg-gray-600'
                  }`}
                >
                  {mood.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AudioControls;
