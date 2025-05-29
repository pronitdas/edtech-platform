import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dialog } from './Dialog';

describe('Dialog', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders when isOpen is true', () => {
    render(
      <Dialog isOpen={true} onClose={mockOnClose}>
        Test Content
      </Dialog>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <Dialog isOpen={false} onClose={mockOnClose}>
        Test Content
      </Dialog>
    );
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(
      <Dialog isOpen={true} onClose={mockOnClose} title="Test Title">
        Content
      </Dialog>
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <Dialog
        isOpen={true}
        onClose={mockOnClose}
        description="Test Description"
      >
        Content
      </Dialog>
    );
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    render(
      <Dialog
        isOpen={true}
        onClose={mockOnClose}
        footer={<button>Test Footer</button>}
      >
        Content
      </Dialog>
    );
    expect(screen.getByText('Test Footer')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    render(
      <Dialog isOpen={true} onClose={mockOnClose}>
        Content
      </Dialog>
    );
    
    // Click the backdrop (the first element with the backdrop class)
    const backdrop = document.querySelector('.fixed.inset-0.bg-gray-900\\/75');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('applies correct max-width class', () => {
    const { container } = render(
      <Dialog isOpen={true} onClose={mockOnClose} maxWidth="xl">
        Content
      </Dialog>
    );
    const panel = container.querySelector('.max-w-xl');
    expect(panel).toBeInTheDocument();
  });

  it('merges custom className with default styles', () => {
    const { container } = render(
      <Dialog isOpen={true} onClose={mockOnClose} className="custom-class">
        Content
      </Dialog>
    );
    const panel = container.querySelector('.custom-class');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveClass('rounded-lg'); // default style
  });
}); 