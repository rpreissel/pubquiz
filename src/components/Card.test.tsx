import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>,
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies base card class', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.querySelector('.card');
    expect(card).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-card">Content</Card>);
    const card = container.querySelector('.card');
    expect(card).toHaveClass('custom-card');
    expect(card).toHaveClass('card'); // Should also have base class
  });

  it('applies clickable class when onClick is provided', () => {
    const handleClick = vi.fn();
    const { container } = render(<Card onClick={handleClick}>Content</Card>);
    const card = container.querySelector('.card');
    expect(card).toHaveClass('card--clickable');
  });

  it('does not apply clickable class when onClick is not provided', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.querySelector('.card');
    expect(card).not.toHaveClass('card--clickable');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    const { container } = render(<Card onClick={handleClick}>Content</Card>);
    const card = container.querySelector('.card');

    fireEvent.click(card!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when card is not clickable', () => {
    const handleClick = vi.fn();
    const { container } = render(<Card>Content</Card>);
    const card = container.querySelector('.card');

    fireEvent.click(card!);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders complex children', () => {
    render(
      <Card>
        <h2>Title</h2>
        <p>Description</p>
        <button>Action</button>
      </Card>,
    );

    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });
});
