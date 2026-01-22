/**
 * Performance measurement utilities
 * Works in both server (Node.js) and client (browser) environments
 */

function getNow(): number {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now()
  }
  // Fallback for Node.js - use Date.now() for simplicity
  return Date.now()
}

export class PerformanceTimer {
  private startTime: number
  private label: string
  private metadata?: Record<string, any>

  constructor(label: string, metadata?: Record<string, any>) {
    this.label = label
    this.metadata = metadata
    this.startTime = getNow()
  }

  end() {
    const duration = getNow() - this.startTime
    return {
      label: this.label,
      duration,
      metadata: this.metadata,
    }
  }

  log() {
    const result = this.end()
    const { logger } = require('./logger')
    logger.performance(result.label, result.duration, result.metadata)
    return result
  }
}

/**
 * Measure async function execution time
 */
export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>,
): Promise<T> {
  const timer = new PerformanceTimer(label, metadata)
  try {
    const result = await fn()
    timer.log()
    return result
  } catch (error) {
    timer.log()
    throw error
  }
}

/**
 * Measure sync function execution time
 */
export function measureSync<T>(
  label: string,
  fn: () => T,
  metadata?: Record<string, any>,
): T {
  const timer = new PerformanceTimer(label, metadata)
  try {
    const result = fn()
    timer.log()
    return result
  } catch (error) {
    timer.log()
    throw error
  }
}

/**
 * Create a performance timer (for manual timing)
 */
export function startTimer(label: string, metadata?: Record<string, any>) {
  return new PerformanceTimer(label, metadata)
}
