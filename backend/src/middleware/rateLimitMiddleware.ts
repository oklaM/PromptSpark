import type { Request, Response, NextFunction } from 'express';

const WINDOW_MS = {
  ONE_MINUTE: 60 * 1000,
  FIFTEEN_MINUTES: 15 * 60 * 1000,
} as const;

const RATE_LIMITS = {
  AI: { windowMs: WINDOW_MS.ONE_MINUTE, maxRequests: 10 },
  GENERAL: { windowMs: WINDOW_MS.ONE_MINUTE, maxRequests: 60 },
  AUTH: { windowMs: WINDOW_MS.FIFTEEN_MINUTES, maxRequests: 5 },
} as const;

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  reset: number;
}

export interface RateLimitRequest extends Request {
  rateLimit?: RateLimitInfo;
}

type AuthenticatedRequest = Request & { user?: { id: string } };

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();

  constructor() {
    setInterval(() => this.cleanup(), WINDOW_MS.ONE_MINUTE);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  private getIdentifier(req: AuthenticatedRequest): string {
    return req.user?.id || req.ip || req.socket.remoteAddress || 'unknown';
  }

  private setHeaders(res: Response, limit: number, remaining: number, reset: number): void {
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', reset.toString());
  }

  middleware(config: { windowMs: number; maxRequests: number }) {
    return (req: RateLimitRequest, res: Response, next: NextFunction): void => {
      const key = `${this.getIdentifier(req)}:${req.path}`;
      const now = Date.now();
      const entry = this.store.get(key);

      if (!entry || entry.resetTime < now) {
        const resetTime = now + config.windowMs;
        this.store.set(key, { count: 1, resetTime });

        req.rateLimit = { limit: config.maxRequests, current: 1, remaining: config.maxRequests - 1, reset: resetTime };
        this.setHeaders(res, config.maxRequests, config.maxRequests - 1, resetTime);
        next();
        return;
      }

      entry.count++;

      if (entry.count > config.maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        res.status(429).json({
          success: false,
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Please retry after ${retryAfter} seconds.`,
          data: { retryAfter, limit: config.maxRequests, resetAt: new Date(entry.resetTime).toISOString() }
        });
        return;
      }

      req.rateLimit = {
        limit: config.maxRequests,
        current: entry.count,
        remaining: config.maxRequests - entry.count,
        reset: entry.resetTime
      };
      this.setHeaders(res, config.maxRequests, config.maxRequests - entry.count, entry.resetTime);
      next();
    };
  }
}

const limiter = new RateLimiter();

export const rateLimitAi = limiter.middleware(RATE_LIMITS.AI);
export const rateLimitGeneral = limiter.middleware(RATE_LIMITS.GENERAL);
export const rateLimitAuth = limiter.middleware(RATE_LIMITS.AUTH);

export function skipRateLimit(condition: (req: Request) => boolean) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (condition(req)) {
      next();
    } else {
      rateLimitGeneral(req, res, next);
    }
  };
}
