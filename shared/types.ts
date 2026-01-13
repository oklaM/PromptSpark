/**
 * Shared TypeScript Type Definitions
 * Used across both backend and frontend to ensure type consistency
 */

/**
 * Base Prompt interface
 */
export interface Prompt {
  id: string;
  title: string;
  description: string | null;
  content: string;
  category: string | null;
  author: string;
  isPublic: boolean;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  metadata: PromptMetadata;
  tags: string[];
}

/**
 * Prompt metadata for Civitai/Liblib parameters
 */
export interface PromptMetadata {
  seed?: number;
  model?: string;
  sampler?: string;
  steps?: number;
  cfg_scale?: number;
  denoising_strength?: number;
  [key: string]: any;
}

/**
 * Prompt creation/update DTO
 */
export interface CreatePromptDTO {
  title: string;
  description?: string;
  content: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  metadata?: PromptMetadata;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Search filters
 */
export interface SearchFilters {
  query?: string;
  category?: string;
  tags?: string[];
  model?: string;
  sampler?: string;
  minSeed?: number;
  maxSeed?: number;
  author?: string;
  isPublic?: boolean;
}

/**
 * User information
 */
export interface User {
  id: string;
  username: string;
  email: string | null;
  displayName?: string;
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Auth tokens
 */
export interface AuthTokens {
  token: string;
  refreshToken?: string;
}

/**
 * Permission roles
 */
export type PermissionRole = 'owner' | 'editor' | 'viewer';

/**
 * Permission entry
 */
export interface Permission {
  id: string;
  promptId: string;
  userId: string;
  role: PermissionRole;
  createdAt: string;
}

/**
 * Comment structure
 */
export interface Comment {
  id: string;
  promptId: string;
  userId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * Rating dimensions
 */
export interface Rating {
  id: string;
  promptId: string;
  userId: string;
  helpfulness: number;
  accuracy: number;
  relevance: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Discussion thread
 */
export interface Discussion {
  id: string;
  promptId: string;
  userId: string;
  title: string;
  content: string;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  error?: string;
}

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Toast notification
 */
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}
