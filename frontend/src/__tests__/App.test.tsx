import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { AppContent } from '../App';

// Mock the hooks and services
jest.mock('../hooks/usePrompts', () => ({
  usePrompts: () => ({
    prompts: [
      {
        id: '1',
        title: 'Test Prompt 1',
        description: 'Test Description 1',
        content: 'Test Content 1',
        category: 'test',
        author: 'testuser',
        isPublic: true,
        views: 10,
        likes: 5,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        tags: ['test']
      }
    ],
    refresh: jest.fn()
  }),
  usePromptDetail: () => ({
    id: '1',
    title: 'Test Prompt 1',
    description: 'Test Description 1',
    content: 'Test Content 1',
    category: 'test',
    author: 'testuser',
    isPublic: true,
    views: 10,
    likes: 5,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    tags: ['test']
  })
}));

jest.mock('../stores/promptStore', () => ({
  usePromptStore: () => ({
    isLoading: false,
    error: null
  })
}));

jest.mock('../context/ToastContext', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useToast: () => ({
    show: jest.fn()
  })
}));

// Mock ErrorBoundary to always render children for tests
jest.mock('../components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

describe('App Component', () => {
  it('renders home page at root route', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppContent />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Prompt 1')).toBeInTheDocument();
    });
  });

  it('navigates to prompt detail page', async () => {
    const history = createMemoryHistory();
    history.push('/prompts/1');

    render(
      <Router location={history.location} navigator={history}>
        <AppContent />
      </Router>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Prompt 1')).toBeInTheDocument();
    });
  });

  it('displays footer', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppContent />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/© 2025 PromptSpark/)).toBeInTheDocument();
    });
  });
});
