import { render, screen } from '@testing-library/react';
import { PromptCard } from '../PromptCard';

// Mock dependencies
jest.mock('../../services/promptService', () => ({
  promptService: {
    toggleLike: jest.fn(),
  },
}));

jest.mock('../../stores/promptStore', () => ({
  usePromptStore: (selector: any) => selector({
    updatePrompt: jest.fn(),
  }),
}));

describe('PromptCard', () => {
  const defaultProps = {
    id: '1',
    title: 'Test Prompt',
    description: 'Test Description',
    content: 'Test Content',
    category: 'coding',
    author: 'Test Author',
    views: 10,
    likes: 5,
    tags: ['react', 'test'],
  };

  it('renders title and description', () => {
    render(<PromptCard {...defaultProps} />);
    expect(screen.getByText('Test Prompt')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('renders content when description is empty', () => {
    const props = { ...defaultProps, description: '', content: 'Fallback Content' };
    render(<PromptCard {...props} />);
    expect(screen.getByText('Fallback Content')).toBeInTheDocument();
  });
  
  it('renders description over content when both present', () => {
    const props = { ...defaultProps, description: 'Main Description', content: 'Fallback Content' };
    render(<PromptCard {...props} />);
    expect(screen.getByText('Main Description')).toBeInTheDocument();
    expect(screen.queryByText('Fallback Content')).not.toBeInTheDocument();
  });
});
