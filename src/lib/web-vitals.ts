/**
 * Web Vitals tracking for performance monitoring
 * Tracks Core Web Vitals: LCP, FID, CLS, FCP, TTFB
 */

export interface WebVitalsMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: string
}

export function getRating(value: number, thresholds: { good: number; poor: number }): 'good' | 'needs-improvement' | 'poor' {
  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.poor) return 'needs-improvement'
  return 'poor'
}

export function reportWebVitals(metric: WebVitalsMetric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: `${metric.value.toFixed(2)}ms`,
      rating: metric.rating,
    })
  }

  // In production, you can send to analytics service
  // Example: sendToAnalytics(metric)
}

export function trackWebVitals() {
  if (typeof window === 'undefined') return

  // Track Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        const lcp = lastEntry.renderTime || lastEntry.loadTime

        if (lcp) {
          const metric: WebVitalsMetric = {
            name: 'LCP',
            value: lcp,
            rating: getRating(lcp, { good: 2500, poor: 4000 }),
            delta: lcp,
            id: lastEntry.id || '',
            navigationType: lastEntry.navigationType || 'navigate',
          }
          reportWebVitals(metric)
        }
      })

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (e) {
      // PerformanceObserver not supported
    }

    // Track First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[]
        entries.forEach((entry) => {
          const fid = entry.processingStart - entry.startTime
          const metric: WebVitalsMetric = {
            name: 'FID',
            value: fid,
            rating: getRating(fid, { good: 100, poor: 300 }),
            delta: fid,
            id: entry.id || '',
            navigationType: entry.navigationType || 'navigate',
          }
          reportWebVitals(metric)
        })
      })

      fidObserver.observe({ entryTypes: ['first-input'] })
    } catch (e) {
      // PerformanceObserver not supported
    }

    // Track Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[]
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })

        const metric: WebVitalsMetric = {
          name: 'CLS',
          value: clsValue,
          rating: getRating(clsValue, { good: 0.1, poor: 0.25 }),
          delta: clsValue,
          id: '',
          navigationType: 'navigate',
        }
        reportWebVitals(metric)
      })

      clsObserver.observe({ entryTypes: ['layout-shift'] })
    } catch (e) {
      // PerformanceObserver not supported
    }

    // Track First Contentful Paint (FCP)
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            const metric: WebVitalsMetric = {
              name: 'FCP',
              value: entry.startTime,
              rating: getRating(entry.startTime, { good: 1800, poor: 3000 }),
              delta: entry.startTime,
              id: entry.id || '',
              navigationType: entry.navigationType || 'navigate',
            }
            reportWebVitals(metric)
          }
        })
      })

      fcpObserver.observe({ entryTypes: ['paint'] })
    } catch (e) {
      // PerformanceObserver not supported
    }
  }
}
