'use client'

import { usePagePerformance } from '@/hooks/use-performance'

export function PerformanceTracker() {
  usePagePerformance()
  return null
}
