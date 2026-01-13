import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary } from '../ErrorBoundary';

// Console error suppression for error boundary tests
const consoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = consoleError;
});

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test Children</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test Children')).toBeInTheDocument();
  });

  it('catches errors and displays error UI', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('出错了')).toBeInTheDocument();
    expect(screen.getByText(/抱歉，应用程序遇到了意外错误/)).toBeInTheDocument();
  });

  it('displays error details when expanded', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const details = screen.getByText(/查看错误详情/);
    fireEvent.click(details);

    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  it('resets error state when retry button is clicked', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('出错了')).toBeInTheDocument();

    // First, change the children to non-erroring component
    rerender(
      <ErrorBoundary>
        <div>Test Children</div>
      </ErrorBoundary>
    );

    // Then click retry to clear error state and render the new children
    const retryButton = screen.getByText(/重试/);
    fireEvent.click(retryButton);

    expect(screen.queryByText('出错了')).not.toBeInTheDocument();
    expect(screen.getByText('Test Children')).toBeInTheDocument();
  });

  it('navigates to home when home button is clicked', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    // Mock window.location
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { href: '' } as any;

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const homeButton = screen.getByText(/返回首页/);
    fireEvent.click(homeButton);

    expect((window.location as any).href).toBe('/');

    // Restore window.location
    (window as any).location = originalLocation;
  });
});
