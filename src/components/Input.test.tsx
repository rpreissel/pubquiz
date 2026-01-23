import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  it('renders input field', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Input label="Name" />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('does not render label when not provided', () => {
    const { container } = render(<Input />);
    expect(container.querySelector('.input-label')).not.toBeInTheDocument();
  });

  it('renders error message when provided', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('does not render error when not provided', () => {
    const { container } = render(<Input />);
    expect(container.querySelector('.input-error')).not.toBeInTheDocument();
  });

  it('applies full-width class when specified', () => {
    render(<Input fullWidth />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('input--full-width');
  });

  it('applies custom className', () => {
    render(<Input className="custom-input" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-input');
    expect(input).toHaveClass('input'); // Should also have base class
  });

  it('forwards input props', () => {
    render(<Input placeholder="Enter name" disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Enter name');
    expect(input).toBeDisabled();
  });

  it('supports different input types', () => {
    render(<Input type="email" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('renders complete input with label and error', () => {
    render(<Input label="Email" error="Invalid email" placeholder="you@example.com" fullWidth />);

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('input--full-width');
  });
});
