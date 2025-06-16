import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommandInput from './CommandInput';

describe('CommandInput Component', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  test('renders input field with placeholder', () => {
    render(<CommandInput onSubmit={mockOnSubmit} isLoading={false} />);
    
    const input = screen.getByPlaceholderText('Enter your command, choom...');
    expect(input).toBeInTheDocument();
  });

  test('shows loading placeholder when loading', () => {
    render(<CommandInput onSubmit={mockOnSubmit} isLoading={true} />);
    
    const input = screen.getByPlaceholderText('Processing request on the Net...');
    expect(input).toBeInTheDocument();
    expect(input).toBeDisabled();
  });

  test('calls onSubmit when form is submitted', async () => {
    const user = userEvent.setup();
    render(<CommandInput onSubmit={mockOnSubmit} isLoading={false} />);
    
    const input = screen.getByPlaceholderText('Enter your command, choom...');
    
    await user.type(input, 'look around');
    await user.keyboard('{Enter}');
    
    expect(mockOnSubmit).toHaveBeenCalledWith('look around');
  });

  test('clears input after submission', async () => {
    const user = userEvent.setup();
    render(<CommandInput onSubmit={mockOnSubmit} isLoading={false} />);
    
    const input = screen.getByPlaceholderText('Enter your command, choom...');
    
    await user.type(input, 'hack terminal');
    await user.keyboard('{Enter}');
    
    expect(input).toHaveValue('');
  });

  test('does not submit empty or whitespace-only commands', async () => {
    const user = userEvent.setup();
    render(<CommandInput onSubmit={mockOnSubmit} isLoading={false} />);
    
    const input = screen.getByPlaceholderText('Enter your command, choom...');
    
    // Try empty submission
    await user.keyboard('{Enter}');
    expect(mockOnSubmit).not.toHaveBeenCalled();
    
    // Try whitespace only
    await user.type(input, '   ');
    await user.keyboard('{Enter}');
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('does not submit when loading', async () => {
    const user = userEvent.setup();
    render(<CommandInput onSubmit={mockOnSubmit} isLoading={true} />);
    
    const input = screen.getByPlaceholderText('Processing request on the Net...');
    
    await user.type(input, 'test command');
    
    // Form should not submit when loading
    const form = input.closest('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});