import React, { useState, useEffect } from 'react';
import { StoryLogEntry, LogEntryType } from '../types';
import { audioService } from '../services/audioService';

interface VisualCortexPanelProps {
  storyLog: StoryLogEntry[];
  isProcessing: boolean;
}

const VisualCortexPanel: React.FC<VisualCortexPanelProps> = ({ storyLog, isProcessing }) => {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [imageHistory, setImageHistory] = useState<string[]>([]);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [scanLines, setScanLines] = useState(true);
  const [dataStreams, setDataStreams] = useState(true);  const [holographicBorder, setHolographicBorder] = useState(true);
  const [imageTransition, setImageTransition] = useState(false);
  
  // Extract images from story log
  useEffect(() => {
    const images = storyLog
      .filter(entry => entry.type === LogEntryType.IMAGE)
      .map(entry => entry.content);
    
    setImageHistory(images);
    if (images.length > 0 && images[images.length - 1] !== currentImage) {
      // For initial load, set image immediately, for subsequent changes use transition
      const isInitialLoad = currentImage === null;
      
      if (isInitialLoad) {
        setCurrentImage(images[images.length - 1]);
      } else {
        // Trigger transition effect for image changes
        setImageTransition(true);
        setTimeout(() => {
          setCurrentImage(images[images.length - 1]);
          setImageTransition(false);
          // Play audio feedback if enabled
          playAudioFeedback();
        }, 200);
      }
    }
  }, [storyLog, currentImage]);

  // Matrix data streams animation
  useEffect(() => {
    if (!dataStreams) return;
    
    const interval = setInterval(() => {
      // This creates the flowing data effect
      const dataElements = document.querySelectorAll('.data-stream');
      dataElements.forEach((element) => {
        if (element instanceof HTMLElement) {
          element.style.transform = `translateY(${Math.random() * 100}px)`;
        }
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [dataStreams]);  // Audio feedback function
  const playAudioFeedback = () => {
    audioService.playUIClick();
  };

  // Scan line animation effect
  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setScanLines(prev => !prev);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isProcessing]);
  const handleImageClick = () => {
    setIsEnhanced(!isEnhanced);
    playAudioFeedback();
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (imageHistory.length === 0) return;
    
    const currentIndex = imageHistory.indexOf(currentImage || '');
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : imageHistory.length - 1;
    } else {
      newIndex = currentIndex < imageHistory.length - 1 ? currentIndex + 1 : 0;
    }
    
    // Trigger transition effect
    setImageTransition(true);
    playAudioFeedback();
    
    setTimeout(() => {
      setCurrentImage(imageHistory[newIndex]);
      setImageTransition(false);
    }, 150);
  };

  // Matrix data stream generator
  const generateDataStreams = () => {
    const streams = [];
    for (let i = 0; i < 12; i++) {
      streams.push(
        <div
          key={i}
          className="data-stream absolute text-green-500 text-xs opacity-30 animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            transform: `rotate(${Math.random() * 360}deg)`
          }}
        >
          {Math.random().toString(16).substr(2, 6)}
        </div>
      );
    }
    return streams;
  };

  return (
    <div className="flex flex-col h-full bg-black border-l-2 border-cyan-400 relative overflow-hidden">
      {/* Neural Interface Header */}
      <div className="bg-gray-900 border-b border-cyan-400 p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-cyan-400 text-sm font-mono font-bold">VISUAL CORTEX v3.7</span>
          </div>          <div className="text-xs text-gray-500">
            {imageHistory.length > 0 && (
              <span>{Math.max(1, imageHistory.indexOf(currentImage || '') + 1)}/{imageHistory.length}</span>
            )}
          </div>
        </div>
        
        {/* Processing indicator */}
        {isProcessing && (
          <div className="mt-1 text-xs text-yellow-400 animate-pulse">
            ⚡ NEURAL PROCESSING...
          </div>
        )}
      </div>      {/* Main Image Display */}
      <div className="flex-1 relative bg-black overflow-hidden">
        {/* Matrix Data Streams Background */}
        {dataStreams && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {generateDataStreams()}
          </div>
        )}

        {currentImage ? (
          <div className="relative w-full h-full">
            {/* Holographic border effect */}
            {holographicBorder && (
              <div className="absolute inset-0 border-2 border-cyan-400 opacity-60 z-20 pointer-events-none">
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-yellow-400 animate-pulse"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-yellow-400 animate-pulse"></div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-yellow-400 animate-pulse"></div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-yellow-400 animate-pulse"></div>
              </div>
            )}

            <img
              src={currentImage}
              alt="Visual Cortex Feed"
              className={`w-full h-full object-cover cursor-pointer transition-all duration-500 ${
                isEnhanced ? 'scale-150' : 'scale-100'
              } ${imageTransition ? 'opacity-50 blur-sm' : 'opacity-100'}`}
              onClick={handleImageClick}
              style={{
                filter: scanLines && isProcessing ? 'contrast(1.2) brightness(1.1) hue-rotate(10deg)' : 'none'
              }}
            />
            
            {/* Enhanced scan lines overlay */}
            {scanLines && (
              <div className="absolute inset-0 pointer-events-none z-30">
                <div className="w-full h-full opacity-30 bg-gradient-to-b from-transparent via-cyan-400 to-transparent animate-pulse"></div>
                <div className="absolute w-full h-0.5 bg-cyan-400 opacity-70 animate-bounce top-1/4 shadow-cyan-400 shadow-sm"></div>
                <div className="absolute w-full h-0.5 bg-yellow-400 opacity-50 animate-pulse top-2/3 shadow-yellow-400 shadow-sm"></div>
                <div className="absolute w-full h-px bg-green-400 opacity-40 animate-ping top-1/2"></div>
              </div>
            )}

            {/* Enhancement indicator */}
            {isEnhanced && (
              <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-1 text-xs font-bold rounded z-40 animate-pulse">
                ⚡ ENHANCED
              </div>
            )}

            {/* Glitch effect during transition */}
            {imageTransition && (
              <div className="absolute inset-0 bg-black bg-opacity-20 z-50 pointer-events-none">
                <div className="w-full h-full bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-30 animate-ping"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 border-2 border-cyan-400 border-dashed rounded-lg mx-auto flex items-center justify-center">
                <span className="text-cyan-400 text-2xl">👁️</span>
              </div>
              <div className="text-cyan-400 text-sm">
                <div className="font-bold">VISUAL CORTEX STANDBY</div>
                <div className="text-xs text-gray-500 mt-1">Awaiting neural input...</div>
              </div>
            </div>
          </div>
        )}        {/* Enhanced processing overlay */}
        {isProcessing && !currentImage && (
          <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className="text-center space-y-4 relative">
              {/* Matrix background for processing */}
              <div className="absolute inset-0 opacity-20">
                {generateDataStreams()}
              </div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <div className="w-12 h-12 border-2 border-yellow-400 border-b-transparent rounded-full animate-spin mx-auto absolute top-2 left-1/2 transform -translate-x-1/2"></div>
                <div className="w-8 h-8 border-2 border-green-400 border-l-transparent rounded-full animate-ping mx-auto absolute top-4 left-1/2 transform -translate-x-1/2"></div>
              </div>
              
              <div className="text-cyan-400 text-sm font-mono relative z-10">
                <div className="animate-pulse text-lg">⚡ PROCESSING VISUAL DATA...</div>
                <div className="text-xs text-gray-400 mt-1 animate-bounce">Neural pathways synchronizing...</div>
                <div className="text-xs text-green-400 mt-1 opacity-60">Quantum entanglement active...</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      {imageHistory.length > 1 && (
        <div className="bg-gray-900 border-t border-cyan-400 p-2">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigateImage('prev')}
              className="bg-gray-800 hover:bg-gray-700 text-cyan-400 px-3 py-1 rounded text-sm border border-cyan-400 transition-colors"
            >
              ← PREV
            </button>
            
            <div className="flex space-x-1">
              {imageHistory.slice(-5).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === imageHistory.length - 1 ? 'bg-cyan-400' : 'bg-gray-600'
                  }`}
                ></div>
              ))}
            </div>
            
            <button
              onClick={() => navigateImage('next')}
              className="bg-gray-800 hover:bg-gray-700 text-cyan-400 px-3 py-1 rounded text-sm border border-cyan-400 transition-colors"
            >
              NEXT →
            </button>
          </div>
        </div>
      )}      {/* Enhanced Toggle Controls */}
      <div className="bg-gray-900 border-t border-cyan-400 p-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => {
              setScanLines(!scanLines);
              playAudioFeedback();
            }}
            className={`px-2 py-1 rounded transition-all ${
              scanLines 
                ? 'bg-cyan-400 text-black shadow-cyan-400 shadow-sm' 
                : 'bg-gray-800 text-cyan-400 border border-cyan-400 hover:bg-cyan-900'
            }`}
          >
            SCAN LINES
          </button>
          
          <button
            onClick={() => {
              setDataStreams(!dataStreams);
              playAudioFeedback();
            }}
            className={`px-2 py-1 rounded transition-all ${
              dataStreams 
                ? 'bg-green-400 text-black shadow-green-400 shadow-sm' 
                : 'bg-gray-800 text-green-400 border border-green-400 hover:bg-green-900'
            }`}
          >
            DATA STREAMS
          </button>
          
          <button
            onClick={() => {
              setHolographicBorder(!holographicBorder);
              playAudioFeedback();
            }}
            className={`px-2 py-1 rounded transition-all ${
              holographicBorder 
                ? 'bg-yellow-400 text-black shadow-yellow-400 shadow-sm' 
                : 'bg-gray-800 text-yellow-400 border border-yellow-400 hover:bg-yellow-900'
            }`}
          >
            HOLO BORDER
          </button>
          
          <div className="text-gray-500 text-center flex items-center justify-center">
            Neural Active
          </div>        </div>
      </div>
    </div>
  );
};

export default VisualCortexPanel;
