
import React from 'react';
import { StoryLogEntry, LogEntryType } from '../types';

interface CommandLineOutputProps {
  log: StoryLogEntry[];
}

const CommandLineOutput: React.FC<CommandLineOutputProps> = ({ log }) => {
  const getEntryStyle = (type: LogEntryType) => {
    switch (type) {
      case LogEntryType.PLAYER_INPUT:
        return 'text-cyan-400';
      case LogEntryType.STORY:
        return 'text-green-400';
      case LogEntryType.IMAGE_CAPTION:
        return 'text-yellow-400 italic';
      case LogEntryType.ERROR:
        return 'text-red-500 font-bold';
      case LogEntryType.SYSTEM_MESSAGE:
        return 'text-purple-400';
       case LogEntryType.LOADING:
        return 'text-gray-500 italic';
      default:
        return 'text-green-400'; // Default to story color
    }
  };

  return (
    <div className="p-4 space-y-2 overflow-y-auto h-full">
      {log.map((entry) => (
        <div key={entry.id} className={`whitespace-pre-wrap break-words ${getEntryStyle(entry.type)}`}>
          <span className="text-gray-500 mr-2 text-xs">{entry.timestamp}</span>
          {entry.type === LogEntryType.PLAYER_INPUT && <span className="text-yellow-400">NC_TERMINAL:&gt; </span>}
          {entry.type === LogEntryType.IMAGE ? (
            <div className="my-2">
              <img src={entry.content} alt="Scene visual" className="max-w-sm md:max-w-md lg:max-w-lg mx-auto border-2 border-green-700 p-1 bg-black" />
            </div>
          ) : (
            <span>{entry.content}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default CommandLineOutput;
