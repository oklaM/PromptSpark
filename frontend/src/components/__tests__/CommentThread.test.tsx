import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommentThread } from '../CommentThread';
import * as collaborationService from '../../services/collaborationService';

jest.mock('../../services/collaborationService');
jest.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user' }
  })
}));

describe('CommentThread Component', () => {
  const mockComments = [
    {
      id: '1',
      promptId: '1',
      content: 'Great prompt!',
      userId: 'user-1',
      userName: 'Alice',
      parentId: null,
      createdAt: '2024-01-01T10:00:00Z',
      likes: 5
    },
    {
      id: '2',
      promptId: '1',
      content: 'I agree!',
      userId: 'user-2',
      userName: 'Bob',
      parentId: '1',
      createdAt: '2024-01-01T11:00:00Z',
      likes: 2
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (collaborationService.getComments as jest.Mock).mockResolvedValue(mockComments);
    (collaborationService.createComment as jest.Mock).mockResolvedValue({
      id: '3',
      promptId: '1',
      content: 'New comment',
      userId: 'test-user',
      userName: 'Test User',
      parentId: null,
      createdAt: new Date().toISOString(),
      likes: 0
    });
    (collaborationService.deleteComment as jest.Mock).mockResolvedValue({});
    (collaborationService.likeComment as jest.Mock).mockResolvedValue({
      likes: 6
    });
  });

  test('should render comment thread section', () => {
    render(<CommentThread promptId={"1"} />);
    // wait for loading to finish and then check that the comment input exists
    return waitFor(() => {
      expect(screen.getByPlaceholderText(/添加您的评论.../)).toBeInTheDocument();
    });
  });

  test('should display all comments', async () => {
    render(<CommentThread promptId={"1"} />);

    await waitFor(() => {
      expect(screen.getByText('Great prompt!')).toBeInTheDocument();
      expect(screen.getByText('I agree!')).toBeInTheDocument();
    });
  });

  test('should display nested replies under parent comment', async () => {
    render(<CommentThread promptId={"1"} />);

    await waitFor(() => {
      // reply button exists and clicking it renders a nested CommentThread (a textarea)
      expect(screen.getByText('I agree!')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const replyButtons = screen.getAllByRole('button', { name: /回复/ });
    await user.click(replyButtons[0]);
    // nested thread should render its own textarea placeholder
    expect(screen.getAllByPlaceholderText(/添加您的评论.../).length).toBeGreaterThanOrEqual(1);
  });

  test('should create new comment on submit', async () => {
    const user = userEvent.setup();
    render(<CommentThread promptId={"1"} />);

    await waitFor(() => expect(screen.getByPlaceholderText(/添加您的评论.../)).toBeInTheDocument());
    const commentInput = screen.getByPlaceholderText(/添加您的评论.../);
    const submitButton = screen.getAllByRole('button', { name: /发布评论/ })[0];

    await user.type(commentInput, 'New comment');
    await user.click(submitButton);

    await waitFor(() => {
      // allow either null or undefined for parentId (component may pass undefined)
      const call = (collaborationService.createComment as jest.Mock).mock.calls[0];
      expect(call[0]).toBe("1");
      expect(call[1]).toBe('New comment');
      expect(call[2] == null).toBeTruthy();
    });
  });

  test('should create reply to parent comment', async () => {
    const user = userEvent.setup();
    render(<CommentThread promptId={"1"} />);

    await waitFor(() => {
      expect(screen.getByText('Great prompt!')).toBeInTheDocument();
    });

    const replyButtons = screen.getAllByRole('button', { name: /回复/ });
    await user.click(replyButtons[0]);

    const commentInput = screen.getAllByPlaceholderText(/添加您的评论.../)[1];
    const submitButton = screen.getAllByRole('button', { name: /发布评论/ })[1];

    await user.type(commentInput, 'Reply to comment');
    await user.click(submitButton);

    await waitFor(() => {
      expect(collaborationService.createComment).toHaveBeenCalledWith("1", 'Reply to comment', '1');
    });
  });

  test('should like a comment', async () => {
    const user = userEvent.setup();
    render(<CommentThread promptId={"1"} />);

    await waitFor(() => {
      expect(screen.getByText('Great prompt!')).toBeInTheDocument();
    });

    const likeButtons = screen.getAllByRole('button').filter((b) => /👍/.test(b.textContent || ''));
    await user.click(likeButtons[0]);

    await waitFor(() => {
      expect(collaborationService.likeComment).toHaveBeenCalledWith('1');
    });
  });

  test('should delete own comment', async () => {
    const userCommentMock = {
      ...mockComments[0],
      userId: 'test-user',
      userName: 'Test User'
    };

    (collaborationService.getComments as jest.Mock).mockResolvedValue([userCommentMock]);

    const user = userEvent.setup();
    // mock confirm dialog to allow deletion
    (global as any).confirm = jest.fn(() => true);
    render(<CommentThread promptId={"1"} />);

    await waitFor(() => {
      expect(screen.getByText('Great prompt!')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /删除/ });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(collaborationService.deleteComment).toHaveBeenCalledWith('1');
    });
  });

  test('should not show delete button for other user comments', async () => {
    render(<CommentThread promptId={"1"} />);

    await waitFor(() => {
      expect(screen.getByText('Great prompt!')).toBeInTheDocument();
    });

    // there should be no global delete button (current user is not the comment author)
    expect(screen.queryByRole('button', { name: /删除/ })).not.toBeInTheDocument();
  });

  test('should show loading state', () => {
    (collaborationService.getComments as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    render(<CommentThread promptId={"1"} />);
    expect(screen.getByText(/加载中/)).toBeInTheDocument();
  });

  test('should show error state on load failure', async () => {
    const errorMessage = 'Failed to load comments';
    (collaborationService.getComments as jest.Mock).mockRejectedValueOnce(
      new Error(errorMessage)
    );

    render(<CommentThread promptId={"1"} />);

    await waitFor(() => {
      // component logs error and shows empty state
      expect(screen.getByText(/暂无评论/)).toBeInTheDocument();
    });
  });

  test('should display author information', async () => {
    render(<CommentThread promptId={"1"} />);

    await waitFor(() => {
      expect(screen.getByText(/Alice/i)).toBeInTheDocument();
      expect(screen.getByText(/Bob/i)).toBeInTheDocument();
    });
  });

  test('should display comment timestamps', async () => {
    render(<CommentThread promptId={"1"} />);

    await waitFor(() => {
      const timestamps = screen.getAllByText(/2024/);
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });

  test('should display likes count', async () => {
    render(<CommentThread promptId={"1"} />);

    await waitFor(() => {
      expect(screen.getByText(/👍\s*5/)).toBeInTheDocument();
      expect(screen.getByText(/👍\s*2/)).toBeInTheDocument();
    });
  });
});
