/**
 * Simple logger for production use.
 * In a real production app, this could be connected to a service like Sentry, Logtail, etc.
 */
export const logger = {
  info: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] ${message}`, ...args)
    }
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args)
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args)
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${message}`, ...args)
    }
  },
  performance: (label: string, duration: number, metadata?: Record<string, any>) => {
    const emoji = duration < 200 ? '⚡' : duration < 500 ? '✅' : duration < 1000 ? '⚠️' : '🐌'
    const message = `${emoji} [PERF] ${label}: ${duration.toFixed(2)}ms`
    if (metadata) {
      console.log(message, metadata)
    } else {
      console.log(message)
    }
  },
}
