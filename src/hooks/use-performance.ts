'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackWebVitals } from '@/lib/web-vitals'

export function usePagePerformance() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Track Web Vitals
    trackWebVitals()

    // Track page load performance
    const startTime = performance.now()

    // Wait for page to be fully loaded
    const handleLoad = () => {
      const loadTime = performance.now() - startTime
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paintEntries = performance.getEntriesByType('paint') as PerformancePaintTiming[]

      if (navigation) {
        // Get actual paint timing metrics
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
        const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint')
        
        // Calculate DOMContentLoaded duration (time it took for the event)
        const domContentLoaded = navigation.domContentLoadedEventEnd && navigation.domContentLoadedEventStart
          ? (navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart).toFixed(2)
          : 'N/A'
        
        // Also track when DOMContentLoaded occurred (absolute time from fetch start)
        const domContentLoadedTime = navigation.domContentLoadedEventEnd
          ? (navigation.domContentLoadedEventEnd - navigation.fetchStart).toFixed(2)
          : 'N/A'
        
        const metrics = {
          route: pathname,
          loadTime: loadTime.toFixed(2),
          domContentLoaded, // Duration of the event
          domContentLoadedTime, // When it occurred (absolute time)
          firstPaint: firstPaint ? firstPaint.startTime.toFixed(2) : 'N/A',
          firstContentfulPaint: firstContentfulPaint ? firstContentfulPaint.startTime.toFixed(2) : 'N/A',
          timeToInteractive: navigation.domInteractive 
            ? (navigation.domInteractive - navigation.fetchStart).toFixed(2)
            : 'N/A',
        }

        // Performance logging disabled
      } else {
        // Performance logging disabled
      }
    }

    // Track navigation timing
    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [pathname])
}

export function useNavigationPerformance() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Track Next.js navigation
    const handleRouteChangeStart = () => {
      ;(window as any).__navigationStart = performance.now()
    }

    const handleRouteChangeComplete = () => {
      if ((window as any).__navigationStart) {
        const duration = performance.now() - (window as any).__navigationStart
        // Performance logging disabled
        delete (window as any).__navigationStart
      }
    }

    // Listen to Next.js router events
    const router = (window as any).next?.router
    if (router) {
      router.events?.on('routeChangeStart', handleRouteChangeStart)
      router.events?.on('routeChangeComplete', handleRouteChangeComplete)

      return () => {
        router.events?.off('routeChangeStart', handleRouteChangeStart)
        router.events?.off('routeChangeComplete', handleRouteChangeComplete)
      }
    }
  }, [])
}
