import type { Request, Response, NextFunction } from 'express';

const METRIC_RETENTION_MS = 60 * 1000;
const MAX_METRICS = 1000;
const REPORT_INTERVAL_MS = 60 * 1000;
const SLOW_REQUEST_THRESHOLD_MS = 1000;

interface PerformanceMetric {
  timestamp: number;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
}

interface PerformanceSummary {
  requests: number;
  avgResponseTime: number;
  maxResponseTime: number;
  errorRate: number;
  memory: NodeJS.MemoryUsage;
  uptime: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timer: NodeJS.Timeout;

  constructor() {
    this.timer = setInterval(() => this.logSummary(), REPORT_INTERVAL_MS);
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();

      res.on('finish', () => {
        const responseTime = Date.now() - startTime;

        this.metrics.push({
          timestamp: startTime,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          responseTime
        });

        this.trimMetrics();

        if (responseTime > SLOW_REQUEST_THRESHOLD_MS) {
          console.warn(`[Performance] Slow request: ${req.method} ${req.path} - ${responseTime}ms`);
        }

        if (res.statusCode >= 400) {
          console.error(`[Performance] Error: ${req.method} ${req.path} - ${res.statusCode}`);
        }
      });

      next();
    };
  }

  private trimMetrics(): void {
    if (this.metrics.length > MAX_METRICS) {
      this.metrics = this.metrics.slice(-MAX_METRICS);
    }
  }

  private getRecentMetrics(): PerformanceMetric[] {
    const cutoff = Date.now() - METRIC_RETENTION_MS;
    return this.metrics.filter(m => m.timestamp > cutoff);
  }

  private calculatePercentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.min(Math.ceil((p / 100) * sorted.length) - 1, sorted.length - 1);
    return sorted[Math.max(0, index)];
  }

  private logSummary(): void {
    const recent = this.getRecentMetrics();
    if (recent.length === 0) return;

    const responseTimes = recent.map(m => m.responseTime);
    const errorCount = recent.filter(m => m.statusCode >= 400).length;

    const summary = {
      timestamp: new Date().toISOString(),
      requests: recent.length,
      avgResponseTime: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length),
      maxResponseTime: Math.round(Math.max(...responseTimes)),
      p95ResponseTime: Math.round(this.calculatePercentile(responseTimes, 95)),
      errorCount,
      errorRate: Math.round((errorCount / recent.length) * 10000) / 100,
      memory: process.memoryUsage(),
      uptime: Math.round(process.uptime())
    };

    console.log('[Performance Monitor]', JSON.stringify(summary, null, 2));
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getSummary(): PerformanceSummary | { message: string } {
    const recent = this.getRecentMetrics();
    if (recent.length === 0) {
      return { message: 'No metrics available yet' };
    }

    const responseTimes = recent.map(m => m.responseTime);
    const errorCount = recent.filter(m => m.statusCode >= 400).length;

    return {
      requests: recent.length,
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      maxResponseTime: Math.max(...responseTimes),
      errorRate: (errorCount / recent.length) * 100,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };
  }

  destroy(): void {
    clearInterval(this.timer);
  }
}

export const performanceMonitor = new PerformanceMonitor();
export const monitorPerformance = performanceMonitor.middleware();
