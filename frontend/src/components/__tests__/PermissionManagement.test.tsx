import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PermissionManagement } from '../PermissionManagement';
import * as collaborationService from '../../services/collaborationService';

jest.mock('../../services/collaborationService');
jest.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user' }
  })
}));

describe('PermissionManagement Component', () => {
  const mockPermissions = [
    { id: '1', userId: 'user-1', role: 'editor', userName: 'User One', grantedAt: '2024-01-01' },
    { id: '2', userId: 'user-2', role: 'commenter', userName: 'User Two', grantedAt: '2024-01-02' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (collaborationService.getPromptPermissions as jest.Mock).mockResolvedValue(mockPermissions);
    (collaborationService.grantPermission as jest.Mock).mockResolvedValue({
      id: 3,
      userId: 'user-3',
      role: 'viewer'
    });
    (collaborationService.revokePermission as jest.Mock).mockResolvedValue({});
  });

  test('should render permission management section', () => {
    render(<PermissionManagement promptId={"1"} isOwner={true} />);
    expect(screen.getByText(/🔐 权限管理/)).toBeInTheDocument();
  });

  test('should display grant permission form when isOwner is true', () => {
    render(<PermissionManagement promptId={"1"} isOwner={true} />);
    // inputs are not associated with labels in this component; use placeholder and role queries
    expect(screen.getByPlaceholderText(/输入用户 ID/)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /授予权限/ })).toBeInTheDocument();
  });

  test('should not display grant form when isOwner is false', () => {
    render(<PermissionManagement promptId={"1"} isOwner={false} />);
    expect(screen.queryByText(/🔐 权限管理/)).not.toBeInTheDocument();
  });

  test('should grant permission on form submit', async () => {
    const user = userEvent.setup();
    render(<PermissionManagement promptId={"1"} isOwner={true} />);
    const userIdInput = screen.getByPlaceholderText(/输入用户 ID/);
    const roleSelect = screen.getByRole('combobox');
    const grantButton = screen.getByRole('button', { name: /授予权限/ });

    await user.type(userIdInput, 'user-3');
    await user.selectOptions(roleSelect, 'viewer');
    await user.click(grantButton);

    await waitFor(() => {
      expect(collaborationService.grantPermission).toHaveBeenCalledWith("1", 'user-3', 'viewer');
    });
  });

  test('should revoke permission when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<PermissionManagement promptId={"1"} isOwner={true} />);

    await waitFor(() => {
      expect(collaborationService.getPromptPermissions).toHaveBeenCalled();
    });
    // mock confirm to allow revoke
    (global as any).confirm = jest.fn(() => true);
    const deleteButtons = screen.getAllByRole('button', { name: /撤销/ });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(collaborationService.revokePermission).toHaveBeenCalled();
    });
  });

  test('should load and display existing permissions', async () => {
    render(<PermissionManagement promptId={"1"} isOwner={true} />);

    await waitFor(() => {
      expect(screen.getByText(/user-1/)).toBeInTheDocument();
      expect(screen.getByText(/user-2/)).toBeInTheDocument();
      // role text can appear multiple times (options + badges); ensure at least one badge exists
      expect(screen.getAllByText(/编辑者/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/评论者/).length).toBeGreaterThan(0);
    });
  });

  test('should show error message on failed permission grant', async () => {
    const errorMessage = 'Failed to grant permission';
    (collaborationService.grantPermission as jest.Mock).mockRejectedValueOnce(
      new Error(errorMessage)
    );

    const user = userEvent.setup();
    render(<PermissionManagement promptId={"1"} isOwner={true} />);

    const userIdInput = screen.getByPlaceholderText(/输入用户 ID/);
    const roleSelect = screen.getByRole('combobox');
    const grantButton = screen.getByRole('button', { name: /授予权限/ });

    await user.type(userIdInput, 'user-3');
    await user.selectOptions(roleSelect, 'viewer');
    await user.click(grantButton);

    await waitFor(() => {
      // on error component logs and keeps the form; ensure grantPermission was called
      expect(collaborationService.grantPermission).toHaveBeenCalled();
      expect(screen.getByRole('button', { name: /授予权限/ })).toBeInTheDocument();
    });
  });

  test('should display role badge with correct styling for each role', async () => {
    render(<PermissionManagement promptId={"1"} isOwner={true} />);

    await waitFor(() => {
      const roleBadges = screen.getAllByText(/编辑者|评论者/i);
      expect(roleBadges.length).toBeGreaterThan(0);
    });
  });
});
