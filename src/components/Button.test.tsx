import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('applies primary variant by default', () => {
    render(<Button>Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('button--primary');
  });

  it('applies secondary variant when specified', () => {
    render(<Button variant="secondary">Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('button--secondary');
  });

  it('applies danger variant when specified', () => {
    render(<Button variant="danger">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('button--danger');
  });

  it('applies medium size by default', () => {
    render(<Button>Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('button--medium');
  });

  it('applies small size when specified', () => {
    render(<Button size="small">Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('button--small');
  });

  it('applies large size when specified', () => {
    render(<Button size="large">Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('button--large');
  });

  it('applies full-width class when specified', () => {
    render(<Button fullWidth>Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('button--full-width');
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
    expect(button).toHaveClass('button'); // Should also have base class
  });

  it('forwards button props', () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Test
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders all classes correctly', () => {
    render(
      <Button variant="danger" size="large" fullWidth className="extra">
        Test
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveClass('button');
    expect(button).toHaveClass('button--danger');
    expect(button).toHaveClass('button--large');
    expect(button).toHaveClass('button--full-width');
    expect(button).toHaveClass('extra');
  });
});
