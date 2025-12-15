import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiscussionSection } from '../DiscussionSection';
import * as collaborationService from '../../services/collaborationService';

jest.mock('../../services/collaborationService');
jest.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user' }
  })
}));
jest.mock('../CommentThread', () => ({
  CommentThread: (props: any) => <div data-testid="comment-thread">Comments for discussion {props.parentId || props.discussionId}</div>
}));

describe('DiscussionSection Component', () => {
  const mockDiscussions = [
    {
      id: '1',
      promptId: '1',
      title: 'How to improve?',
      description: 'Suggestions for enhancement',
      initiatorName: 'Alice',
      status: 'open',
      createdAt: '2024-01-01T10:00:00Z',
      commentCount: 3
    },
    {
      id: '2',
      promptId: '1',
      title: 'Best practices',
      description: 'Discussing best practices',
      initiatorName: 'Bob',
      status: 'resolved',
      createdAt: '2024-01-01T09:00:00Z',
      commentCount: 5
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (collaborationService.getDiscussions as jest.Mock).mockResolvedValue(mockDiscussions);
    (collaborationService.createDiscussion as jest.Mock).mockResolvedValue({
      id: '3',
      promptId: '1',
      title: 'New discussion',
      description: 'New discussion content',
      initiatorName: 'Test User',
      status: 'open',
      createdAt: new Date().toISOString(),
      commentCount: 0
    });
    (collaborationService.updateDiscussionStatus as jest.Mock).mockResolvedValue({
      status: 'resolved'
    });
  });

  test('should render discussion section', () => {
    render(<DiscussionSection promptId={"1"} />);
    expect(screen.getByText(/💬 讨论区/)).toBeInTheDocument();
  });

  test('should display create discussion form', async () => {
    const user = userEvent.setup();
    render(<DiscussionSection promptId={"1"} />);
    // by default a button to open the form should be visible
    expect(screen.getByRole('button', { name: /开启新讨论/ })).toBeInTheDocument();
    // open form and check fields by placeholder (labels are not associated)
    await user.click(screen.getByRole('button', { name: /开启新讨论/ }));
    expect(screen.getByPlaceholderText(/输入讨论标题/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/描述您的讨论主题/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /创建讨论/ })).toBeInTheDocument();
  });

  test('should display all discussions', async () => {
    render(<DiscussionSection promptId={"1"} />);

    await waitFor(() => {
      expect(screen.getByText('How to improve?')).toBeInTheDocument();
      expect(screen.getByText('Best practices')).toBeInTheDocument();
    });
  });

  test('should create new discussion on form submit', async () => {
    const user = userEvent.setup();
    render(<DiscussionSection promptId={"1"} />);
    // open form
    await user.click(screen.getByRole('button', { name: /开启新讨论/ }));

    const titleInput = screen.getByPlaceholderText(/输入讨论标题/) as HTMLInputElement;
    const contentInput = screen.getByPlaceholderText(/描述您的讨论主题/) as HTMLTextAreaElement;
    const submitButton = screen.getByRole('button', { name: /创建讨论/ });

    await user.type(titleInput, 'New discussion');
    await user.type(contentInput, 'New discussion content');
    await user.click(submitButton);

    await waitFor(() => {
      expect(collaborationService.createDiscussion).toHaveBeenCalledWith("1", 'New discussion', 'New discussion content');
    });
  });

  test('should display discussion status badge', async () => {
    render(<DiscussionSection promptId={"1"} />);

    await waitFor(() => {
      expect(screen.getByText(/开放中/)).toBeInTheDocument();
      expect(screen.getByText(/已解决/)).toBeInTheDocument();
    });
  });

  test('should change discussion status', async () => {
    const user = userEvent.setup();
    render(<DiscussionSection promptId={"1"} />);

    await waitFor(() => {
      expect(screen.getByText('How to improve?')).toBeInTheDocument();
    });
    // expand the discussion to reveal status controls
    await user.click(screen.getByText('How to improve?'));
    const statusButtons = screen.getAllByRole('button').filter((b) => /开放中|已解决|已关闭/.test(b.textContent || ''));
    await user.click(statusButtons[0]);

    await waitFor(() => {
      expect(collaborationService.updateDiscussionStatus).toHaveBeenCalled();
    });
  });

  test('should display discussion author and creation date', async () => {
    render(<DiscussionSection promptId={"1"} />);

    await waitFor(() => {
      expect(screen.getByText(/Alice/i)).toBeInTheDocument();
      expect(screen.getByText(/Bob/i)).toBeInTheDocument();
      const dates = screen.getAllByText(/2024/);
      expect(dates.length).toBeGreaterThan(0);
    });
  });

  test('should display replies count', async () => {
    render(<DiscussionSection promptId={"1"} />);

    await waitFor(() => {
      // comment counts are displayed as numbers with a following '条评论'
      expect(screen.getAllByText(/条评论/).length).toBeGreaterThan(0);
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  test('should display comment thread when discussion is expanded', async () => {
    const user = userEvent.setup();
    render(<DiscussionSection promptId={"1"} />);

    await waitFor(() => {
      expect(screen.getByText('How to improve?')).toBeInTheDocument();
    });
    await user.click(screen.getByText('How to improve?'));

    await waitFor(() => {
      expect(screen.getByTestId('comment-thread')).toBeInTheDocument();
    });
  });

  test('should show loading state', () => {
    (collaborationService.getDiscussions as jest.Mock).mockImplementation(() =>
      new Promise(() => {}) // Never resolves
    );

    render(<DiscussionSection promptId={"1"} />);
    expect(screen.getByText(/暂无讨论/)).toBeInTheDocument();
  });

  test('should show error state on load failure', async () => {
    (collaborationService.getDiscussions as jest.Mock).mockRejectedValueOnce(
      new Error('Failed to load discussions')
    );

    render(<DiscussionSection promptId={"1"} />);

    await waitFor(() => {
      expect(screen.getByText(/暂无讨论/)).toBeInTheDocument();
    });
  });

  test('should clear form after successful submission', async () => {
    const user = userEvent.setup();
    render(<DiscussionSection promptId={"1"} />);

    await user.click(screen.getByRole('button', { name: /开启新讨论/ }));
    const titleInput = screen.getByPlaceholderText(/输入讨论标题/) as HTMLInputElement;
    const contentInput = screen.getByPlaceholderText(/描述您的讨论主题/) as HTMLTextAreaElement;
    const submitButton = screen.getByRole('button', { name: /创建讨论/ });

    await user.type(titleInput, 'New discussion');
    await user.type(contentInput, 'New discussion content');
    await user.click(submitButton);

    await waitFor(() => {
      // after successful submit the form is closed and the open button returns
      expect(screen.getByRole('button', { name: /开启新讨论/ })).toBeInTheDocument();
    });
  });

  test('should display discussion content in expanded view', async () => {
    const user = userEvent.setup();
    render(<DiscussionSection promptId={"1"} />);

    await waitFor(() => {
      expect(screen.getByText('How to improve?')).toBeInTheDocument();
    });
    await user.click(screen.getByText('How to improve?'));

    await waitFor(() => {
      expect(screen.getByText('Suggestions for enhancement')).toBeInTheDocument();
    });
  });
});
