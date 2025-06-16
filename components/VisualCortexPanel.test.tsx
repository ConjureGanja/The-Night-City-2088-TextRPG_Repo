import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VisualCortexPanel from './VisualCortexPanel';
import { StoryLogEntry, LogEntryType } from '../types';

// Mock HTMLMediaElement play method
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: jest.fn().mockImplementation(() => Promise.resolve())
});

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: jest.fn()
});

describe('VisualCortexPanel', () => {
  const mockStoryLog: StoryLogEntry[] = [
    {
      id: '1',
      type: LogEntryType.SYSTEM_MESSAGE,
      content: 'System message',
      timestamp: '12:00:00'
    },
    {
      id: '2',
      type: LogEntryType.IMAGE,
      content: 'data:image/jpeg;base64,mockimage1',
      timestamp: '12:01:00'
    },
    {
      id: '3',
      type: LogEntryType.IMAGE,
      content: 'data:image/jpeg;base64,mockimage2',
      timestamp: '12:02:00'
    }
  ];

  test('renders visual cortex header', () => {
    render(<VisualCortexPanel storyLog={[]} isProcessing={false} />);
    
    expect(screen.getByText('VISUAL CORTEX v3.7')).toBeInTheDocument();
  });

  test('shows standby message when no images', () => {
    render(<VisualCortexPanel storyLog={[]} isProcessing={false} />);
    
    expect(screen.getByText('VISUAL CORTEX STANDBY')).toBeInTheDocument();
    expect(screen.getByText('Awaiting neural input...')).toBeInTheDocument();
  });

  test('displays current image when available', () => {
    render(<VisualCortexPanel storyLog={mockStoryLog} isProcessing={false} />);
    
    const image = screen.getByAltText('Visual Cortex Feed');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'data:image/jpeg;base64,mockimage2');
  });
  test('shows processing overlay when processing', () => {
    render(<VisualCortexPanel storyLog={[]} isProcessing={true} />);
    
    expect(screen.getByText('⚡ PROCESSING VISUAL DATA...')).toBeInTheDocument();
    expect(screen.getByText('Neural pathways synchronizing...')).toBeInTheDocument();
  });
  test('shows navigation controls when multiple images', () => {
    render(<VisualCortexPanel storyLog={mockStoryLog} isProcessing={false} />);
    
    expect(screen.getByText('← PREV')).toBeInTheDocument();
    expect(screen.getByText('NEXT →')).toBeInTheDocument();
    expect(screen.getByText('2/2')).toBeInTheDocument();
  });

  test('toggles scan lines when button clicked', () => {
    render(<VisualCortexPanel storyLog={[]} isProcessing={false} />);
    
    const scanLinesButton = screen.getByText('SCAN LINES');
    expect(scanLinesButton).toHaveClass('bg-cyan-400');
    
    fireEvent.click(scanLinesButton);
    expect(scanLinesButton).toHaveClass('bg-gray-800');
  });
  test('navigates between images', async () => {
    render(<VisualCortexPanel storyLog={mockStoryLog} isProcessing={false} />);
    
    const image = screen.getByAltText('Visual Cortex Feed');
    expect(image).toHaveAttribute('src', 'data:image/jpeg;base64,mockimage2');
    
    const prevButton = screen.getByText('← PREV');
    fireEvent.click(prevButton);
    
    await waitFor(() => {
      expect(image).toHaveAttribute('src', 'data:image/jpeg;base64,mockimage1');
    });
  });
  test('toggles enhanced view when image clicked', async () => {
    render(<VisualCortexPanel storyLog={mockStoryLog} isProcessing={false} />);
    
    const image = screen.getByAltText('Visual Cortex Feed');
    expect(image).toHaveClass('scale-100');
    
    fireEvent.click(image);
    expect(image).toHaveClass('scale-150');
    expect(screen.getByText('⚡ ENHANCED')).toBeInTheDocument();
  });

  test('shows processing indicator when isProcessing is true', () => {
    render(<VisualCortexPanel storyLog={[]} isProcessing={true} />);
    
    expect(screen.getByText('⚡ NEURAL PROCESSING...')).toBeInTheDocument();
  });
});
