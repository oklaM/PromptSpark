/**
 * Application Constants
 * Centralized configuration values to avoid magic strings and numbers
 */

/**
 * Pagination
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
} as const;

/**
 * Cache TTL (in milliseconds)
 */
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 15 * 60 * 1000,      // 15 minutes
  HOUR: 60 * 60 * 1000,      // 1 hour
  DAY: 24 * 60 * 60 * 1000   // 24 hours
} as const;

/**
 * User Roles
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
} as const;

/**
 * Permission Roles
 */
export const PERMISSION_ROLES = {
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer'
} as const;

/**
 * Prompt Categories
 */
export const PROMPT_CATEGORIES = [
  'AI',
  'Programming',
  'Writing',
  'Art',
  'Music',
  'Video',
  'Productivity',
  'Education',
  'Other'
] as const;

/**
 * AI Providers
 */
export const AI_PROVIDERS = {
  GEMINI: 'gemini',
  DEEPSEEK: 'deepseek',
  OPENAI: 'openai'
} as const;

/**
 * Subscription Plans
 */
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PRO_MONTHLY: 'pro_monthly',
  PRO_YEARLY: 'pro_yearly',
  TEAM: 'team'
} as const;

/**
 * Quota Limits
 */
export const QUOTA_LIMITS = {
  FREE: {
    STORAGE: 100,
    AI_REQUESTS_DAILY: 10,
    PROMPTS_PUBLIC: 0.5, // 50% can be public
    API_CALLS_HOURLY: 100
  },
  PRO: {
    STORAGE: 1000,
    AI_REQUESTS_DAILY: 100,
    PROMPTS_PUBLIC: 1.0, // 100% can be public
    API_CALLS_HOURLY: 1000
  },
  TEAM: {
    STORAGE: 10000,
    AI_REQUESTS_DAILY: 1000,
    PROMPTS_PUBLIC: 1.0,
    API_CALLS_HOURLY: 10000
  }
} as const;

/**
 * Rate Limiting
 */
export const RATE_LIMITS = {
  AI_ENDPOINT: {
    WINDOW_MS: 60 * 1000,  // 1 minute
    MAX_REQUESTS: 10
  },
  GENERAL: {
    WINDOW_MS: 60 * 1000,  // 1 minute
    MAX_REQUESTS: 60
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000,  // 15 minutes
    MAX_REQUESTS: 5
  }
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

/**
 * Error Codes
 */
export const ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR'
} as const;

/**
 * Cache Key Patterns
 */
export const CACHE_KEYS = {
  PROMPT_BY_ID: (id: string) => `prompt:${id}`,
  PROMPT_LIST: (page: number, limit: number) => `prompt:list:${page}:${limit}`,
  PROMPT_SEARCH: (query: string) => `prompt:search:${query}`,
  PROMPT_TAGS: (id: string) => `prompt:tags:${id}`,
  USER_PROMPTS: (userId: string, page: number) => `user:${userId}:prompts:${page}`,
  PERMISSION: (promptId: string, userId: string) => `permission:${promptId}:${userId}`
} as const;

/**
 * Regular Expressions
 */
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  SLUG: /^[a-z0-9-]+$/
} as const;

/**
 * Default Values
 */
export const DEFAULTS = {
  ANONYMOUS_AUTHOR: 'Anonymous',
  PROMPT_CATEGORY: 'Other',
  AI_PROVIDER: 'gemini',
  AI_TEMPERATURE: 0.7,
  AI_MAX_TOKENS: 1000,
  PAGE: 1,
  LIMIT: 20
} as const;

/**
 * Environment Variables (with fallbacks)
 */
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000'),
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key',
  DATABASE_URL: process.env.DATABASE_URL || '',
  AI_PROVIDER: process.env.AI_PROVIDER || 'gemini',
  AI_API_KEY: process.env.AI_API_KEY || '',
  DEEPSEEK_API_KEY: process.env.DEEPESEEK_API_KEY || '',
  REDIS_URL: process.env.REDIS_URL || ''
} as const;

/**
 * Time Constants (in milliseconds)
 */
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000
} as const;
