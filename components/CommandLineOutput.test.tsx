import React from 'react';
import { render, screen } from '@testing-library/react';
import CommandLineOutput from './CommandLineOutput';
import { StoryLogEntry, LogEntryType } from '../types';

describe('CommandLineOutput Component', () => {
  const mockLogEntries: StoryLogEntry[] = [
    {
      id: '1',
      type: LogEntryType.SYSTEM_MESSAGE,
      content: 'System booting...',
      timestamp: '12:00:00'
    },
    {
      id: '2',
      type: LogEntryType.PLAYER_INPUT,
      content: 'look around',
      timestamp: '12:00:05'
    },
    {
      id: '3',
      type: LogEntryType.STORY,
      content: 'You see neon lights flickering in the distance.',
      timestamp: '12:00:06'
    },
    {
      id: '4',
      type: LogEntryType.ERROR,
      content: 'Connection failed',
      timestamp: '12:00:10'
    },
    {
      id: '5',
      type: LogEntryType.IMAGE,
      content: 'https://example.com/image.jpg',
      timestamp: '12:00:15'
    }
  ];

  test('renders empty log correctly', () => {
    const { container } = render(<CommandLineOutput log={[]} />);
    
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('p-4', 'space-y-2', 'overflow-y-auto', 'h-full');
  });

  test('displays log entries with timestamps', () => {
    render(<CommandLineOutput log={mockLogEntries} />);
    
    expect(screen.getByText('System booting...')).toBeInTheDocument();
    expect(screen.getByText('look around')).toBeInTheDocument();
    expect(screen.getByText('You see neon lights flickering in the distance.')).toBeInTheDocument();
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    
    // Check timestamps are displayed
    expect(screen.getByText('12:00:00')).toBeInTheDocument();
    expect(screen.getByText('12:00:05')).toBeInTheDocument();
  });

  test('renders player input with terminal prompt', () => {
    const playerInputLog = [mockLogEntries[1]]; // Player input entry
    render(<CommandLineOutput log={playerInputLog} />);
    
    expect(screen.getByText('NC_TERMINAL:>')).toBeInTheDocument();
    expect(screen.getByText('look around')).toBeInTheDocument();
  });

  test('renders images correctly', () => {
    const imageLog = [mockLogEntries[4]]; // Image entry
    render(<CommandLineOutput log={imageLog} />);
    
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(image).toHaveAttribute('alt', 'Scene visual');
  });

  test('applies correct CSS classes for different log types', () => {
    render(<CommandLineOutput log={mockLogEntries} />);
    
    const container = screen.getByText('System booting...').parentElement;
    expect(container).toHaveClass('text-purple-400');
    
    const playerInput = screen.getByText('look around').parentElement;
    expect(playerInput).toHaveClass('text-cyan-400');
    
    const story = screen.getByText('You see neon lights flickering in the distance.').parentElement;
    expect(story).toHaveClass('text-green-400');
    
    const error = screen.getByText('Connection failed').parentElement;
    expect(error).toHaveClass('text-red-500', 'font-bold');
  });
});