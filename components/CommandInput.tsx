
import React, { useState } from 'react';
import { CLI_PROMPT_SYMBOL } from '../constants';
import { audioService } from '../services/audioService';

interface CommandInputProps {
  onSubmit: (command: string) => void;
  isLoading: boolean;
}

const CommandInput: React.FC<CommandInputProps> = ({ onSubmit, isLoading }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      audioService.playEnterSound();
      onSubmit(inputValue.trim());
      setInputValue('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Play typing sound only when character is added (not deleted)
    if (newValue.length > inputValue.length) {
      audioService.playTypingSound();
    }
    
    setInputValue(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Play typing sound for most keys except special ones
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
      audioService.playTypingSound();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-green-700 flex items-center">
      <span className="text-yellow-400 mr-2 flex-shrink-0">{CLI_PROMPT_SYMBOL}</span>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="bg-transparent text-cyan-400 focus:outline-none w-full cli-input"
        placeholder={isLoading ? "Processing request on the Net..." : "Enter your command, choom..."}
        disabled={isLoading}
        spellCheck="false"
        autoCapitalize='none'
        autoComplete='off'
      />
      {!isLoading && <div className="blinking-cursor"></div>}
      <button type="submit" hidden disabled={isLoading}></button>
    </form>
  );
};

export default CommandInput;
